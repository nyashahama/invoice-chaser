"use client";

import Link from "next/link";
import React, { useState, useRef, useCallback } from "react";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Tone = "polite" | "firm" | "final";
type Step = 1 | 2 | 3;

interface InvoiceData {
  sender: string;
  senderEmail: string;
  client: string;
  contact: string;
  clientEmail: string;
  invNum: string;
  amount: string;
  due: string;
  daysLate: number;
  work: string;
  notes: string;
}

interface ScheduleItem {
  day: string;
  label: string;
  tone: string;
  color: string;
  bg: string;
}

interface TimelineEvent {
  id: number;
  colorKey: "blue" | "green" | "amber" | "red";
  icon: string;
  label: string;
  sub: string;
  time: string;
}

interface EmailCard {
  index: number;
  item: ScheduleItem;
  status: "queued" | "generating" | "done" | "error";
  body: string;
  subject: string;
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const toneSchedules: Record<Tone, ScheduleItem[]> = {
  polite: [
    {
      day: "Day 1",
      label: "Friendly reminder",
      tone: "Polite",
      color: "#00e676",
      bg: "rgba(0,230,118,0.15)",
    },
    {
      day: "Day 5",
      label: "Gentle follow-up",
      tone: "Polite",
      color: "#00e676",
      bg: "rgba(0,230,118,0.15)",
    },
    {
      day: "Day 14",
      label: "Checking in",
      tone: "Polite+Firm",
      color: "#ffb300",
      bg: "rgba(255,179,0,0.15)",
    },
    {
      day: "Day 30",
      label: "Final notice",
      tone: "Firm",
      color: "#ff3d3d",
      bg: "rgba(255,61,61,0.15)",
    },
  ],
  firm: [
    {
      day: "Day 1",
      label: "Payment reminder",
      tone: "Firm",
      color: "#ffb300",
      bg: "rgba(255,179,0,0.15)",
    },
    {
      day: "Day 5",
      label: "Urgent follow-up",
      tone: "Firm",
      color: "#ffb300",
      bg: "rgba(255,179,0,0.15)",
    },
    {
      day: "Day 10",
      label: "Demand for payment",
      tone: "Very Firm",
      color: "#ff3d3d",
      bg: "rgba(255,61,61,0.15)",
    },
    {
      day: "Day 21",
      label: "Final notice",
      tone: "Final",
      color: "#ff3d3d",
      bg: "rgba(255,61,61,0.15)",
    },
  ],
  final: [
    {
      day: "Day 1",
      label: "Immediate notice",
      tone: "Firm",
      color: "#ff3d3d",
      bg: "rgba(255,61,61,0.15)",
    },
    {
      day: "Day 3",
      label: "Final warning",
      tone: "Final",
      color: "#ff3d3d",
      bg: "rgba(255,61,61,0.15)",
    },
    {
      day: "Day 7",
      label: "Collections notice",
      tone: "Legal",
      color: "#ff3d3d",
      bg: "rgba(255,61,61,0.15)",
    },
  ],
};

const tlColors = {
  blue: { bg: "rgba(77,158,255,0.1)", color: "var(--blue)" },
  green: { bg: "rgba(0,230,118,0.1)", color: "var(--green)" },
  amber: { bg: "rgba(255,179,0,0.1)", color: "var(--amber)" },
  red: { bg: "rgba(255,61,61,0.1)", color: "var(--red)" },
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── API CALL ─────────────────────────────────────────────────────────────────

async function generateEmail(
  schedItem: ScheduleItem,
  index: number,
  scheduleLength: number,
  inv: InvoiceData,
  tone: Tone,
): Promise<string> {
  const toneGuide: Record<Tone, string> = {
    polite:
      "warm, friendly, professional. Assume they just forgot. No pressure.",
    firm: "direct and clear. Professional but no-nonsense. Make it clear payment is expected promptly.",
    final:
      "serious and final. Non-negotiable. Mention this is the last notice before escalation.",
  };

  const systemPrompt = `You are an expert at writing invoice payment reminder emails. Write concise, human-sounding emails — not templates, not robotic. Max 120 words. Do not use subject lines. Output ONLY the email body text, starting with the greeting. No markdown, no formatting codes.`;

  const userPrompt = `Write a ${schedItem.tone} invoice reminder email.

Sender: ${inv.sender} (${inv.senderEmail})
Client contact: ${inv.contact} at ${inv.client}
Invoice #: ${inv.invNum}
Amount: ${inv.amount}
Due date: ${inv.due}
Days overdue: ${inv.daysLate}
Work: ${inv.work}
Context: ${inv.notes || "none"}
Sequence position: ${index + 1} of ${scheduleLength} (${schedItem.day}, ${schedItem.label})
Tone guidance: ${toneGuide[tone]}

Include a placeholder like [PAYMENT LINK] for the payment URL. Sign off as ${inv.sender}.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 400,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) throw new Error("API error");
  const data = await response.json();
  return data.content.map((b: { text?: string }) => b.text || "").join("");
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function SkeletonLines() {
  return (
    <div style={{ padding: "16px" }}>
      {[85, 70, 90, 55].map((w, i) => (
        <div key={i} className="skeleton-line" style={{ width: `${w}%` }} />
      ))}
    </div>
  );
}

function Spinner() {
  return <div className="spinner" />;
}

function EmailCardComponent({
  card,
  inv,
  onEdit,
  onSaveEdit,
  editValue,
  onEditChange,
  isEditing,
}: {
  card: EmailCard;
  inv: InvoiceData;
  onEdit: (i: number) => void;
  onSaveEdit: (i: number) => void;
  editValue: string;
  onEditChange: (v: string) => void;
  isEditing: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const subjectMap: Record<number, string> = {
    0: `Friendly reminder: ${inv.invNum} is due`,
    1: `Following up: ${inv.invNum} — ${inv.amount}`,
    2: `Action needed: Invoice ${inv.invNum}`,
    3: `Final notice: Invoice ${inv.invNum} — ${inv.amount} outstanding`,
  };
  const subject = subjectMap[card.index] ?? `Reminder: ${inv.invNum}`;

  const copyEmail = async () => {
    await navigator.clipboard.writeText(card.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const borderColor =
    card.status === "generating"
      ? "rgba(77,158,255,0.4)"
      : card.status === "done"
        ? "rgba(0,230,118,0.3)"
        : "var(--border)";

  return (
    <div className="email-card" style={{ borderColor }}>
      <div className="email-card-header">
        <div className="email-card-meta">
          <div
            className="email-day-tag"
            style={{ background: card.item.bg, color: card.item.color }}
          >
            {card.item.day}
          </div>
          <div className="email-tone-tag">{card.item.label}</div>
        </div>
        <div className="email-card-status">
          {card.status === "generating" && (
            <>
              <Spinner />
              <span
                style={{
                  color: "var(--blue)",
                  fontSize: "10px",
                  letterSpacing: "0.1em",
                }}
              >
                Writing...
              </span>
            </>
          )}
          {card.status === "done" && (
            <span style={{ color: "var(--green)" }}>✓ Ready</span>
          )}
          {card.status === "queued" && (
            <span
              style={{
                color: "var(--text-muted)",
                fontFamily: "var(--mono)",
                fontSize: "10px",
                letterSpacing: "0.1em",
              }}
            >
              Queued
            </span>
          )}
          {card.status === "error" && (
            <span style={{ color: "var(--red)" }}>✗ Error</span>
          )}
        </div>
      </div>

      <div className="email-card-body">
        <div className="email-fields">
          <div className="ef-row">
            <span className="ef-key">From:</span>
            <span className="ef-val">
              <strong>{inv.sender}</strong> &lt;{inv.senderEmail}&gt;
            </span>
          </div>
          <div className="ef-row">
            <span className="ef-key">To:</span>
            <span className="ef-val">
              <strong>{inv.contact}</strong> &lt;{inv.clientEmail}&gt;
            </span>
          </div>
          <div className="ef-row">
            <span className="ef-key">Sub:</span>
            <span className="ef-val">{subject}</span>
          </div>
        </div>

        {card.status === "queued" ? (
          <SkeletonLines />
        ) : (
          <>
            {!isEditing && (
              <div className="email-body-content">
                {card.status === "generating" && !card.body ? (
                  <SkeletonLines />
                ) : (
                  card.body
                )}
              </div>
            )}
            {isEditing && (
              <textarea
                className="edit-textarea visible"
                value={editValue}
                onChange={(e) => onEditChange(e.target.value)}
                rows={8}
              />
            )}
          </>
        )}
      </div>

      {card.status === "done" && (
        <div className="email-actions">
          <button
            className="btn-sm btn-edit"
            onClick={() =>
              isEditing ? onSaveEdit(card.index) : onEdit(card.index)
            }
          >
            {isEditing ? "✓ Save" : "✏ Edit"}
          </button>
          <button className="btn-sm btn-copy tooltip" onClick={copyEmail}>
            <span className="tooltip-tip">Copy to clipboard</span>
            {copied ? "✓ Copied!" : "⎘ Copy"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function DemoPage() {
  const [step, setStep] = useState<Step>(1);
  const [tone, setTone] = useState<Tone>("polite");
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [schedule, setSchedule] = useState<ScheduleItem[]>(
    toneSchedules.polite,
  );
  const [emailCards, setEmailCards] = useState<EmailCard[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [showTimeline, setShowTimeline] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [allGenerated, setAllGenerated] = useState(false);
  const [activated, setActivated] = useState(false);
  const [genTitle, setGenTitle] = useState("Generating your email sequence...");
  const [genSub, setGenSub] = useState(
    "Claude is writing personalised reminders for your client",
  );
  const [showSpinner, setShowSpinner] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const rightPanelRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const tlCounter = useRef(0);

  // Field refs for step 1
  const fields = {
    sender: useRef<HTMLInputElement>(null),
    senderEmail: useRef<HTMLInputElement>(null),
    client: useRef<HTMLInputElement>(null),
    contact: useRef<HTMLInputElement>(null),
    clientEmail: useRef<HTMLInputElement>(null),
    invNum: useRef<HTMLInputElement>(null),
    amount: useRef<HTMLInputElement>(null),
    due: useRef<HTMLInputElement>(null),
    work: useRef<HTMLInputElement>(null),
    notes: useRef<HTMLTextAreaElement>(null),
  };

  // ── Timeline helper ──
  const addTimelineEvent = useCallback(
    (
      colorKey: TimelineEvent["colorKey"],
      icon: string,
      label: string,
      sub: string,
    ) => {
      const now = new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setTimeline((prev) => [
        ...prev,
        { id: tlCounter.current++, colorKey, icon, label, sub, time: now },
      ]);
      requestAnimationFrame(() => {
        if (timelineRef.current)
          timelineRef.current.scrollTop = timelineRef.current.scrollHeight;
      });
    },
    [],
  );

  // ── Step navigation ──
  const goToStep = (n: Step) => {
    setStep(n);
    if (rightPanelRef.current) rightPanelRef.current.scrollTop = 0;
  };

  // ── Tone / schedule ──
  const handleToneSelect = (t: Tone) => {
    setTone(t);
    setSchedule(toneSchedules[t]);
  };

  // ── Step 1 submit ──
  const completeStep1 = () => {
    const required = [
      fields.sender,
      fields.client,
      fields.contact,
      fields.clientEmail,
      fields.invNum,
      fields.amount,
      fields.due,
    ] as React.RefObject<HTMLInputElement>[];

    let ok = true;
    required.forEach((ref) => {
      if (!ref.current?.value.trim()) {
        if (ref.current) ref.current.style.borderColor = "var(--red)";
        ok = false;
      } else {
        if (ref.current) ref.current.style.borderColor = "";
      }
    });
    if (!ok) return;

    const due = new Date(fields.due.current!.value);
    const today = new Date();
    const diffDays = Math.max(
      0,
      Math.floor((today.getTime() - due.getTime()) / 86400000),
    );

    setInvoiceData({
      sender: fields.sender.current!.value,
      senderEmail: fields.senderEmail.current!.value,
      client: fields.client.current!.value,
      contact: fields.contact.current!.value,
      clientEmail: fields.clientEmail.current!.value,
      invNum: fields.invNum.current!.value,
      amount: fields.amount.current!.value,
      due: fields.due.current!.value,
      daysLate: diffDays || 28,
      work: fields.work.current!.value,
      notes: fields.notes.current!.value,
    });

    goToStep(2);
  };

  // ── Step 2 submit ──
  const completeStep2 = () => {
    goToStep(3);
    setShowTimeline(true);
    if (!allGenerated) startGeneration();
  };

  // ── AI generation ──
  const startGeneration = useCallback(async () => {
    if (generating || !invoiceData) return;
    setGenerating(true);
    setAllGenerated(false);
    setEmailCards([]);
    setGenTitle("Generating your email sequence...");
    setGenSub(
      `Claude is writing personalised reminders for ${invoiceData.contact || invoiceData.client}`,
    );
    setShowSpinner(true);

    addTimelineEvent(
      "blue",
      "⚡",
      "Autopilot initialised",
      "Analysing invoice data...",
    );
    await sleep(600);
    addTimelineEvent(
      "blue",
      "🧠",
      "Claude connected",
      "Generating personalised sequence",
    );

    const currentSchedule = toneSchedules[tone];

    for (let i = 0; i < currentSchedule.length; i++) {
      const item = currentSchedule[i];

      // Add queued card
      setEmailCards((prev) => [
        ...prev,
        { index: i, item, status: "queued", body: "", subject: "" },
      ]);

      addTimelineEvent("amber", "✍️", `Writing: ${item.label}`, item.day);
      await sleep(300);

      // Mark as generating
      setEmailCards((prev) =>
        prev.map((c) => (c.index === i ? { ...c, status: "generating" } : c)),
      );

      try {
        const emailText = await generateEmail(
          item,
          i,
          currentSchedule.length,
          invoiceData,
          tone,
        );

        // Type-writer effect via incremental state updates
        const chars = emailText.split("");
        const CHUNK = 4;
        for (let j = 0; j < chars.length; j += CHUNK) {
          const partial = emailText.slice(0, j + CHUNK);
          setEmailCards((prev) =>
            prev.map((c) => (c.index === i ? { ...c, body: partial } : c)),
          );
          await sleep(16);
        }

        setEmailCards((prev) =>
          prev.map((c) =>
            c.index === i ? { ...c, status: "done", body: emailText } : c,
          ),
        );
        addTimelineEvent(
          "green",
          "✓",
          `${item.label} — done`,
          "Queued for sending",
        );
      } catch {
        setEmailCards((prev) =>
          prev.map((c) =>
            c.index === i
              ? {
                  ...c,
                  status: "error",
                  body: "[Error generating email — please try again]",
                }
              : c,
          ),
        );
        addTimelineEvent(
          "red",
          "✗",
          `${item.label} — error`,
          "Could not generate",
        );
      }

      await sleep(200);
    }

    setShowSpinner(false);
    setGenTitle("Sequence ready — review and activate");
    setGenSub(
      `${currentSchedule.length} emails generated for ${invoiceData.contact}`,
    );
    setGenerating(false);
    setAllGenerated(true);
    addTimelineEvent(
      "green",
      "🎯",
      "All emails ready",
      "Awaiting your activation",
    );
  }, [generating, invoiceData, tone, addTimelineEvent]);

  // ── Activate ──
  const activateAutopilot = () => {
    if (!invoiceData) return;
    setActivated(true);
    addTimelineEvent(
      "green",
      "🚀",
      "Autopilot activated!",
      `Sequence live for ${invoiceData.client}`,
    );
    schedule.forEach((item, i) => {
      setTimeout(
        () => {
          addTimelineEvent("green", "📬", `Scheduled: ${item.label}`, item.day);
        },
        (i + 1) * 400,
      );
    });
    setTimeout(
      () => {
        addTimelineEvent(
          "blue",
          "👁",
          "Watching for payment",
          "Will stop on detection",
        );
      },
      (schedule.length + 1) * 400,
    );
  };

  // ── Edit ──
  const handleEdit = (i: number) => {
    const card = emailCards.find((c) => c.index === i);
    if (!card) return;
    setEditValue(card.body);
    setEditingIndex(i);
  };
  const handleSaveEdit = (i: number) => {
    setEmailCards((prev) =>
      prev.map((c) => (c.index === i ? { ...c, body: editValue } : c)),
    );
    setEditingIndex(null);
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <>
      <style>{demoStyles}</style>

      {/* NAV */}
      <nav className="demo-nav">
        <Link href="/" className="nav-logo">
          Invoice<span>Chaser</span>
        </Link>
        <div className="nav-badge">
          <div className="pulse-dot" />
          Live Demo
        </div>
        <Link href="/" className="nav-back">
          ← Back to site
        </Link>
      </nav>

      <div className="app-shell">
        {/* LEFT PANEL */}
        <div className="left-panel">
          <div className="panel-header">
            <div className="panel-title">Autopilot Setup</div>
            <div className="panel-sub">
              Fill in 3 steps and watch the system generate and queue your
              entire follow-up sequence.
            </div>
          </div>

          <div className="steps-nav">
            {([1, 2, 3] as Step[]).map((n) => (
              <button
                key={n}
                className={`step-btn ${step === n ? "active" : step > n ? "done" : ""}`}
                onClick={() => goToStep(n)}
              >
                <div className="step-num-badge">{step > n ? "✓" : n}</div>
                <span className="step-label">
                  {n === 1
                    ? "Invoice Details"
                    : n === 2
                      ? "Tone & Schedule"
                      : "Generate & Send"}
                </span>
              </button>
            ))}
          </div>

          {/* Invoice summary */}
          {invoiceData && (
            <div className="invoice-summary visible">
              <div className="inv-sum-header">
                <span>Invoice Preview</span>
                <span
                  style={{
                    color: "var(--red)",
                    fontSize: "9px",
                    letterSpacing: "0.1em",
                  }}
                >
                  OVERDUE
                </span>
              </div>
              <div className="inv-sum-body">
                <div className="inv-sum-row">
                  <span>Client</span>
                  <strong>{invoiceData.client}</strong>
                </div>
                <div className="inv-sum-row">
                  <span>Invoice #</span>
                  <strong>{invoiceData.invNum}</strong>
                </div>
                <div className="inv-sum-row">
                  <span>Due</span>
                  <strong>
                    {new Date(invoiceData.due).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </strong>
                </div>
                <div className="inv-sum-row">
                  <span>Days Late</span>
                  <strong style={{ color: "var(--red)" }}>
                    {invoiceData.daysLate} days
                  </strong>
                </div>
                <div className="inv-sum-amount">
                  <span>Total Due</span>
                  <div>{invoiceData.amount}</div>
                </div>
              </div>
            </div>
          )}

          {/* Sequence preview */}
          {step >= 2 && (
            <div className="sequence-preview visible">
              <div className="seq-label">{"// Reminder Sequence"}</div>
              {schedule.map((item, i) => (
                <div key={i} className="seq-item">
                  {i < schedule.length - 1 && <div className="seq-line" />}
                  <div
                    className="seq-dot"
                    style={{ background: item.bg, color: item.color }}
                  >
                    {i + 1}
                  </div>
                  <div className="seq-info">
                    <div className="seq-name">{item.label}</div>
                    <div className="seq-day">{item.day}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div
          className="right-panel"
          id="right-panel"
          ref={rightPanelRef}
          style={{ marginRight: showTimeline ? "280px" : "0" }}
        >
          {/* ── STEP 1 ── */}
          <div className={`step-view ${step === 1 ? "active" : ""}`}>
            <div className="progress-bar-wrap">
              <div className="progress-bar" style={{ width: "33%" }} />
            </div>
            <div className="step-view-title">Invoice details</div>
            <div className="step-view-sub">
              {"// Enter the invoice you want to collect. All fields used to personalize emails."}
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Your name / company</label>
                <input
                  ref={fields.sender}
                  className="form-input"
                  type="text"
                  placeholder="Alex Rivera"
                  defaultValue="Alex Rivera"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Your email</label>
                <input
                  ref={fields.senderEmail}
                  className="form-input"
                  type="email"
                  placeholder="alex@studio.com"
                  defaultValue="alex@studio.com"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Client / Company name</label>
                <input
                  ref={fields.client}
                  className="form-input"
                  type="text"
                  placeholder="Acme Corp"
                  defaultValue="Acme Corp"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Client contact name</label>
                <input
                  ref={fields.contact}
                  className="form-input"
                  type="text"
                  placeholder="Sarah Chen"
                  defaultValue="Sarah Chen"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Client email</label>
                <input
                  ref={fields.clientEmail}
                  className="form-input"
                  type="email"
                  placeholder="billing@acmecorp.com"
                  defaultValue="billing@acmecorp.com"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Invoice number</label>
                <input
                  ref={fields.invNum}
                  className="form-input"
                  type="text"
                  placeholder="INV-2301"
                  defaultValue="INV-2301"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Invoice amount</label>
                <input
                  ref={fields.amount}
                  className="form-input"
                  type="text"
                  placeholder="$12,500"
                  defaultValue="$12,500"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Due date</label>
                <input
                  ref={fields.due}
                  className="form-input"
                  type="date"
                  defaultValue="2025-02-15"
                />
              </div>
              <div className="form-group full">
                <label className="form-label">
                  What was the work / services rendered?
                </label>
                <input
                  ref={fields.work}
                  className="form-input"
                  type="text"
                  placeholder="Brand identity redesign"
                  defaultValue="Brand identity redesign — logo, guidelines, digital assets"
                />
              </div>
              <div className="form-group full">
                <label className="form-label">
                  Any context to add? (optional)
                </label>
                <textarea
                  ref={fields.notes}
                  className="form-textarea"
                  placeholder="e.g. We've had a good relationship..."
                  defaultValue="We've had a great working relationship. Final deliverables were submitted Jan 28th and approved by the client."
                />
              </div>
            </div>

            <div className="btn-row">
              <button className="btn-primary" onClick={completeStep1}>
                Continue to tone &amp; schedule →
              </button>
            </div>
          </div>

          {/* ── STEP 2 ── */}
          <div className={`step-view ${step === 2 ? "active" : ""}`}>
            <div className="progress-bar-wrap">
              <div className="progress-bar" style={{ width: "66%" }} />
            </div>
            <div className="step-view-title">Tone &amp; schedule</div>
            <div className="step-view-sub">
              {"// Choose how assertive you want to get, and set your follow-up cadence."}
            </div>

            <div style={{ marginBottom: "10px" }} className="form-label">
              Overall tone approach
            </div>
            <div className="tone-grid">
              {(["polite", "firm", "final"] as Tone[]).map((t) => {
                const cls =
                  tone === t
                    ? t === "polite"
                      ? "selected"
                      : t === "firm"
                        ? "selected-amber"
                        : "selected-red"
                    : "";
                return (
                  <div
                    key={t}
                    className={`tone-option ${cls}`}
                    onClick={() => handleToneSelect(t)}
                  >
                    <div className="tone-check">✓</div>
                    <div className="tone-emoji">
                      {t === "polite" ? "🤝" : t === "firm" ? "📋" : "⚡"}
                    </div>
                    <div className="tone-title">
                      {t === "polite"
                        ? "Polite"
                        : t === "firm"
                          ? "Firm"
                          : "Final Notice"}
                    </div>
                    <div className="tone-desc">
                      {t === "polite" &&
                        "Warm & professional. Assumes goodwill. Great for long-term clients."}
                      {t === "firm" &&
                        "Direct and clear. No fluff. Gets the message without burning bridges."}
                      {t === "final" &&
                        "Professional but non-negotiable. Last step before escalation."}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="form-label" style={{ marginBottom: "14px" }}>
              Reminder schedule
            </div>
            <div className="schedule-items">
              {schedule.map((item, i) => (
                <div key={i} className="schedule-item">
                  <div
                    className="sched-day-badge"
                    style={{ background: item.bg, color: item.color }}
                  >
                    {item.day}
                  </div>
                  <div className="sched-label">{item.label}</div>
                  <div
                    className="sched-tone-badge"
                    style={{ background: item.bg, color: item.color }}
                  >
                    {item.tone}
                  </div>
                </div>
              ))}
            </div>

            <div className="btn-row">
              <button className="btn-secondary" onClick={() => goToStep(1)}>
                ← Back
              </button>
              <button className="btn-primary" onClick={completeStep2}>
                Generate email sequence →
              </button>
            </div>
          </div>

          {/* ── STEP 3 ── */}
          <div className={`step-view ${step === 3 ? "active" : ""}`}>
            <div className="progress-bar-wrap">
              <div className="progress-bar" style={{ width: "100%" }} />
            </div>

            {/* Success banner */}
            {activated && (
              <div className="success-banner visible">
                <div className="success-icon">✅</div>
                <div className="success-text">
                  <h3>Autopilot activated</h3>
                  <p>
                    Your sequence is live. Reminders will send automatically
                    until <strong>{invoiceData?.client}</strong> pays.
                    You&apos;ll be notified the moment the invoice is settled.
                  </p>
                </div>
              </div>
            )}

            {/* Gen status bar */}
            {!activated && (
              <div className="gen-status-bar">
                <div className="gen-status-icon">⚡</div>
                <div className="gen-status-text">
                  <div className="gen-status-title">{genTitle}</div>
                  <div className="gen-status-sub">{genSub}</div>
                </div>
                {showSpinner && <Spinner />}
              </div>
            )}

            <div
              className="step-view-sub"
              style={{ marginTop: "-12px", marginBottom: "24px" }}
            >
              {"// Your AI-generated reminder sequence — review, edit, then activate autopilot."}
            </div>

            <div className="email-sequence">
              {emailCards.map((card) => (
                <EmailCardComponent
                  key={card.index}
                  card={card}
                  inv={invoiceData!}
                  onEdit={handleEdit}
                  onSaveEdit={handleSaveEdit}
                  editValue={editValue}
                  onEditChange={setEditValue}
                  isEditing={editingIndex === card.index}
                />
              ))}
            </div>

            {allGenerated && !activated && (
              <div className="btn-row">
                <button className="btn-primary" onClick={activateAutopilot}>
                  ⚡ Activate autopilot
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    goToStep(1);
                    setAllGenerated(false);
                    setEmailCards([]);
                    setActivated(false);
                    setShowTimeline(false);
                    setTimeline([]);
                  }}
                >
                  Start over
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LIVE TIMELINE */}
      {showTimeline && (
        <div className="timeline-overlay visible">
          <div className="timeline-header">
            <div className="timeline-title">{"// System activity"}</div>
          </div>
          <div className="timeline-list" ref={timelineRef}>
            {timeline.map((ev) => {
              const c = tlColors[ev.colorKey];
              return (
                <div key={ev.id} className="tl-event appear">
                  <div className="tl-icon-wrap">
                    <div
                      className="tl-icon"
                      style={{ background: c.bg, color: c.color }}
                    >
                      {ev.icon}
                    </div>
                    <div className="tl-connector" />
                  </div>
                  <div className="tl-content">
                    <div className="tl-label">{ev.label}</div>
                    <div className="tl-time">
                      {ev.sub} · {ev.time}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

// ─── SCOPED STYLES ────────────────────────────────────────────────────────────

const demoStyles = `
  :root {
    --blue: #4d9eff;
    --blue-dim: rgba(77,158,255,0.1);
    --red-dim: rgba(255,61,61,0.1);
    --amber-dim: rgba(255,179,0,0.1);
    --green-glow: rgba(0,230,118,0.25);
    --surface3: #1a1a1a;
    --border-light: #2e2e2e;
  }

  .demo-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 200;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 32px; height: 56px;
    border-bottom: 1px solid var(--border);
    background: rgba(10,10,10,0.95);
    backdrop-filter: blur(16px);
  }
  .nav-badge {
    font-family: var(--mono); font-size: 10px; letter-spacing: 0.15em;
    text-transform: uppercase; color: var(--amber);
    background: var(--amber-dim); border: 1px solid rgba(255,179,0,0.3);
    padding: 4px 10px; border-radius: 2px;
    display: flex; align-items: center; gap: 6px;
  }
  .pulse-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--amber);
    animation: pulseDot 1.5s ease-in-out infinite;
  }
  @keyframes pulseDot { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:0.4;transform:scale(0.7);} }
  .nav-back {
    font-family: var(--mono); font-size: 11px; color: var(--text-dim);
    text-decoration: none; letter-spacing: 0.08em; text-transform: uppercase;
    transition: color 0.2s;
  }
  .nav-back:hover { color: var(--text); }

  .app-shell {
    display: grid; grid-template-columns: 340px 1fr;
    height: 100vh; padding-top: 56px;
  }
  .left-panel {
    border-right: 1px solid var(--border); background: var(--surface);
    display: flex; flex-direction: column; overflow-y: auto;
  }
  .panel-header { padding: 28px 28px 20px; border-bottom: 1px solid var(--border); }
  .panel-title { font-size: 18px; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 6px; }
  .panel-sub { font-family: var(--mono); font-size: 11px; color: var(--text-dim); line-height: 1.6; letter-spacing: 0.02em; }

  .steps-nav { padding: 20px 28px; border-bottom: 1px solid var(--border); display: flex; flex-direction: column; gap: 4px; }
  .step-btn {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 12px; border-radius: 3px; cursor: pointer; transition: background 0.2s;
    border: none; background: none; color: var(--text-dim); text-align: left; width: 100%;
  }
  .step-btn:hover { background: var(--surface2); }
  .step-btn.active { background: var(--green-dim); color: var(--text); }
  .step-num-badge {
    width: 24px; height: 24px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-family: var(--mono); font-size: 10px; font-weight: 700;
    border: 1px solid var(--border); flex-shrink: 0; transition: all 0.3s;
  }
  .step-btn.active .step-num-badge { background: var(--green); color: var(--black); border-color: var(--green); }
  .step-btn.done .step-num-badge { background: var(--green-dim); color: var(--green); border-color: rgba(0,230,118,0.4); }
  .step-label { font-family: var(--mono); font-size: 11px; letter-spacing: 0.05em; text-transform: uppercase; }

  .invoice-summary { margin: 20px 28px; border: 1px solid var(--border); border-radius: 3px; overflow: hidden; display: none; }
  .invoice-summary.visible { display: block; }
  .inv-sum-header {
    background: var(--surface2); padding: 10px 14px;
    font-family: var(--mono); font-size: 10px; color: var(--text-dim);
    letter-spacing: 0.15em; text-transform: uppercase;
    border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;
  }
  .inv-sum-body { padding: 14px; }
  .inv-sum-row { display: flex; justify-content: space-between; font-family: var(--mono); font-size: 11px; padding: 4px 0; color: var(--text-dim); }
  .inv-sum-row strong { color: var(--text); }
  .inv-sum-amount { font-size: 22px; font-weight: 800; color: var(--red); margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: baseline; }
  .inv-sum-amount span { font-family: var(--mono); font-size: 10px; color: var(--text-dim); }

  .sequence-preview { margin: 0 28px 20px; display: none; }
  .sequence-preview.visible { display: block; }
  .seq-label { font-family: var(--mono); font-size: 10px; color: var(--text-dim); letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 10px; }
  .seq-item { display: flex; gap: 10px; align-items: flex-start; padding: 8px 0; border-bottom: 1px solid var(--border); position: relative; }
  .seq-item:last-child { border-bottom: none; }
  .seq-line { position: absolute; left: 8px; top: 24px; bottom: -8px; width: 1px; background: var(--border); }
  .seq-dot { width: 18px; height: 18px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 8px; margin-top: 1px; }
  .seq-info { flex: 1; }
  .seq-name { font-size: 12px; font-weight: 700; margin-bottom: 2px; }
  .seq-day { font-family: var(--mono); font-size: 10px; color: var(--text-dim); }

  .right-panel { overflow-y: auto; position: relative; transition: margin-right 0.3s ease; }
  .step-view { display: none; padding: 40px 48px; max-width: 760px; }
  .step-view.active { display: block; }
  .step-view-title { font-size: 26px; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 6px; }
  .step-view-sub { font-family: var(--mono); font-size: 12px; color: var(--text-dim); margin-bottom: 36px; letter-spacing: 0.04em; }

  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
  .form-group { display: flex; flex-direction: column; gap: 8px; }
  .form-group.full { grid-column: 1 / -1; }
  .form-label { font-family: var(--mono); font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--text-dim); }
  .form-input, .form-select, .form-textarea {
    background: var(--surface); border: 1px solid var(--border);
    color: var(--text); font-family: var(--mono); font-size: 13px;
    padding: 12px 14px; border-radius: 2px; outline: none; transition: border-color 0.2s; width: 100%;
  }
  .form-input:focus, .form-select:focus, .form-textarea:focus { border-color: var(--green); }
  .form-textarea { resize: vertical; min-height: 80px; line-height: 1.6; }

  .tone-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 32px; }
  .tone-option { border: 1px solid var(--border); border-radius: 3px; padding: 18px; cursor: pointer; transition: all 0.2s; position: relative; }
  .tone-option:hover { border-color: var(--border-light); background: var(--surface); }
  .tone-option.selected { border-color: var(--green); background: var(--green-dim); }
  .tone-option.selected-amber { border-color: var(--amber); background: var(--amber-dim); }
  .tone-option.selected-red { border-color: var(--red); background: var(--red-dim); }
  .tone-emoji { font-size: 24px; margin-bottom: 10px; }
  .tone-title { font-size: 14px; font-weight: 800; margin-bottom: 6px; }
  .tone-desc { font-family: var(--mono); font-size: 10px; color: var(--text-dim); line-height: 1.6; }
  .tone-check {
    position: absolute; top: 10px; right: 10px;
    width: 16px; height: 16px; border-radius: 50%;
    background: var(--green); display: none;
    align-items: center; justify-content: center;
    font-size: 9px; color: var(--black); font-weight: 900;
  }
  .tone-option.selected .tone-check,
  .tone-option.selected-amber .tone-check,
  .tone-option.selected-red .tone-check { display: flex; }

  .schedule-items { display: flex; flex-direction: column; gap: 10px; margin-bottom: 28px; }
  .schedule-item { display: flex; align-items: center; gap: 12px; background: var(--surface); border: 1px solid var(--border); border-radius: 3px; padding: 12px 16px; }
  .sched-day-badge { font-family: var(--mono); font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; padding: 4px 10px; border-radius: 2px; flex-shrink: 0; }
  .sched-label { font-family: var(--mono); font-size: 12px; flex: 1; }
  .sched-tone-badge { font-family: var(--mono); font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; padding: 3px 8px; border-radius: 2px; }

  .gen-status-bar { display: flex; align-items: center; gap: 14px; background: var(--surface); border: 1px solid var(--border); border-radius: 3px; padding: 16px 20px; margin-bottom: 28px; }
  .gen-status-icon { font-size: 18px; }
  .gen-status-text { flex: 1; }
  .gen-status-title { font-size: 14px; font-weight: 800; margin-bottom: 3px; }
  .gen-status-sub { font-family: var(--mono); font-size: 11px; color: var(--text-dim); }

  .email-sequence { display: flex; flex-direction: column; gap: 16px; }
  .email-card { border: 1px solid var(--border); border-radius: 3px; overflow: hidden; transition: border-color 0.3s; }
  .email-card-header { background: var(--surface2); padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); }
  .email-card-meta { display: flex; align-items: center; gap: 10px; }
  .email-day-tag { font-family: var(--mono); font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; padding: 3px 9px; border-radius: 2px; }
  .email-tone-tag { font-family: var(--mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-dim); }
  .email-card-status { font-family: var(--mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; display: flex; align-items: center; gap: 6px; }
  .email-card-body { padding: 0; }
  .email-fields { padding: 12px 16px; border-bottom: 1px solid var(--border); display: flex; flex-direction: column; gap: 4px; }
  .ef-row { display: flex; gap: 10px; font-family: var(--mono); font-size: 11px; }
  .ef-key { color: var(--text-muted); min-width: 44px; }
  .ef-val { color: var(--text-dim); }
  .ef-val strong { color: var(--text); }
  .email-body-content { padding: 16px; font-family: var(--mono); font-size: 12px; color: var(--text-dim); line-height: 1.75; min-height: 60px; white-space: pre-wrap; }
  .email-actions { padding: 12px 16px; border-top: 1px solid var(--border); display: flex; gap: 8px; align-items: center; }

  .skeleton-line { height: 11px; border-radius: 2px; background: linear-gradient(90deg, var(--surface2) 25%, var(--border-light) 50%, var(--surface2) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; margin-bottom: 8px; }
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

  .btn-sm { font-family: var(--mono); font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; padding: 7px 14px; border-radius: 2px; border: none; cursor: pointer; transition: all 0.2s; }
  .btn-edit { background: var(--surface3); color: var(--text-dim); border: 1px solid var(--border); }
  .btn-edit:hover { color: var(--text); border-color: var(--border-light); }
  .btn-copy { background: transparent; color: var(--text-dim); border: 1px solid var(--border); }
  .btn-copy:hover { color: var(--text); }
  .edit-textarea { width: 100%; background: var(--surface2); border: none; border-top: 1px solid var(--border); color: var(--text); font-family: var(--mono); font-size: 12px; padding: 16px; line-height: 1.75; resize: none; outline: none; min-height: 120px; display: none; }
  .edit-textarea.visible { display: block; }

  .btn-row { display: flex; align-items: center; gap: 12px; margin-top: 32px; }
  .btn-primary { display: inline-flex; align-items: center; gap: 10px; background: var(--green); color: var(--black); font-family: var(--mono); font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; padding: 14px 28px; border-radius: 2px; border: none; cursor: pointer; transition: all 0.2s; }
  .btn-primary:hover { background: #1fffaa; transform: translateY(-1px); box-shadow: 0 6px 24px var(--green-glow); }
  .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }
  .btn-secondary { display: inline-flex; align-items: center; gap: 8px; background: transparent; color: var(--text-dim); font-family: var(--mono); font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; padding: 14px 20px; border-radius: 2px; border: 1px solid var(--border); cursor: pointer; transition: all 0.2s; }
  .btn-secondary:hover { color: var(--text); border-color: var(--border-light); }

  .success-banner { display: none; background: var(--green-dim); border: 1px solid rgba(0,230,118,0.3); border-radius: 3px; padding: 20px 24px; margin-bottom: 24px; align-items: center; gap: 16px; }
  .success-banner.visible { display: flex; }
  .success-icon { font-size: 28px; }
  .success-text h3 { font-size: 16px; font-weight: 800; margin-bottom: 4px; }
  .success-text p { font-family: var(--mono); font-size: 11px; color: var(--text-dim); line-height: 1.6; }

  .progress-bar-wrap { height: 2px; background: var(--border); position: relative; margin-bottom: 32px; border-radius: 1px; }
  .progress-bar { height: 100%; background: var(--green); border-radius: 1px; transition: width 0.5s ease; box-shadow: 0 0 8px rgba(0,230,118,0.6); }

  .tooltip { position: relative; }
  .tooltip-tip { position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%); background: var(--surface3); border: 1px solid var(--border); padding: 6px 10px; border-radius: 2px; font-family: var(--mono); font-size: 10px; color: var(--text-dim); white-space: nowrap; pointer-events: none; opacity: 0; transition: opacity 0.2s; }
  .tooltip:hover .tooltip-tip { opacity: 1; }

  .timeline-overlay { display: none; position: fixed; top: 56px; right: 0; bottom: 0; width: 280px; border-left: 1px solid var(--border); background: var(--surface); flex-direction: column; z-index: 50; }
  .timeline-overlay.visible { display: flex; }
  .timeline-header { padding: 20px 20px 14px; border-bottom: 1px solid var(--border); }
  .timeline-title { font-family: var(--mono); font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--text-dim); }
  .timeline-list { flex: 1; overflow-y: auto; padding: 16px 20px; }
  .tl-event { display: flex; gap: 12px; margin-bottom: 16px; opacity: 0; transform: translateX(8px); transition: all 0.35s ease; }
  .tl-event.appear { opacity: 1; transform: translateX(0); }
  .tl-icon-wrap { display: flex; flex-direction: column; align-items: center; }
  .tl-icon { width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 12px; }
  .tl-connector { width: 1px; flex: 1; background: var(--border); min-height: 12px; }
  .tl-content { flex: 1; padding-bottom: 4px; }
  .tl-label { font-size: 12px; font-weight: 700; margin-bottom: 3px; }
  .tl-time { font-family: var(--mono); font-size: 10px; color: var(--text-dim); }

  .spinner { width: 14px; height: 14px; border: 2px solid rgba(77,158,255,0.3); border-top-color: var(--blue); border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
  @keyframes spin { to { transform: rotate(360deg); } }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border-light); border-radius: 2px; }

  @media (max-width: 900px) {
    .app-shell { grid-template-columns: 1fr; }
    .left-panel { display: none; }
    .timeline-overlay { display: none !important; }
    .step-view { padding: 24px; }
    .tone-grid { grid-template-columns: 1fr; }
    .form-grid { grid-template-columns: 1fr; }
  }
`;
