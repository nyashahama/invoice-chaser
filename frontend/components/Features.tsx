"use client";

import React from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function Features() {
  const ref = useScrollReveal<HTMLDivElement>({
    staggerSelector: ".feature-card",
  });

  return (
    <section className="py-20 px-6 max-w-[1200px] mx-auto md:py-[120px] md:px-12">
      <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-green mb-4 flex items-center gap-2.5 after:content-[''] after:flex-1 after:h-px after:bg-border-default">
        Features
      </div>
      <h2 className="text-[clamp(32px,4vw,52px)] font-extrabold leading-[1.1] tracking-tight mb-[72px] max-w-[600px]">
        Built for people who <em className="font-serif italic font-normal bg-gradient-to-r from-text-dim to-green bg-clip-text text-transparent">hate</em> chasing money.
      </h2>
      <div ref={ref} className="grid grid-cols-1 gap-px bg-border-default border border-border-default mt-[60px] md:grid-cols-2 reveal">
        <div className="bg-black p-10 transition-all duration-300 hover:bg-white/[0.03] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)] feature-card">
          <div className="w-8 h-8 rounded-[3px] bg-green/10 border border-green/20 flex items-center justify-center text-green font-bold text-[11px] mb-4">↗</div>
          <div className="text-[17px] font-extrabold mb-2.5 tracking-tight">Integrations that actually work</div>
          <p className="font-mono text-xs text-text-dim leading-[1.65]">
            Connect Stripe, FreshBooks, QuickBooks, Wave, or just paste an
            invoice. No manual data entry.
          </p>
        </div>
        <div className="bg-black p-10 transition-all duration-300 hover:bg-white/[0.03] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)] feature-card">
          <div className="w-8 h-8 rounded-[3px] bg-green/10 border border-green/20 flex items-center justify-center text-green font-bold text-[11px] mb-4">⚡</div>
          <div className="text-[17px] font-extrabold mb-2.5 tracking-tight">Smart stop on payment</div>
          <p className="font-mono text-xs text-text-dim leading-[1.65]">
            The system polls for payment and halts the sequence automatically.
            No awkward &ldquo;thanks, we got it&rdquo; situations.
          </p>
        </div>
        <div className="bg-black p-10 transition-all duration-300 hover:bg-white/[0.03] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)] feature-card">
          <div className="w-8 h-8 rounded-[3px] bg-green/10 border border-green/20 flex items-center justify-center text-green font-bold text-[11px] mb-4">↗</div>
          <div className="text-[17px] font-extrabold mb-2.5 tracking-tight">Escalating sequences</div>
          <p className="font-mono text-xs text-text-dim leading-[1.65]">
            Reminders get progressively firmer. Day 1 is warm. Day 30 means
            business. You set the schedule.
          </p>
        </div>
        <div className="bg-black p-10 transition-all duration-300 hover:bg-white/[0.03] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)] feature-card">
          <div className="w-8 h-8 rounded-[3px] bg-green/10 border border-green/20 flex items-center justify-center text-green font-bold text-[11px] mb-4">✦</div>
          <div className="text-[17px] font-extrabold mb-2.5 tracking-tight">Your voice, not ours</div>
          <p className="font-mono text-xs text-text-dim leading-[1.65]">
            Emails are generated to match your tone and brand. Clients
            won&apos;t know it&apos;s automated — unless you tell them.
          </p>
        </div>
      </div>
    </section>
  );
}