"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useSession } from "@/context/SessionContext";
import { isApiError } from "@/lib/api/errors";

import { createEmptyAuthModalFields } from "./auth-modal-state";

export type AuthModalMode = "login" | "register";

interface AuthModalProps {
  initialMode?: AuthModalMode;
  isOpen: boolean;
  onClose: () => void;
}

function authErrorMessage(error: unknown) {
  if (isApiError(error)) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

export default function AuthModal({
  initialMode = "register",
  isOpen,
  onClose,
}: AuthModalProps) {
  const router = useRouter();
  const { login, register } = useSession();

  const [mode, setMode] = useState<AuthModalMode>(initialMode);
  const [fields, setFields] = useState(createEmptyAuthModalFields);
  const { email, error, fullName, password, submitting } = fields;

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setFields(createEmptyAuthModalFields());
    }
  }, [initialMode, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFields((current) => ({
      ...current,
      error: null,
      submitting: true,
    }));

    try {
      if (mode === "login") {
        await login({ email, password });
      } else {
        await register({ email, full_name: fullName, password });
      }

      onClose();
      router.push("/dashboard");
    } catch (nextError) {
      setFields((current) => ({
        ...current,
        error: authErrorMessage(nextError),
      }));
    } finally {
      setFields((current) => ({
        ...current,
        submitting: false,
      }));
    }
  }

  return (
    <div
      aria-modal="true"
      role="dialog"
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-[rgba(10,10,10,0.72)] backdrop-blur-[10px] p-6"
    >
      <div className="w-full max-w-[440px] rounded-lg border border-border-default bg-surface p-7 relative shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <button
          aria-label="Close authentication modal"
          onClick={onClose}
          className="absolute right-[18px] top-3.5 cursor-pointer border-none bg-transparent text-text-dim text-2xl leading-none"
          type="button"
        >
          ×
        </button>

        <div className="mb-3 font-mono text-[11px] tracking-[0.12em] uppercase text-text-dim">
          Backend session auth
        </div>
        <h2 className="m-0 mb-3 text-[32px] leading-none text-text">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h2>
        <p className="mb-6 leading-[1.6] text-text-dim">
          {mode === "login"
            ? "Sign in with your email and password to resume your collections."
            : "Start with a backend-backed session. Your refresh token stays in a cookie; the access token stays client-side."}
        </p>

        <div className="mb-5 grid grid-cols-2 gap-2">
          {(["login", "register"] as const).map((nextMode) => (
            <button
              key={nextMode}
              onClick={() => {
                setMode(nextMode);
                setFields((current) => ({
                  ...current,
                  error: null,
                }));
              }}
              className={`${nextMode === mode ? "bg-text text-black" : "bg-transparent text-text-dim"} cursor-pointer rounded-full border border-border-default px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.1em]`}
              type="button"
            >
              {nextMode === "login" ? "Sign in" : "Register"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="grid gap-3.5">
          {mode === "register" ? (
            <label className="grid gap-2">
              <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-dim">
                Full name
              </span>
              <input
                autoComplete="name"
                onChange={(event) =>
                  setFields((current) => ({
                    ...current,
                    fullName: event.target.value,
                  }))
                }
                required
                className="rounded border border-border-default bg-white/[0.02] px-4 py-3.5 text-base text-text"
                type="text"
                value={fullName}
              />
            </label>
          ) : null}

          <label className="grid gap-2">
            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-dim">
              Email
            </span>
            <input
              autoComplete="email"
              onChange={(event) =>
                setFields((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              required
              className="rounded border border-border-default bg-white/[0.02] px-4 py-3.5 text-base text-text"
              type="email"
              value={email}
            />
          </label>

          <label className="grid gap-2">
            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-dim">
              Password
            </span>
            <input
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              minLength={8}
              onChange={(event) =>
                setFields((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              required
              className="rounded border border-border-default bg-white/[0.02] px-4 py-3.5 text-base text-text"
              type="password"
              value={password}
            />
          </label>

          {error ? (
            <div className="rounded border border-[rgba(255,61,61,0.25)] px-3.5 py-3 font-mono text-[11px] uppercase tracking-[0.06em] text-[#ff9b9b]">
              {error}
            </div>
          ) : null}

          <button
            disabled={submitting}
            className="mt-1.5 rounded-full border-none bg-text px-[18px] py-[14px] font-mono text-xs uppercase tracking-[0.12em] text-black disabled:cursor-progress disabled:opacity-80"
            type="submit"
          >
            {submitting
              ? "Working..."
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}