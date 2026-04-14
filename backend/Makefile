include .env
export

BINARY     := bin/server
CMD        := ./cmd/server
DB_URL     ?= $(DATABASE_URL)

.PHONY: dev migrate migrate-down sqlc test test-cover build docker-build lint payfast-itn

dev:
	docker compose up -d postgres
	air -c .air.toml

migrate:
	goose -dir db/migrations postgres "$(DB_URL)" up

migrate-down:
	goose -dir db/migrations postgres "$(DB_URL)" down

migrate-status:
	goose -dir db/migrations postgres "$(DB_URL)" status

sqlc:
	sqlc generate --file db/sqlc.yaml

test:
	go test ./... -race -count=1

test-cover:
	go test ./... -race -coverprofile=coverage.out
	go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report: coverage.html"

build:
	CGO_ENABLED=0 go build -ldflags="-s -w" -o $(BINARY) $(CMD)

docker-build:
	docker build -t invoicechaser:latest .

lint:
	golangci-lint run ./...

# Fire a test PayFast ITN at your local server (sandbox values).
# Requires PAYFAST_PASSPHRASE set in .env.
payfast-itn:
	@echo "Sending mock PayFast ITN..."
	curl -X POST http://localhost:8080/webhooks/payfast \
	  -H "Content-Type: application/x-www-form-urlencoded" \
	  -d "merchant_id=10000100&merchant_key=46f0cd694581a&m_payment_id=TEST-INV-ID&amount_gross=100.00&payment_status=COMPLETE&pf_payment_id=test-pf-123&signature=placeholder"

tidy:
	go mod tidy

.env:
	@echo ".env file not found. Copy .env.example to .env and fill in values."
	@exit 1