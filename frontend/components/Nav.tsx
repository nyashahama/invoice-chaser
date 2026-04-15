"use client";

import React from "react";
import { useRouter } from "next/navigation";

import { useSession } from "@/context/SessionContext";

interface NavProps {
  onOpenAuthModal: (mode: "login" | "register") => void;
}

export default function Nav({ onOpenAuthModal }: NavProps) {
  const router = useRouter();
  const { authenticated, logout } = useSession();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-12 md:py-5 border-b border-border-default bg-black/90 backdrop-blur-md">
      <div className="font-mono text-[13px] font-bold tracking-[0.08em] text-green uppercase">
        Invoice<span className="text-text-dim">Chaser</span>
      </div>
      <ul className="hidden md:flex items-center gap-8 list-none">
        {!authenticated && (
          <>
            <li>
              <a
                href="#how"
                className="font-mono text-[11px] tracking-[0.12em] uppercase text-text-dim no-underline hover:text-text transition-colors"
              >
                How it works
              </a>
            </li>
            <li>
              <a
                href="#pricing"
                className="font-mono text-[11px] tracking-[0.12em] uppercase text-text-dim no-underline hover:text-text transition-colors"
              >
                Pricing
              </a>
            </li>
            <li>
              <button
                className="bg-transparent border-none text-text-dim cursor-pointer font-mono text-[12px] p-0"
                onClick={() => onOpenAuthModal("login")}
                type="button"
              >
                Sign in
              </button>
            </li>
          </>
        )}
        <li>
          <a
            href="/demo"
            className="font-mono text-[11px] tracking-[0.12em] uppercase text-text-dim no-underline hover:text-text transition-colors"
          >
            Live demo ↗
          </a>
        </li>
        {authenticated ? (
          <>
            <li>
              <a
                href="/dashboard"
                className="font-mono text-[11px] tracking-[0.1em] uppercase text-black bg-green px-5 py-2 rounded-[2px] no-underline hover:opacity-85 transition-opacity border-none cursor-pointer"
              >
                Dashboard →
              </a>
            </li>
            <li>
              <button
                onClick={() => {
                  void logout();
                  router.push("/");
                }}
                className="bg-transparent border-none cursor-pointer text-text-dim font-mono text-[12px]"
                type="button"
              >
                Sign out
              </button>
            </li>
          </>
        ) : (
          <li>
            <button
              className="font-mono text-[11px] tracking-[0.1em] uppercase text-black bg-green px-5 py-2 rounded-[2px] no-underline hover:opacity-85 transition-opacity border-none cursor-pointer"
              onClick={() => onOpenAuthModal("register")}
              type="button"
            >
              Create account →
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
}