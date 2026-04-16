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
  applyInvoiceOptimizer,
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
  const [applyingOptimizer, setApplyingOptimizer] = useState(false);

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

  async function handleApplyOptimizer() {
    if (!selectedInvoice) {
      return;
    }

    setApplyingOptimizer(true);
    try {
      await applyInvoiceOptimizer(selectedInvoice.id);
      await Promise.all([
        loadInvoices(),
        loadSequence(selectedInvoice.id),
        loadEvents(selectedInvoice.id),
      ]);
    } finally {
      setApplyingOptimizer(false);
    }
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardShell
      actions={
        <button className="inline-flex items-center gap-2 text-text-dim font-mono text-xs tracking-[0.08em] uppercase hover:text-text transition-colors py-4 bg-transparent border-none cursor-pointer" onClick={() => void logout()} type="button">
          Sign out
        </button>
      }
      subtitle="Backend-backed invoice and reminder operations. This dashboard now reads and mutates real API state."
      title={`Collections for ${user.full_name.split(" ")[0] || user.email}`}
    >
      <div className="mb-5 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
        <StatCard label="Outstanding" value={formatCurrency(stats.totalOutstandingCents)} />
        <StatCard label="Active invoices" value={String(stats.activeCount)} />
        <StatCard label="Overdue invoices" value={String(stats.overdueCount)} />
        <StatCard label="Plan" value={user.plan} />
      </div>

      {error ? (
        <div className="mb-5 rounded-lg border border-[rgba(255,61,61,0.2)] bg-[rgba(255,61,61,0.08)] px-4 py-[14px] text-text">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-[minmax(320px,420px)_minmax(0,1fr)] gap-5">
        <div className="grid gap-5">
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
          applyingOptimizer={applyingOptimizer}
          events={events}
          eventsLoading={loadingEvents}
          invoice={selectedInvoice}
          onApplyOptimizer={handleApplyOptimizer}
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
    <div className="rounded-lg border border-border-default bg-white/[0.02] p-[18px]">
      <div className="mb-3 font-mono text-[11px] tracking-[0.1em] uppercase text-text-dim">
        {label}
      </div>
      <div className="text-[28px] font-bold">{value}</div>
    </div>
  );
}