"use client";

import React, { useState } from "react";

type Tone = "polite" | "firm" | "final";

const emails: Record<Tone, React.ReactNode> = {
  polite: (
    <>
      Hi Sarah,
      <br />
      <br />
      Hope you&apos;re doing well! Just a quick note — Invoice #2301 for $12,500
      was due on Feb 15th.
      <br />
      <br />
      If it&apos;s already on its way, please ignore this. Otherwise, you can
      view and pay it here:
      <br />
      <br />
      <span className="text-green">→ Pay Invoice #2301</span>
      <br />
      <br />
      Thanks so much,
      <br />
      Alex
    </>
  ),
  firm: (
    <>
      Hi Sarah,
      <br />
      <br />
      I&apos;m following up on Invoice #2301 ($12,500), now 14 days overdue.
      <br />
      <br />
      Please arrange payment at your earliest convenience. You can settle the
      balance here:
      <br />
      <br />
      <span className="text-amber">
        → Pay Invoice #2301 — Due Immediately
      </span>
      <br />
      <br />
      If there&apos;s an issue, please let me know directly.
      <br />
      <br />
      Regards,
      <br />
      Alex
    </>
  ),
  final: (
    <>
      Sarah,
      <br />
      <br />
      This is a final notice regarding Invoice #2301 for $12,500, now 28 days
      overdue.
      <br />
      <br />
      Payment is required within 72 hours to avoid escalation to a collections
      process.
      <br />
      <br />
      <span className="text-red">
        → Pay Invoice #2301 — Final Notice
      </span>
      <br />
      <br />
      If payment has already been made, please disregard this message and send
      confirmation.
      <br />
      <br />
      Alex
    </>
  ),
};

const toneClasses: Record<Tone, string> = {
  polite: "border-green bg-green-dim before:bg-green shadow-[0_0_20px_rgba(0,230,118,0.1)]",
  firm: "border-amber bg-amber/[0.08] before:bg-amber shadow-[0_0_20px_rgba(255,179,0,0.1)]",
  final: "border-red bg-red/[0.08] before:bg-red shadow-[0_0_20px_rgba(255,61,61,0.1)]",
};

export default function ToneSelector() {
  const [activeTone, setActiveTone] = useState<Tone>("polite");
  const [fading, setFading] = useState(false);

  const handleTone = (tone: Tone) => {
    if (tone === activeTone) return;
    setFading(true);
    setTimeout(() => {
      setActiveTone(tone);
      setFading(false);
    }, 180);
  };

  return (
    <div
      className="bg-surface border-t border-b border-border-default py-[60px] px-6 md:py-[100px] md:px-12"
      id="tone"
    >
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 gap-10 items-center md:grid-cols-2 md:gap-20">
        <div>
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-green mb-4 flex items-center gap-2.5 after:content-[''] after:flex-1 after:h-px after:bg-border-default">
            Tone control
          </div>
          <h2 className="text-[clamp(32px,4vw,52px)] font-extrabold leading-[1.1] tracking-tight mb-8">
            Your voice.
            <br />
            <em className="font-serif italic font-normal text-text-dim">Automated.</em>
          </h2>
          <p className="font-mono text-[13px] text-text-dim leading-[1.7] max-w-[380px]">
            Every reminder sounds like you wrote it — not a robot. Choose how
            assertive you want to get, and we&apos;ll match that energy across
            the whole sequence.
          </p>
          <div className="flex flex-col gap-3 mt-9">
            {(["polite", "firm", "final"] as Tone[]).map((tone) => (
              <div
                key={tone}
                className={`border border-border-default rounded-[3px] py-5 px-6 cursor-pointer transition-all relative overflow-hidden before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-transparent before:transition-colors hover:border-border-light hover:bg-surface2 ${activeTone === tone ? toneClasses[tone] : ""}`}
                onClick={() => handleTone(tone)}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-extrabold tracking-tight">
                    {tone === "polite" && "🤝 Polite"}
                    {tone === "firm" && "📋 Firm"}
                    {tone === "final" && "⚡ Final Notice"}
                  </span>
                  <span className="font-mono text-[10px] text-text-muted tracking-[0.1em] uppercase">
                    {tone === "polite" && "Day 1 – 7"}
                    {tone === "firm" && "Day 8 – 21"}
                    {tone === "final" && "Day 22+"}
                  </span>
                </div>
                <div className="font-mono text-[11px] text-text-dim leading-[1.65]">
                  {tone === "polite" &&
                    "Warm, professional. Assumes the best. Great for long-term client relationships."}
                  {tone === "firm" &&
                    "Direct and clear. No fluff. Gets the message across without burning bridges."}
                  {tone === "final" &&
                    "This is the last step before escalation. Professional but non-negotiable."}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-lg shadow-[0_20px_40px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.04)] overflow-hidden font-mono text-xs">
          <div className="bg-white/[0.04] py-3 px-4 border-b border-border-default flex items-center gap-2">
            <div className="w-[10px] h-[10px] rounded-full bg-[#ff5f57]" />
            <div className="w-[10px] h-[10px] rounded-full bg-[#febc2e]" />
            <div className="w-[10px] h-[10px] rounded-full bg-[#28c840]" />
            <div className="text-[10px] text-text-muted ml-2 tracking-[0.1em] uppercase">
              Auto-generated email preview
            </div>
          </div>
          <div className="py-4 px-5 border-b border-border-default">
            <div className="[&>span:first-child]:text-text-muted [&>span:first-child]:min-w-[40px] [&>strong]:text-text flex gap-3 text-text-dim text-[11px] py-0.5">
              <span>From:</span>
              <strong>you@studio.com</strong>
            </div>
            <div className="[&>span:first-child]:text-text-muted [&>span:first-child]:min-w-[40px] [&>strong]:text-text flex gap-3 text-text-dim text-[11px] py-0.5">
              <span>To:</span>
              <strong>billing@acmecorp.com</strong>
            </div>
            <div className="[&>span:first-child]:text-text-muted [&>span:first-child]:min-w-[40px] [&>strong]:text-text flex gap-3 text-text-dim text-[11px] py-0.5">
              <span>Re:</span>
              <strong>Invoice #2301 – $12,500</strong>
            </div>
          </div>
          <div
            className={`py-5 px-5 leading-relaxed text-[11px] text-text-dim min-h-[160px] transition-all duration-[180ms] ${fading ? "opacity-0" : "opacity-1"}`}
          >
            {emails[activeTone]}
          </div>
        </div>
      </div>
    </div>
  );
}