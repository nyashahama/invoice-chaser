"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";

import type {
  ApiInvoice,
  InvoiceEvent,
  InvoiceTone,
  ReminderSequence,
} from "@/lib/api/types";

import { formatCurrency, formatDate } from "./view-models";

interface InvoiceDetailProps {
  events: InvoiceEvent[];
  eventsLoading: boolean;
  invoice: ApiInvoice | null;
  onCreateSequence: (input: {
    interval_days: number[];
    tone: InvoiceTone;
  }) => Promise<void>;
  onMarkPaid: () => Promise<void>;
  onRegenerate: (reminderId: string) => Promise<void>;
  onSendNow: (reminderId: string) => Promise<void>;
  onUpdateSequence: (input: {
    interval_days: number[];
    tone: InvoiceTone;
  }) => Promise<void>;
  sequence: ReminderSequence | null;
  sequenceLoading: boolean;
}

export default function InvoiceDetail({
  events,
  eventsLoading,
  invoice,
  onCreateSequence,
  onMarkPaid,
  onRegenerate,
  onSendNow,
  onUpdateSequence,
  sequence,
  sequenceLoading,
}: InvoiceDetailProps) {
  const [intervalText, setIntervalText] = useState("");
  const [sequenceTone, setSequenceTone] = useState<InvoiceTone>("polite");
  const [sequenceError, setSequenceError] = useState<string | null>(null);
  const [sequenceSubmitting, setSequenceSubmitting] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);

  useEffect(() => {
    if (!sequence) {
      setSequenceTone("polite");
      setIntervalText("1,5,14,30");
      return;
    }

    setSequenceTone(sequence.tone);
    setIntervalText(sequence.interval_days.join(","));
  }, [sequence]);

  const parsedIntervals = useMemo(
    () =>
      intervalText
        .split(",")
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isFinite(value) && value > 0),
    [intervalText],
  );

  if (!invoice) {
    return (
      <section
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          minHeight: "320px",
          padding: "20px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Invoice detail</h2>
        <p style={{ color: "var(--text-dim)" }}>
          Select an invoice to inspect its reminder sequence, delivery events,
          and payment state.
        </p>
      </section>
    );
  }

  const canManageSequence = sequence !== null || invoice.status !== "draft";

  async function handleSequenceSubmit() {
    setSequenceError(null);
    setSequenceSubmitting(true);

    if (parsedIntervals.length === 0) {
      setSequenceError("Enter at least one positive interval day.");
      setSequenceSubmitting(false);
      return;
    }

    try {
      if (sequence) {
        await onUpdateSequence({
          interval_days: parsedIntervals,
          tone: sequenceTone,
        });
      } else {
        await onCreateSequence({
          interval_days: parsedIntervals,
          tone: sequenceTone,
        });
      }
    } catch (error) {
      setSequenceError(
        error instanceof Error ? error.message : "Could not save sequence.",
      );
    } finally {
      setSequenceSubmitting(false);
    }
  }

  async function handleMarkPaid() {
    setMarkingPaid(true);

    try {
      await onMarkPaid();
    } finally {
      setMarkingPaid(false);
    }
  }

  return (
    <section
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        display: "grid",
        gap: "20px",
        padding: "20px",
      }}
    >
      <div
        style={{
          alignItems: "flex-start",
          display: "flex",
          flexWrap: "wrap",
          gap: "16px",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>{invoice.client_name}</h2>
          <p style={{ color: "var(--text-dim)", margin: "8px 0 0" }}>
            {invoice.invoice_number} · {formatCurrency(invoice.amount_cents)}
          </p>
        </div>
        {invoice.status !== "paid" ? (
          <button
            className="btn-primary"
            disabled={markingPaid}
            onClick={() => void handleMarkPaid()}
            type="button"
          >
            <span>{markingPaid ? "Updating..." : "Mark paid"}</span>
            <span>✓</span>
          </button>
        ) : null}
      </div>

      <div
        style={{
          display: "grid",
          gap: "10px",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        }}
      >
        <Meta label="Client email" value={invoice.client_email} />
        <Meta label="Client contact" value={invoice.client_contact || "Not set"} />
        <Meta label="Due date" value={formatDate(invoice.due_date)} />
        <Meta label="Status" value={invoice.status} />
        <Meta
          label="Amount"
          value={formatCurrency(invoice.amount_cents, invoice.currency)}
        />
        <Meta
          label="Days overdue"
          value={String(invoice.days_overdue ?? 0)}
        />
      </div>

      <div
        style={{
          display: "grid",
          gap: "20px",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        }}
      >
        <section
          style={{
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "16px",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Reminder sequence</h3>
          <p style={{ color: "var(--text-dim)" }}>
            {sequence
              ? "Update the active reminder cadence for this invoice."
              : canManageSequence
                ? "No sequence exists yet for this invoice."
                : "Draft invoices need to be created with a sequence in one step under the current backend contract."}
          </p>

          <label style={{ display: "grid", gap: "8px", marginBottom: "12px" }}>
            <span style={{ color: "var(--text-dim)" }}>Tone</span>
            <select
              onChange={(event) =>
                setSequenceTone(event.target.value as InvoiceTone)
              }
              style={fieldStyle}
              value={sequenceTone}
            >
              <option value="polite">polite</option>
              <option value="firm">firm</option>
              <option value="final">final</option>
            </select>
          </label>

          <label style={{ display: "grid", gap: "8px" }}>
            <span style={{ color: "var(--text-dim)" }}>
              Intervals after due date
            </span>
            <input
              onChange={(event) => setIntervalText(event.target.value)}
              style={fieldStyle}
              value={intervalText}
            />
          </label>

          {sequenceError ? (
            <p style={{ color: "var(--red)", marginBottom: 0 }}>
              {sequenceError}
            </p>
          ) : null}

          <button
            className="btn-primary"
            disabled={!canManageSequence || sequenceLoading || sequenceSubmitting}
            onClick={() => void handleSequenceSubmit()}
            style={{ marginTop: "14px" }}
            type="button"
          >
            <span>
              {sequenceSubmitting
                ? "Saving..."
                : sequence
                  ? "Update sequence"
                  : "Create sequence"}
            </span>
            <span>→</span>
          </button>

          <div style={{ display: "grid", gap: "10px", marginTop: "18px" }}>
            {sequenceLoading ? (
              <p style={{ color: "var(--text-dim)", margin: 0 }}>
                Loading sequence...
              </p>
            ) : sequence?.reminders.length ? (
              sequence.reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid var(--border)",
                    borderRadius: "6px",
                    padding: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                    }}
                  >
                    <strong>Reminder {reminder.sequence_position}</strong>
                    <span style={{ color: "var(--text-dim)" }}>
                      {reminder.status}
                    </span>
                  </div>
                  <p style={{ color: "var(--text-dim)", margin: "0 0 12px" }}>
                    Scheduled {formatDate(reminder.scheduled_for)}
                  </p>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <button
                      className="btn-ghost"
                      onClick={() => void onSendNow(reminder.id)}
                      type="button"
                    >
                      Send now
                    </button>
                    <button
                      className="btn-ghost"
                      onClick={() => void onRegenerate(reminder.id)}
                      type="button"
                    >
                      Regenerate
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: "var(--text-dim)", margin: 0 }}>
                No reminders scheduled yet.
              </p>
            )}
          </div>
        </section>

        <section
          style={{
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "16px",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Event log</h3>
          <p style={{ color: "var(--text-dim)" }}>
            Delivery and tracking events from the backend audit log.
          </p>

          {eventsLoading ? (
            <p style={{ color: "var(--text-dim)", margin: 0 }}>
              Loading events...
            </p>
          ) : events.length ? (
            <div style={{ display: "grid", gap: "10px" }}>
              {events.map((event) => (
                <div
                  key={event.id}
                  style={{
                    borderBottom: "1px solid var(--border)",
                    paddingBottom: "10px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "6px",
                    }}
                  >
                    <strong>{event.event_type}</strong>
                    <span style={{ color: "var(--text-dim)", fontSize: "12px" }}>
                      {formatDate(event.occurred_at)}
                    </span>
                  </div>
                  <pre
                    style={{
                      color: "var(--text-dim)",
                      fontFamily: "var(--mono)",
                      fontSize: "12px",
                      margin: 0,
                      overflowX: "auto",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {JSON.stringify(event.metadata ?? {}, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "var(--text-dim)", margin: 0 }}>
              No reminder events recorded yet.
            </p>
          )}
        </section>
      </div>
    </section>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "14px",
      }}
    >
      <div
        style={{
          color: "var(--text-dim)",
          fontFamily: "var(--mono)",
          fontSize: "11px",
          marginBottom: "8px",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div>{value}</div>
    </div>
  );
}

const fieldStyle = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid var(--border)",
  borderRadius: "6px",
  color: "var(--text)",
  padding: "12px 14px",
  width: "100%",
} satisfies CSSProperties;
