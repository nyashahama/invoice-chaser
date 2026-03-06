"use client";

import React, { useRef, useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export default function CTA() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSignup = async () => {
    const email = inputRef.current?.value?.trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (inputRef.current) {
        inputRef.current.style.borderColor = "var(--red)";
        inputRef.current.focus();
        setTimeout(() => {
          if (inputRef.current) inputRef.current.style.borderColor = "";
        }, 1400);
      }
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.status === 429) {
        setStatus("error");
        setErrorMsg("Too many attempts — try again in a minute.");
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMsg("Network error — check your connection and try again.");
    }
  };

  return (
    <div className="cta-final" id="cta">
      <div
        className="section-label"
        style={{ justifyContent: "center", marginBottom: "24px" }}
      >
        <span>Early access</span>
      </div>

      <h2>
        Get paid.
        <br />
        <span style={{ color: "var(--green)" }}>On autopilot.</span>
      </h2>

      <p>
        Join 200+ freelancers already recovering lost revenue. Free 14-day
        trial. No credit card.
      </p>

      {status === "success" ? (
        <div style={{ maxWidth: "480px", margin: "0 auto" }}>
          <div
            style={{
              border: "1px solid rgba(0,230,118,0.4)",
              borderRadius: "3px",
              padding: "28px 32px",
              background: "rgba(0,230,118,0.04)",
              textAlign: "left",
            }}
          >
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: "10px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "var(--green)",
                marginBottom: "12px",
              }}
            >
              // request received
            </div>
            <div
              style={{
                fontSize: "20px",
                fontWeight: 800,
                marginBottom: "10px",
                letterSpacing: "-0.02em",
              }}
            >
              You&apos;re on the list.
            </div>
            <p
              style={{
                fontFamily: "var(--mono)",
                fontSize: "12px",
                color: "var(--text-dim)",
                lineHeight: 1.7,
                margin: "0 0 20px",
              }}
            >
              Check your inbox — we just sent a confirmation. We review every
              application personally and you&apos;ll hear back within{" "}
              <strong style={{ color: "var(--text)" }}>
                1–2 business days
              </strong>{" "}
              with your access link.
            </p>
            <a
              href="/demo"
              style={{
                fontFamily: "var(--mono)",
                fontSize: "11px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--green)",
                textDecoration: "none",
              }}
            >
              Try the live demo while you wait ↗
            </a>
          </div>
        </div>
      ) : (
        <>
          <div className="cta-email-form">
            <input
              ref={inputRef}
              type="email"
              className="cta-input"
              placeholder="your@email.com"
              disabled={status === "loading"}
              onKeyDown={(e) => e.key === "Enter" && handleSignup()}
            />
            <button
              className="btn-primary"
              onClick={handleSignup}
              disabled={status === "loading"}
              style={{ opacity: status === "loading" ? 0.7 : 1 }}
            >
              {status === "loading" ? (
                <span
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      width: "11px",
                      height: "11px",
                      border: "2px solid rgba(0,0,0,0.25)",
                      borderTopColor: "var(--black)",
                      borderRadius: "50%",
                      animation: "ctaSpin 0.7s linear infinite",
                    }}
                  />
                  Sending…
                </span>
              ) : (
                <span>Request access →</span>
              )}
            </button>
          </div>

          {status === "error" && (
            <p
              style={{
                fontFamily: "var(--mono)",
                fontSize: "11px",
                color: "var(--red)",
                marginTop: "12px",
                letterSpacing: "0.04em",
              }}
            >
              ✗ {errorMsg}
            </p>
          )}
        </>
      )}

      <p
        style={{
          fontFamily: "var(--mono)",
          fontSize: "10px",
          color: "var(--text-muted)",
          marginTop: "20px",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        No card required · We review every request · Setup in 5 minutes
      </p>

      <style>{`@keyframes ctaSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
