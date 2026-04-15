"use client";

import type { ApiInvoice } from "@/lib/api/types";

import { formatCurrency, formatDate } from "./view-models";

interface InvoiceListProps {
  invoices: ApiInvoice[];
  loading: boolean;
  onCreateInvoice: () => void;
  onSelect: (invoiceId: string) => void;
  selectedInvoiceId: string | null;
}

export default function InvoiceList({
  invoices,
  loading,
  onCreateInvoice,
  onSelect,
  selectedInvoiceId,
}: InvoiceListProps) {
  return (
    <section
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          alignItems: "center",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          padding: "20px",
        }}
      >
        <div>
          <h2 style={{ fontSize: "20px", margin: 0 }}>Invoices</h2>
          <p
            style={{
              color: "var(--text-dim)",
              margin: "8px 0 0",
            }}
          >
            Live backend state. Select an invoice to inspect reminders and
            events.
          </p>
        </div>
        <button className="btn-primary" onClick={onCreateInvoice} type="button">
          <span>New invoice</span>
          <span>+</span>
        </button>
      </div>

      {loading ? (
        <p style={{ color: "var(--text-dim)", margin: 0, padding: "20px" }}>
          Loading invoices...
        </p>
      ) : invoices.length === 0 ? (
        <p style={{ color: "var(--text-dim)", margin: 0, padding: "20px" }}>
          No invoices yet. Create your first invoice to start a reminder
          sequence.
        </p>
      ) : (
        <div>
          {invoices.map((invoice) => {
            const selected = invoice.id === selectedInvoiceId;

            return (
              <button
                key={invoice.id}
                onClick={() => onSelect(invoice.id)}
                style={{
                  background: selected ? "rgba(0,230,118,0.08)" : "transparent",
                  border: "none",
                  borderBottom: "1px solid var(--border)",
                  color: "inherit",
                  cursor: "pointer",
                  display: "grid",
                  gap: "8px",
                  padding: "18px 20px",
                  textAlign: "left",
                  width: "100%",
                }}
                type="button"
              >
                <div
                  style={{
                    alignItems: "center",
                    display: "flex",
                    gap: "12px",
                    justifyContent: "space-between",
                  }}
                >
                  <strong>{invoice.client_name}</strong>
                  <span
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      borderRadius: "999px",
                      color: "var(--text-dim)",
                      fontFamily: "var(--mono)",
                      fontSize: "11px",
                      padding: "6px 10px",
                      textTransform: "uppercase",
                    }}
                  >
                    {invoice.status}
                  </span>
                </div>
                <div
                  style={{
                    color: "var(--text-dim)",
                    display: "grid",
                    fontFamily: "var(--mono)",
                    fontSize: "12px",
                    gap: "4px",
                  }}
                >
                  <span>{invoice.invoice_number}</span>
                  <span>
                    {formatCurrency(invoice.amount_cents, invoice.currency)} due{" "}
                    {formatDate(invoice.due_date)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
