-- +goose Up
-- +goose StatementBegin
CREATE TABLE invoice_collection_states (
    invoice_id            UUID PRIMARY KEY REFERENCES invoices(id) ON DELETE CASCADE,
    risk_score            INT         NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    engagement_state      TEXT        NOT NULL CHECK (engagement_state IN ('unengaged', 'opened', 'clicked', 'bounced', 'paid')),
    next_best_action      TEXT        NOT NULL CHECK (next_best_action IN ('none', 'wait', 'send_now', 'escalate_tone', 'fix_email', 'manual_follow_up')),
    recommended_tone      TEXT        NOT NULL CHECK (recommended_tone IN ('polite', 'firm', 'final')),
    recommended_send_at   TIMESTAMPTZ,
    reasons               JSONB       NOT NULL DEFAULT '[]'::jsonb,
    metrics               JSONB       NOT NULL DEFAULT '{}'::jsonb,
    last_event_at         TIMESTAMPTZ,
    last_evaluated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    applied_at            TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoice_collection_states_action ON invoice_collection_states(next_best_action);
CREATE INDEX idx_invoice_collection_states_score ON invoice_collection_states(risk_score DESC);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS invoice_collection_states;
-- +goose StatementEnd