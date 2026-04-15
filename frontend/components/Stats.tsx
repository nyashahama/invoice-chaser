"use client";

import React from "react";

export default function Stats() {
  return (
    <div className="border-t border-b border-border-default bg-surface px-12 grid grid-cols-3 overflow-hidden md:grid-cols-1 md:px-6">
      <div className="[&:nth-child(1)]:[animation-delay:100ms] [&:nth-child(2)]:[animation-delay:200ms] [&:nth-child(3)]:[animation-delay:300ms] py-10 pr-12 pl-12 border-r border-border-default opacity-0 animate-fade-up md:border-r-0 md:border-b md:border-border-default md:px-0">
        <div className="text-[clamp(36px,4vw,54px)] font-extrabold leading-none mb-2 text-green tracking-tight">$2.4M</div>
        <div className="font-mono text-[11px] text-text-dim tracking-[0.1em] uppercase leading-relaxed">
          Collected for
          <br />
          freelancers
        </div>
      </div>
      <div className="[&:nth-child(1)]:[animation-delay:100ms] [&:nth-child(2)]:[animation-delay:200ms] [&:nth-child(3)]:[animation-delay:300ms] py-10 pr-12 pl-12 border-r border-border-default opacity-0 animate-fade-up md:border-r-0 md:border-b md:border-border-default md:px-0">
        <div className="text-[clamp(36px,4vw,54px)] font-extrabold leading-none mb-2 text-green tracking-tight">94%</div>
        <div className="font-mono text-[11px] text-text-dim tracking-[0.1em] uppercase leading-relaxed">
          Invoices paid
          <br />
          within 30 days
        </div>
      </div>
      <div className="[&:nth-child(1)]:[animation-delay:100ms] [&:nth-child(2)]:[animation-delay:200ms] [&:nth-child(3)]:[animation-delay:300ms] py-10 pr-12 pl-12 border-r border-border-default opacity-0 animate-fade-up md:border-r-0 md:border-b md:border-border-default md:px-0">
        <div className="text-[clamp(36px,4vw,54px)] font-extrabold leading-none mb-2 text-green tracking-tight">0</div>
        <div className="font-mono text-[11px] text-text-dim tracking-[0.1em] uppercase leading-relaxed">
          Awkward emails
          <br />
          sent by you
        </div>
      </div>
    </div>
  );
}