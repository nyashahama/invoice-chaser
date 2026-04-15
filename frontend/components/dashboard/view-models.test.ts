import { describe, expect, it } from "vitest";

import type { ApiInvoice } from "@/lib/api/types";

import {
  buildCreateInvoiceInput,
  buildDashboardStats,
  defaultIntervalsForTone,
} from "./view-models";

const invoices: ApiInvoice[] = [
  {
    amount_cents: 125000,
    client_contact: "Sarah Chen",
    client_email: "billing@acme.test",
    client_name: "Acme",
    created_at: "2026-04-10T08:00:00Z",
    currency: "ZAR",
    description: "Brand identity",
    due_date: "2026-04-12",
    id: "inv-1",
    invoice_number: "INV-1",
    notes: "",
    status: "active",
    updated_at: "2026-04-10T08:00:00Z",
  },
  {
    amount_cents: 80000,
    client_contact: "",
    client_email: "finance@beta.test",
    client_name: "Beta",
    created_at: "2026-04-02T08:00:00Z",
    currency: "ZAR",
    description: "Sprint",
    due_date: "2026-04-03",
    id: "inv-2",
    invoice_number: "INV-2",
    notes: "",
    status: "paid",
    updated_at: "2026-04-05T08:00:00Z",
  },
  {
    amount_cents: 54000,
    client_contact: "Tom",
    client_email: "tom@gamma.test",
    client_name: "Gamma",
    created_at: "2026-03-29T08:00:00Z",
    currency: "ZAR",
    description: "Audit",
    due_date: "2026-03-31",
    id: "inv-3",
    invoice_number: "INV-3",
    notes: "",
    status: "overdue",
    updated_at: "2026-03-31T08:00:00Z",
  },
];

describe("dashboard view models", () => {
  it("builds stats from outstanding invoices only", () => {
    expect(buildDashboardStats(invoices)).toEqual({
      activeCount: 1,
      overdueCount: 1,
      totalOutstandingCents: 179000,
    });
  });

  it("uses tone defaults when creating an invoice sequence", () => {
    expect(defaultIntervalsForTone("firm")).toEqual([1, 5, 10, 21]);

    expect(
      buildCreateInvoiceInput({
        amount: "1250.50",
        clientContact: "Sarah Chen",
        clientEmail: "billing@acme.test",
        clientName: "Acme",
        description: "Brand identity",
        dueDate: "2026-04-20",
        invoiceNumber: "INV-101",
        notes: "Urgent",
        startSequence: true,
        tone: "firm",
      }),
    ).toEqual({
      amount_cents: 125050,
      client_contact: "Sarah Chen",
      client_email: "billing@acme.test",
      client_name: "Acme",
      currency: "ZAR",
      description: "Brand identity",
      due_date: "2026-04-20",
      invoice_number: "INV-101",
      notes: "Urgent",
      sequence: {
        interval_days: [1, 5, 10, 21],
        tone: "firm",
      },
    });
  });
});
