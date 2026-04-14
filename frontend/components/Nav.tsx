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
    <nav>
      <div className="nav-logo">
        Invoice<span>Chaser</span>
      </div>
      <ul className="nav-links">
        {!authenticated && (
          <>
            <li>
              <a href="#how">How it works</a>
            </li>
            <li>
              <a href="#pricing">Pricing</a>
            </li>
            <li>
              <button
                className="nav-auth"
                onClick={() => onOpenAuthModal("login")}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-dim)",
                  cursor: "pointer",
                  fontFamily: "var(--mono)",
                  fontSize: "12px",
                  padding: 0,
                }}
                type="button"
              >
                Sign in
              </button>
            </li>
          </>
        )}
        <li>
          <a href="/demo">Live demo ↗</a>
        </li>
        {authenticated ? (
          <>
            <li>
              <a href="/dashboard" className="nav-cta">
                Dashboard →
              </a>
            </li>
            <li>
              <button
                onClick={() => {
                  void logout();
                  router.push("/");
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-dim)",
                  fontFamily: "var(--mono)",
                  fontSize: "12px",
                }}
                type="button"
              >
                Sign out
              </button>
            </li>
          </>
        ) : (
          <li>
            <button
              className="nav-cta"
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
