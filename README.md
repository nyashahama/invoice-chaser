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

`APP_BASE_URL` in the backend env should point at the backend's public base URL, because email tracking and PayFast click-through routes are served by the API, not by the Next.js frontend.
`FRONTEND_BASE_URL` in the backend env should point at the browser-facing frontend origin so credentialed CORS requests are explicit rather than inferred.
`NEXT_PUBLIC_API_BASE_URL` in the frontend env should point at the Go API origin.

The frontend talks directly to the Go API with native `fetch`. Access tokens stay client-side for bearer auth. Refresh tokens stay in backend-set cookies and are rotated through `/api/v1/auth/refresh`.

## Frontend

```bash
cd frontend
npm ci
npm run dev
```

Required local env:

```bash
cd frontend
cp .env.example .env.local
```

Validation:

```bash
cd frontend
npm test
npm run lint
npm run build
```

## Backend

```bash
cd backend
go test ./...
go build ./...
```

Required local env:

```bash
cd backend
cp .env.example .env
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

Cookie and browser-integration notes:

- Use `COOKIE_SECURE=false` for local `http://localhost` development
- Use `COOKIE_SECURE=true` in production
- `COOKIE_SAME_SITE=lax` works for same-site frontend/backend deployments such as localhost with different ports or sibling subdomains
- If you change deployment topology, review cookie and CORS settings together rather than independently

## CI

GitHub Actions runs separate pipelines for each package:

- `frontend.yml` runs install, lint, and production build for frontend changes
- `backend.yml` runs `go test ./...` and `go build ./...` for backend changes
