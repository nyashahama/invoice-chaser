# Full Stack Integration Design

**Date:** 2026-04-14

**Scope:** Full product surface plus admin and operations hardening for a production-ready release.

## Goal

Integrate the Next.js frontend with the Go backend so the application uses a single production-grade authentication model, real invoice and reminder data, backend-owned AI/email flows, and deployment-safe configuration across the full user journey.

## Current State

The backend already contains production-oriented business logic for:

- user registration, login, refresh, logout, profile updates, and password changes
- invoice CRUD, payment marking, events, and PayFast webhook handling
- reminder sequence creation, updates, immediate send scheduling, regeneration hooks, and scheduler dispatch
- AI-backed reminder generation, fallback templating, tracking links, and outbound email delivery

The frontend is not integrated with that backend. It currently contains:

- Clerk-based auth in shared UI components
- a mock `AuthContext` with sessionStorage-backed user state
- seeded dashboard invoice data
- browser-side AI calls that bypass the backend entirely
- a marketing waitlist flow that is separate from the product auth flow

This creates conflicting sources of truth, weakens security, and prevents the app from being production-ready.

## Recommended Architecture

Use the existing monorepo shape with the Next.js frontend and Go backend as separate services. The Go backend remains the system of record for business state and integrations. The Next.js app becomes a typed client of the backend over HTTP using native `fetch`.

The frontend will not proxy the backend through a duplicate Next.js BFF layer. That would add another contract surface and duplicate API concerns that are already implemented in Go.

## Architecture Boundaries

### Backend Ownership

The backend remains responsible for:

- auth token issuance and refresh
- refresh cookie lifecycle
- user profile state
- invoice persistence and validation
- reminder sequence orchestration
- scheduler-driven reminder sending
- AI reminder generation and fallback behavior
- payment and webhook processing
- operational health endpoints and environment-based configuration

### Frontend Ownership

The frontend becomes responsible for:

- routing and screen composition
- form state and client-side validation
- session bootstrap and auth UX
- typed consumption of backend endpoints
- rendering live invoice, reminder, event, profile, and billing state
- optimistic or controlled refresh behavior after user mutations

## Data Flow

### Authentication

1. A user registers or logs in from the frontend.
2. The backend returns an `access_token` in JSON and sets a `refresh_token` cookie.
3. The frontend stores the access token only in client state or session storage.
4. Protected requests send the access token in the `Authorization` header.
5. On `401`, the frontend attempts one refresh request with `credentials: "include"`.
6. If refresh succeeds, the original request retries once with the new access token.
7. If refresh fails, the frontend clears session state and redirects to the auth entry path.

### Product Data

1. Protected pages bootstrap with the current user profile.
2. The dashboard loads invoices from the backend rather than seeded local arrays.
3. Invoice selection drives follow-up requests for sequence state and invoice events.
4. Invoice mutations call backend endpoints and then refresh or reconcile local screen state from the server response.
5. Reminder actions such as `send-now` and `regenerate` use existing backend routes and surface asynchronous behavior clearly in the UI.

### Reminder Generation

The frontend never calls an LLM provider directly. It only manages invoice and reminder actions. The backend scheduler and email service own reminder generation, tracking injection, fallback content, and sending.

### Billing and Payment

Payment state remains backend-owned. Frontend payment CTA flows must point to backend-supported invoice payment behavior rather than client-generated links or browser-side payment logic.

## Frontend Design

### Session Layer

Replace the current mixed Clerk and mock auth setup with a single session provider backed by backend auth endpoints. This provider will:

- bootstrap the current session from stored access-token state plus `/api/v1/users/me`
- expose login, register, logout, refresh, and clear-session actions
- provide protected-route guards and predictable loading states

### API Layer

Create a small typed API layer built on native `fetch`, not Axios. It will:

- centralize base URL handling
- attach bearer tokens for protected requests
- include credentials for refresh/logout flows where required
- normalize backend error payloads into a consistent frontend error shape
- retry one time after a successful refresh on unauthorized responses

### Feature Slices

The frontend should be organized around focused units instead of one giant dashboard file:

- auth
- dashboard shell
- invoices
- reminders
- profile/settings
- billing or plan UX

The current dashboard component is too large and mixes seed data, auth assumptions, API calls, and rendering. As part of the integration, it should be broken into smaller units that are easier to test and maintain.

### UI State Principles

- server state comes from backend responses, not hardcoded constants
- form state stays local to feature components
- loading, empty, and error states are explicit
- mutation success updates are deterministic and based on returned server data or an immediate refetch

## Backend Completion And Hardening

The backend is substantially implemented already, but this integration scope includes targeted hardening to support the full product surface:

- ensure auth and CORS behavior matches browser-based frontend usage in local and production environments
- expose any missing response fields or endpoint behaviors needed by the frontend
- verify config requirements and defaults are consistent with deployment needs
- tighten any incomplete integration seams that block a full end-to-end flow
- keep AI generation, payment, tracking, and reminder dispatch on the backend only

This scope does not require a broad backend rewrite. It is targeted completion and contract hardening in service of the production app.

## Security Model

- remove Clerk from the core product auth path
- remove browser-side LLM calls
- keep refresh tokens in `httpOnly` cookies
- use short-lived bearer access tokens for API calls
- scope cross-origin credential use to the auth refresh/logout needs
- rely on backend validation as the final authority for all business writes

## Error Handling

The frontend will interpret backend errors through a shared normalization layer so forms and pages can render:

- field validation errors
- authentication failures
- authorization failures
- conflict errors
- generic unexpected failures

User-visible error handling should be specific enough to guide recovery without exposing internal backend details.

The backend remains responsible for returning structured JSON errors consistently.

## Testing Strategy

### Frontend

- API client unit coverage for request, refresh, and error normalization behavior
- component or feature tests for auth forms and dashboard flows where practical
- production build and lint verification

### Backend

- preserve and extend handler or service tests for any changed contracts
- run package tests for auth, payment, email, and middleware-sensitive changes
- verify the backend still builds cleanly after contract updates

### End-to-End Confidence

At minimum, verify:

- register
- login
- session refresh
- logout
- dashboard data load
- invoice creation
- sequence creation and update
- reminder action triggers
- invoice payment state changes
- profile update
- frontend production build
- backend test and build success

## Implementation Phases

### Phase 1

Replace conflicting frontend auth infrastructure with backend-backed session management and a typed `fetch` API layer.

### Phase 2

Refactor the dashboard and related screens to consume real backend data for invoices, reminders, events, and profile state.

### Phase 3

Remove browser-side AI calls and wire reminder actions fully through backend routes and scheduler-owned flows.

### Phase 4

Complete product-surface integration for marketing-to-product entry points, payment UX touchpoints, and settings/profile behavior.

### Phase 5

Apply targeted backend and deployment hardening, then run verification across frontend and backend build/test paths.

## Out Of Scope

- replacing the existing Go backend with a new backend-for-frontend layer
- adding a separate admin control plane unless required by existing product screens
- introducing a new third-party auth provider on top of the current backend auth system

## Success Criteria

The work is complete when:

- the frontend uses only backend auth for the core product
- no seeded dashboard data is required for normal app behavior
- no browser-side LLM calls remain in the product flow
- invoice and reminder workflows execute against real backend state
- landing-to-product and billing touchpoints are coherent
- frontend and backend pass their verification commands
- the application is deployable with clear environment contracts and production-safe behavior
