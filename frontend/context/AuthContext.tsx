"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";

// ─── TYPES ────────────────────────────────────────────────────────────────────
// Swap this for your real user type when you wire up NextAuth / Supabase / etc.

export interface User {
  email: string;
  name: string;
  plan: "trial" | "solo" | "pro" | "team";
  trialEndsAt: string; // ISO date string
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signUp: (email: string, name?: string) => Promise<void>;
  signIn: (email: string) => Promise<void>;
  signOut: () => void;
}

// ─── CONTEXT ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signUp: async () => {},
  signIn: async () => {},
  signOut: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

// ─── STORAGE KEY ──────────────────────────────────────────────────────────────
// Replace the sessionStorage calls below with real JWT/session logic.

const STORAGE_KEY = "ic_user";

function readUser(): User | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function writeUser(u: User) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(u));
}

function clearUser() {
  sessionStorage.removeItem(STORAGE_KEY);
}

// ─── PROVIDER ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readUser());
  const [loading] = useState(false);

  const signUp = useCallback(async (email: string, name?: string) => {
    // ── REPLACE THIS BLOCK with your real API call ──────────────────────────
    // e.g.: const { user } = await supabase.auth.signUp({ email, password })
    // ────────────────────────────────────────────────────────────────────────
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);

    const newUser: User = {
      email,
      name: name ?? email.split("@")[0],
      plan: "trial",
      trialEndsAt: trialEnd.toISOString(),
    };
    writeUser(newUser);
    setUser(newUser);
  }, []);

  const signIn = useCallback(
    async (email: string) => {
      // ── REPLACE THIS BLOCK ───────────────────────────────────────────────────
      const existing = readUser();
      if (existing && existing.email === email) {
        setUser(existing);
        return;
      }
      // Fallback: create a fresh session
      await signUp(email);
    },
    [signUp],
  );

  const signOut = useCallback(() => {
    clearUser();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
