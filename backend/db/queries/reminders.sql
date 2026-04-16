-- name: CreateReminderSequence :one
INSERT INTO reminder_sequences (invoice_id, tone, interval_days, max_reminders)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetSequenceByInvoiceID :one
SELECT * FROM reminder_sequences
WHERE invoice_id = $1;

-- name: GetSequenceByID :one
SELECT * FROM reminder_sequences
WHERE id = $1;

-- name: UpdateSequence :one
UPDATE reminder_sequences
SET
    tone          = COALESCE(sqlc.narg('tone'), tone),
    interval_days = COALESCE(sqlc.narg('interval_days'), interval_days),
    max_reminders = COALESCE(sqlc.narg('max_reminders'), max_reminders),
    active        = COALESCE(sqlc.narg('active'), active)
WHERE id = $1
RETURNING *;

-- name: DeactivateSequence :exec
UPDATE reminder_sequences
SET active = false
WHERE invoice_id = $1;

-- ─── Reminders ───────────────────────────────────────────────────────────────

-- name: CreateReminder :one
INSERT INTO reminders (invoice_id, sequence_id, sequence_position, tone, scheduled_for)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetReminderByID :one
SELECT * FROM reminders
WHERE id = $1;

-- name: GetReminderByOpenToken :one
SELECT * FROM reminders
WHERE open_token = $1;

-- name: ListRemindersByInvoice :many
SELECT * FROM reminders
WHERE invoice_id = $1
ORDER BY sequence_position ASC;

-- name: GetDueRemindersForUpdate :many
-- Scheduler core query. FOR UPDATE SKIP LOCKED prevents double-fire across instances.
SELECT r.*
FROM reminders r
JOIN invoices i ON i.id = r.invoice_id
WHERE r.scheduled_for <= NOW()
  AND r.status         = 'pending'
  AND i.status         = 'active'
ORDER BY r.scheduled_for ASC
LIMIT 50
FOR UPDATE OF r SKIP LOCKED;

-- name: MarkReminderSending :one
-- Set immediately before OpenAI call as idempotency guard.
UPDATE reminders
SET status = 'sending', updated_at = NOW()
WHERE id = $1 AND status = 'pending'
RETURNING *;

-- name: MarkReminderSent :one
UPDATE reminders
SET
    status                   = 'sent',
    sent_at                  = NOW(),
    subject                  = $2,
    body_text                = $3,
    body_html                = $4,
    openai_prompt_tokens     = $5,
    openai_completion_tokens = $6,
    updated_at               = NOW()
WHERE id = $1
RETURNING *;

-- name: MarkReminderFailed :exec
UPDATE reminders
SET status = 'failed', updated_at = NOW()
WHERE id = $1;

-- name: CancelPendingRemindersForInvoice :exec
UPDATE reminders
SET status = 'cancelled', updated_at = NOW()
WHERE invoice_id = $1 AND status = 'pending';

-- name: CancelPendingRemindersForSequence :exec
UPDATE reminders
SET status = 'cancelled', updated_at = NOW()
WHERE sequence_id = $1 AND status = 'pending';

-- Recovery: reset stuck 'sending' rows older than 5 minutes.
-- name: ResetStuckSendingReminders :exec
UPDATE reminders
SET status = 'pending', updated_at = NOW()
WHERE status = 'sending'
  AND updated_at < NOW() - INTERVAL '5 minutes';

-- name: RescheduleReminder :exec
-- Moves a pending reminder's scheduled_for to the given time.
-- The AND status = 'pending' guard makes concurrent SendNow calls on the
-- same reminder idempotent — only the first update wins; subsequent ones
-- match zero rows and are silently ignored.
UPDATE reminders
SET scheduled_for = @scheduled_for,
    updated_at    = NOW()
WHERE id     = @id
  AND status  = 'pending';

-- name: UpdatePendingReminderToneByInvoice :exec
UPDATE reminders
SET tone = $2, updated_at = NOW()
WHERE invoice_id = $1
  AND status = 'pending';

-- name: StoreGeneratedEmail :exec
UPDATE reminders
SET
    subject   = $2,
    body_text = $3,
    body_html = $4,
    openai_prompt_tokens     = $5,
    openai_completion_tokens = $6,
    updated_at = NOW()
WHERE id = $1;

-- ─── Reminder Events (append-only) ───────────────────────────────────────────

-- name: CreateReminderEvent :one
INSERT INTO reminder_events (reminder_id, invoice_id, event_type, metadata)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: ListEventsByReminder :many
SELECT * FROM reminder_events
WHERE reminder_id = $1
ORDER BY occurred_at ASC;

-- name: ListEventsByInvoice :many
SELECT * FROM reminder_events
WHERE invoice_id = $1
ORDER BY occurred_at ASC;