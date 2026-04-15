"use client";

import Link from "next/link";

const reminderPreview = [
  {
    body: "Hi Sarah, just a quick note that invoice INV-2301 for ZAR 12,500 fell due on 15 April. If payment is already in motion, ignore this. Otherwise, you can settle it here: [PAYMENT LINK].",
    label: "Polite reminder · Day 1",
    status: "Sent",
  },
  {
    body: "Hi Sarah, following up on invoice INV-2301. The balance is still outstanding and the reminder sequence will continue automatically until payment lands. You can pay here: [PAYMENT LINK].",
    label: "Firm follow-up · Day 5",
    status: "Queued",
  },
  {
    body: "Hi Sarah, this is the final scheduled reminder for invoice INV-2301. Please confirm payment timing today or settle here: [PAYMENT LINK].",
    label: "Final notice · Day 14",
    status: "Scheduled",
  },
];

export default function DemoPage() {
  return (
    <main
      style={{
        background:
          "linear-gradient(180deg, rgba(0,230,118,0.06), transparent 25%), #040404",
        color: "var(--text)",
        minHeight: "100vh",
        padding: "32px 20px 56px",
      }}
    >
      <div style={{ margin: "0 auto", maxWidth: "1120px" }}>
        <Link
          href="/"
          style={{
            color: "var(--text-dim)",
            display: "inline-block",
            fontFamily: "var(--mono)",
            fontSize: "12px",
            marginBottom: "24px",
            textDecoration: "none",
          }}
        >
          ← Back to home
        </Link>

        <div
          style={{
            display: "grid",
            gap: "20px",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          }}
        >
          <section
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              padding: "28px",
            }}
          >
            <div
              style={{
                color: "var(--green)",
                fontFamily: "var(--mono)",
                fontSize: "11px",
                letterSpacing: "0.14em",
                marginBottom: "12px",
                textTransform: "uppercase",
              }}
            >
              Product preview
            </div>
            <h1 style={{ fontSize: "42px", margin: 0 }}>
              Backend-driven reminders, not browser AI.
            </h1>
            <p style={{ color: "var(--text-dim)", lineHeight: 1.7 }}>
              This preview shows the reminder sequence and dashboard shape
              without exposing model calls or payment logic in the browser. In
              the production app, reminder generation, tracking, and sending all
              stay on the backend.
            </p>

            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <Link className="btn-primary" href="/get-started">
                <span>Create account</span>
                <span>→</span>
              </Link>
              <Link className="btn-ghost" href="/dashboard">
                View app shell
              </Link>
            </div>
          </section>

          <section
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              padding: "28px",
            }}
          >
            <h2 style={{ marginTop: 0 }}>Sequence preview</h2>
            <div style={{ display: "grid", gap: "14px" }}>
              {reminderPreview.map((item) => (
                <div
                  key={item.label}
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    padding: "16px",
                  }}
                >
                  <div
                    style={{
                      alignItems: "center",
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "10px",
                    }}
                  >
                    <strong>{item.label}</strong>
                    <span
                      style={{
                        color: "var(--text-dim)",
                        fontFamily: "var(--mono)",
                        fontSize: "11px",
                        textTransform: "uppercase",
                      }}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p style={{ color: "var(--text-dim)", margin: 0 }}>
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
