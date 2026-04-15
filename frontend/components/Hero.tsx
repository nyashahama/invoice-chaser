"use client";

import React from "react";
import { useRouter } from "next/navigation";

import { useSession } from "@/context/SessionContext";

interface HeroProps {
  onOpenAuthModal: (mode: "login" | "register") => void;
}

function getDisplayName(fullName: string, email: string) {
  return fullName.trim().split(" ")[0] || email.split("@")[0] || "there";
}

export default function Hero({ onOpenAuthModal }: HeroProps) {
  const { authenticated, user } = useSession();
  const router = useRouter();

  if (authenticated && user) {
    const name = getDisplayName(user.full_name, user.email);

    return (
      <section className="min-h-screen grid grid-cols-1 items-center pt-[100px] px-6 pb-[60px] gap-12 relative overflow-hidden md:grid-cols-2 md:pt-[120px] md:px-12 md:pb-20 md:gap-20">
<div className="absolute -top-[200px] -right-[200px] w-[700px] h-[700px] bg-[radial-gradient(circle,rgba(0,230,118,0.06)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute -bottom-[200px] -left-[200px] w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(0,230,118,0.03)_0%,transparent_70%)] pointer-events-none" />
        <div>
          <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-green mb-7 flex items-center gap-3 opacity-0 animate-fade-up [animation-delay:100ms] before:content-[''] before:block before:w-6 before:h-px before:bg-green">
            Welcome back
          </div>
          <h1 className="text-[clamp(42px,5.5vw,76px)] font-extrabold leading-none tracking-tight mb-7 opacity-0 animate-fade-up [animation-delay:200ms]">
            Hey, <em className="font-serif italic font-normal text-green">{name}.</em>
          </h1>
          <p className="text-[clamp(16px,1.8vw,20px)] text-text-dim leading-[1.65] max-w-[480px] mb-12 font-normal opacity-0 animate-fade-up [animation-delay:300ms]">
            Your autopilot is running. Check your dashboard to see what&apos;s
            been collected while you were away.
          </p>
          <div className="flex items-center gap-5 flex-wrap opacity-0 animate-fade-up [animation-delay:400ms]">
            <button
              className="inline-flex items-center gap-2.5 bg-green text-black font-mono text-[13px] font-bold tracking-[0.05em] uppercase px-8 py-4 rounded-[2px] no-underline transition-all hover:bg-[#1fffaa] hover:-translate-y-px hover:shadow-[0_8px_32px_rgba(0,230,118,0.3)] border-none cursor-pointer"
              onClick={() => router.push("/dashboard")}
            >
              <span>Go to dashboard</span>
              <span>→</span>
            </button>
            <a href="/demo" className="inline-flex items-center gap-2 text-text-dim font-mono text-xs tracking-[0.08em] uppercase no-underline hover:text-text transition-colors py-4">
              Try live demo ↗
            </a>
          </div>
        </div>
        <div className="relative opacity-0 animate-fade-in [animation-delay:500ms] order-first md:order-none">
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-lg shadow-[0_25px_50px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)] overflow-hidden font-mono text-xs hover:shadow-[0_4px_20px_rgba(0,230,118,0.08)] transition-shadow duration-300">
            <div className="bg-white/[0.04] py-3.5 px-5 border-b border-border-default flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
              <div className="flex-1 text-center text-[10px] text-text-muted tracking-[0.1em] uppercase">autopilot — running</div>
            </div>
            <div className="p-6">
              <div className="flex justify-between py-2 border-b border-border-default text-text-dim text-[11px] [&:last-child]:border-b-0">
                <span>Account</span>
                <strong className="text-text">{user.email}</strong>
              </div>
              <div className="flex justify-between pt-4 pb-2 text-xl font-bold border-t-2 border-border-light mt-2 text-text">
                <span>Status</span>
                <span className="text-green text-base">● Active</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen grid grid-cols-1 items-center pt-[100px] px-6 pb-[60px] gap-12 relative overflow-hidden md:grid-cols-2 md:pt-[120px] md:px-12 md:pb-20 md:gap-20">
      <div className="absolute -top-[200px] -right-[200px] w-[700px] h-[700px] bg-[radial-gradient(circle,rgba(0,230,118,0.06)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute -bottom-[200px] -left-[200px] w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(0,230,118,0.03)_0%,transparent_70%)] pointer-events-none" />
      <div>
        <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-green mb-7 flex items-center gap-3 opacity-0 animate-fade-up [animation-delay:100ms] before:content-[''] before:block before:w-6 before:h-px before:bg-green">
          Autopilot for overdue invoices
        </div>
        <h1 className="text-[clamp(42px,5.5vw,76px)] font-extrabold leading-none tracking-tight mb-7 opacity-0 animate-fade-up [animation-delay:200ms]">
          Stop chasing.
          <br />
          Start <em className="font-serif italic font-normal bg-gradient-to-r from-text-dim to-green bg-clip-text text-transparent">getting paid.</em>
        </h1>
        <p className="text-[clamp(16px,1.8vw,20px)] text-text-dim leading-[1.65] max-w-[480px] mb-12 font-normal opacity-0 animate-fade-up [animation-delay:300ms]">
          Automated follow-ups that escalate from polite to firm — and stop the
          instant your client pays. No awkward emails. No forgotten invoices.
        </p>
        <div className="flex items-center gap-5 flex-wrap opacity-0 animate-fade-up [animation-delay:400ms]">
          <button
            className="inline-flex items-center gap-2.5 bg-green text-black font-mono text-[13px] font-bold tracking-[0.05em] uppercase px-8 py-4 rounded-[2px] no-underline transition-all hover:bg-[#1fffaa] hover:-translate-y-px hover:shadow-[0_8px_32px_rgba(0,230,118,0.3)] border-none cursor-pointer"
            onClick={() => onOpenAuthModal("register")}
            type="button"
          >
            <span>Start collecting</span>
            <span>→</span>
          </button>
          <a href="/demo" className="inline-flex items-center gap-2 text-text-dim font-mono text-xs tracking-[0.08em] uppercase no-underline hover:text-text transition-colors py-4">
            Try live demo ↗
          </a>
        </div>
      </div>
      <div className="relative opacity-0 animate-fade-in [animation-delay:500ms] order-first md:order-none">
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-lg shadow-[0_25px_50px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)] overflow-hidden font-mono text-xs hover:shadow-[0_4px_20px_rgba(0,230,118,0.08)] transition-shadow duration-300">
          <div className="bg-white/[0.04] py-3.5 px-5 border-b border-border-default flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
            <div className="flex-1 text-center text-[10px] text-text-muted tracking-[0.1em] uppercase">invoice #2301 — acme corp</div>
          </div>
          <div className="p-6">
            <div className="flex justify-between py-2 border-b border-border-default text-text-dim text-[11px] [&:last-child]:border-b-0">
              <span>Client</span>
              <strong className="text-text">Acme Corp</strong>
            </div>
            <div className="flex justify-between py-2 border-b border-border-default text-text-dim text-[11px] [&:last-child]:border-b-0">
              <span>Issued</span>
              <strong className="text-text">Feb 01, 2025</strong>
            </div>
            <div className="flex justify-between py-2 border-b border-border-default text-text-dim text-[11px] [&:last-child]:border-b-0">
              <span>Due</span>
              <strong className="text-text">Feb 15, 2025</strong>
            </div>
            <div className="flex justify-between py-2 border-b border-border-default text-text-dim text-[11px] [&:last-child]:border-b-0">
              <span>Status</span>
              <div className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.15em] uppercase px-2.5 py-1 rounded-[2px] mt-1 bg-red/15 text-red border border-red/30">
                ● 28 days overdue
              </div>
            </div>
            <div className="flex justify-between pt-4 pb-2 text-xl font-bold border-t-2 border-border-light mt-2 text-text">
              <span>Total Due</span>
              <span className="text-red">$12,500</span>
            </div>
            <div className="mt-4 border-t border-border-default pt-4">
              <div className="text-[9px] tracking-[0.2em] uppercase text-text-muted mb-2.5">{"// auto-reminders sent"}</div>
              <div className="flex items-start gap-2.5 py-2 border-b border-border-default last:border-b-0 animate-slide-in [animation-delay:1200ms]">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] shrink-0 mt-px bg-green/15 text-green">✓</div>
                <div className="flex-1">
                  <div className="text-[10px] text-text-dim mb-0.5">Friendly reminder · Day 1</div>
                  <div className="text-[9px] text-text-muted">Feb 16 · Opened ✓</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5 py-2 border-b border-border-default last:border-b-0 animate-slide-in [animation-delay:1600ms]">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] shrink-0 mt-px bg-green/15 text-green">✓</div>
                <div className="flex-1">
                  <div className="text-[10px] text-text-dim mb-0.5">Follow-up · Day 7</div>
                  <div className="text-[9px] text-text-muted">Feb 22 · Opened ✓</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5 py-2 border-b border-border-default last:border-b-0 animate-slide-in [animation-delay:2000ms]">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] shrink-0 mt-px bg-amber/15 text-amber">⚡</div>
                <div className="flex-1">
                  <div className="text-[10px] text-text-dim mb-0.5">Final notice · Day 14</div>
                  <div className="text-[9px] text-amber">Sending now...</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}