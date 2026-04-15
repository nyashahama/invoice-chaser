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
    <main className="min-h-screen bg-[linear-gradient(180deg,rgba(0,230,118,0.06),transparent_25%),#040404] px-5 pb-14 pt-8 text-text">
      <div className="mx-auto max-w-[1120px]">
        <Link
          href="/"
          className="mb-6 inline-block font-mono text-xs tracking-normal text-text-dim no-underline"
        >
          ← Back to home
        </Link>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-5">
          <section className="rounded-[10px] border border-border-default bg-white/[0.02] p-7">
            <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-green">
              Product preview
            </div>
            <h1 className="m-0 text-[42px]">
              Backend-driven reminders, not browser AI.
            </h1>
            <p className="leading-[1.7] text-text-dim">
              This preview shows the reminder sequence and dashboard shape
              without exposing model calls or payment logic in the browser. In
              the production app, reminder generation, tracking, and sending all
              stay on the backend.
            </p>

            <div className="mt-6 flex gap-3">
              <Link className="inline-flex items-center gap-2.5 bg-green text-black font-mono text-[13px] font-bold tracking-[0.05em] uppercase px-8 py-4 rounded-[2px] no-underline transition-all hover:bg-[#1fffaa] hover:-translate-y-px hover:shadow-[0_8px_32px_rgba(0,230,118,0.3)] border-none cursor-pointer" href="/get-started">
                <span>Create account</span>
                <span>→</span>
              </Link>
              <Link className="inline-flex items-center gap-2 text-text-dim font-mono text-xs tracking-[0.08em] uppercase no-underline hover:text-text transition-colors py-4" href="/dashboard">
                View app shell
              </Link>
            </div>
          </section>

          <section className="rounded-[10px] border border-border-default bg-white/[0.02] p-7">
            <h2 className="mt-0">Sequence preview</h2>
            <div className="grid gap-3.5">
              {reminderPreview.map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border border-border-default bg-white/[0.02] p-4"
                >
                  <div className="mb-2.5 flex items-center justify-between">
                    <strong>{item.label}</strong>
                    <span className="font-mono text-[11px] uppercase text-text-dim">
                      {item.status}
                    </span>
                  </div>
                  <p className="m-0 text-text-dim">
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