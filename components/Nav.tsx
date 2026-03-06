"use client";

import React from "react";
import { useUser, useClerk } from "@clerk/nextjs";

export default function Nav() {
  const { isSignedIn } = useUser();
  const { signOut } = useClerk();

  return (
    <nav>
      <div className="nav-logo">
        Invoice<span>Chaser</span>
      </div>
      <ul className="nav-links">
        {!isSignedIn && (
          <>
            <li>
              <a href="#how">How it works</a>
            </li>
            <li>
              <a href="#pricing">Pricing</a>
            </li>
          </>
        )}
        <li>
          <a href="/demo">Live demo ↗</a>
        </li>
        {isSignedIn ? (
          <>
            <li>
              <a href="/dashboard" className="nav-cta">
                Dashboard →
              </a>
            </li>
            <li>
              <button
                onClick={() => signOut({ redirectUrl: "/" })}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-dim)",
                  fontFamily: "var(--mono)",
                  fontSize: "12px",
                }}
              >
                Sign out
              </button>
            </li>
          </>
        ) : (
          <li>
            <a href="#cta" className="nav-cta">
              Get early access
            </a>
          </li>
        )}
      </ul>
    </nav>
  );
}
