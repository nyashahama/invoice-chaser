"use client";

import type { CSSProperties } from "react";
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
    <section
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "20px",
      }}
    >
      <div
        style={{
          alignItems: "center",
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "16px",
        }}
      >
        <div>
          <h2 style={{ fontSize: "20px", margin: 0 }}>Create invoice</h2>
          <p style={{ color: "var(--text-dim)", margin: "8px 0 0" }}>
            Create the invoice and optionally activate the reminder sequence in
            one backend request.
          </p>
        </div>
        <button className="btn-ghost" onClick={onCancel} type="button">
          Cancel
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "grid",
          gap: "14px",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        }}
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

        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: "6px",
            gridColumn: "1 / -1",
            padding: "14px",
          }}
        >
          <label
            style={{
              alignItems: "center",
              display: "flex",
              gap: "10px",
              marginBottom: "12px",
            }}
          >
            <input
              checked={values.startSequence}
              onChange={(event) =>
                updateField("startSequence", event.target.checked)
              }
              type="checkbox"
            />
            <span>Start reminder sequence immediately</span>
          </label>

          <div
            style={{
              alignItems: "center",
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            {toneOptions.map((tone) => (
              <button
                key={tone}
                disabled={!values.startSequence}
                onClick={() => updateField("tone", tone)}
                style={{
                  background:
                    tone === values.tone ? "var(--green)" : "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: "999px",
                  color: tone === values.tone ? "var(--bg)" : "var(--text)",
                  cursor: "pointer",
                  opacity: values.startSequence ? 1 : 0.4,
                  padding: "8px 12px",
                  textTransform: "capitalize",
                }}
                type="button"
              >
                {tone}
              </button>
            ))}
          </div>

          {values.startSequence ? (
            <p
              style={{
                color: "var(--text-dim)",
                margin: "12px 0 0",
              }}
            >
              Reminder intervals for <strong>{values.tone}</strong>:{" "}
              {sequenceSummary} days after due date.
            </p>
          ) : null}
        </div>

        {error ? (
          <p style={{ color: "var(--red)", gridColumn: "1 / -1", margin: 0 }}>
            {error}
          </p>
        ) : null}

        <div
          style={{
            display: "flex",
            gap: "12px",
            gridColumn: "1 / -1",
            justifyContent: "flex-end",
          }}
        >
          <button className="btn-ghost" onClick={onCancel} type="button">
            Cancel
          </button>
          <button className="btn-primary" disabled={submitting} type="submit">
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
    <label style={{ display: "grid", gap: "8px" }}>
      <span style={{ color: "var(--text-dim)", fontSize: "14px" }}>{label}</span>
      <input
        onChange={(event) => onChange(event.target.value)}
        required={required}
        step={step}
        style={fieldStyle}
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
    <label
      style={{
        display: "grid",
        gap: "8px",
        gridColumn: "1 / -1",
      }}
    >
      <span style={{ color: "var(--text-dim)", fontSize: "14px" }}>{label}</span>
      <textarea
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        style={fieldStyle}
        value={value}
      />
    </label>
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
