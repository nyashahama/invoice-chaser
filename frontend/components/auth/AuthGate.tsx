"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useSession } from "@/context/SessionContext";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { authenticated, error, loading, refreshUser, unauthenticated } =
    useSession();

  useEffect(() => {
    if (unauthenticated) {
      router.replace("/");
    }
  }, [router, unauthenticated]);

  if (loading && error) {
    return (
      <div
        style={{
          alignItems: "center",
          color: "var(--text)",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          height: "100vh",
          justifyContent: "center",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: "12px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Session check failed
        </div>
        <p style={{ color: "var(--text-dim)", margin: 0, maxWidth: "420px" }}>
          {error}
        </p>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            className="btn-primary"
            onClick={() => {
              void refreshUser();
            }}
            type="button"
          >
            <span>Retry</span>
            <span>→</span>
          </button>
          <Link href="/" className="btn-ghost">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  if (loading || !authenticated) {
    return (
      <div
        style={{
          alignItems: "center",
          color: "var(--text-dim)",
          display: "flex",
          fontFamily: "var(--mono)",
          fontSize: "12px",
          height: "100vh",
          justifyContent: "center",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        Loading session...
      </div>
    );
  }

  return <>{children}</>;
}
