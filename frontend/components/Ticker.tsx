"use client";

import React from "react";

export default function Ticker() {
  return (
    <>
      <div className="divider-gradient" />
      <div className="bg-surface2 overflow-hidden py-3 whitespace-nowrap mt-16">
      <div className="inline-flex gap-0 animate-ticker">
        <span className="inline-flex items-center gap-2 font-mono text-[11px] text-text-muted tracking-[0.1em] px-10 uppercase">
          ✓ Invoice #1042
          <span className="text-green font-bold">$3,200</span>
          collected
          <span className="text-border-light">·</span>
        </span>
        <span className="inline-flex items-center gap-2 font-mono text-[11px] text-text-muted tracking-[0.1em] px-10 uppercase">
          ✓ Invoice #877
          <span className="text-green font-bold">$890</span>
          collected
          <span className="text-border-light">·</span>
        </span>
        <span className="inline-flex items-center gap-2 font-mono text-[11px] text-text-muted tracking-[0.1em] px-10 uppercase">
          ✓ Invoice #2301
          <span className="text-green font-bold">$12,500</span>
          collected
          <span className="text-border-light">·</span>
        </span>
        <span className="inline-flex items-center gap-2 font-mono text-[11px] text-text-muted tracking-[0.1em] px-10 uppercase">
          ✓ Invoice #445
          <span className="text-green font-bold">$640</span>
          collected
          <span className="text-border-light">·</span>
        </span>
        <span className="inline-flex items-center gap-2 font-mono text-[11px] text-text-muted tracking-[0.1em] px-10 uppercase">
          ✓ Invoice #3188
          <span className="text-green font-bold">$4,750</span>
          collected
          <span className="text-border-light">·</span>
        </span>
        <span className="inline-flex items-center gap-2 font-mono text-[11px] text-text-muted tracking-[0.1em] px-10 uppercase">
          ✓ Invoice #991
          <span className="text-green font-bold">$1,100</span>
          collected
          <span className="text-border-light">·</span>
        </span>
        {/* repeat for infinite scroll */}
        <span className="inline-flex items-center gap-2 font-mono text-[11px] text-text-muted tracking-[0.1em] px-10 uppercase">
          ✓ Invoice #1042
          <span className="text-green font-bold">$3,200</span>
          collected
          <span className="text-border-light">·</span>
        </span>
        <span className="inline-flex items-center gap-2 font-mono text-[11px] text-text-muted tracking-[0.1em] px-10 uppercase">
          ✓ Invoice #877
          <span className="text-green font-bold">$890</span>
          collected
          <span className="text-border-light">·</span>
        </span>
        <span className="inline-flex items-center gap-2 font-mono text-[11px] text-text-muted tracking-[0.1em] px-10 uppercase">
          ✓ Invoice #2301
          <span className="text-green font-bold">$12,500</span>
          collected
          <span className="text-border-light">·</span>
        </span>
        <span className="inline-flex items-center gap-2 font-mono text-[11px] text-text-muted tracking-[0.1em] px-10 uppercase">
          ✓ Invoice #445
          <span className="text-green font-bold">$640</span>
          collected
          <span className="text-border-light">·</span>
        </span>
        <span className="inline-flex items-center gap-2 font-mono text-[11px] text-text-muted tracking-[0.1em] px-10 uppercase">
          ✓ Invoice #3188
          <span className="text-green font-bold">$4,750</span>
          collected
          <span className="text-border-light">·</span>
        </span>
        <span className="inline-flex items-center gap-2 font-mono text-[11px] text-text-muted tracking-[0.1em] px-10 uppercase">
          ✓ Invoice #991
          <span className="text-green font-bold">$1,100</span>
          collected
          <span className="text-border-light">·</span>
        </span>
      </div>
    </div>
    </>
  );
}