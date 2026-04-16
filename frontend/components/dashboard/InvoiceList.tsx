"use client";

import type { ApiInvoice } from "@/lib/api/types";

import { collectionActionColor, formatCurrency, formatDate } from "./view-models";

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
    <section className="overflow-hidden rounded-lg border border-border-default bg-white/[0.02]">
      <div className="flex items-center justify-between border-b border-border-default p-5">
        <div>
          <h2 className="m-0 text-xl">Invoices</h2>
          <p className="mt-2 text-text-dim">
            Live backend state. Select an invoice to inspect reminders and
            events.
          </p>
        </div>
        <button className="inline-flex items-center gap-2.5 bg-green text-black font-mono text-[13px] font-bold tracking-[0.05em] uppercase px-8 py-4 rounded-[2px] transition-all hover:bg-[#1fffaa] hover:-translate-y-px hover:shadow-[0_8px_32px_rgba(0,230,118,0.3)] border-none cursor-pointer" onClick={onCreateInvoice} type="button">
          <span>New invoice</span>
          <span>+</span>
        </button>
      </div>

      {loading ? (
        <p className="m-0 p-5 text-text-dim">
          Loading invoices...
        </p>
      ) : invoices.length === 0 ? (
        <p className="m-0 p-5 text-text-dim">
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
                className={`w-full grid gap-2 border-b border-border-default px-5 py-[18px] text-left cursor-pointer border-none ${selected ? "bg-[rgba(0,230,118,0.08)]" : "bg-transparent"}`}
                type="button"
              >
                <div className="flex items-center justify-between gap-3">
                  <strong>{invoice.client_name}</strong>
                  <div className="flex items-center gap-2">
                    {invoice.collections ? (
                      <span
                        className={`rounded px-2 py-1 font-mono text-[10px] uppercase ${
                          collectionActionColor(invoice.collections.next_best_action)
                        }`}
                      >
                        {invoice.collections.next_best_action.replace("_", " ")}
                      </span>
                    ) : null}
                    <span className="rounded-full bg-white/[0.05] px-2.5 py-1.5 font-mono text-[11px] uppercase text-text-dim">
                      {invoice.status}
                    </span>
                  </div>
                </div>
                <div className="grid gap-1 font-mono text-xs text-text-dim">
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