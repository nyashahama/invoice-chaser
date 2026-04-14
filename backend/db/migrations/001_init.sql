-- +goose Up
-- +goose StatementBegin
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    email         TEXT          NOT NULL UNIQUE,
    password_hash TEXT,
    full_name     TEXT          NOT NULL,
    plan          TEXT          NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'agency')),
    timezone      TEXT          NOT NULL DEFAULT 'UTC',
    email_signature TEXT,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    deleted_at    TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email);

CREATE TABLE invoices (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invoice_number   TEXT        NOT NULL,
    client_name      TEXT        NOT NULL,
    client_email     TEXT        NOT NULL,
    client_contact   TEXT,
    amount_cents     BIGINT      NOT NULL CHECK (amount_cents > 0),
    currency         TEXT        NOT NULL DEFAULT 'ZAR',
    due_date         DATE        NOT NULL,
    description      TEXT,
    notes            TEXT,
    status           TEXT        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paid', 'cancelled')),
    paid_at          TIMESTAMPTZ,
    payment_source   TEXT,
    external_id      TEXT,
    click_token      TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
    payfast_payment_id TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoices_user_id   ON invoices(user_id);
CREATE INDEX idx_invoices_status    ON invoices(status);
CREATE INDEX idx_invoices_due_date  ON invoices(due_date) WHERE status = 'active';
CREATE UNIQUE INDEX idx_invoices_click_token ON invoices(click_token);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS users;
-- +goose StatementEnd