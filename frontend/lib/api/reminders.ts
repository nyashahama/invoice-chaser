import { apiClient } from "./client";
import type {
  ApiReminder,
  CreateSequenceInput,
  ReminderActionResponse,
  ReminderSequence,
  UpdateSequenceInput,
} from "./types";

export function getReminder(id: string) {
  return apiClient.get<ApiReminder>(`/api/v1/reminders/${id}`);
}

export function sendReminderNow(id: string) {
  return apiClient.post<ReminderActionResponse>(`/api/v1/reminders/${id}/send-now`);
}

export function regenerateReminder(id: string) {
  return apiClient.post<ReminderActionResponse>(
    `/api/v1/reminders/${id}/regenerate`,
  );
}

export function getInvoiceSequence(invoiceId: string) {
  return apiClient.get<ReminderSequence>(`/api/v1/invoices/${invoiceId}/sequence`);
}

export function createInvoiceSequence(
  invoiceId: string,
  input: CreateSequenceInput,
) {
  return apiClient.post<ReminderSequence>(
    `/api/v1/invoices/${invoiceId}/sequence`,
    input,
  );
}

export function updateInvoiceSequence(
  invoiceId: string,
  input: UpdateSequenceInput,
) {
  return apiClient.patch<ReminderSequence>(
    `/api/v1/invoices/${invoiceId}/sequence`,
    input,
  );
}

export function deleteInvoiceSequence(invoiceId: string) {
  return apiClient.delete<void>(`/api/v1/invoices/${invoiceId}/sequence`);
}
