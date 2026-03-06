"use client";

import React from "react";

export default function Ticker() {
  return (
    <div className="ticker-wrap" style={{ marginTop: "64px" }}>
      <div className="ticker">
        <span className="ticker-item">
          ✓ Invoice #1042
          <span className="amt">$3,200</span>
          collected
          <span className="ticker-sep">·</span>
        </span>
        <span className="ticker-item">
          ✓ Invoice #877
          <span className="amt">$890</span>
          collected
          <span className="ticker-sep">·</span>
        </span>
        <span className="ticker-item">
          ✓ Invoice #2301
          <span className="amt">$12,500</span>
          collected
          <span className="ticker-sep">·</span>
        </span>
        <span className="ticker-item">
          ✓ Invoice #445
          <span className="amt">$640</span>
          collected
          <span className="ticker-sep">·</span>
        </span>
        <span className="ticker-item">
          ✓ Invoice #3188
          <span className="amt">$4,750</span>
          collected
          <span className="ticker-sep">·</span>
        </span>
        <span className="ticker-item">
          ✓ Invoice #991
          <span className="amt">$1,100</span>
          collected
          <span className="ticker-sep">·</span>
        </span>
        {/* repeat for infinite scroll */}
        <span className="ticker-item">
          ✓ Invoice #1042
          <span className="amt">$3,200</span>
          collected
          <span className="ticker-sep">·</span>
        </span>
        <span className="ticker-item">
          ✓ Invoice #877
          <span className="amt">$890</span>
          collected
          <span className="ticker-sep">·</span>
        </span>
        <span className="ticker-item">
          ✓ Invoice #2301
          <span className="amt">$12,500</span>
          collected
          <span className="ticker-sep">·</span>
        </span>
        <span className="ticker-item">
          ✓ Invoice #445
          <span className="amt">$640</span>
          collected
          <span className="ticker-sep">·</span>
        </span>
        <span className="ticker-item">
          ✓ Invoice #3188
          <span className="amt">$4,750</span>
          collected
          <span className="ticker-sep">·</span>
        </span>
        <span className="ticker-item">
          ✓ Invoice #991
          <span className="amt">$1,100</span>
          collected
          <span className="ticker-sep">·</span>
        </span>
      </div>
    </div>
  );
}
