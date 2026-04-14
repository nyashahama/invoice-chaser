# Invoice Generator Monorepo

This repository is organized as a small monorepo with one frontend app and one backend service.

## Apps

- `frontend/`: Next.js 16 application
- `backend/`: Go 1.24 API, scheduler, and database assets

## Prerequisites

- Node.js 22 with npm
- Go 1.24+
- Docker, if you want to run the backend Postgres stack locally

## Environment Files

- Frontend: copy `frontend/.env.example` to `frontend/.env.local`
- Backend: copy `backend/.env.example` to `backend/.env`

## Frontend

```bash
cd frontend
npm ci
npm run dev
```

Validation:

```bash
cd frontend
npm run lint
npm run build
```

## Backend

```bash
cd backend
go test ./...
go build ./...
```

For local development with the scheduler and API server:

```bash
cd backend
make dev
```

The backend `dev` target expects:

- Docker Compose for the local Postgres service
- `air` installed locally
- `backend/.env` present

## CI

GitHub Actions runs separate pipelines for each package:

- `frontend.yml` runs install, lint, and production build for frontend changes
- `backend.yml` runs `go test ./...` and `go build ./...` for backend changes
