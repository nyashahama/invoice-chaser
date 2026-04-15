"use client";

import React from "react";
import { useCountUp } from "@/hooks/useCountUp";

export default function Stats() {
  const statRev = useCountUp({ end: 2.4, decimals: 1 });
  const statPaid = useCountUp({ end: 94 });

  return (
    <div className="relative overflow-hidden border-t border-b border-border-default bg-surface px-6 grid grid-cols-1 md:grid-cols-3 md:px-12">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[radial-gradient(ellipse,rgba(0,230,118,0.04)_0%,transparent_70%)] pointer-events-none" />
      <div ref={statRev.ref} className="[&:nth-child(1)]:[animation-delay:100ms] [&:nth-child(2)]:[animation-delay:200ms] [&:nth-child(3)]:[animation-delay:300ms] py-10 border-b border-border-default opacity-0 animate-fade-up md:border-b-0 md:border-r md:pl-12 md:pr-12">
        <div className="text-[clamp(36px,4vw,54px)] font-extrabold leading-none mb-2 text-green tracking-tight">${statRev.formatted}M</div>
        <div className="font-mono text-[11px] text-text-dim tracking-[0.1em] uppercase leading-[1.5]">
          Collected for
          <br />
          freelancers
        </div>
      </div>
      <div ref={statPaid.ref} className="[&:nth-child(1)]:[animation-delay:100ms] [&:nth-child(2)]:[animation-delay:200ms] [&:nth-child(3)]:[animation-delay:300ms] py-10 border-b border-border-default opacity-0 animate-fade-up md:border-b-0 md:border-r md:pl-12 md:pr-12">
        <div className="text-[clamp(36px,4vw,54px)] font-extrabold leading-none mb-2 text-green tracking-tight">{statPaid.formatted}%</div>
        <div className="font-mono text-[11px] text-text-dim tracking-[0.1em] uppercase leading-[1.5]">
          Invoices paid
          <br />
          within 30 days
        </div>
      </div>
      <div className="[&:nth-child(1)]:[animation-delay:100ms] [&:nth-child(2)]:[animation-delay:200ms] [&:nth-child(3)]:[animation-delay:300ms] py-10 border-b border-border-default opacity-0 animate-fade-up md:border-b-0 md:border-r md:pl-12 md:pr-12">
        <div className="text-[clamp(36px,4vw,54px)] font-extrabold leading-none mb-2 text-green tracking-tight">0</div>
        <div className="font-mono text-[11px] text-text-dim tracking-[0.1em] uppercase leading-[1.5]">
          Awkward emails
          <br />
          sent by you
        </div>
      </div>
    </div>
  );
}