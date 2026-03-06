"use client";

import React from "react";

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-content">
        <div className="hero-eyebrow">Autopilot for overdue invoices</div>
        <h1 className="hero-title">
          Stop chasing.
          <br />
          Start
          <em>getting paid.</em>
        </h1>
        <p className="hero-sub">
          Automated follow-ups that escalate from polite to firm — and stop the
          instant your client pays. No awkward emails. No forgotten invoices.
        </p>
        <div className="hero-actions">
          <a href="#cta" className="btn-primary">
            <span>Start collecting</span>
            <span>→</span>
          </a>
          <a href="/demo" className="btn-ghost">
            Try live demo ↗
          </a>
        </div>
      </div>
      <div className="hero-visual">
        <div className="invoice-card">
          <div className="invoice-header">
            <div className="dot dot-r" />
            <div className="dot dot-y" />
            <div className="dot dot-g" />
            <div className="invoice-title-bar">invoice #2301 — acme corp</div>
          </div>
          <div className="invoice-body">
            <div className="inv-row">
              <span>Client</span>
              <strong>Acme Corp</strong>
            </div>
            <div className="inv-row">
              <span>Issued</span>
              <strong>Feb 01, 2025</strong>
            </div>
            <div className="inv-row">
              <span>Due</span>
              <strong>Feb 15, 2025</strong>
            </div>
            <div className="inv-row">
              <span>Status</span>
              <div className="status-badge status-overdue">
                ● 28 days overdue
              </div>
            </div>
            <div className="inv-total">
              <span>Total Due</span>
              <span className="amount">$12,500</span>
            </div>
            <div className="reminder-thread">
              <div className="thread-label">// auto-reminders sent</div>
              <div className="reminder-item">
                <div className="r-icon r-sent">✓</div>
                <div className="r-text">
                  <div className="r-label">Friendly reminder · Day 1</div>
                  <div className="r-date">Feb 16 · Opened ✓</div>
                </div>
              </div>
              <div className="reminder-item">
                <div className="r-icon r-sent">✓</div>
                <div className="r-text">
                  <div className="r-label">Follow-up · Day 7</div>
                  <div className="r-date">Feb 22 · Opened ✓</div>
                </div>
              </div>
              <div className="reminder-item">
                <div className="r-icon r-pending">⚡</div>
                <div className="r-text">
                  <div className="r-label">Final notice · Day 14</div>
                  <div className="r-date" style={{ color: "var(--amber)" }}>
                    Sending now...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
