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

export interface UpdateUserInput {
  full_name?: string;
  timezone?: string;
}

export interface ChangePasswordInput {
  current_password: string;
  new_password: string;
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
  amount_formatted?: string;
  client_contact: string;
  client_email: string;
  client_name: string;
  click_token?: string;
  created_at: string;
  currency: string;
  days_overdue?: number;
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
  tone: InvoiceTone;
}

export type InvoiceTone = "polite" | "firm" | "final";

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
  created_at: string;
  id: string;
  invoice_id: string;
  openai_completion_tokens?: number;
  openai_prompt_tokens?: number;
  scheduled_for: string;
  sent_at?: string | null;
  sequence_position: number;
  status: string;
  subject?: string | null;
  tone: InvoiceTone;
}

export interface ReminderSequence {
  active: boolean;
  created_at: string;
  id: string;
  interval_days: number[];
  invoice_id: string;
  max_reminders: number;
  reminders: ApiReminder[];
  tone: InvoiceTone;
}

export interface CreateSequenceInput {
  interval_days: number[];
  max_reminders?: number;
  tone: InvoiceTone;
}

export interface UpdateSequenceInput {
  interval_days?: number[];
  max_reminders?: number;
  tone?: InvoiceTone;
}

export interface ReminderActionResponse {
  message: string;
  reminder_id: string;
}
