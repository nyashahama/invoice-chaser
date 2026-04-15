"use client";

import React from "react";

export default function Stats() {
  return (
    <div className="border-t border-b border-border-default bg-surface px-6 grid grid-cols-1 overflow-hidden md:grid-cols-3 md:px-12">
      <div className="[&:nth-child(1)]:[animation-delay:100ms] [&:nth-child(2)]:[animation-delay:200ms] [&:nth-child(3)]:[animation-delay:300ms] py-10 border-b border-border-default opacity-0 animate-fade-up md:border-b-0 md:border-r md:pl-12 md:pr-12">
        <div className="text-[clamp(36px,4vw,54px)] font-extrabold leading-none mb-2 text-green tracking-tight">$2.4M</div>
        <div className="font-mono text-[11px] text-text-dim tracking-[0.1em] uppercase leading-[1.5]">
          Collected for
          <br />
          freelancers
        </div>
      </div>
      <div className="[&:nth-child(1)]:[animation-delay:100ms] [&:nth-child(2)]:[animation-delay:200ms] [&:nth-child(3)]:[animation-delay:300ms] py-10 border-b border-border-default opacity-0 animate-fade-up md:border-b-0 md:border-r md:pl-12 md:pr-12">
        <div className="text-[clamp(36px,4vw,54px)] font-extrabold leading-none mb-2 text-green tracking-tight">94%</div>
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