"use client";

import React from "react";

export default function Footer() {
  return (
    <footer className="border-t border-border-default px-12 py-8 flex items-center justify-between md:flex-col md:gap-3 md:text-center md:py-6">
      <div className="font-mono text-xs font-bold text-text-muted tracking-[0.1em] uppercase">InvoiceChaser</div>
      <div className="font-mono text-[11px] text-text-muted">
        © 2026 InvoiceChaser. All rights reserved.
      </div>
    </footer>
  );
}