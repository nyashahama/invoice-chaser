"use client";

import React from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function Pricing() {
  const ref = useScrollReveal<HTMLDivElement>({
    staggerSelector: ".price-card",
  });

  return (
    <section className="section" id="pricing">
      <div className="section-label">Pricing</div>
      <h2 className="section-title">
        Pays for itself on the <em>first invoice.</em>
      </h2>
      <div ref={ref} className="pricing-grid reveal">
        <div className="price-card">
          <span className="price-tag">Starter</span>
          <div className="price-name">Solo</div>
          <div className="price-amount">
            <sup>$</sup>19
          </div>
          <div className="price-period">per month</div>
          <ul className="price-features">
            <li>Up to 10 active invoices</li>
            <li>3-step reminder sequence</li>
            <li>Email reminders</li>
            <li>Manual invoice upload</li>
            <li>Payment detection</li>
          </ul>
          <a href="#cta" className="btn-ghost">
            Get started →
          </a>
        </div>
        <div className="price-card featured">
          <span className="price-tag">Most popular</span>
          <div className="price-name">Pro</div>
          <div className="price-amount">
            <sup>$</sup>49
          </div>
          <div className="price-period">per month</div>
          <ul className="price-features">
            <li>Unlimited invoices</li>
            <li>Custom sequences &amp; tone</li>
            <li>Stripe, FreshBooks, QB</li>
            <li>SMS + email reminders</li>
            <li>Smart payment detection</li>
            <li>Reporting dashboard</li>
          </ul>
          <a
            href="#cta"
            className="btn-primary"
            style={{ width: "100%", justifyContent: "center" }}
          >
            Start free trial →
          </a>
        </div>
        <div className="price-card">
          <span className="price-tag">Agency</span>
          <div className="price-name">Team</div>
          <div className="price-amount">
            <sup>$</sup>99
          </div>
          <div className="price-period">per month</div>
          <ul className="price-features">
            <li>Everything in Pro</li>
            <li>5 team seats</li>
            <li>Client portal branding</li>
            <li>API access</li>
            <li>Priority support</li>
          </ul>
          <a href="#cta" className="btn-ghost">
            Contact sales →
          </a>
        </div>
      </div>
    </section>
  );
}
