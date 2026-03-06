"use client";

import React, { useRef, useState } from "react";

export default function CTA() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const handleSignup = () => {
    const email = inputRef.current?.value?.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      inputRef.current?.focus();
      if (inputRef.current) {
        inputRef.current.style.borderColor = "var(--red)";
        setTimeout(() => {
          if (inputRef.current) inputRef.current.style.borderColor = "";
        }, 1200);
      }
      return;
    }

    setStatus("loading");
    // Simulate async signup — replace with your real API call
    setTimeout(() => {
      setStatus("success");
    }, 900);
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
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: "13px",
            color: "var(--green)",
            border: "1px solid var(--green)",
            borderRadius: "2px",
            padding: "16px 32px",
            display: "inline-block",
            marginTop: "8px",
            letterSpacing: "0.05em",
          }}
        >
          ✓ You&apos;re on the list — we&apos;ll be in touch soon.
        </div>
      ) : (
        <div className="cta-email-form">
          <input
            ref={inputRef}
            type="email"
            className="cta-input"
            placeholder="your@email.com"
            onKeyDown={(e) => e.key === "Enter" && handleSignup()}
          />
          <button
            className="btn-primary"
            onClick={handleSignup}
            disabled={status === "loading"}
            style={{ opacity: status === "loading" ? 0.7 : 1 }}
          >
            <span>{status === "loading" ? "Sending…" : "Start free →"}</span>
          </button>
        </div>
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
        No card required · Cancel anytime · Setup in 5 minutes
      </p>
    </div>
  );
}
