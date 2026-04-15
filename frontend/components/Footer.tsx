"use client";

import React from "react";

export default function Footer() {
  return (
    <footer className="border-t border-border-default px-6 py-6 flex flex-col items-center gap-3 text-center md:flex-row md:justify-between md:px-12 md:py-8">
      <div className="font-mono text-xs font-bold text-text-muted tracking-[0.1em] uppercase">InvoiceChaser</div>
      <div className="font-mono text-[11px] text-text-muted">
        © 2026 InvoiceChaser. All rights reserved.
      </div>
    </footer>
  );
}