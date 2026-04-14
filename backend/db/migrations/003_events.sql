-- +goose Up
-- +goose StatementBegin
CREATE TABLE reminder_events (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    reminder_id UUID        NOT NULL REFERENCES reminders(id) ON DELETE CASCADE,
    invoice_id  UUID        NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    event_type  TEXT        NOT NULL CHECK (event_type IN ('sent', 'opened', 'clicked', 'bounced', 'failed', 'cancelled')),
    metadata    JSONB,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reminder_events_reminder_id ON reminder_events(reminder_id);
CREATE INDEX idx_reminder_events_invoice_id  ON reminder_events(invoice_id);
CREATE INDEX idx_reminder_events_occurred_at ON reminder_events(occurred_at);
CREATE INDEX idx_reminder_events_type        ON reminder_events(event_type);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS reminder_events;
-- +goose StatementEnd