# Full Stack Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the Next.js frontend with the Go backend, remove conflicting mock auth and browser-side AI behavior, and ship a production-ready invoice/reminder app with real end-to-end flows.

**Architecture:** Keep the Go API as the single business authority and convert the Next.js app into a typed `fetch` client of that API. Replace Clerk and mock session state with backend-backed auth, decompose the dashboard into focused feature units, and harden backend contracts where the browser integration needs clearer or safer behavior.

**Tech Stack:** Next.js 16, React 19, TypeScript, native `fetch`, Go 1.24, chi, pgx/sqlc, PostgreSQL, OpenAI, Resend/SMTP

---

## File Structure

### Frontend

- Modify: `frontend/package.json`
- Modify: `frontend/app/layout.tsx`
- Modify: `frontend/app/page.tsx`
- Modify: `frontend/app/dashboard/page.tsx`
- Modify: `frontend/components/Nav.tsx`
- Modify: `frontend/components/Hero.tsx`
- Modify: `frontend/components/CTA.tsx`
- Modify: `frontend/components/Dashboard.tsx`
- Modify: `frontend/components/DemoPage.tsx`
- Delete or replace: `frontend/context/AuthContext.tsx`
- Create: `frontend/lib/api/client.ts`
- Create: `frontend/lib/api/errors.ts`
- Create: `frontend/lib/api/auth.ts`
- Create: `frontend/lib/api/invoices.ts`
- Create: `frontend/lib/api/reminders.ts`
- Create: `frontend/lib/api/users.ts`
- Create: `frontend/lib/api/types.ts`
- Create: `frontend/lib/config.ts`
- Create: `frontend/lib/auth/session-storage.ts`
- Create: `frontend/context/SessionContext.tsx`
- Create: `frontend/components/auth/AuthGate.tsx`
- Create: `frontend/components/auth/AuthModal.tsx`
- Create: `frontend/components/dashboard/DashboardShell.tsx`
- Create: `frontend/components/dashboard/InvoiceList.tsx`
- Create: `frontend/components/dashboard/InvoiceDetail.tsx`
- Create: `frontend/components/dashboard/NewInvoiceForm.tsx`
- Create: `frontend/components/dashboard/ProfilePanel.tsx`

### Backend

- Modify: `backend/internal/api/handler/auth.go`
- Modify: `backend/internal/api/middleware/cors.go`
- Modify: `backend/internal/config/config.go`
- Modify: `backend/cmd/server/main.go`
- Modify: `backend/.env.example`
- Modify: `README.md`
- Test: `backend/internal/api/handler/auth_test.go`
- Create: `backend/internal/api/middleware/cors_test.go`

### Verification

- Run: `cd frontend && npm run lint`
- Run: `cd frontend && npm run build`
- Run: `cd backend && go test ./...`
- Run: `cd backend && go build ./...`

### Task 1: Replace Conflicting Frontend Auth Dependencies

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/app/layout.tsx`
- Modify: `frontend/components/Nav.tsx`
- Modify: `frontend/components/Hero.tsx`
- Delete or replace: `frontend/context/AuthContext.tsx`

- [ ] **Step 1: Remove Clerk from the dependency graph and identify the replacement provider mount point**

```json
{
  "dependencies": {
    "next": "16.1.6",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "resend": "^6.9.3"
  }
}
```

- [ ] **Step 2: Run install metadata check before touching app code**

Run: `cd frontend && npm install`
Expected: `package-lock.json` updates without Clerk packages remaining

- [ ] **Step 3: Replace the existing layout provider tree with a single session provider**

```tsx
import type { Metadata } from "next";
import { Syne } from "next/font/google";
import { SessionProvider } from "@/context/SessionContext";
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={syne.variable}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Replace `Nav` and `Hero` auth reads so they depend on the backend session context rather than Clerk**

```tsx
import { useSession } from "@/context/SessionContext";

const { user, status, logout } = useSession();
const isSignedIn = status === "authenticated";
```

- [ ] **Step 5: Run lint to catch stale Clerk imports and type fallout**

Run: `cd frontend && npm run lint`
Expected: no `@clerk/nextjs` import errors remain

- [ ] **Step 6: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/app/layout.tsx frontend/components/Nav.tsx frontend/components/Hero.tsx frontend/context
git commit -m "refactor: remove clerk auth shell"
```

### Task 2: Build a Typed Fetch API Layer With Refresh Handling

**Files:**
- Create: `frontend/lib/api/client.ts`
- Create: `frontend/lib/api/errors.ts`
- Create: `frontend/lib/api/auth.ts`
- Create: `frontend/lib/api/invoices.ts`
- Create: `frontend/lib/api/reminders.ts`
- Create: `frontend/lib/api/users.ts`
- Create: `frontend/lib/api/types.ts`
- Create: `frontend/lib/config.ts`
- Create: `frontend/lib/auth/session-storage.ts`

- [ ] **Step 1: Define the API contract surface first so the fetch client and session layer share stable types**

```ts
export interface ApiErrorShape {
  code: string;
  message: string;
  status: number;
}

export interface ApiClientOptions {
  getAccessToken: () => string | null;
  setAccessToken: (token: string | null) => void;
  onUnauthorized: () => void;
}
```

- [ ] **Step 2: Implement config and storage helpers first so the client code has stable dependencies**

```ts
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:8080";

const ACCESS_TOKEN_KEY = "invoice_chaser_access_token";
```

- [ ] **Step 3: Implement a reusable fetch client with one-shot refresh retry and normalized errors**

```ts
export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  opts?: { auth?: boolean; retryOnUnauthorized?: boolean },
): Promise<T> {
  const headers = new Headers(init.headers);
  const token = opts?.auth ? accessTokenStore.get() : null;

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: init.credentials ?? "include",
  });

  if (response.status === 401 && opts?.auth && opts?.retryOnUnauthorized !== false) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiFetch<T>(path, init, { ...opts, retryOnUnauthorized: false });
    }
    accessTokenStore.clear();
    throw new ApiError({ code: "UNAUTHORIZED", message: "Session expired", status: 401 });
  }

  if (!response.ok) {
    throw await toApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}
```

- [ ] **Step 4: Implement typed auth, user, invoice, and reminder endpoint wrappers**

```ts
export function login(input: LoginRequest) {
  return apiFetch<LoginResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  }, { auth: false, retryOnUnauthorized: false });
}

export function listInvoices(query?: { status?: string }) {
  const search = new URLSearchParams(query as Record<string, string>);
  const suffix = search.toString() ? `?${search.toString()}` : "";
  return apiFetch<InvoiceListResponse>(`/api/v1/invoices${suffix}`, {}, { auth: true });
}
```

- [ ] **Step 5: Run lint to verify the API layer compiles cleanly**

Run: `cd frontend && npm run lint`
Expected: no unresolved imports or `any`-driven structural errors in the new API modules

- [ ] **Step 6: Commit**

```bash
git add frontend/lib
git commit -m "feat: add typed frontend api client"
```

### Task 3: Implement Backend-Backed Session Context And Protected Route Handling

**Files:**
- Create: `frontend/context/SessionContext.tsx`
- Create: `frontend/components/auth/AuthGate.tsx`
- Create: `frontend/components/auth/AuthModal.tsx`
- Modify: `frontend/app/page.tsx`
- Modify: `frontend/app/dashboard/page.tsx`

- [ ] **Step 1: Write the failing provider shape and interaction contract**

```ts
interface SessionContextValue {
  status: "loading" | "authenticated" | "unauthenticated";
  user: ApiUser | null;
  login: (input: LoginRequest) => Promise<void>;
  register: (input: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}
```

- [ ] **Step 2: Implement the provider bootstrap flow using stored access token plus `/api/v1/users/me`**

```tsx
useEffect(() => {
  const token = accessTokenStore.get();
  if (!token) {
    setStatus("unauthenticated");
    return;
  }

  void usersApi
    .getCurrentUser()
    .then((nextUser) => {
      setUser(nextUser);
      setStatus("authenticated");
    })
    .catch(() => {
      accessTokenStore.clear();
      setUser(null);
      setStatus("unauthenticated");
    });
}, []);
```

- [ ] **Step 3: Implement login, register, and logout actions against the backend API**

```tsx
const login = async (input: LoginRequest) => {
  const result = await authApi.login(input);
  accessTokenStore.set(result.access_token);
  setUser(result.user);
  setStatus("authenticated");
};

const logout = async () => {
  try {
    await authApi.logout();
  } finally {
    accessTokenStore.clear();
    setUser(null);
    setStatus("unauthenticated");
  }
};
```

- [ ] **Step 4: Protect the dashboard route and add an auth entry component on the landing page**

```tsx
export default function DashboardPage() {
  return (
    <AuthGate>
      <Dashboard />
    </AuthGate>
  );
}
```

- [ ] **Step 5: Run lint to verify provider and route wiring**

Run: `cd frontend && npm run lint`
Expected: dashboard and home routes compile against the new session context

- [ ] **Step 6: Commit**

```bash
git add frontend/context frontend/components/auth frontend/app/page.tsx frontend/app/dashboard/page.tsx
git commit -m "feat: add backend session management"
```

### Task 4: Refactor The Dashboard Into API-Driven Feature Units

**Files:**
- Modify: `frontend/components/Dashboard.tsx`
- Create: `frontend/components/dashboard/DashboardShell.tsx`
- Create: `frontend/components/dashboard/InvoiceList.tsx`
- Create: `frontend/components/dashboard/InvoiceDetail.tsx`
- Create: `frontend/components/dashboard/NewInvoiceForm.tsx`
- Create: `frontend/components/dashboard/ProfilePanel.tsx`

- [ ] **Step 1: Carve out the shared DTO mapping layer so the UI no longer depends on seeded invoice types**

```ts
export type InvoiceStatus = "draft" | "active" | "paid" | "cancelled" | "overdue";

export interface InvoiceViewModel {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  clientContact: string;
  amountFormatted: string;
  amountCents: number;
  currency: string;
  dueDate: string;
  daysOverdue: number;
  status: string;
  notes: string;
  description: string;
  paidAt?: string;
}
```

- [ ] **Step 2: Write the failing dashboard bootstrap flow around real invoice loading**

```tsx
const [invoices, setInvoices] = useState<InvoiceViewModel[]>([]);
const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  void invoicesApi
    .listInvoices()
    .then((result) => {
      setInvoices(result.data.map(toInvoiceViewModel));
      setSelectedInvoiceId(result.data[0]?.id ?? null);
    })
    .catch((err) => setError(getErrorMessage(err)))
    .finally(() => setLoading(false));
}, []);
```

- [ ] **Step 3: Split the current giant dashboard into list, detail, form, and profile slices**

```tsx
return (
  <DashboardShell>
    <InvoiceList
      invoices={invoices}
      selectedInvoiceId={selectedInvoiceId}
      onSelect={setSelectedInvoiceId}
    />
    <InvoiceDetail
      invoice={selectedInvoice}
      sequence={selectedSequence}
      events={selectedEvents}
      onMarkPaid={handleMarkPaid}
      onSendNow={handleSendNow}
      onRegenerate={handleRegenerate}
    />
    <NewInvoiceForm onCreated={handleInvoiceCreated} />
  </DashboardShell>
);
```

- [ ] **Step 4: Remove all seeded invoice arrays, fake generation timelines, and direct provider calls from the dashboard**

```tsx
// Delete:
// - SEED_INVOICES
// - generateEmail browser logic
// - Clerk hooks
// - demo-only local timeline synthesis used as production state
```

- [ ] **Step 5: Run lint after the split to catch stale prop and type mismatches**

Run: `cd frontend && npm run lint`
Expected: dashboard feature components compile with the new API-driven state

- [ ] **Step 6: Commit**

```bash
git add frontend/components/Dashboard.tsx frontend/components/dashboard
git commit -m "refactor: split dashboard into api-driven features"
```

### Task 5: Wire Invoice, Reminder, And Profile Mutations To Backend Endpoints

**Files:**
- Modify: `frontend/components/dashboard/NewInvoiceForm.tsx`
- Modify: `frontend/components/dashboard/InvoiceDetail.tsx`
- Modify: `frontend/components/dashboard/ProfilePanel.tsx`
- Modify: `frontend/lib/api/invoices.ts`
- Modify: `frontend/lib/api/reminders.ts`
- Modify: `frontend/lib/api/users.ts`

- [ ] **Step 1: Write the failing mutation contracts for the core product actions**

```ts
createInvoice(input: {
  invoice_number: string;
  client_name: string;
  client_email: string;
  client_contact?: string;
  amount_cents: number;
  currency: "ZAR";
  due_date: string;
  description?: string;
  notes?: string;
  sequence?: { tone: string; interval_days: number[] };
})
markPaid(invoiceId: string)
sendReminderNow(reminderId: string)
regenerateReminder(reminderId: string)
updateProfile(input: { full_name?: string; timezone?: string; email_signature?: string })
```

- [ ] **Step 2: Implement new-invoice submission against `POST /api/v1/invoices`**

```tsx
const handleSubmit = async () => {
  const created = await invoicesApi.createInvoice({
    invoice_number: values.invoiceNumber,
    client_name: values.clientName,
    client_email: values.clientEmail,
    client_contact: values.clientContact || undefined,
    amount_cents: Math.round(Number(values.amount) * 100),
    currency: "ZAR",
    due_date: values.dueDate,
    description: values.description,
    notes: values.notes,
    sequence: {
      tone: values.tone,
      interval_days: values.intervalDays,
    },
  });

  onCreated(toInvoiceViewModel(created));
};
```

- [ ] **Step 3: Implement invoice detail actions for mark-paid, send-now, regenerate, and sequence refresh**

```tsx
const handleMarkPaid = async () => {
  const updated = await invoicesApi.markPaid(invoice.id);
  onInvoiceUpdated(toInvoiceViewModel(updated));
};

const handleSendNow = async (reminderId: string) => {
  await remindersApi.sendNow(reminderId);
  await refreshSequenceAndEvents(invoice.id);
};
```

- [ ] **Step 4: Implement profile editing and password update flows against `/api/v1/users/me`**

```tsx
await usersApi.updateCurrentUser({
  full_name: form.fullName,
  timezone: form.timezone,
  email_signature: form.emailSignature,
});
```

- [ ] **Step 5: Run lint after wiring mutations**

Run: `cd frontend && npm run lint`
Expected: forms and detail actions compile and no direct mock state mutation paths remain

- [ ] **Step 6: Commit**

```bash
git add frontend/components/dashboard frontend/lib/api
git commit -m "feat: connect dashboard mutations to backend"
```

### Task 6: Remove Browser-Side AI Calls And Align Demo/Marketing Entry Flows

**Files:**
- Modify: `frontend/components/DemoPage.tsx`
- Modify: `frontend/components/CTA.tsx`
- Modify: `frontend/components/Hero.tsx`
- Modify: `frontend/components/Nav.tsx`
- Modify: `frontend/app/page.tsx`

- [ ] **Step 1: Write the failing requirement for browser security cleanup**

```ts
// There must be no frontend code that calls third-party LLM endpoints directly.
// Product entry points should route users into backend-backed auth or explicit demo-only local behavior.
```

- [ ] **Step 2: Remove direct Anthropic fetch usage from `DemoPage` and `Dashboard`**

```tsx
// Delete:
await fetch("https://api.anthropic.com/v1/messages", ...)

// Replace with:
// - static explanatory demo copy, or
// - product CTA pointing to signup/login
```

- [ ] **Step 3: Update landing-page CTAs so they direct users toward real auth instead of Clerk or waitlist-only dead ends**

```tsx
<button className="btn-primary" onClick={() => setAuthMode("register")}>
  <span>Start collecting</span>
  <span>→</span>
</button>
```

- [ ] **Step 4: Keep the waitlist flow only if it is intentionally separate, and make its purpose explicit in the UI**

```tsx
<p>
  Want updates before launch? Join the product list. Want to use the app now?
  Create an account.
</p>
```

- [ ] **Step 5: Run lint to verify the UI no longer references removed generation helpers**

Run: `cd frontend && npm run lint`
Expected: no remaining direct LLM endpoint calls in frontend components

- [ ] **Step 6: Commit**

```bash
git add frontend/components frontend/app/page.tsx
git commit -m "refactor: remove browser ai flows from frontend"
```

### Task 7: Harden Backend Browser Integration And Session Behavior

**Files:**
- Modify: `backend/internal/api/handler/auth.go`
- Modify: `backend/internal/api/middleware/cors.go`
- Modify: `backend/internal/config/config.go`
- Modify: `backend/cmd/server/main.go`
- Modify: `backend/.env.example`

- [ ] **Step 1: Write the failing behavior requirements for browser-compatible auth cookies and CORS**

```go
// Development frontend on localhost must be able to refresh sessions through the API.
// Production cookies must remain secure.
// Allowed origins must be explicit and support credentialed requests.
```

- [ ] **Step 2: Introduce config needed for cookie security and multi-origin frontend deployment**

```go
type Config struct {
    AppBaseURL        string
    FrontendBaseURL   string
    CookieSecure      bool
    CookieSameSite    string
}
```

- [ ] **Step 3: Update auth cookie writing so local development is not broken by unconditional `Secure` + strict same-site assumptions**

```go
http.SetCookie(w, &http.Cookie{
    Name:     "refresh_token",
    Value:    token,
    Path:     "/",
    HttpOnly: true,
    Secure:   cfg.CookieSecure,
    SameSite: http.SameSiteLaxMode,
    MaxAge:   int(expiry.Seconds()),
})
```

- [ ] **Step 4: Expand CORS/config wiring so the frontend origin can be explicitly configured**

```go
func allowedOrigins(cfg *config.Config) []string {
    origins := []string{cfg.AppBaseURL}
    if cfg.FrontendBaseURL != "" {
        origins = append(origins, cfg.FrontendBaseURL)
    }
    return origins
}
```

- [ ] **Step 5: Run backend tests to verify handler and middleware behavior still passes**

Run: `cd backend && go test ./...`
Expected: auth, middleware, payment, and service tests pass

- [ ] **Step 6: Commit**

```bash
git add backend/internal/api/handler/auth.go backend/internal/api/middleware/cors.go backend/internal/config/config.go backend/cmd/server/main.go backend/.env.example
git commit -m "fix: harden backend auth browser integration"
```

### Task 8: Update Documentation And Deployment Contracts

**Files:**
- Modify: `README.md`
- Modify: `frontend/.env.example`
- Modify: `backend/.env.example`

- [ ] **Step 1: Write the failing documentation contract**

```md
Frontend and backend environment setup must explain:
- backend API base URL for the frontend
- cookie/session assumptions
- local development startup order
- production verification commands
```

- [ ] **Step 2: Add the missing frontend API environment variable example**

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
RESEND_API_KEY=re_placeholder
RESEND_AUDIENCE_ID=aud_placeholder
OWNER_EMAIL=owner@example.com
EMAIL_FROM=InvoiceChaser <onboarding@resend.dev>
```

- [ ] **Step 3: Update root documentation to describe the real auth and API integration model**

```md
The frontend talks directly to the Go API over HTTP using native fetch.
Access tokens are stored client-side for bearer auth, while refresh tokens remain in httpOnly cookies set by the backend.
```

- [ ] **Step 4: Run a quick readback on the edited docs**

Run: `sed -n '1,220p' README.md && sed -n '1,120p' frontend/.env.example && sed -n '1,160p' backend/.env.example`
Expected: setup instructions and env contracts are coherent and non-contradictory

- [ ] **Step 5: Commit**

```bash
git add README.md frontend/.env.example backend/.env.example
git commit -m "docs: update full-stack integration setup"
```

### Task 9: Final Verification

**Files:**
- Modify: any touched files above as needed for fixups

- [ ] **Step 1: Run frontend lint**

Run: `cd frontend && npm run lint`
Expected: PASS

- [ ] **Step 2: Run frontend production build**

Run: `cd frontend && npm run build`
Expected: PASS

- [ ] **Step 3: Run backend tests**

Run: `cd backend && go test ./...`
Expected: PASS

- [ ] **Step 4: Run backend build**

Run: `cd backend && go build ./...`
Expected: PASS

- [ ] **Step 5: Review the final diff for accidental regressions**

Run: `git status --short && git diff --stat`
Expected: only intended frontend/backend integration changes remain

- [ ] **Step 6: Commit**

```bash
git add frontend backend README.md
git commit -m "feat: complete full-stack integration"
```
