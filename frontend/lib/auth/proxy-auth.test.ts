import { describe, expect, it } from "vitest";

import {
  AUTH_PRESENCE_COOKIE_NAME,
  AUTH_PRESENCE_COOKIE_VALUE,
  shouldRedirectFromProtectedRoute,
} from "./proxy-auth";

describe("shouldRedirectFromProtectedRoute", () => {
  it("redirects protected dashboard routes when the auth presence cookie is missing", () => {
    expect(
      shouldRedirectFromProtectedRoute("/dashboard", undefined),
    ).toBe(true);
    expect(
      shouldRedirectFromProtectedRoute("/dashboard/invoices", ""),
    ).toBe(true);
  });

  it("allows protected routes when the auth presence cookie is present", () => {
    expect(
      shouldRedirectFromProtectedRoute(
        "/dashboard",
        AUTH_PRESENCE_COOKIE_VALUE,
      ),
    ).toBe(false);
  });

  it("never redirects public routes", () => {
    expect(
      shouldRedirectFromProtectedRoute("/", undefined),
    ).toBe(false);
    expect(AUTH_PRESENCE_COOKIE_NAME).toBe("invoice_chaser_auth");
  });
});
