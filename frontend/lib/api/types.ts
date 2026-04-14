export type SessionStatus =
  | "loading"
  | "authenticated"
  | "unauthenticated";

export interface ApiUser {
  created_at: string;
  email: string;
  full_name: string;
  id: string;
  plan: string;
  timezone: string;
}

export interface AuthResponse {
  access_token: string;
  user: ApiUser;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  full_name: string;
  timezone: string;
}

export interface RefreshTokenResponse {
  access_token: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  limit: number;
  offset: number;
  total: number;
}

export interface ApiInvoice {
  amount_cents: number;
  client_contact: string;
  client_email: string;
  client_name: string;
  created_at: string;
  currency: string;
  description: string;
  due_date: string;
  id: string;
  invoice_number: string;
  notes: string;
  paid_at?: string | null;
  payment_source?: string | null;
  status: string;
  updated_at: string;
}

export interface InvoiceEvent {
  event_type: string;
  id: string;
  metadata: Record<string, unknown> | null;
  occurred_at: string;
  reminder_id: string;
}

export interface InvoiceSequenceInput {
  interval_days: number[];
  tone: string;
}

export interface CreateInvoiceInput {
  amount_cents: number;
  client_contact?: string;
  client_email: string;
  client_name: string;
  currency?: string;
  description?: string;
  due_date: string;
  invoice_number: string;
  notes?: string;
  sequence?: InvoiceSequenceInput;
}

export interface UpdateInvoiceInput {
  amount_cents?: number;
  client_contact?: string;
  client_email?: string;
  client_name?: string;
  currency?: string;
  description?: string;
  due_date?: string;
  invoice_number?: string;
  notes?: string;
}

export interface ApiReminder {
  body_html?: string | null;
  body_text?: string | null;
  created_at: string;
  id: string;
  invoice_id: string;
  open_token: string;
  scheduled_for: string;
  sent_at?: string | null;
  sequence_position: number;
  status: string;
  subject?: string | null;
  tone: string;
  updated_at: string;
}

export interface ReminderSequence {
  active: boolean;
  created_at: string;
  id: string;
  interval_days: number[];
  invoice_id: string;
  max_reminders: number;
  reminders: ApiReminder[];
  tone: string;
}

export interface CreateSequenceInput {
  interval_days: number[];
  max_reminders?: number;
  tone: string;
}

export interface UpdateSequenceInput {
  interval_days?: number[];
  max_reminders?: number;
  tone?: string;
}

export interface ReminderActionResponse {
  message: string;
  reminder_id: string;
}
