import { describe, expect, it } from "vitest";

import { ApiError } from "../lib/api/errors";
import type { ApiUser } from "../lib/api/types";
import { resolveSessionFailure } from "./session-state";

const user: ApiUser = {
  created_at: "2026-04-15T08:00:00Z",
  email: "ada@example.com",
  full_name: "Ada Lovelace",
  id: "user_123",
  plan: "trial",
  timezone: "Africa/Johannesburg",
};

describe("resolveSessionFailure", () => {
  it("clears the session on unauthorized errors", () => {
    const result = resolveSessionFailure(
      new ApiError("unauthorized", {
        code: "UNAUTHORIZED",
        status: 401,
      }),
      user,
      "bootstrap",
    );

    expect(result).toEqual({
      error: null,
      nextStatus: "unauthenticated",
      shouldClearSession: true,
      user: null,
    });
  });

  it("preserves the session on non-auth bootstrap failures", () => {
    const result = resolveSessionFailure(
      new ApiError("backend exploded", {
        code: "INTERNAL",
        status: 500,
      }),
      user,
      "bootstrap",
    );

    expect(result).toEqual({
      error: "We couldn't verify your session. Check your connection and retry.",
      nextStatus: "authenticated",
      shouldClearSession: false,
      user,
    });
  });

  it("keeps bootstrap loading when no user is available yet", () => {
    const result = resolveSessionFailure(
      new Error("network down"),
      null,
      "bootstrap",
    );

    expect(result).toEqual({
      error: "We couldn't verify your session. Check your connection and retry.",
      nextStatus: "loading",
      shouldClearSession: false,
      user: null,
    });
  });
});
