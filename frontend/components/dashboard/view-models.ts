import type {
  ApiInvoice,
  CreateInvoiceInput,
  InvoiceTone,
} from "@/lib/api/types";

export interface DashboardStats {
  activeCount: number;
  overdueCount: number;
  totalOutstandingCents: number;
}

export interface InvoiceFormValues {
  amount: string;
  clientContact: string;
  clientEmail: string;
  clientName: string;
  description: string;
  dueDate: string;
  invoiceNumber: string;
  notes: string;
  startSequence: boolean;
  tone: InvoiceTone;
}

const DEFAULT_INTERVALS: Record<InvoiceTone, number[]> = {
  final: [1, 3, 7],
  firm: [1, 5, 10, 21],
  polite: [1, 5, 14, 30],
};

export function defaultIntervalsForTone(tone: InvoiceTone) {
  return DEFAULT_INTERVALS[tone];
}

export function buildDashboardStats(invoices: ApiInvoice[]): DashboardStats {
  return invoices.reduce<DashboardStats>(
    (stats, invoice) => {
      if (invoice.status === "active") {
        stats.activeCount += 1;
        stats.totalOutstandingCents += invoice.amount_cents;
      }

      if (invoice.status === "overdue") {
        stats.overdueCount += 1;
        stats.totalOutstandingCents += invoice.amount_cents;
      }

      return stats;
    },
    {
      activeCount: 0,
      overdueCount: 0,
      totalOutstandingCents: 0,
    },
  );
}

export function buildCreateInvoiceInput(
  values: InvoiceFormValues,
): CreateInvoiceInput {
  const input: CreateInvoiceInput = {
    amount_cents: Math.round(Number(values.amount) * 100),
    client_contact: values.clientContact,
    client_email: values.clientEmail,
    client_name: values.clientName,
    currency: "ZAR",
    description: values.description,
    due_date: values.dueDate,
    invoice_number: values.invoiceNumber,
    notes: values.notes,
  };

  if (values.startSequence) {
    input.sequence = {
      interval_days: defaultIntervalsForTone(values.tone),
      tone: values.tone,
    };
  }

  return input;
}

export function formatCurrency(amountCents: number, currency = "ZAR") {
  return new Intl.NumberFormat("en-ZA", {
    currency,
    style: "currency",
  }).format(amountCents / 100);
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
