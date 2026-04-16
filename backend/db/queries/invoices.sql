-- name: CreateInvoice :one
INSERT INTO invoices (
    user_id, invoice_number, client_name, client_email, client_contact,
    amount_cents, currency, due_date, description, notes, status
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
RETURNING *;

-- name: GetInvoiceByID :one
SELECT * FROM invoices
WHERE id = $1;

-- name: GetInvoiceByIDForUser :one
SELECT * FROM invoices
WHERE id = $1 AND user_id = $2;

-- name: GetInvoiceByClickToken :one
SELECT * FROM invoices
WHERE click_token = $1;

-- name: ListInvoicesForUser :many
SELECT * FROM invoices
WHERE user_id = $1
  AND ($2::text IS NULL OR status = $2)
ORDER BY created_at DESC
LIMIT $3 OFFSET $4;

-- name: CountInvoicesForUser :one
SELECT COUNT(*) FROM invoices
WHERE user_id = $1
  AND ($2::text IS NULL OR status = $2);

-- name: ListOverdueInvoices :many
SELECT * FROM invoices
WHERE status = 'active'
  AND due_date < CURRENT_DATE
ORDER BY due_date ASC;

-- name: UpdateInvoice :one
UPDATE invoices
SET
    invoice_number = COALESCE(sqlc.narg('invoice_number'), invoice_number),
    client_name    = COALESCE(sqlc.narg('client_name'), client_name),
    client_email   = COALESCE(sqlc.narg('client_email'), client_email),
    client_contact = COALESCE(sqlc.narg('client_contact'), client_contact),
    amount_cents   = COALESCE(sqlc.narg('amount_cents'), amount_cents),
    currency       = COALESCE(sqlc.narg('currency'), currency),
    due_date       = COALESCE(sqlc.narg('due_date'), due_date),
    description    = COALESCE(sqlc.narg('description'), description),
    notes          = COALESCE(sqlc.narg('notes'), notes),
    status         = COALESCE(sqlc.narg('status'), status)
WHERE id = $1 AND user_id = $2
RETURNING *;

-- name: ActivateInvoice :one
UPDATE invoices
SET status = 'active'
WHERE id = $1 AND user_id = $2 AND status = 'draft'
RETURNING *;

-- name: MarkInvoicePaid :one
UPDATE invoices
SET
    status         = 'paid',
    paid_at        = $2,
    payment_source = $3
WHERE id = $1 AND status != 'paid'
RETURNING *;

-- name: MarkInvoicePaidAndCancelReminders :exec
WITH paid AS (
    UPDATE invoices
    SET
        status             = 'paid',
        paid_at            = $2,
        payment_source     = $3,
        payfast_payment_id = sqlc.narg('payfast_payment_id')
    WHERE invoices.id = $1 AND invoices.status != 'paid'
    RETURNING invoices.id AS invoice_id
)
UPDATE reminders
SET status = 'cancelled', updated_at = NOW()
WHERE invoice_id = (SELECT invoice_id FROM paid)
  AND status = 'pending';

-- name: CancelInvoice :exec
UPDATE invoices
SET status = 'cancelled'
WHERE id = $1 AND user_id = $2;

-- name: GetInvoiceCollectionStateByInvoiceForUser :one
SELECT ics.*
FROM invoice_collection_states ics
JOIN invoices i ON i.id = ics.invoice_id
WHERE ics.invoice_id = $1
  AND i.user_id = $2;