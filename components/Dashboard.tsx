"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Tone = "polite" | "firm" | "final";
type InvoiceStatus = "active" | "paid" | "overdue" | "draft";

interface Invoice {
  id: string;
  client: string;
  contact: string;
  clientEmail: string;
  invNum: string;
  amount: string;
  amountNum: number;
  due: string;
  daysLate: number;
  work: string;
  notes: string;
  status: InvoiceStatus;
  tone: Tone;
  emailsSent: number;
  createdAt: string;
  paidAt?: string;
}

interface ScheduleItem {
  day: string;
  label: string;
  tone: string;
  color: string;
  bg: string;
}

interface EmailCard {
  index: number;
  item: ScheduleItem;
  status: "queued" | "generating" | "done" | "error";
  body: string;
}

interface TimelineEvent {
  id: number;
  colorKey: "blue" | "green" | "amber" | "red";
  icon: string;
  label: string;
  sub: string;
  time: string;
}

// ─── SEED DATA ────────────────────────────────────────────────────────────────

const SEED_INVOICES: Invoice[] = [
  {
    id: "inv_001",
    client: "Acme Corp",
    contact: "Sarah Chen",
    clientEmail: "billing@acmecorp.com",
    invNum: "INV-2301",
    amount: "$12,500",
    amountNum: 12500,
    due: "2025-02-15",
    daysLate: 19,
    work: "Brand identity redesign",
    notes: "Great relationship. Deliverables approved Jan 28.",
    status: "overdue",
    tone: "polite",
    emailsSent: 2,
    createdAt: "2025-01-28",
  },
  {
    id: "inv_002",
    client: "Verve Studio",
    contact: "Jake Morton",
    clientEmail: "jake@vervestudio.io",
    invNum: "INV-2298",
    amount: "$4,200",
    amountNum: 4200,
    due: "2025-02-20",
    daysLate: 14,
    work: "Motion graphics package",
    notes: "",
    status: "active",
    tone: "firm",
    emailsSent: 1,
    createdAt: "2025-02-01",
  },
  {
    id: "inv_003",
    client: "Neon Digital",
    contact: "Priya Nair",
    clientEmail: "priya@neondigital.com",
    invNum: "INV-2289",
    amount: "$8,800",
    amountNum: 8800,
    due: "2025-01-31",
    daysLate: 34,
    work: "UX audit & redesign sprint",
    notes: "First-time client. Be professional.",
    status: "overdue",
    tone: "firm",
    emailsSent: 3,
    createdAt: "2025-01-10",
  },
  {
    id: "inv_004",
    client: "Marble & Co",
    contact: "Tom Aldridge",
    clientEmail: "tom@marbleco.com",
    invNum: "INV-2275",
    amount: "$3,600",
    amountNum: 3600,
    due: "2025-01-15",
    daysLate: 0,
    work: "Campaign photography direction",
    notes: "",
    status: "paid",
    tone: "polite",
    emailsSent: 1,
    createdAt: "2025-01-05",
    paidAt: "2025-01-18",
  },
];

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
  blue: { bg: "rgba(77,158,255,0.1)", color: "#4d9eff" },
  green: { bg: "rgba(0,230,118,0.1)", color: "#00e676" },
  amber: { bg: "rgba(255,179,0,0.1)", color: "#ffb300" },
  red: { bg: "rgba(255,61,61,0.1)", color: "#ff3d3d" },
};

const STATUS_META: Record<
  InvoiceStatus,
  { label: string; color: string; bg: string }
> = {
  overdue: { label: "Overdue", color: "#ff3d3d", bg: "rgba(255,61,61,0.12)" },
  active: { label: "Active", color: "#ffb300", bg: "rgba(255,179,0,0.12)" },
  paid: { label: "Paid", color: "#00e676", bg: "rgba(0,230,118,0.12)" },
  draft: { label: "Draft", color: "#888", bg: "rgba(136,136,136,0.12)" },
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── API CALL ─────────────────────────────────────────────────────────────────

async function generateEmail(
  schedItem: ScheduleItem,
  index: number,
  scheduleLength: number,
  inv: Invoice,
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
  const userPrompt = `Write a ${schedItem.tone} invoice reminder email.\n\nSender: ${inv.contact} chaser (${inv.clientEmail})\nClient contact: ${inv.contact} at ${inv.client}\nInvoice #: ${inv.invNum}\nAmount: ${inv.amount}\nDue date: ${inv.due}\nDays overdue: ${inv.daysLate}\nWork: ${inv.work}\nContext: ${inv.notes || "none"}\nSequence position: ${index + 1} of ${scheduleLength} (${schedItem.day}, ${schedItem.label})\nTone guidance: ${toneGuide[tone]}\n\nInclude a placeholder like [PAYMENT LINK] for the payment URL.`;

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

function TrialBanner({ user }: { user: User }) {
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(user.trialEndsAt).getTime() - Date.now()) / 86400000),
  );
  if (user.plan !== "trial") return null;
  return (
    <div
      style={{
        background: "rgba(255,179,0,0.08)",
        borderBottom: "1px solid rgba(255,179,0,0.2)",
        padding: "10px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontFamily: "var(--mono)",
        fontSize: "11px",
      }}
    >
      <span style={{ color: "#ffb300" }}>
        ⚡ Free trial — <strong>{daysLeft} days</strong> remaining
      </span>
      <a
        href="#pricing"
        style={{
          color: "#00e676",
          textDecoration: "none",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          fontSize: "10px",
        }}
      >
        Upgrade plan →
      </a>
    </div>
  );
}

function InvoiceRow({
  inv,
  onSelect,
  selected,
}: {
  inv: Invoice;
  onSelect: () => void;
  selected: boolean;
}) {
  const s = STATUS_META[inv.status];
  return (
    <div
      onClick={onSelect}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 100px 90px 80px 80px",
        alignItems: "center",
        gap: "16px",
        padding: "14px 20px",
        borderBottom: "1px solid var(--border)",
        cursor: "pointer",
        background: selected ? "rgba(0,230,118,0.04)" : "transparent",
        transition: "background 0.15s",
        borderLeft: selected
          ? "2px solid var(--green)"
          : "2px solid transparent",
      }}
      onMouseEnter={(e) => {
        if (!selected)
          (e.currentTarget as HTMLElement).style.background =
            "rgba(255,255,255,0.02)";
      }}
      onMouseLeave={(e) => {
        if (!selected)
          (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      <div>
        <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "2px" }}>
          {inv.client}
        </div>
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: "11px",
            color: "var(--text-dim)",
          }}
        >
          {inv.invNum} · {inv.work.slice(0, 38)}
          {inv.work.length > 38 ? "…" : ""}
        </div>
      </div>
      <div style={{ fontWeight: 700, fontSize: "15px" }}>{inv.amount}</div>
      <div
        style={{
          fontFamily: "var(--mono)",
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: s.color,
          background: s.bg,
          padding: "4px 10px",
          borderRadius: "2px",
          textAlign: "center",
        }}
      >
        {s.label}
      </div>
      <div
        style={{
          fontFamily: "var(--mono)",
          fontSize: "11px",
          color: "var(--text-dim)",
        }}
      >
        {inv.emailsSent} sent
      </div>
      <div
        style={{
          fontFamily: "var(--mono)",
          fontSize: "11px",
          color: "var(--text-dim)",
        }}
      >
        {inv.status === "paid" ? fmtDate(inv.paidAt!) : `${inv.daysLate}d late`}
      </div>
    </div>
  );
}

function StatCard({
  num,
  label,
  color,
}: {
  num: string;
  label: string;
  color?: string;
}) {
  return (
    <div
      style={{
        padding: "24px",
        borderRight: "1px solid var(--border)",
        flex: 1,
      }}
    >
      <div
        style={{
          fontSize: "28px",
          fontWeight: 800,
          color: color ?? "var(--text)",
          letterSpacing: "-0.03em",
          marginBottom: "4px",
        }}
      >
        {num}
      </div>
      <div
        style={{
          fontFamily: "var(--mono)",
          fontSize: "11px",
          color: "var(--text-dim)",
          lineHeight: 1.5,
        }}
      >
        {label}
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut } = useClerk();
  const loading = !isLoaded;
  const user = clerkUser
    ? {
        email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
        name:
          clerkUser.firstName ??
          clerkUser.emailAddresses[0]?.emailAddress.split("@")[0] ??
          "User",
        plan: "trial" as const,
        trialEndsAt: new Date(Date.now() + 14 * 86400000).toISOString(),
      }
    : null;
  const router = useRouter();

  // Auth guard
  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading, router]);

  // ── State ──
  const [invoices, setInvoices] = useState<Invoice[]>(SEED_INVOICES);
  const [selectedId, setSelectedId] = useState<string | null>("inv_001");
  const [sidebarView, setSidebarView] = useState<"detail" | "new">("detail");
  const [filter, setFilter] = useState<"all" | InvoiceStatus>("all");

  // New invoice wizard
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [wizardTone, setWizardTone] = useState<Tone>("polite");
  const [wizardInvoice, setWizardInvoice] = useState<Invoice | null>(null);
  const [emailCards, setEmailCards] = useState<EmailCard[]>([]);
  const [generating, setGenerating] = useState(false);
  const [allGenerated, setAllGenerated] = useState(false);
  const [activated, setActivated] = useState(false);
  const [genTitle, setGenTitle] = useState("");
  const [showSpinner, setShowSpinner] = useState(false);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const tlCounter = useRef(0);

  // New invoice field refs
  const fSender = useRef<HTMLInputElement>(null);
  const fSenderEmail = useRef<HTMLInputElement>(null);
  const fClient = useRef<HTMLInputElement>(null);
  const fContact = useRef<HTMLInputElement>(null);
  const fClientEmail = useRef<HTMLInputElement>(null);
  const fInvNum = useRef<HTMLInputElement>(null);
  const fAmount = useRef<HTMLInputElement>(null);
  const fDue = useRef<HTMLInputElement>(null);
  const fWork = useRef<HTMLInputElement>(null);
  const fNotes = useRef<HTMLTextAreaElement>(null);

  // ── Derived stats ──
  const overdueInvoices = invoices.filter((i) => i.status === "overdue");
  const activeInvoices = invoices.filter((i) => i.status === "active");
  const totalOutstanding = [...overdueInvoices, ...activeInvoices].reduce(
    (sum, i) => sum + i.amountNum,
    0,
  );
  const totalCollected = invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + i.amountNum, 0);

  const filteredInvoices =
    filter === "all" ? invoices : invoices.filter((i) => i.status === filter);
  const selectedInvoice = invoices.find((i) => i.id === selectedId) ?? null;

  // ── Timeline ──
  const addEvent = useCallback(
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
    },
    [],
  );

  // ── Wizard step 1 ──
  const completeWizardStep1 = () => {
    const required = [
      fClient,
      fContact,
      fClientEmail,
      fInvNum,
      fAmount,
      fDue,
    ] as React.RefObject<HTMLInputElement>[];
    let ok = true;
    required.forEach((ref) => {
      if (!ref.current?.value.trim()) {
        if (ref.current) ref.current.style.borderColor = "#ff3d3d";
        ok = false;
      } else {
        if (ref.current) ref.current.style.borderColor = "";
      }
    });
    if (!ok) return;
    const due = new Date(fDue.current!.value);
    const diffDays = Math.max(
      0,
      Math.floor((Date.now() - due.getTime()) / 86400000),
    );
    const amountRaw = fAmount.current!.value.replace(/[^0-9.]/g, "");
    const inv: Invoice = {
      id: `inv_${Date.now()}`,
      sender: fSender.current?.value || user?.name || "You",
      senderEmail: fSenderEmail.current?.value || user?.email || "",
      client: fClient.current!.value,
      contact: fContact.current!.value,
      clientEmail: fClientEmail.current!.value,
      invNum: fInvNum.current!.value,
      amount: fAmount.current!.value,
      amountNum: parseFloat(amountRaw) || 0,
      due: fDue.current!.value,
      daysLate: diffDays || 0,
      work: fWork.current?.value || "",
      notes: fNotes.current?.value || "",
      status: "draft",
      tone: wizardTone,
      emailsSent: 0,
      createdAt: new Date().toISOString().slice(0, 10),
    } as unknown as Invoice;
    setWizardInvoice(inv);
    setWizardStep(2);
  };

  // ── Wizard step 3: generate ──
  const startGeneration = useCallback(async () => {
    if (generating || !wizardInvoice) return;
    setGenerating(true);
    setAllGenerated(false);
    setActivated(false);
    setEmailCards([]);
    setTimeline([]);
    setGenTitle(`Generating sequence for ${wizardInvoice.contact}…`);
    setShowSpinner(true);

    addEvent(
      "blue",
      "⚡",
      "Autopilot initialised",
      "Analysing invoice data...",
    );
    await sleep(500);
    addEvent(
      "blue",
      "🧠",
      "Claude connected",
      "Generating personalised sequence",
    );

    const sched = toneSchedules[wizardTone];
    for (let i = 0; i < sched.length; i++) {
      const item = sched[i];
      setEmailCards((prev) => [
        ...prev,
        { index: i, item, status: "queued", body: "" },
      ]);
      addEvent("amber", "✍️", `Writing: ${item.label}`, item.day);
      await sleep(300);
      setEmailCards((prev) =>
        prev.map((c) => (c.index === i ? { ...c, status: "generating" } : c)),
      );
      try {
        const text = await generateEmail(
          item,
          i,
          sched.length,
          wizardInvoice,
          wizardTone,
        );
        const chars = text.split("");
        for (let j = 0; j < chars.length; j += 4) {
          const partial = text.slice(0, j + 4);
          setEmailCards((prev) =>
            prev.map((c) => (c.index === i ? { ...c, body: partial } : c)),
          );
          await sleep(14);
        }
        setEmailCards((prev) =>
          prev.map((c) =>
            c.index === i ? { ...c, status: "done", body: text } : c,
          ),
        );
        addEvent("green", "✓", `${item.label} — done`, "Queued for sending");
      } catch {
        setEmailCards((prev) =>
          prev.map((c) =>
            c.index === i
              ? { ...c, status: "error", body: "[Error — please try again]" }
              : c,
          ),
        );
        addEvent("red", "✗", `${item.label} — error`, "Could not generate");
      }
      await sleep(200);
    }

    setShowSpinner(false);
    setGenTitle(`${sched.length} emails ready — review and activate`);
    setGenerating(false);
    setAllGenerated(true);
    addEvent("green", "🎯", "All emails ready", "Awaiting activation");
  }, [generating, wizardInvoice, wizardTone, addEvent]);

  const activateAutopilot = () => {
    if (!wizardInvoice) return;
    const activeInv: Invoice = {
      ...wizardInvoice,
      status: "active",
      tone: wizardTone,
    };
    setInvoices((prev) => [activeInv, ...prev]);
    setSelectedId(activeInv.id);
    setSidebarView("detail");
    setActivated(true);
    addEvent(
      "green",
      "🚀",
      "Autopilot activated!",
      `Sequence live for ${activeInv.client}`,
    );
    toneSchedules[wizardTone].forEach((item, i) => {
      setTimeout(
        () => addEvent("green", "📬", `Scheduled: ${item.label}`, item.day),
        (i + 1) * 400,
      );
    });
    setTimeout(
      () => {
        addEvent(
          "blue",
          "👁",
          "Watching for payment",
          "Will stop on detection",
        );
        // Auto-dismiss after showing success
        setTimeout(() => {
          setWizardStep(1);
          setWizardInvoice(null);
          setEmailCards([]);
          setTimeline([]);
          setAllGenerated(false);
          setActivated(false);
        }, 2000);
      },
      (toneSchedules[wizardTone].length + 1) * 400,
    );
  };

  const markPaid = (id: string) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === id
          ? {
              ...inv,
              status: "paid",
              paidAt: new Date().toISOString().slice(0, 10),
              daysLate: 0,
            }
          : inv,
      ),
    );
  };

  if (loading || !user) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          fontFamily: "var(--mono)",
          color: "var(--text-dim)",
          fontSize: "12px",
        }}
      >
        Loading…
      </div>
    );
  }

  const schedule = toneSchedules[wizardTone];

  return (
    <>
      <style>{dashStyles}</style>

      {/* ── TOP NAV ── */}
      <div className="dash-nav">
        <div className="dash-logo">
          Invoice<span>Chaser</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <TrialBanner user={user} />
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: "11px",
              color: "var(--text-dim)",
            }}
          >
            {user.email}
          </div>
          <button
            onClick={() => signOut({ redirectUrl: "/" })}
            style={{
              fontFamily: "var(--mono)",
              fontSize: "11px",
              color: "var(--text-dim)",
              background: "none",
              border: "1px solid var(--border)",
              padding: "6px 14px",
              borderRadius: "2px",
              cursor: "pointer",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="dash-shell">
        {/* ── LEFT SIDEBAR ── */}
        <div className="dash-sidebar">
          {/* Stats */}
          <div
            style={{ display: "flex", borderBottom: "1px solid var(--border)" }}
          >
            <StatCard
              num={`$${(totalOutstanding / 1000).toFixed(1)}k`}
              label={`Outstanding\n(${overdueInvoices.length + activeInvoices.length} invoices)`}
              color="#ff3d3d"
            />
            <StatCard
              num={`$${(totalCollected / 1000).toFixed(1)}k`}
              label={`Collected\nthis month`}
              color="#00e676"
            />
          </div>

          {/* Filter tabs */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid var(--border)",
              padding: "0 4px",
            }}
          >
            {(["all", "overdue", "active", "paid"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: "10px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  padding: "12px 14px",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  color: filter === f ? "var(--green)" : "var(--text-dim)",
                  borderBottom:
                    filter === f
                      ? "1px solid var(--green)"
                      : "1px solid transparent",
                  marginBottom: "-1px",
                }}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Invoice list header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 100px 90px 80px 80px",
              gap: "16px",
              padding: "10px 20px",
              fontFamily: "var(--mono)",
              fontSize: "9px",
              color: "var(--text-muted)",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <span>Client / Invoice</span>
            <span>Amount</span>
            <span>Status</span>
            <span>Emails</span>
            <span>Date</span>
          </div>

          {/* Invoice list */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {filteredInvoices.length === 0 ? (
              <div
                style={{
                  padding: "40px 20px",
                  textAlign: "center",
                  fontFamily: "var(--mono)",
                  fontSize: "12px",
                  color: "var(--text-muted)",
                }}
              >
                No invoices yet
              </div>
            ) : (
              filteredInvoices.map((inv) => (
                <InvoiceRow
                  key={inv.id}
                  inv={inv}
                  selected={selectedId === inv.id && sidebarView === "detail"}
                  onSelect={() => {
                    setSelectedId(inv.id);
                    setSidebarView("detail");
                  }}
                />
              ))
            )}
          </div>

          {/* New invoice button */}
          <div
            style={{
              padding: "16px 20px",
              borderTop: "1px solid var(--border)",
            }}
          >
            <button
              onClick={() => {
                setSidebarView("new");
                setWizardStep(1);
                setEmailCards([]);
                setAllGenerated(false);
                setActivated(false);
                setTimeline([]);
              }}
              style={{
                width: "100%",
                background: "var(--green)",
                color: "var(--black)",
                fontFamily: "var(--mono)",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                padding: "13px",
                border: "none",
                borderRadius: "2px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              + New invoice
            </button>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="dash-main">
          {/* ─ DETAIL VIEW ─ */}
          {sidebarView === "detail" &&
            selectedInvoice &&
            (() => {
              const inv = selectedInvoice;
              const s = STATUS_META[inv.status];
              return (
                <div style={{ padding: "40px 48px", maxWidth: "800px" }}>
                  {/* Header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      marginBottom: "32px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontFamily: "var(--mono)",
                          fontSize: "10px",
                          color: "var(--text-muted)",
                          letterSpacing: "0.2em",
                          textTransform: "uppercase",
                          marginBottom: "8px",
                        }}
                      >
                        {inv.invNum}
                      </div>
                      <h1
                        style={{
                          fontSize: "28px",
                          fontWeight: 800,
                          letterSpacing: "-0.02em",
                          marginBottom: "6px",
                        }}
                      >
                        {inv.client}
                      </h1>
                      <div
                        style={{
                          fontFamily: "var(--mono)",
                          fontSize: "12px",
                          color: "var(--text-dim)",
                        }}
                      >
                        {inv.work}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: "32px",
                          fontWeight: 800,
                          letterSpacing: "-0.03em",
                          color:
                            inv.status === "paid"
                              ? "var(--green)"
                              : "var(--text)",
                        }}
                      >
                        {inv.amount}
                      </div>
                      <div
                        style={{
                          display: "inline-block",
                          marginTop: "8px",
                          fontFamily: "var(--mono)",
                          fontSize: "10px",
                          fontWeight: 700,
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          color: s.color,
                          background: s.bg,
                          padding: "5px 12px",
                          borderRadius: "2px",
                        }}
                      >
                        {s.label}
                      </div>
                    </div>
                  </div>

                  {/* Meta grid */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "1px",
                      background: "var(--border)",
                      border: "1px solid var(--border)",
                      borderRadius: "3px",
                      overflow: "hidden",
                      marginBottom: "32px",
                    }}
                  >
                    {[
                      ["Contact", `${inv.contact} · ${inv.clientEmail}`],
                      ["Due Date", fmtDate(inv.due)],
                      [
                        "Days Overdue",
                        inv.status === "paid"
                          ? "Paid ✓"
                          : `${inv.daysLate} days`,
                      ],
                      [
                        "Emails Sent",
                        `${inv.emailsSent} reminder${inv.emailsSent !== 1 ? "s" : ""}`,
                      ],
                      [
                        "Tone",
                        inv.tone.charAt(0).toUpperCase() + inv.tone.slice(1),
                      ],
                      ["Created", fmtDate(inv.createdAt)],
                    ].map(([k, v]) => (
                      <div
                        key={k}
                        style={{
                          background: "var(--surface)",
                          padding: "16px 20px",
                        }}
                      >
                        <div
                          style={{
                            fontFamily: "var(--mono)",
                            fontSize: "9px",
                            color: "var(--text-muted)",
                            letterSpacing: "0.2em",
                            textTransform: "uppercase",
                            marginBottom: "6px",
                          }}
                        >
                          {k}
                        </div>
                        <div
                          style={{
                            fontFamily: "var(--mono)",
                            fontSize: "12px",
                            color: "var(--text)",
                          }}
                        >
                          {v}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Notes */}
                  {inv.notes && (
                    <div
                      style={{
                        border: "1px solid var(--border)",
                        borderRadius: "3px",
                        padding: "16px 20px",
                        marginBottom: "32px",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "var(--mono)",
                          fontSize: "9px",
                          color: "var(--text-muted)",
                          letterSpacing: "0.2em",
                          textTransform: "uppercase",
                          marginBottom: "8px",
                        }}
                      >
                        Notes
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--mono)",
                          fontSize: "12px",
                          color: "var(--text-dim)",
                          lineHeight: 1.7,
                        }}
                      >
                        {inv.notes}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {inv.status !== "paid" && (
                    <div style={{ display: "flex", gap: "12px" }}>
                      <button
                        onClick={() => {
                          setSidebarView("new");
                          setWizardStep(3);
                          setWizardInvoice(inv);
                          setWizardTone(inv.tone);
                          setEmailCards([]);
                          setAllGenerated(false);
                          setActivated(false);
                          setTimeline([]);
                          startGeneration();
                        }}
                        style={{
                          background: "var(--green)",
                          color: "var(--black)",
                          fontFamily: "var(--mono)",
                          fontSize: "12px",
                          fontWeight: 700,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          padding: "13px 24px",
                          border: "none",
                          borderRadius: "2px",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        ⚡ Regenerate sequence
                      </button>
                      <button
                        onClick={() => markPaid(inv.id)}
                        style={{
                          background: "transparent",
                          color: "var(--text-dim)",
                          fontFamily: "var(--mono)",
                          fontSize: "12px",
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          padding: "13px 24px",
                          border: "1px solid var(--border)",
                          borderRadius: "2px",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        ✓ Mark as paid
                      </button>
                    </div>
                  )}
                  {inv.status === "paid" && (
                    <div
                      style={{
                        background: "rgba(0,230,118,0.06)",
                        border: "1px solid rgba(0,230,118,0.2)",
                        borderRadius: "3px",
                        padding: "20px 24px",
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                      }}
                    >
                      <span style={{ fontSize: "24px" }}>✅</span>
                      <div>
                        <div style={{ fontWeight: 700, marginBottom: "4px" }}>
                          Invoice settled
                        </div>
                        <div
                          style={{
                            fontFamily: "var(--mono)",
                            fontSize: "11px",
                            color: "var(--text-dim)",
                          }}
                        >
                          Paid on {fmtDate(inv.paidAt!)} · Autopilot stopped
                          automatically
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

          {/* ─ EMPTY STATE ─ */}
          {sidebarView === "detail" && !selectedInvoice && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                gap: "16px",
              }}
            >
              <div style={{ fontSize: "48px" }}>📬</div>
              <div
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: "12px",
                  color: "var(--text-dim)",
                }}
              >
                Select an invoice or create a new one
              </div>
            </div>
          )}

          {/* ─ NEW INVOICE WIZARD ─ */}
          {sidebarView === "new" && (
            <div style={{ padding: "40px 48px", maxWidth: "800px" }}>
              {/* Progress bar */}
              <div
                style={{
                  height: "2px",
                  background: "var(--border)",
                  marginBottom: "32px",
                  borderRadius: "1px",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    background: "var(--green)",
                    borderRadius: "1px",
                    width:
                      wizardStep === 1
                        ? "33%"
                        : wizardStep === 2
                          ? "66%"
                          : "100%",
                    transition: "width 0.5s ease",
                    boxShadow: "0 0 8px rgba(0,230,118,0.6)",
                  }}
                />
              </div>

              {/* Step tabs */}
              <div
                style={{
                  display: "flex",
                  gap: "0",
                  marginBottom: "36px",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                {[
                  ["1", "Invoice details"],
                  ["2", "Tone & schedule"],
                  ["3", "Generate & send"],
                ].map(([n, label], idx) => {
                  const stepN = (idx + 1) as 1 | 2 | 3;
                  const isActive = wizardStep === stepN;
                  const isDone = wizardStep > stepN;
                  return (
                    <div
                      key={n}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "12px 20px 12px 0",
                        fontFamily: "var(--mono)",
                        fontSize: "11px",
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        color: isActive
                          ? "var(--text)"
                          : isDone
                            ? "var(--green)"
                            : "var(--text-muted)",
                        marginRight: "16px",
                      }}
                    >
                      <div
                        style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "9px",
                          fontWeight: 700,
                          flexShrink: 0,
                          background: isActive
                            ? "var(--green)"
                            : isDone
                              ? "rgba(0,230,118,0.15)"
                              : "transparent",
                          color: isActive
                            ? "var(--black)"
                            : isDone
                              ? "var(--green)"
                              : "var(--text-muted)",
                          border: isActive ? "none" : "1px solid currentColor",
                        }}
                      >
                        {isDone ? "✓" : n}
                      </div>
                      {label}
                    </div>
                  );
                })}
              </div>

              {/* ─ WIZARD STEP 1 ─ */}
              {wizardStep === 1 && (
                <>
                  <h2
                    style={{
                      fontSize: "22px",
                      fontWeight: 800,
                      letterSpacing: "-0.02em",
                      marginBottom: "6px",
                    }}
                  >
                    Invoice details
                  </h2>
                  <div
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: "12px",
                      color: "var(--text-dim)",
                      marginBottom: "28px",
                    }}
                  >
                    // All fields are used to personalise the emails
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Your name</label>
                      <input
                        ref={fSender}
                        className="form-input"
                        type="text"
                        defaultValue={user.name}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Your email</label>
                      <input
                        ref={fSenderEmail}
                        className="form-input"
                        type="email"
                        defaultValue={user.email}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Client / Company</label>
                      <input
                        ref={fClient}
                        className="form-input"
                        type="text"
                        placeholder="Acme Corp"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Contact name</label>
                      <input
                        ref={fContact}
                        className="form-input"
                        type="text"
                        placeholder="Sarah Chen"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Client email</label>
                      <input
                        ref={fClientEmail}
                        className="form-input"
                        type="email"
                        placeholder="billing@acmecorp.com"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Invoice number</label>
                      <input
                        ref={fInvNum}
                        className="form-input"
                        type="text"
                        placeholder="INV-2301"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Amount</label>
                      <input
                        ref={fAmount}
                        className="form-input"
                        type="text"
                        placeholder="$12,500"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Due date</label>
                      <input ref={fDue} className="form-input" type="date" />
                    </div>
                    <div className="form-group full">
                      <label className="form-label">
                        Work / services rendered
                      </label>
                      <input
                        ref={fWork}
                        className="form-input"
                        type="text"
                        placeholder="Brand identity redesign"
                      />
                    </div>
                    <div className="form-group full">
                      <label className="form-label">Context (optional)</label>
                      <textarea
                        ref={fNotes}
                        className="form-textarea"
                        placeholder="Any relevant background for the emails…"
                      />
                    </div>
                  </div>
                  <div
                    style={{ display: "flex", gap: "12px", marginTop: "28px" }}
                  >
                    <button
                      onClick={completeWizardStep1}
                      className="dash-btn-primary"
                    >
                      Continue →
                    </button>
                    <button
                      onClick={() => setSidebarView("detail")}
                      className="dash-btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}

              {/* ─ WIZARD STEP 2 ─ */}
              {wizardStep === 2 && (
                <>
                  <h2
                    style={{
                      fontSize: "22px",
                      fontWeight: 800,
                      letterSpacing: "-0.02em",
                      marginBottom: "6px",
                    }}
                  >
                    Tone &amp; schedule
                  </h2>
                  <div
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: "12px",
                      color: "var(--text-dim)",
                      marginBottom: "28px",
                    }}
                  >
                    // Choose how assertive you want to get
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3,1fr)",
                      gap: "12px",
                      marginBottom: "28px",
                    }}
                  >
                    {(["polite", "firm", "final"] as Tone[]).map((t) => {
                      const cls =
                        wizardTone === t
                          ? t === "polite"
                            ? "tone-selected-g"
                            : t === "firm"
                              ? "tone-selected-a"
                              : "tone-selected-r"
                          : "";
                      return (
                        <div
                          key={t}
                          className={`tone-opt ${cls}`}
                          onClick={() => setWizardTone(t)}
                        >
                          <div
                            style={{ fontSize: "20px", marginBottom: "8px" }}
                          >
                            {t === "polite" ? "🤝" : t === "firm" ? "📋" : "⚡"}
                          </div>
                          <div
                            style={{
                              fontWeight: 800,
                              fontSize: "13px",
                              marginBottom: "4px",
                            }}
                          >
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                          </div>
                          <div
                            style={{
                              fontFamily: "var(--mono)",
                              fontSize: "10px",
                              color: "var(--text-dim)",
                              lineHeight: 1.5,
                            }}
                          >
                            {t === "polite" &&
                              "Warm & professional. Great for long-term clients."}
                            {t === "firm" &&
                              "Direct. No fluff. Gets the message without burning bridges."}
                            {t === "final" &&
                              "Non-negotiable. Last step before escalation."}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: "10px",
                      color: "var(--text-dim)",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      marginBottom: "12px",
                    }}
                  >
                    Reminder schedule
                  </div>
                  {schedule.map((item, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: "3px",
                        padding: "12px 16px",
                        marginBottom: "8px",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "var(--mono)",
                          fontSize: "10px",
                          fontWeight: 700,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          padding: "4px 10px",
                          borderRadius: "2px",
                          background: item.bg,
                          color: item.color,
                          flexShrink: 0,
                        }}
                      >
                        {item.day}
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--mono)",
                          fontSize: "12px",
                          flex: 1,
                        }}
                      >
                        {item.label}
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--mono)",
                          fontSize: "9px",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          padding: "3px 8px",
                          borderRadius: "2px",
                          background: item.bg,
                          color: item.color,
                        }}
                      >
                        {item.tone}
                      </div>
                    </div>
                  ))}

                  <div
                    style={{ display: "flex", gap: "12px", marginTop: "28px" }}
                  >
                    <button
                      onClick={() => {
                        setWizardStep(3);
                        if (!allGenerated) startGeneration();
                      }}
                      className="dash-btn-primary"
                    >
                      Generate sequence →
                    </button>
                    <button
                      onClick={() => setWizardStep(1)}
                      className="dash-btn-secondary"
                    >
                      ← Back
                    </button>
                  </div>
                </>
              )}

              {/* ─ WIZARD STEP 3 ─ */}
              {wizardStep === 3 && (
                <>
                  {/* Status bar */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "3px",
                      padding: "16px 20px",
                      marginBottom: "28px",
                    }}
                  >
                    <span style={{ fontSize: "18px" }}>⚡</span>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 800,
                          marginBottom: "3px",
                        }}
                      >
                        {genTitle || "Ready to generate…"}
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--mono)",
                          fontSize: "11px",
                          color: "var(--text-dim)",
                        }}
                      >
                        {wizardInvoice?.client} · {wizardInvoice?.invNum}
                      </div>
                    </div>
                    {showSpinner && <div className="spinner" />}
                  </div>

                  {/* Email cards */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "14px",
                      marginBottom: "28px",
                    }}
                  >
                    {emailCards.map((card) => {
                      const borderCol =
                        card.status === "generating"
                          ? "rgba(77,158,255,0.4)"
                          : card.status === "done"
                            ? "rgba(0,230,118,0.3)"
                            : "var(--border)";
                      return (
                        <div
                          key={card.index}
                          style={{
                            border: `1px solid ${borderCol}`,
                            borderRadius: "3px",
                            overflow: "hidden",
                            transition: "border-color 0.3s",
                          }}
                        >
                          <div
                            style={{
                              background: "var(--surface2)",
                              padding: "11px 16px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              borderBottom: "1px solid var(--border)",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                              }}
                            >
                              <div
                                style={{
                                  fontFamily: "var(--mono)",
                                  fontSize: "10px",
                                  fontWeight: 700,
                                  letterSpacing: "0.1em",
                                  textTransform: "uppercase",
                                  padding: "3px 9px",
                                  borderRadius: "2px",
                                  background: card.item.bg,
                                  color: card.item.color,
                                }}
                              >
                                {card.item.day}
                              </div>
                              <div
                                style={{
                                  fontFamily: "var(--mono)",
                                  fontSize: "10px",
                                  letterSpacing: "0.1em",
                                  textTransform: "uppercase",
                                  color: "var(--text-dim)",
                                }}
                              >
                                {card.item.label}
                              </div>
                            </div>
                            <div
                              style={{
                                fontFamily: "var(--mono)",
                                fontSize: "10px",
                                letterSpacing: "0.1em",
                                textTransform: "uppercase",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              {card.status === "generating" && (
                                <>
                                  <div className="spinner" />
                                  <span style={{ color: "#4d9eff" }}>
                                    Writing…
                                  </span>
                                </>
                              )}
                              {card.status === "done" && (
                                <span style={{ color: "var(--green)" }}>
                                  ✓ Ready
                                </span>
                              )}
                              {card.status === "queued" && (
                                <span style={{ color: "var(--text-muted)" }}>
                                  Queued
                                </span>
                              )}
                              {card.status === "error" && (
                                <span style={{ color: "var(--red)" }}>
                                  ✗ Error
                                </span>
                              )}
                            </div>
                          </div>
                          <div
                            style={{
                              padding: "16px",
                              fontFamily: "var(--mono)",
                              fontSize: "12px",
                              color: "var(--text-dim)",
                              lineHeight: 1.75,
                              minHeight: "56px",
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {card.status === "queued" ? (
                              [85, 70, 90, 55].map((w, i) => (
                                <div
                                  key={i}
                                  className="skel-line"
                                  style={{ width: `${w}%` }}
                                />
                              ))
                            ) : editingIndex === card.index ? (
                              <textarea
                                className="edit-ta"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                rows={7}
                              />
                            ) : (
                              card.body
                            )}
                          </div>
                          {card.status === "done" && (
                            <div
                              style={{
                                padding: "10px 16px",
                                borderTop: "1px solid var(--border)",
                                display: "flex",
                                gap: "8px",
                                alignItems: "center",
                              }}
                            >
                              <button
                                className="dash-btn-sm"
                                onClick={() => {
                                  if (editingIndex === card.index) {
                                    setEmailCards((prev) =>
                                      prev.map((c) =>
                                        c.index === card.index
                                          ? { ...c, body: editValue }
                                          : c,
                                      ),
                                    );
                                    setEditingIndex(null);
                                  } else {
                                    setEditValue(card.body);
                                    setEditingIndex(card.index);
                                  }
                                }}
                              >
                                {editingIndex === card.index
                                  ? "✓ Save"
                                  : "✏ Edit"}
                              </button>
                              <button
                                className="dash-btn-sm"
                                onClick={() =>
                                  navigator.clipboard.writeText(card.body)
                                }
                              >
                                ⎘ Copy
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Timeline */}
                  {timeline.length > 0 && (
                    <div
                      style={{
                        border: "1px solid var(--border)",
                        borderRadius: "3px",
                        overflow: "hidden",
                        marginBottom: "28px",
                      }}
                    >
                      <div
                        style={{
                          padding: "10px 16px",
                          borderBottom: "1px solid var(--border)",
                          fontFamily: "var(--mono)",
                          fontSize: "9px",
                          color: "var(--text-muted)",
                          letterSpacing: "0.2em",
                          textTransform: "uppercase",
                        }}
                      >
                        // System activity
                      </div>
                      <div
                        style={{
                          maxHeight: "200px",
                          overflowY: "auto",
                          padding: "12px 16px",
                        }}
                      >
                        {timeline.map((ev) => {
                          const c = tlColors[ev.colorKey];
                          return (
                            <div
                              key={ev.id}
                              style={{
                                display: "flex",
                                gap: "10px",
                                marginBottom: "10px",
                                alignItems: "flex-start",
                              }}
                            >
                              <div
                                style={{
                                  width: "22px",
                                  height: "22px",
                                  borderRadius: "50%",
                                  flexShrink: 0,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "11px",
                                  background: c.bg,
                                  color: c.color,
                                }}
                              >
                                {ev.icon}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div
                                  style={{
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    marginBottom: "1px",
                                  }}
                                >
                                  {ev.label}
                                </div>
                                <div
                                  style={{
                                    fontFamily: "var(--mono)",
                                    fontSize: "10px",
                                    color: "var(--text-dim)",
                                  }}
                                >
                                  {ev.sub} · {ev.time}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {allGenerated && !activated && (
                    <div style={{ display: "flex", gap: "12px" }}>
                      <button
                        onClick={activateAutopilot}
                        className="dash-btn-primary"
                      >
                        ⚡ Activate autopilot
                      </button>
                      <button
                        onClick={() => setWizardStep(2)}
                        className="dash-btn-secondary"
                      >
                        ← Adjust schedule
                      </button>
                    </div>
                  )}

                  {activated && (
                    <div
                      style={{
                        background: "rgba(0,230,118,0.06)",
                        border: "1px solid rgba(0,230,118,0.2)",
                        borderRadius: "3px",
                        padding: "20px 24px",
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                      }}
                    >
                      <span style={{ fontSize: "24px" }}>✅</span>
                      <div>
                        <div style={{ fontWeight: 700, marginBottom: "4px" }}>
                          Autopilot activated!
                        </div>
                        <div
                          style={{
                            fontFamily: "var(--mono)",
                            fontSize: "11px",
                            color: "var(--text-dim)",
                          }}
                        >
                          Your sequence is live. Returning to dashboard…
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── SCOPED STYLES ─────────────────────────────────────────────────────────────

const dashStyles = `
  .dash-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 200;
    height: 56px; display: flex; align-items: center; justify-content: space-between;
    padding: 0 24px; border-bottom: 1px solid var(--border);
    background: rgba(10,10,10,0.95); backdrop-filter: blur(16px);
  }
  .dash-logo {
    font-family: var(--mono); font-size: 13px; font-weight: 700;
    letter-spacing: 0.08em; color: var(--green); text-transform: uppercase;
  }
  .dash-logo span { color: var(--text-dim); }

  .dash-shell {
    display: grid; grid-template-columns: 480px 1fr;
    height: 100vh; padding-top: 56px;
  }

  .dash-sidebar {
    border-right: 1px solid var(--border); background: var(--surface);
    display: flex; flex-direction: column; overflow: hidden;
  }

  .dash-main { overflow-y: auto; }

  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 8px; }
  .form-group { display: flex; flex-direction: column; gap: 6px; }
  .form-group.full { grid-column: 1 / -1; }
  .form-label { font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-dim); }
  .form-input, .form-textarea {
    background: var(--black); border: 1px solid var(--border);
    color: var(--text); font-family: var(--mono); font-size: 12px;
    padding: 10px 12px; border-radius: 2px; outline: none; transition: border-color 0.2s; width: 100%;
  }
  .form-input:focus, .form-textarea:focus { border-color: var(--green); }
  .form-textarea { resize: vertical; min-height: 72px; line-height: 1.6; }

  .tone-opt { border: 1px solid var(--border); border-radius: 3px; padding: 16px; cursor: pointer; transition: all 0.2s; }
  .tone-opt:hover { border-color: #2e2e2e; background: var(--surface); }
  .tone-selected-g { border-color: var(--green) !important; background: rgba(0,230,118,0.06) !important; }
  .tone-selected-a { border-color: var(--amber) !important; background: rgba(255,179,0,0.06) !important; }
  .tone-selected-r { border-color: var(--red) !important; background: rgba(255,61,61,0.06) !important; }

  .dash-btn-primary { display: inline-flex; align-items: center; gap: 8px; background: var(--green); color: var(--black); font-family: var(--mono); font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; padding: 13px 24px; border-radius: 2px; border: none; cursor: pointer; transition: all 0.2s; }
  .dash-btn-primary:hover { background: #1fffaa; transform: translateY(-1px); }
  .dash-btn-secondary { display: inline-flex; align-items: center; background: transparent; color: var(--text-dim); font-family: var(--mono); font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; padding: 13px 20px; border-radius: 2px; border: 1px solid var(--border); cursor: pointer; transition: all 0.2s; }
  .dash-btn-secondary:hover { color: var(--text); border-color: #2e2e2e; }
  .dash-btn-sm { font-family: var(--mono); font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; padding: 6px 12px; border-radius: 2px; border: 1px solid var(--border); background: var(--surface2); color: var(--text-dim); cursor: pointer; transition: all 0.2s; }
  .dash-btn-sm:hover { color: var(--text); }

  .skel-line { height: 10px; border-radius: 2px; background: linear-gradient(90deg, #161616 25%, #2e2e2e 50%, #161616 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; margin-bottom: 7px; }
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

  .spinner { width: 14px; height: 14px; border: 2px solid rgba(77,158,255,0.3); border-top-color: #4d9eff; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; flex-shrink: 0; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .edit-ta { width: 100%; background: var(--surface2); border: none; color: var(--text); font-family: var(--mono); font-size: 12px; padding: 0; line-height: 1.75; resize: none; outline: none; }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #2e2e2e; border-radius: 2px; }

  @media (max-width: 1100px) {
    .dash-shell { grid-template-columns: 360px 1fr; }
  }
  @media (max-width: 800px) {
    .dash-shell { grid-template-columns: 1fr; }
    .dash-sidebar { height: 50vh; }
    .form-grid { grid-template-columns: 1fr; }
  }
`;
