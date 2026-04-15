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
      <div className="flex h-screen flex-col items-center justify-center gap-4 p-6 text-center text-text">
        <div className="font-mono text-xs uppercase tracking-[0.08em]">
          Session check failed
        </div>
        <p className="m-0 max-w-[420px] text-text-dim">
          {error}
        </p>
        <div className="flex gap-3">
          <button
            className="inline-flex items-center gap-2.5 bg-green text-black font-mono text-[13px] font-bold tracking-[0.05em] uppercase px-8 py-4 rounded-[2px] transition-all hover:bg-[#1fffaa] hover:-translate-y-px hover:shadow-[0_8px_32px_rgba(0,230,118,0.3)] border-none cursor-pointer"
            onClick={() => {
              void refreshUser();
            }}
            type="button"
          >
            <span>Retry</span>
            <span>→</span>
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-text-dim font-mono text-xs tracking-[0.08em] uppercase hover:text-text transition-colors py-4 bg-transparent border-none cursor-pointer"
          >
            Go home
          </Link>
        </div>
      </div>
    );
  }

  if (loading || !authenticated) {
    return (
      <div className="flex h-screen items-center justify-center font-mono text-xs uppercase tracking-[0.08em] text-text-dim">
        Loading session...
      </div>
    );
  }

  return <>{children}</>;
}