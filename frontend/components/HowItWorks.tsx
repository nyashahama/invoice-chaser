"use client";

import React from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function HowItWorks() {
  const ref = useScrollReveal<HTMLDivElement>({ staggerSelector: ".step" });

  return (
    <section className="py-20 px-6 max-w-[1200px] mx-auto md:py-[120px] md:px-12" id="how">
      <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-green mb-4 flex items-center gap-2.5 after:content-[''] after:flex-1 after:h-px after:bg-border-default">
        How it works
      </div>
      <h2 className="text-[clamp(32px,4vw,52px)] font-extrabold leading-[1.1] tracking-tight mb-[72px] max-w-[600px]">
        Three steps. Then <em className="font-serif italic font-normal text-text-dim">autopilot.</em>
      </h2>
      <div ref={ref} className="grid grid-cols-1 gap-px bg-border-default border border-border-default md:grid-cols-3 reveal">
        <div className="bg-black py-12 px-10 relative transition-all duration-300 hover:bg-surface hover:-translate-y-0.5 hover:shadow-lg step">
          <div className="w-8 h-8 rounded-[3px] bg-green/10 border border-green/20 flex items-center justify-center text-green text-xs font-bold mb-6">01</div>
          <div className="text-xl font-extrabold mb-3 tracking-tight">Upload your invoice</div>
          <p className="text-sm text-text-dim leading-[1.65] font-mono font-normal">
            Paste an invoice link, forward an email, or connect Stripe,
            FreshBooks, or QuickBooks. We handle the parsing.
          </p>
        </div>
        <div className="bg-black py-12 px-10 relative transition-all duration-300 hover:bg-surface hover:-translate-y-0.5 hover:shadow-lg step">
          <div className="w-8 h-8 rounded-[3px] bg-green/10 border border-green/20 flex items-center justify-center text-green text-xs font-bold mb-6">02</div>
          <div className="text-xl font-extrabold mb-3 tracking-tight">Pick your tone</div>
          <p className="text-sm text-text-dim leading-[1.65] font-mono font-normal">
            Polite, firm, or final notice. You set the escalation schedule — we
            write and send every email automatically.
          </p>
        </div>
        <div className="bg-black py-12 px-10 relative transition-all duration-300 hover:bg-surface hover:-translate-y-0.5 hover:shadow-lg step">
          <div className="w-8 h-8 rounded-[3px] bg-green/10 border border-green/20 flex items-center justify-center text-green text-xs font-bold mb-6">03</div>
          <div className="text-xl font-extrabold mb-3 tracking-tight">Get paid, we stop</div>
          <p className="text-sm text-text-dim leading-[1.65] font-mono font-normal">
            The moment your invoice is marked paid, the system stops. No
            embarrassing double-sends. No manual cleanup.
          </p>
        </div>
      </div>
    </section>
  );
}