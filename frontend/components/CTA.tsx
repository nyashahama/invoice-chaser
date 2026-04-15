"use client";

import Link from "next/link";
import React, { useRef, useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export default function CTA() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [inputError, setInputError] = useState(false);

  const handleSignup = async () => {
    const email = inputRef.current?.value?.trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (inputRef.current) {
        setInputError(true);
        inputRef.current.focus();
        setTimeout(() => {
          setInputError(false);
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
    <div className="bg-surface border-t border-border-default py-20 px-6 text-center relative overflow-hidden md:pt-[140px] md:pb-[140px] md:px-12" id="cta">
      <div className="absolute bottom-[-200px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(0,230,118,0.08)_0%,transparent_70%)] pointer-events-none" />

      <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-green flex items-center justify-center gap-2.5 mb-6">
        <span>Early access</span>
      </div>

      <h2 className="text-[clamp(32px,4vw,52px)] font-extrabold leading-[1.1] tracking-tight mb-6">
        Get paid.
        <br />
        <span className="text-green">On autopilot.</span>
      </h2>

      <p className="text-[clamp(16px,1.8vw,20px)] text-text-dim leading-[1.65] max-w-[480px] mx-auto mb-8 font-normal">
        Create an account to use the product now, or join the launch list if
        you only want rollout updates.
      </p>

      {status === "success" ? (
        <div className="max-w-[480px] mx-auto">
          <div className="border border-[rgba(0,230,118,0.4)] rounded-[3px] py-7 px-8 bg-[rgba(0,230,118,0.04)] text-left">
            <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-green mb-3">
              {"// request received"}
            </div>
            <div className="text-[20px] font-extrabold mb-2.5 tracking-[-0.02em]">
              You&apos;re on the list.
            </div>
            <p className="font-mono text-xs text-text-dim leading-[1.7] mb-5">
              Check your inbox — we just sent a confirmation. We review every
              application personally and you&apos;ll hear back within{" "}
              <strong className="text-text">
                1–2 business days
              </strong>{" "}
              with your access link.
            </p>
            <Link
              href="/get-started"
              className="font-mono text-[11px] tracking-[0.08em] uppercase text-green no-underline"
            >
              Create your account now →
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="flex gap-3 justify-center mb-5">
            <Link className="inline-flex items-center gap-2.5 bg-green text-black font-mono text-[13px] font-bold tracking-[0.05em] uppercase px-8 py-4 rounded-[2px] no-underline transition-all hover:bg-[#1fffaa] hover:-translate-y-px hover:shadow-[0_8px_32px_rgba(0,230,118,0.3)] border-none cursor-pointer" href="/get-started">
              <span>Create account</span>
              <span>→</span>
            </Link>
            <Link className="inline-flex items-center gap-2 text-text-dim font-mono text-xs tracking-[0.08em] uppercase no-underline hover:text-text transition-colors py-4" href="/demo">
              Product preview ↗
            </Link>
          </div>

          <div className="flex flex-col gap-3 justify-center max-w-[480px] mx-auto md:flex-row">
            <input
              ref={inputRef}
              type="email"
              className={`flex-1 bg-black border ${inputError ? "border-red" : "border-border-light"} text-text font-mono text-[13px] px-[18px] py-3.5 rounded-[2px] outline-none focus:border-green placeholder:text-text-muted`}
              placeholder="your@email.com"
              disabled={status === "loading"}
              onKeyDown={(e) => e.key === "Enter" && handleSignup()}
            />
            <button
              className={`inline-flex items-center gap-2.5 bg-green text-black font-mono text-[13px] font-bold tracking-[0.05em] uppercase px-8 py-4 rounded-[2px] no-underline transition-all hover:bg-[#1fffaa] hover:-translate-y-px hover:shadow-[0_8px_32px_rgba(0,230,118,0.3)] border-none cursor-pointer ${status === "loading" ? "opacity-70" : ""}`}
              onClick={handleSignup}
              disabled={status === "loading"}
            >
              {status === "loading" ? (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block w-[11px] h-[11px] border-2 border-[rgba(0,0,0,0.25)] border-t-black rounded-full animate-cta-spin" />
                  Sending…
                </span>
              ) : (
                <span>Request access →</span>
              )}
            </button>
          </div>

          {status === "error" && (
            <p className="font-mono text-[11px] text-red mt-3 tracking-[0.04em]">
              ✗ {errorMsg}
            </p>
          )}
        </>
      )}

      <p className="font-mono text-[10px] text-text-muted mt-5 tracking-[0.1em] uppercase">
        Create an account for immediate access · Waitlist is for launch updates
      </p>
    </div>
  );
}