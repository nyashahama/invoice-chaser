"use client";

import React from "react";
import { useRouter } from "next/navigation";

import { useSession } from "@/context/SessionContext";

interface HeroProps {
  onOpenAuthModal: (mode: "login" | "register") => void;
}

function getDisplayName(fullName: string, email: string) {
  return fullName.trim().split(" ")[0] || email.split("@")[0] || "there";
}

export default function Hero({ onOpenAuthModal }: HeroProps) {
  const { authenticated, user } = useSession();
  const router = useRouter();

  if (authenticated && user) {
    const name = getDisplayName(user.full_name, user.email);

    return (
      <section className="hero">
        <div className="hero-content">
          <div className="hero-eyebrow">Welcome back</div>
          <h1 className="hero-title">
            Hey, <em>{name}.</em>
          </h1>
          <p className="hero-sub">
            Your autopilot is running. Check your dashboard to see what&apos;s
            been collected while you were away.
          </p>
          <div className="hero-actions">
            <button
              className="btn-primary"
              onClick={() => router.push("/dashboard")}
            >
              <span>Go to dashboard</span>
              <span>→</span>
            </button>
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
              <div className="invoice-title-bar">autopilot — running</div>
            </div>
            <div className="invoice-body">
            <div className="inv-row">
              <span>Account</span>
              <strong>{user.email}</strong>
            </div>
            <div className="inv-total">
              <span>Status</span>
              <span style={{ color: "var(--green)", fontSize: "16px" }}>
                  ● Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="hero">
      <div className="hero-content">
        <div className="hero-eyebrow">Autopilot for overdue invoices</div>
        <h1 className="hero-title">
          Stop chasing.
          <br />
          Start <em>getting paid.</em>
        </h1>
        <p className="hero-sub">
          Automated follow-ups that escalate from polite to firm — and stop the
          instant your client pays. No awkward emails. No forgotten invoices.
        </p>
        <div className="hero-actions">
          <button
            className="btn-primary"
            onClick={() => onOpenAuthModal("register")}
            type="button"
          >
            <span>Start collecting</span>
            <span>→</span>
          </button>
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
              <div className="thread-label">{"// auto-reminders sent"}</div>
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
