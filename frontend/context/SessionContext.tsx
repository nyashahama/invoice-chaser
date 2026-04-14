"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { login, logout, register } from "@/lib/api/auth";
import type {
  ApiUser,
  LoginInput,
  RegisterInput,
  SessionStatus,
} from "@/lib/api/types";
import { getCurrentUser } from "@/lib/api/users";
import {
  clearAccessToken,
  setAccessToken,
  setAuthPresenceCookie,
} from "@/lib/auth/session-storage";

import { resolveSessionFailure } from "./session-state";

interface SessionContextValue {
  authenticated: boolean;
  error: string | null;
  loading: boolean;
  login: (input: LoginInput) => Promise<ApiUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<ApiUser | null>;
  register: (input: Omit<RegisterInput, "timezone"> & { timezone?: string }) => Promise<ApiUser>;
  status: SessionStatus;
  unauthenticated: boolean;
  user: ApiUser | null;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

function getDefaultTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [user, setUser] = useState<ApiUser | null>(null);
  const userRef = useRef<ApiUser | null>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const applySession = useCallback((nextUser: ApiUser, accessToken?: string) => {
    if (accessToken) {
      setAccessToken(accessToken);
    } else {
      setAuthPresenceCookie();
    }

    setError(null);
    userRef.current = nextUser;
    setUser(nextUser);
    setStatus("authenticated");
    return nextUser;
  }, []);

  const clearSession = useCallback(() => {
    clearAccessToken();
    setError(null);
    userRef.current = null;
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const refreshUser = useCallback(async () => {
    const currentUser = userRef.current;

    if (!currentUser) {
      setStatus("loading");
    }

    setError(null);

    try {
      const nextUser = await getCurrentUser();
      return applySession(nextUser);
    } catch (error) {
      const resolution = resolveSessionFailure(error, currentUser, "refresh");

      if (resolution.shouldClearSession) {
        clearSession();
      } else {
        setError(resolution.error);
        userRef.current = resolution.user;
        setUser(resolution.user);
        setStatus(resolution.nextStatus);
      }

      return resolution.user;
    }
  }, [applySession, clearSession]);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const handleLogin = useCallback(
    async (input: LoginInput) => {
      const session = await login(input);
      return applySession(session.user, session.access_token);
    },
    [applySession],
  );

  const handleRegister = useCallback(
    async (
      input: Omit<RegisterInput, "timezone"> & {
        timezone?: string;
      },
    ) => {
      const session = await register({
        ...input,
        timezone: input.timezone || getDefaultTimezone(),
      });

      return applySession(session.user, session.access_token);
    },
    [applySession],
  );

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo<SessionContextValue>(
    () => ({
      authenticated: status === "authenticated",
      error,
      loading: status === "loading",
      login: handleLogin,
      logout: handleLogout,
      refreshUser,
      register: handleRegister,
      status,
      unauthenticated: status === "unauthenticated",
      user,
    }),
    [
      error,
      handleLogin,
      handleLogout,
      handleRegister,
      refreshUser,
      status,
      user,
    ],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }

  return context;
}
