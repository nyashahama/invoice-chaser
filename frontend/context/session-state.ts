import { isApiError } from "../lib/api/errors";
import type { ApiUser, SessionStatus } from "../lib/api/types";

export type SessionFailurePhase = "bootstrap" | "refresh";

export interface SessionFailureResolution {
  error: string | null;
  nextStatus: SessionStatus;
  shouldClearSession: boolean;
  user: ApiUser | null;
}

export const SESSION_RETRY_MESSAGE =
  "We couldn't verify your session. Check your connection and retry.";

export function resolveSessionFailure(
  error: unknown,
  currentUser: ApiUser | null,
  phase: SessionFailurePhase,
): SessionFailureResolution {
  void phase;

  if (isApiError(error) && error.status === 401) {
    return {
      error: null,
      nextStatus: "unauthenticated",
      shouldClearSession: true,
      user: null,
    };
  }

  return {
    error: SESSION_RETRY_MESSAGE,
    nextStatus: currentUser ? "authenticated" : "loading",
    shouldClearSession: false,
    user: currentUser,
  };
}
