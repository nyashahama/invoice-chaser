"use client";

import { useEffect, useMemo, useState } from "react";

import InvoiceDetail from "@/components/dashboard/InvoiceDetail";
import InvoiceList from "@/components/dashboard/InvoiceList";
import NewInvoiceForm from "@/components/dashboard/NewInvoiceForm";
import ProfilePanel from "@/components/dashboard/ProfilePanel";
import {
  buildDashboardStats,
  formatCurrency,
} from "@/components/dashboard/view-models";
import { useSession } from "@/context/SessionContext";
import { isApiError } from "@/lib/api/errors";
import {
  createInvoice,
  listInvoiceEvents,
  listInvoices,
  markInvoicePaid,
} from "@/lib/api/invoices";
import { regenerateReminder, getInvoiceSequence, sendReminderNow, createInvoiceSequence, updateInvoiceSequence } from "@/lib/api/reminders";
import type {
  ApiInvoice,
  ChangePasswordInput,
  CreateInvoiceInput,
  InvoiceEvent,
  InvoiceTone,
  ReminderSequence,
  UpdateUserInput,
} from "@/lib/api/types";
import { changePassword, updateCurrentUser } from "@/lib/api/users";

import DashboardShell from "./dashboard/DashboardShell";

export default function Dashboard() {
  const { logout, refreshUser, user } = useSession();
  const [invoices, setInvoices] = useState<ApiInvoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [showNewInvoiceForm, setShowNewInvoiceForm] = useState(false);
  const [sequence, setSequence] = useState<ReminderSequence | null>(null);
  const [events, setEvents] = useState<InvoiceEvent[]>([]);
  const [loadingSequence, setLoadingSequence] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const selectedInvoice = useMemo(
    () => invoices.find((invoice) => invoice.id === selectedInvoiceId) ?? null,
    [invoices, selectedInvoiceId],
  );

  const stats = useMemo(
    () => buildDashboardStats(invoices),
    [invoices],
  );

  useEffect(() => {
    void loadInvoices();
  }, []);

  useEffect(() => {
    if (!selectedInvoiceId) {
      setSequence(null);
      setEvents([]);
      return;
    }

    void loadSequence(selectedInvoiceId);
    void loadEvents(selectedInvoiceId);
  }, [selectedInvoiceId]);

  async function loadInvoices() {
    setLoadingInvoices(true);
    setError(null);

    try {
      const response = await listInvoices({
        limit: 50,
      });

      setInvoices(response.data);
      setSelectedInvoiceId((current) => current ?? response.data[0]?.id ?? null);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Could not load invoices.",
      );
    } finally {
      setLoadingInvoices(false);
    }
  }

  async function loadSequence(invoiceId: string) {
    setLoadingSequence(true);

    try {
      const nextSequence = await getInvoiceSequence(invoiceId);
      setSequence(nextSequence);
    } catch (nextError) {
      if (isApiError(nextError) && nextError.status === 404) {
        setSequence(null);
      } else {
        setError(
          nextError instanceof Error
            ? nextError.message
            : "Could not load reminder sequence.",
        );
      }
    } finally {
      setLoadingSequence(false);
    }
  }

  async function loadEvents(invoiceId: string) {
    setLoadingEvents(true);

    try {
      const response = await listInvoiceEvents(invoiceId);
      setEvents(response.data);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Could not load invoice events.",
      );
    } finally {
      setLoadingEvents(false);
    }
  }

  async function handleCreateInvoice(input: CreateInvoiceInput) {
    const invoice = await createInvoice(input);

    setInvoices((current) => [invoice, ...current]);
    setSelectedInvoiceId(invoice.id);
    setShowNewInvoiceForm(false);

    if (input.sequence) {
      await loadSequence(invoice.id);
    } else {
      setSequence(null);
    }

    setEvents([]);

    return invoice;
  }

  async function handleMarkPaid() {
    if (!selectedInvoice) {
      return;
    }

    const updated = await markInvoicePaid(selectedInvoice.id);
    setInvoices((current) =>
      current.map((invoice) => (invoice.id === updated.id ? updated : invoice)),
    );
    await loadSequence(updated.id);
    await loadEvents(updated.id);
  }

  async function handleSendNow(reminderId: string) {
    await sendReminderNow(reminderId);
    if (selectedInvoice) {
      await Promise.all([
        loadSequence(selectedInvoice.id),
        loadEvents(selectedInvoice.id),
      ]);
    }
  }

  async function handleRegenerate(reminderId: string) {
    await regenerateReminder(reminderId);
    if (selectedInvoice) {
      await Promise.all([
        loadSequence(selectedInvoice.id),
        loadEvents(selectedInvoice.id),
      ]);
    }
  }

  async function handleCreateSequence(input: {
    interval_days: number[];
    tone: InvoiceTone;
  }) {
    if (!selectedInvoice) {
      return;
    }

    const nextSequence = await createInvoiceSequence(selectedInvoice.id, input);
    setSequence(nextSequence);
  }

  async function handleUpdateSequence(input: {
    interval_days: number[];
    tone: InvoiceTone;
  }) {
    if (!selectedInvoice) {
      return;
    }

    const nextSequence = await updateInvoiceSequence(selectedInvoice.id, input);
    setSequence(nextSequence);
  }

  async function handleSaveProfile(input: UpdateUserInput) {
    await updateCurrentUser(input);
    await refreshUser();
  }

  async function handleChangePassword(input: ChangePasswordInput) {
    await changePassword(input);
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardShell
      actions={
        <button className="btn-ghost" onClick={() => void logout()} type="button">
          Sign out
        </button>
      }
      subtitle="Backend-backed invoice and reminder operations. This dashboard now reads and mutates real API state."
      title={`Collections for ${user.full_name.split(" ")[0] || user.email}`}
    >
      <div
        style={{
          display: "grid",
          gap: "16px",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          marginBottom: "20px",
        }}
      >
        <StatCard label="Outstanding" value={formatCurrency(stats.totalOutstandingCents)} />
        <StatCard label="Active invoices" value={String(stats.activeCount)} />
        <StatCard label="Overdue invoices" value={String(stats.overdueCount)} />
        <StatCard label="Plan" value={user.plan} />
      </div>

      {error ? (
        <div
          style={{
            background: "rgba(255,61,61,0.08)",
            border: "1px solid rgba(255,61,61,0.2)",
            borderRadius: "8px",
            color: "var(--text)",
            marginBottom: "20px",
            padding: "14px 16px",
          }}
        >
          {error}
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gap: "20px",
          gridTemplateColumns: "minmax(320px, 420px) minmax(0, 1fr)",
        }}
      >
        <div style={{ display: "grid", gap: "20px" }}>
          <InvoiceList
            invoices={invoices}
            loading={loadingInvoices}
            onCreateInvoice={() => setShowNewInvoiceForm((current) => !current)}
            onSelect={setSelectedInvoiceId}
            selectedInvoiceId={selectedInvoiceId}
          />

          {showNewInvoiceForm ? (
            <NewInvoiceForm
              onCancel={() => setShowNewInvoiceForm(false)}
              onCreate={handleCreateInvoice}
            />
          ) : null}

          <ProfilePanel
            onChangePassword={handleChangePassword}
            onSaveProfile={handleSaveProfile}
            user={user}
          />
        </div>

        <InvoiceDetail
          events={events}
          eventsLoading={loadingEvents}
          invoice={selectedInvoice}
          onCreateSequence={handleCreateSequence}
          onMarkPaid={handleMarkPaid}
          onRegenerate={handleRegenerate}
          onSendNow={handleSendNow}
          onUpdateSequence={handleUpdateSequence}
          sequence={sequence}
          sequenceLoading={loadingSequence}
        />
      </div>
    </DashboardShell>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "18px",
      }}
    >
      <div
        style={{
          color: "var(--text-dim)",
          fontFamily: "var(--mono)",
          fontSize: "11px",
          letterSpacing: "0.1em",
          marginBottom: "12px",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: "28px", fontWeight: 700 }}>{value}</div>
    </div>
  );
}
