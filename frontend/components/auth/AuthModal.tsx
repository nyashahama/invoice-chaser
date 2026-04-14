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
      style={{
        alignItems: "center",
        backdropFilter: "blur(10px)",
        background: "rgba(10, 10, 10, 0.72)",
        display: "flex",
        inset: 0,
        justifyContent: "center",
        padding: "24px",
        position: "fixed",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          boxShadow: "0 24px 80px rgba(0, 0, 0, 0.45)",
          maxWidth: "440px",
          padding: "28px",
          position: "relative",
          width: "100%",
        }}
      >
        <button
          aria-label="Close authentication modal"
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-dim)",
            cursor: "pointer",
            fontSize: "24px",
            lineHeight: 1,
            position: "absolute",
            right: "18px",
            top: "14px",
          }}
          type="button"
        >
          ×
        </button>

        <div
          style={{
            color: "var(--text-dim)",
            fontFamily: "var(--mono)",
            fontSize: "11px",
            letterSpacing: "0.12em",
            marginBottom: "12px",
            textTransform: "uppercase",
          }}
        >
          Backend session auth
        </div>
        <h2
          style={{
            color: "var(--text)",
            fontSize: "32px",
            lineHeight: 1,
            margin: "0 0 12px",
          }}
        >
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h2>
        <p
          style={{
            color: "var(--text-dim)",
            lineHeight: 1.6,
            margin: "0 0 24px",
          }}
        >
          {mode === "login"
            ? "Sign in with your email and password to resume your collections."
            : "Start with a backend-backed session. Your refresh token stays in a cookie; the access token stays client-side."}
        </p>

        <div
          style={{
            display: "grid",
            gap: "8px",
            gridTemplateColumns: "1fr 1fr",
            marginBottom: "20px",
          }}
        >
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
              style={{
                background:
                  nextMode === mode ? "var(--text)" : "transparent",
                border: "1px solid var(--border)",
                borderRadius: "999px",
                color:
                  nextMode === mode ? "var(--bg)" : "var(--text-dim)",
                cursor: "pointer",
                fontFamily: "var(--mono)",
                fontSize: "11px",
                letterSpacing: "0.1em",
                padding: "10px 12px",
                textTransform: "uppercase",
              }}
              type="button"
            >
              {nextMode === "login" ? "Sign in" : "Register"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "14px" }}>
          {mode === "register" ? (
            <label style={{ display: "grid", gap: "8px" }}>
              <span
                style={{
                  color: "var(--text-dim)",
                  fontFamily: "var(--mono)",
                  fontSize: "11px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
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
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid var(--border)",
                  borderRadius: "4px",
                  color: "var(--text)",
                  fontSize: "16px",
                  padding: "14px 16px",
                }}
                type="text"
                value={fullName}
              />
            </label>
          ) : null}

          <label style={{ display: "grid", gap: "8px" }}>
            <span
              style={{
                color: "var(--text-dim)",
                fontFamily: "var(--mono)",
                fontSize: "11px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
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
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid var(--border)",
                borderRadius: "4px",
                color: "var(--text)",
                fontSize: "16px",
                padding: "14px 16px",
              }}
              type="email"
              value={email}
            />
          </label>

          <label style={{ display: "grid", gap: "8px" }}>
            <span
              style={{
                color: "var(--text-dim)",
                fontFamily: "var(--mono)",
                fontSize: "11px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
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
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid var(--border)",
                borderRadius: "4px",
                color: "var(--text)",
                fontSize: "16px",
                padding: "14px 16px",
              }}
              type="password"
              value={password}
            />
          </label>

          {error ? (
            <div
              style={{
                border: "1px solid rgba(255, 61, 61, 0.25)",
                borderRadius: "4px",
                color: "#ff9b9b",
                fontFamily: "var(--mono)",
                fontSize: "11px",
                letterSpacing: "0.06em",
                padding: "12px 14px",
                textTransform: "uppercase",
              }}
            >
              {error}
            </div>
          ) : null}

          <button
            disabled={submitting}
            style={{
              background: "var(--text)",
              border: "none",
              borderRadius: "999px",
              color: "var(--bg)",
              cursor: submitting ? "progress" : "pointer",
              fontFamily: "var(--mono)",
              fontSize: "12px",
              letterSpacing: "0.12em",
              marginTop: "6px",
              opacity: submitting ? 0.8 : 1,
              padding: "14px 18px",
              textTransform: "uppercase",
            }}
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
