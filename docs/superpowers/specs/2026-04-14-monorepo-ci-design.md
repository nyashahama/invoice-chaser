# Monorepo CI Design

## Summary

Convert the repository from a single Next.js app at the root into a working monorepo with two top-level applications:

- `frontend/` for the Next.js application
- `backend/` for the Go API and related database assets

The repository must be left in a working state where a fresh clone can build and validate both applications, and GitHub Actions can enforce that contract on pull requests and protected branches.

## Goals

- Preserve the current product split into `frontend/` and `backend/`
- Remove repository structure issues that break normal monorepo workflows
- Add CI workflows that validate frontend and backend independently
- Document the monorepo layout and developer commands at the repository root
- Keep the PR reviewable by separating structural cleanup, CI, and docs into focused commits

## Non-Goals

- Re-architect the frontend or backend application logic
- Introduce a cross-language monorepo build tool unless the current repo truly requires one
- Add large new backend feature work unrelated to making the monorepo build, test, and review cleanly
- Replace working package-specific commands with a heavyweight abstraction only for aesthetics

## Current Problems

The repository currently has several issues that block a clean monorepo setup:

- The previous root Next.js application files are deleted while the new `frontend/` and `backend/` directories are untracked
- `backend/` still contains nested Git metadata, which breaks normal monorepo review and version control expectations
- `frontend/node_modules/` is present inside the repository tree and needs to be treated as an ignored dependency directory
- There are no GitHub Actions workflows in `.github/workflows/`
- The root `.gitignore` still reflects the old single-application layout
- The root `README.md` was deleted and no longer explains how to work with the new layout

## Proposed Approach

### Repository Structure

Keep the two-application layout:

- `frontend/`
- `backend/`

Treat both as first-class parts of one Git repository. Remove the nested `backend/.git` metadata from versioned content so the top-level repository fully owns the tree. Retain package-local configuration files where they are already idiomatic, such as `frontend/package.json` and `backend/go.mod`.

### Ignore Rules and Hygiene

Update the root `.gitignore` so it correctly covers monorepo paths, including:

- `frontend/node_modules/`
- `frontend/.next/`
- build outputs for frontend and backend
- `.env` files
- coverage and local tool artifacts

Do not ignore committed source or generated assets that are part of the current build contract without first verifying whether they are required. In particular, backend generated SQLC files should only remain committed if the backend currently depends on them being present without generation in CI.

### Developer Experience

Add a root `README.md` that documents:

- repository layout
- prerequisites for frontend and backend
- install commands
- local development commands
- lint, test, and build commands
- where environment variables live

Only add a root helper such as a `Makefile` if it materially improves consistency and does not introduce redundant wrappers around simple package-local commands.

### CI Workflows

Create GitHub Actions workflows under `.github/workflows/` using current stable best practices:

- separate frontend and backend workflows
- path filters so unrelated changes do not trigger both workflows
- concurrency cancellation for duplicate branch runs
- dependency caching through official setup actions
- narrow permissions where possible

Frontend workflow stages:

- checkout
- setup Node.js with npm caching based on `frontend/package-lock.json`
- install dependencies from `frontend/`
- run lint
- run production build

Backend workflow stages:

- checkout
- setup Go with module caching from `backend/go.sum`
- run `go test ./...`
- run `go build ./...` or the repository’s concrete build target if that is the true contract

If backend tests or builds currently fail because of repository-structure issues, fix those issues inside this implementation. Do not add speculative CI jobs that the codebase cannot satisfy yet.

## Verification Strategy

Before claiming completion, verify locally:

- frontend dependencies install successfully
- frontend lint passes
- frontend build passes
- backend `go test ./...` passes
- backend `go build ./...` or equivalent build target passes

Also verify that the repository no longer contains nested Git metadata as part of the tracked monorepo structure and that the final staged diff is reviewable as a normal PR.

## Commit Strategy

Prefer a small set of focused commits such as:

1. structural monorepo cleanup
2. backend CI workflow
3. frontend CI workflow
4. root documentation updates

Adjust the exact split if implementation details make a different grouping materially easier to review, but preserve clean commit boundaries and avoid one large catch-all commit.

## Risks and Mitigations

### Nested backend repository confusion

Risk: removing or ignoring nested Git metadata incorrectly could leave the root repository in a confusing state.

Mitigation: inspect the exact backend contents, preserve source files, and only remove repository metadata from tracked content rather than application code.

### Backend runtime dependencies

Risk: the backend may compile or test only when certain environment variables or services exist.

Mitigation: make CI enforce only the build and test contract that can run in a clean automation environment, and keep local runtime setup documented in the root README.

### Over-scoping the monorepo setup

Risk: introducing root-level workspace tooling or broad refactors would make the PR harder to review and more fragile.

Mitigation: keep the monorepo baseline intentionally small, package-native, and explicit.
