-- +goose Up
-- +goose StatementBegin
CREATE TABLE reminder_sequences (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id     UUID        NOT NULL UNIQUE REFERENCES invoices(id) ON DELETE CASCADE,
    tone           TEXT        NOT NULL DEFAULT 'polite' CHECK (tone IN ('polite', 'firm', 'final')),
    interval_days  INT[]       NOT NULL,
    max_reminders  INT         NOT NULL DEFAULT 4 CHECK (max_reminders > 0),
    active         BOOLEAN     NOT NULL DEFAULT true,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reminder_sequences_invoice_id ON reminder_sequences(invoice_id);

CREATE TABLE reminders (
    id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id                UUID        NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    sequence_id               UUID        NOT NULL REFERENCES reminder_sequences(id) ON DELETE CASCADE,
    sequence_position         INT         NOT NULL CHECK (sequence_position >= 1),
    tone                      TEXT        NOT NULL CHECK (tone IN ('polite', 'firm', 'final')),
    scheduled_for             TIMESTAMPTZ NOT NULL,
    status                    TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'cancelled')),
    subject                   TEXT,
    body_text                 TEXT,
    body_html                 TEXT,
    open_token                TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
    openai_prompt_tokens      INT,
    openai_completion_tokens  INT,
    sent_at                   TIMESTAMPTZ,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reminders_scheduled_for ON reminders(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_reminders_invoice_id    ON reminders(invoice_id);
CREATE INDEX idx_reminders_sequence_id  ON reminders(sequence_id);
CREATE UNIQUE INDEX idx_reminders_open_token ON reminders(open_token);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS reminders;
DROP TABLE IF EXISTS reminder_sequences;
-- +goose StatementEnd