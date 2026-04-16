-- name: UpsertInvoiceCollectionState :one
INSERT INTO invoice_collection_states (
    invoice_id,
    risk_score,
    engagement_state,
    next_best_action,
    recommended_tone,
    recommended_send_at,
    reasons,
    metrics,
    last_event_at,
    last_evaluated_at,
    applied_at,
    updated_at
)
VALUES (
    @invoice_id,
    @risk_score,
    @engagement_state,
    @next_best_action,
    @recommended_tone,
    @recommended_send_at,
    @reasons,
    @metrics,
    @last_event_at,
    NOW(),
    @applied_at,
    NOW()
)
ON CONFLICT (invoice_id) DO UPDATE SET
    risk_score          = EXCLUDED.risk_score,
    engagement_state    = EXCLUDED.engagement_state,
    next_best_action    = EXCLUDED.next_best_action,
    recommended_tone    = EXCLUDED.recommended_tone,
    recommended_send_at = EXCLUDED.recommended_send_at,
    reasons             = EXCLUDED.reasons,
    metrics             = EXCLUDED.metrics,
    last_event_at       = EXCLUDED.last_event_at,
    last_evaluated_at   = NOW(),
    applied_at          = EXCLUDED.applied_at,
    updated_at          = NOW()
RETURNING *;

-- name: GetInvoiceCollectionState :one
SELECT * FROM invoice_collection_states
WHERE invoice_id = $1;

-- name: MarkInvoiceCollectionStateApplied :one
UPDATE invoice_collection_states
SET applied_at = NOW(), updated_at = NOW()
WHERE invoice_id = $1
RETURNING *;