"use client";

import React from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function Features() {
  const ref = useScrollReveal<HTMLDivElement>({
    staggerSelector: ".feature-card",
  });

  return (
    <section className="section">
      <div className="section-label">Features</div>
      <h2 className="section-title">
        Built for people who <em>hate</em> chasing money.
      </h2>
      <div ref={ref} className="features-grid reveal">
        <div className="feature-card">
          <div className="feature-icon">🔌</div>
          <div className="feature-title">Integrations that actually work</div>
          <p className="feature-desc">
            Connect Stripe, FreshBooks, QuickBooks, Wave, or just paste an
            invoice. No manual data entry.
          </p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">⚡</div>
          <div className="feature-title">Smart stop on payment</div>
          <p className="feature-desc">
            The system polls for payment and halts the sequence automatically.
            No awkward &ldquo;thanks, we got it&rdquo; situations.
          </p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📬</div>
          <div className="feature-title">Escalating sequences</div>
          <p className="feature-desc">
            Reminders get progressively firmer. Day 1 is warm. Day 30 means
            business. You set the schedule.
          </p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🔒</div>
          <div className="feature-title">Your voice, not ours</div>
          <p className="feature-desc">
            Emails are generated to match your tone and brand. Clients
            won&apos;t know it&apos;s automated — unless you tell them.
          </p>
        </div>
      </div>
    </section>
  );
}
