"use client";

import React from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function HowItWorks() {
  const ref = useScrollReveal<HTMLDivElement>({ staggerSelector: ".step" });

  return (
    <section className="section" id="how">
      <div className="section-label">How it works</div>
      <h2 className="section-title">
        Three steps. Then <em>autopilot.</em>
      </h2>
      <div ref={ref} className="steps reveal">
        <div className="step">
          <div className="step-num">// 01</div>
          <div className="step-icon">📄</div>
          <div className="step-title">Upload your invoice</div>
          <p className="step-desc">
            Paste an invoice link, forward an email, or connect Stripe,
            FreshBooks, or QuickBooks. We handle the parsing.
          </p>
        </div>
        <div className="step">
          <div className="step-num">// 02</div>
          <div className="step-icon">🎚️</div>
          <div className="step-title">Pick your tone</div>
          <p className="step-desc">
            Polite, firm, or final notice. You set the escalation schedule — we
            write and send every email automatically.
          </p>
        </div>
        <div className="step">
          <div className="step-num">// 03</div>
          <div className="step-icon">✅</div>
          <div className="step-title">Get paid, we stop</div>
          <p className="step-desc">
            The moment your invoice is marked paid, the system stops. No
            embarrassing double-sends. No manual cleanup.
          </p>
        </div>
      </div>
    </section>
  );
}
