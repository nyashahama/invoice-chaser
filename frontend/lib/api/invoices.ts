import { apiClient } from "./client";
import type {
  ApiInvoice,
  CreateInvoiceInput,
  InvoiceEvent,
  PaginatedResponse,
  UpdateInvoiceInput,
} from "./types";

export function listInvoices(params?: {
  limit?: number;
  offset?: number;
  status?: string;
}) {
  const search = new URLSearchParams();

  if (params?.status) {
    search.set("status", params.status);
  }
  if (params?.limit !== undefined) {
    search.set("limit", String(params.limit));
  }
  if (params?.offset !== undefined) {
    search.set("offset", String(params.offset));
  }

  const query = search.toString();
  return apiClient.get<PaginatedResponse<ApiInvoice>>(
    `/api/v1/invoices${query ? `?${query}` : ""}`,
  );
}

export function getInvoice(id: string) {
  return apiClient.get<ApiInvoice>(`/api/v1/invoices/${id}`);
}

export function createInvoice(input: CreateInvoiceInput) {
  return apiClient.post<ApiInvoice>("/api/v1/invoices", input);
}

export function updateInvoice(id: string, input: UpdateInvoiceInput) {
  return apiClient.patch<ApiInvoice>(`/api/v1/invoices/${id}`, input);
}

export function deleteInvoice(id: string) {
  return apiClient.delete<void>(`/api/v1/invoices/${id}`);
}

export function markInvoicePaid(id: string) {
  return apiClient.post<ApiInvoice>(`/api/v1/invoices/${id}/pay`);
}

export function listInvoiceEvents(id: string) {
  return apiClient.get<{ data: InvoiceEvent[] }>(`/api/v1/invoices/${id}/events`);
}
