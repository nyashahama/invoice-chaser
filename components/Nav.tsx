"use client";

import React from "react";

export default function Nav() {
  return (
    <nav>
      <div className="nav-logo">
        Invoice
        <span>Chaser</span>
      </div>
      <ul className="nav-links">
        <li>
          <a href="#how">How it works</a>
        </li>
        <li>
          <a href="#pricing">Pricing</a>
        </li>
        <li>
          <a href="/demo">Live demo ↗</a>
        </li>
        <li>
          <a href="#cta" className="nav-cta">
            Get early access
          </a>
        </li>
      </ul>
    </nav>
  );
}
