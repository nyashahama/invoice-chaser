"use client";

import React, { useState } from "react";

type Tone = "polite" | "firm" | "final";

const emails: Record<Tone, React.ReactNode> = {
  polite: (
    <>
      Hi Sarah,
      <br />
      <br />
      Hope you&apos;re doing well! Just a quick note — Invoice #2301 for $12,500
      was due on Feb 15th.
      <br />
      <br />
      If it&apos;s already on its way, please ignore this. Otherwise, you can
      view and pay it here:
      <br />
      <br />
      <span style={{ color: "var(--green)" }}>→ Pay Invoice #2301</span>
      <br />
      <br />
      Thanks so much,
      <br />
      Alex
    </>
  ),
  firm: (
    <>
      Hi Sarah,
      <br />
      <br />
      I&apos;m following up on Invoice #2301 ($12,500), now 14 days overdue.
      <br />
      <br />
      Please arrange payment at your earliest convenience. You can settle the
      balance here:
      <br />
      <br />
      <span style={{ color: "var(--amber)" }}>
        → Pay Invoice #2301 — Due Immediately
      </span>
      <br />
      <br />
      If there&apos;s an issue, please let me know directly.
      <br />
      <br />
      Regards,
      <br />
      Alex
    </>
  ),
  final: (
    <>
      Sarah,
      <br />
      <br />
      This is a final notice regarding Invoice #2301 for $12,500, now 28 days
      overdue.
      <br />
      <br />
      Payment is required within 72 hours to avoid escalation to a collections
      process.
      <br />
      <br />
      <span style={{ color: "var(--red)" }}>
        → Pay Invoice #2301 — Final Notice
      </span>
      <br />
      <br />
      If payment has already been made, please disregard this message and send
      confirmation.
      <br />
      <br />
      Alex
    </>
  ),
};

const toneClasses: Record<Tone, string> = {
  polite: "active-tone",
  firm: "active-amber",
  final: "active-red",
};

export default function ToneSelector() {
  const [activeTone, setActiveTone] = useState<Tone>("polite");
  const [fading, setFading] = useState(false);

  const handleTone = (tone: Tone) => {
    if (tone === activeTone) return;
    setFading(true);
    setTimeout(() => {
      setActiveTone(tone);
      setFading(false);
    }, 180);
  };

  return (
    <div className="tone-section" id="tone">
      <div className="tone-inner">
        <div>
          <div className="section-label">Tone control</div>
          <h2 className="section-title" style={{ marginBottom: "32px" }}>
            Your voice.
            <br />
            <em>Automated.</em>
          </h2>
          <p
            style={{
              fontFamily: "var(--mono)",
              fontSize: "13px",
              color: "var(--text-dim)",
              lineHeight: "1.7",
              maxWidth: "380px",
            }}
          >
            Every reminder sounds like you wrote it — not a robot. Choose how
            assertive you want to get, and we&apos;ll match that energy across
            the whole sequence.
          </p>
          <div className="tone-cards" style={{ marginTop: "36px" }}>
            {(["polite", "firm", "final"] as Tone[]).map((tone) => (
              <div
                key={tone}
                className={`tone-card ${activeTone === tone ? toneClasses[tone] : ""}`}
                onClick={() => handleTone(tone)}
                style={{ cursor: "pointer" }}
              >
                <div className="tone-header">
                  <span className="tone-name">
                    {tone === "polite" && "🤝 Polite"}
                    {tone === "firm" && "📋 Firm"}
                    {tone === "final" && "⚡ Final Notice"}
                  </span>
                  <span className="tone-day">
                    {tone === "polite" && "Day 1 – 7"}
                    {tone === "firm" && "Day 8 – 21"}
                    {tone === "final" && "Day 22+"}
                  </span>
                </div>
                <div className="tone-preview">
                  {tone === "polite" &&
                    "Warm, professional. Assumes the best. Great for long-term client relationships."}
                  {tone === "firm" &&
                    "Direct and clear. No fluff. Gets the message across without burning bridges."}
                  {tone === "final" &&
                    "This is the last step before escalation. Professional but non-negotiable."}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="email-window">
          <div className="email-header">
            <div className="dot dot-r" />
            <div className="dot dot-y" />
            <div className="dot dot-g" />
            <div
              style={{
                fontSize: "10px",
                color: "var(--text-muted)",
                marginLeft: "8px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Auto-generated email preview
            </div>
          </div>
          <div className="email-meta">
            <div className="email-field">
              <span>From:</span>
              <strong>you@studio.com</strong>
            </div>
            <div className="email-field">
              <span>To:</span>
              <strong>billing@acmecorp.com</strong>
            </div>
            <div className="email-field">
              <span>Re:</span>
              <strong>Invoice #2301 – $12,500</strong>
            </div>
          </div>
          <div
            className="email-body"
            style={{
              opacity: fading ? 0 : 1,
              transition: "opacity 0.18s ease",
            }}
          >
            {emails[activeTone]}
          </div>
        </div>
      </div>
    </div>
  );
}
