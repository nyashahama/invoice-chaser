# Monorepo CI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the repo into a working two-app monorepo with passing local validation and GitHub Actions for frontend and backend.

**Architecture:** Keep `frontend/` as the Next.js app and `backend/` as the Go service, but normalize the repository so the root Git repo owns both trees. Add targeted monorepo hygiene at the root, then add independent backend and frontend CI workflows with path filters, caching, and simple, enforceable quality gates.

**Tech Stack:** Next.js 16, React 19, npm, Go 1.24, GitHub Actions

---

### Task 1: Normalize Repository Structure

**Files:**
- Modify: `.gitignore`
- Delete: `backend/.git`
- Remove from working tree: `frontend/node_modules`, `frontend/.next`, `frontend/.clerk`
- Verify layout: `frontend/`, `backend/`

- [ ] **Step 1: Inspect the current tree and confirm monorepo blockers**

```bash
git status --short
find backend -maxdepth 2 -type f | sort
find frontend -maxdepth 2 -type d | sort
```

Expected: deleted old root app files, untracked `frontend/` and `backend/`, nested `backend/.git`, and local frontend build/dependency directories.

- [ ] **Step 2: Update root ignore rules for the monorepo**

```gitignore
/node_modules
/coverage
/.next/
/out/
/build
.DS_Store
*.pem
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*
.env*
.vercel
*.tsbuildinfo
next-env.d.ts
/.clerk/
/frontend/node_modules/
/frontend/.next/
/frontend/.clerk/
/backend/bin/
/backend/coverage.out
/backend/coverage.html
```

Expected: root ignore rules cover both top-level apps and local artifacts created during development.

- [ ] **Step 3: Remove nested repository metadata and local build artifacts**

Run:

```bash
rm -rf backend/.git frontend/node_modules frontend/.next frontend/.clerk
```

Expected: `backend/` is now plain source owned by the root repo, and frontend build/dependency directories are gone from the working tree.

- [ ] **Step 4: Verify the cleaned structure**

Run:

```bash
test ! -d backend/.git
test ! -d frontend/node_modules
test ! -d frontend/.next
git status --short
```

Expected: no nested repo metadata remains, local dependency/build directories are removed, and source files are ready to be staged from the root repository.

- [ ] **Step 5: Commit the structural cleanup**

```bash
git add .gitignore frontend backend
git commit -m "chore: normalize monorepo structure"
```

### Task 2: Make Backend Build and Test Cleanly

**Files:**
- Modify: `backend/Makefile`
- Modify: `backend/cmd/server/main.go` if compilation issues exist
- Modify: `backend/internal/**` only if required to satisfy `go test ./...` or `go build ./...`

- [ ] **Step 1: Run the backend test suite to capture the current failures**

Run:

```bash
go test ./...
```

Working directory: `backend/`

Expected: either PASS or concrete compile/test failures that identify the exact files requiring cleanup.

- [ ] **Step 2: Run the backend build to capture build-only failures**

Run:

```bash
go build ./...
```

Working directory: `backend/`

Expected: either PASS or concrete compile/build failures that must be fixed before CI is added.

- [ ] **Step 3: Apply the minimal backend fixes required for a clean contract**

If a compile error exists in `backend/cmd/server/main.go` or another package, patch only the failing code path. Example minimal fix shape:

```go
func (s *stubPayFastVerifier) IsAllowedIP(_ string) bool { return true }

func (s *stubPayFastVerifier) VerifySignature(_ map[string]string, _ string) bool {
	return true
}

func (s *stubPayFastVerifier) ValidateWithServer(_ []byte, _ bool) bool {
	return true
}
```

If a Makefile command is inconsistent with the actual CI contract, normalize it to the commands CI will run:

```make
test:
	go test ./... -count=1

build:
	CGO_ENABLED=0 go build -o $(BINARY) $(CMD)
```

Expected: backend source and commands are aligned with the real CI validation path, with no speculative refactors.

- [ ] **Step 4: Re-run backend verification**

Run:

```bash
go test ./...
go build ./...
```

Working directory: `backend/`

Expected: both commands pass cleanly.

- [ ] **Step 5: Commit backend readiness fixes**

```bash
git add backend
git commit -m "fix: make backend build cleanly in monorepo"
```

### Task 3: Add Backend GitHub Actions Workflow

**Files:**
- Create: `.github/workflows/backend.yml`

- [ ] **Step 1: Add the backend workflow**

```yaml
name: Backend CI

on:
  pull_request:
    paths:
      - "backend/**"
      - ".github/workflows/backend.yml"
  push:
    branches:
      - main
      - develop
    paths:
      - "backend/**"
      - ".github/workflows/backend.yml"

permissions:
  contents: read

concurrency:
  group: backend-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  test-build:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version-file: backend/go.mod
          cache-dependency-path: backend/go.sum
      - run: go test ./...
      - run: go build ./...
```

Expected: backend changes trigger a focused workflow with module caching, narrow permissions, and a simple enforceable contract.

- [ ] **Step 2: Validate the workflow YAML**

Run:

```bash
sed -n '1,220p' .github/workflows/backend.yml
```

Expected: workflow uses `actions/checkout@v4`, `actions/setup-go@v5`, path filters, and `backend` as the working directory.

- [ ] **Step 3: Commit backend CI**

```bash
git add .github/workflows/backend.yml
git commit -m "ci: add backend workflow"
```

### Task 4: Make Frontend Build and Lint Cleanly

**Files:**
- Modify: `frontend/package.json` only if scripts need correction
- Modify: `frontend/eslint.config.mjs` or frontend source files only if lint/build failures require it

- [ ] **Step 1: Install frontend dependencies cleanly from the package directory**

Run:

```bash
npm install
```

Working directory: `frontend/`

Expected: dependencies install successfully and `frontend/package-lock.json` remains consistent with `frontend/package.json`.

- [ ] **Step 2: Run frontend lint and build to capture current failures**

Run:

```bash
npm run lint
npm run build
```

Working directory: `frontend/`

Expected: either PASS or concrete errors showing which frontend files or config require adjustment.

- [ ] **Step 3: Apply the minimal frontend fixes required for CI**

If a script or config change is needed, keep it minimal. Example target state:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint ."
  }
}
```

Expected: lint and build commands are explicit and runnable in CI from the `frontend/` directory.

- [ ] **Step 4: Re-run frontend verification**

Run:

```bash
npm run lint
npm run build
```

Working directory: `frontend/`

Expected: both commands pass cleanly.

- [ ] **Step 5: Commit frontend readiness fixes**

```bash
git add frontend
git commit -m "fix: make frontend ready for monorepo ci"
```

### Task 5: Add Frontend GitHub Actions Workflow

**Files:**
- Create: `.github/workflows/frontend.yml`

- [ ] **Step 1: Add the frontend workflow**

```yaml
name: Frontend CI

on:
  pull_request:
    paths:
      - "frontend/**"
      - ".github/workflows/frontend.yml"
  push:
    branches:
      - main
      - develop
    paths:
      - "frontend/**"
      - ".github/workflows/frontend.yml"

permissions:
  contents: read

concurrency:
  group: frontend-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint-build:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: npm
          cache-dependency-path: frontend/package-lock.json
      - run: npm ci
      - run: npm run lint
      - run: npm run build
```

Expected: frontend changes trigger a focused workflow with npm caching and the exact commands used locally.

- [ ] **Step 2: Validate the workflow YAML**

Run:

```bash
sed -n '1,220p' .github/workflows/frontend.yml
```

Expected: workflow uses working directory defaults, path filters, concurrency cancellation, and the frontend package lock for caching.

- [ ] **Step 3: Commit frontend CI**

```bash
git add .github/workflows/frontend.yml
git commit -m "ci: add frontend workflow"
```

### Task 6: Document the Monorepo

**Files:**
- Create: `README.md`

- [ ] **Step 1: Add a root README for the monorepo**

```md
# Invoice Generator Monorepo

## Apps

- `frontend/`: Next.js application
- `backend/`: Go API

## Frontend

```bash
cd frontend
npm install
npm run lint
npm run build
```

## Backend

```bash
cd backend
go test ./...
go build ./...
```
```

Expected: a fresh clone has a single root document explaining layout, prerequisites, and validation commands.

- [ ] **Step 2: Review the README against the actual commands**

Run:

```bash
sed -n '1,240p' README.md
```

Expected: commands match the working frontend/backend validation paths exactly.

- [ ] **Step 3: Commit root documentation**

```bash
git add README.md
git commit -m "docs: add monorepo developer guide"
```

### Task 7: Final Verification and PR Preparation

**Files:**
- Verify only

- [ ] **Step 1: Run full local verification**

Run:

```bash
npm run lint
npm run build
go test ./...
go build ./...
git status --short
```

Working directories:
- `frontend/` for npm commands
- `backend/` for Go commands
- repo root for `git status --short`

Expected: frontend and backend validation commands pass, and only intentional tracked changes remain.

- [ ] **Step 2: Inspect commit history for reviewability**

Run:

```bash
git log --oneline --decorate -8
```

Expected: a small set of focused commits matching the plan’s structure.

- [ ] **Step 3: Push and create the PR**

```bash
git push -u origin develop
gh pr create --title "chore: convert repo to monorepo with CI" --body "## Summary
- normalize the repo into frontend and backend apps
- add backend and frontend GitHub Actions workflows
- document the monorepo developer workflow

## Test Plan
- npm run lint
- npm run build
- go test ./...
- go build ./..."
```

Expected: branch is pushed and a PR is opened with a concise summary and executable test plan.
