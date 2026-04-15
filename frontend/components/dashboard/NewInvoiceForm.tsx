"use client";

import { useMemo, useState } from "react";

import type { ApiInvoice, CreateInvoiceInput, InvoiceTone } from "@/lib/api/types";

import {
  buildCreateInvoiceInput,
  defaultIntervalsForTone,
  type InvoiceFormValues,
} from "./view-models";

interface NewInvoiceFormProps {
  onCancel: () => void;
  onCreate: (input: CreateInvoiceInput) => Promise<ApiInvoice>;
}

const initialValues: InvoiceFormValues = {
  amount: "",
  clientContact: "",
  clientEmail: "",
  clientName: "",
  description: "",
  dueDate: "",
  invoiceNumber: "",
  notes: "",
  startSequence: true,
  tone: "polite",
};

const FIELD = "bg-white/[0.03] border border-border-default rounded-md text-text px-3.5 py-3 w-full";
const BTN_PRIMARY = "inline-flex items-center gap-2.5 bg-green text-black font-mono text-[13px] font-bold tracking-[0.05em] uppercase px-8 py-4 rounded-[2px] transition-all hover:bg-[#1fffaa] hover:-translate-y-px hover:shadow-[0_8px_32px_rgba(0,230,118,0.3)] border-none cursor-pointer";
const BTN_GHOST = "inline-flex items-center gap-2 text-text-dim font-mono text-xs tracking-[0.08em] uppercase hover:text-text transition-colors py-4 bg-transparent border-none cursor-pointer";

export default function NewInvoiceForm({
  onCancel,
  onCreate,
}: NewInvoiceFormProps) {
  const [values, setValues] = useState<InvoiceFormValues>(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const sequenceSummary = useMemo(
    () => defaultIntervalsForTone(values.tone).join(", "),
    [values.tone],
  );

  function updateField<Key extends keyof InvoiceFormValues>(
    key: Key,
    value: InvoiceFormValues[Key],
  ) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await onCreate(buildCreateInvoiceInput(values));
      setValues(initialValues);
    } catch (nextError) {
      const message =
        nextError instanceof Error
          ? nextError.message
          : "Could not create invoice.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  const toneOptions: InvoiceTone[] = ["polite", "firm", "final"];

  return (
    <section className="rounded-lg border border-border-default bg-white/[0.02] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="m-0 text-xl">Create invoice</h2>
          <p className="mt-2 text-text-dim">
            Create the invoice and optionally activate the reminder sequence in
            one backend request.
          </p>
        </div>
        <button className={BTN_GHOST} onClick={onCancel} type="button">
          Cancel
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3.5"
      >
        <Input
          label="Invoice number"
          onChange={(value) => updateField("invoiceNumber", value)}
          required
          value={values.invoiceNumber}
        />
        <Input
          label="Client name"
          onChange={(value) => updateField("clientName", value)}
          required
          value={values.clientName}
        />
        <Input
          label="Client email"
          onChange={(value) => updateField("clientEmail", value)}
          required
          type="email"
          value={values.clientEmail}
        />
        <Input
          label="Client contact"
          onChange={(value) => updateField("clientContact", value)}
          value={values.clientContact}
        />
        <Input
          label="Amount (ZAR)"
          onChange={(value) => updateField("amount", value)}
          required
          step="0.01"
          type="number"
          value={values.amount}
        />
        <Input
          label="Due date"
          onChange={(value) => updateField("dueDate", value)}
          required
          type="date"
          value={values.dueDate}
        />

        <TextArea
          label="Description"
          onChange={(value) => updateField("description", value)}
          value={values.description}
        />
        <TextArea
          label="Notes"
          onChange={(value) => updateField("notes", value)}
          value={values.notes}
        />

        <div className="col-span-[1_/_-1] rounded-md border border-border-default p-3.5">
          <label className="mb-3 flex items-center gap-2.5">
            <input
              checked={values.startSequence}
              onChange={(event) =>
                updateField("startSequence", event.target.checked)
              }
              type="checkbox"
            />
            <span>Start reminder sequence immediately</span>
          </label>

          <div className="flex flex-wrap items-center gap-2.5">
            {toneOptions.map((tone) => (
              <button
                key={tone}
                disabled={!values.startSequence}
                onClick={() => updateField("tone", tone)}
                className={`${tone === values.tone ? "bg-green text-black" : "bg-transparent text-text"} border border-border-default rounded-full cursor-pointer px-3 py-2 uppercase ${values.startSequence ? "opacity-100" : "opacity-40"}`}
                type="button"
              >
                {tone}
              </button>
            ))}
          </div>

          {values.startSequence ? (
            <p className="mt-3 text-text-dim">
              Reminder intervals for <strong>{values.tone}</strong>:{" "}
              {sequenceSummary} days after due date.
            </p>
          ) : null}
        </div>

        {error ? (
          <p className="col-span-[1_/_-1] m-0 text-red">
            {error}
          </p>
        ) : null}

        <div className="col-span-[1_/_-1] flex items-center justify-end gap-3">
          <button className={BTN_GHOST} onClick={onCancel} type="button">
            Cancel
          </button>
          <button className={BTN_PRIMARY} disabled={submitting} type="submit">
            <span>{submitting ? "Creating..." : "Create invoice"}</span>
            <span>→</span>
          </button>
        </div>
      </form>
    </section>
  );
}

interface InputProps {
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  step?: string;
  type?: string;
  value: string;
}

function Input({
  label,
  onChange,
  required,
  step,
  type = "text",
  value,
}: InputProps) {
  return (
    <label className="grid gap-2">
      <span className="text-sm text-text-dim">{label}</span>
      <input
        onChange={(event) => onChange(event.target.value)}
        required={required}
        step={step}
        className={FIELD}
        type={type}
        value={value}
      />
    </label>
  );
}

function TextArea({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="col-span-[1_/_-1] grid gap-2">
      <span className="text-sm text-text-dim">{label}</span>
      <textarea
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        className={FIELD}
        value={value}
      />
    </label>
  );
}