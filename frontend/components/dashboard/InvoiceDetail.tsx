"use client";

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

const FIELD = "bg-white/[0.03] border border-border-default rounded-md text-text px-3.5 py-3 w-full";
const BTN_PRIMARY = "inline-flex items-center gap-2.5 bg-green text-black font-mono text-[13px] font-bold tracking-[0.05em] uppercase px-8 py-4 rounded-[2px] transition-all hover:bg-[#1fffaa] hover:-translate-y-px hover:shadow-[0_8px_32px_rgba(0,230,118,0.3)] border-none cursor-pointer";
const BTN_GHOST = "inline-flex items-center gap-2 text-text-dim font-mono text-xs tracking-[0.08em] uppercase hover:text-text transition-colors py-4 bg-transparent border-none cursor-pointer";

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
      <section className="min-h-[320px] rounded-lg border border-border-default bg-white/[0.02] p-5">
        <h2 className="mt-0">Invoice detail</h2>
        <p className="text-text-dim">
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
    <section className="grid gap-5 rounded-lg border border-border-default bg-white/[0.02] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="m-0">{invoice.client_name}</h2>
          <p className="mt-2 text-text-dim">
            {invoice.invoice_number} · {formatCurrency(invoice.amount_cents)}
          </p>
        </div>
        {invoice.status !== "paid" ? (
          <button
            className={BTN_PRIMARY}
            disabled={markingPaid}
            onClick={() => void handleMarkPaid()}
            type="button"
          >
            <span>{markingPaid ? "Updating..." : "Mark pay"}</span>
            <span>✓</span>
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-2.5">
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

      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5">
        <section className="rounded-lg border border-border-default p-4">
          <h3 className="mt-0">Reminder sequence</h3>
          <p className="text-text-dim">
            {sequence
              ? "Update the active reminder cadence for this invoice."
              : canManageSequence
                ? "No sequence exists yet for this invoice."
                : "Draft invoices need to be created with a sequence in one step under the current backend contract."}
          </p>

          <label className="mb-3 grid gap-2">
            <span className="text-text-dim">Tone</span>
            <select
              onChange={(event) =>
                setSequenceTone(event.target.value as InvoiceTone)
              }
              className={FIELD}
              value={sequenceTone}
            >
              <option value="polite">polite</option>
              <option value="firm">firm</option>
              <option value="final">final</option>
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-text-dim">
              Intervals after due date
            </span>
            <input
              onChange={(event) => setIntervalText(event.target.value)}
              className={FIELD}
              value={intervalText}
            />
          </label>

          {sequenceError ? (
            <p className="mb-0 text-red">
              {sequenceError}
            </p>
          ) : null}

          <button
            className={`${BTN_PRIMARY} mt-3.5`}
            disabled={!canManageSequence || sequenceLoading || sequenceSubmitting}
            onClick={() => void handleSequenceSubmit()}
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

          <div className="mt-[18px] grid gap-2.5">
            {sequenceLoading ? (
              <p className="m-0 text-text-dim">
                Loading sequence...
              </p>
            ) : sequence?.reminders.length ? (
              sequence.reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="rounded-md border border-border-default bg-white/[0.02] p-3"
                >
                  <div className="mb-2 flex justify-between">
                    <strong>Reminder {reminder.sequence_position}</strong>
                    <span className="text-text-dim">
                      {reminder.status}
                    </span>
                  </div>
                  <p className="mb-3 text-text-dim">
                    Scheduled {formatDate(reminder.scheduled_for)}
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      className={BTN_GHOST}
                      onClick={() => void onSendNow(reminder.id)}
                      type="button"
                    >
                      Send now
                    </button>
                    <button
                      className={BTN_GHOST}
                      onClick={() => void onRegenerate(reminder.id)}
                      type="button"
                    >
                      Regenerate
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="m-0 text-text-dim">
                No reminders scheduled yet.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-border-default p-4">
          <h3 className="mt-0">Event log</h3>
          <p className="text-text-dim">
            Delivery and tracking events from the backend audit log.
          </p>

          {eventsLoading ? (
            <p className="m-0 text-text-dim">
              Loading events...
            </p>
          ) : events.length ? (
            <div className="grid gap-2.5">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="border-b border-border-default pb-2.5"
                >
                  <div className="mb-1.5 flex justify-between">
                    <strong>{event.event_type}</strong>
                    <span className="text-xs text-text-dim">
                      {formatDate(event.occurred_at)}
                    </span>
                  </div>
                  <pre className="m-0 overflow-x-auto whitespace-pre-wrap font-mono text-xs text-text-dim">
                    {JSON.stringify(event.metadata ?? {}, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          ) : (
            <p className="m-0 text-text-dim">
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
    <div className="rounded-lg border border-border-default bg-white/[0.02] p-3.5">
      <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.1em] text-text-dim">
        {label}
      </div>
      <div>{value}</div>
    </div>
  );
}