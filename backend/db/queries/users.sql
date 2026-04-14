-- name: CreateUser :one
INSERT INTO users (email, password_hash, full_name, plan, timezone, email_signature)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: GetUserByID :one
SELECT * FROM users
WHERE id = $1 AND deleted_at IS NULL;

-- name: GetUserByEmail :one
SELECT * FROM users
WHERE email = lower($1) AND deleted_at IS NULL;

-- name: UpdateUser :one
UPDATE users
SET
    full_name       = COALESCE(sqlc.narg('full_name'), full_name),
    timezone        = COALESCE(sqlc.narg('timezone'), timezone),
    email_signature = COALESCE(sqlc.narg('email_signature'), email_signature),
    plan            = COALESCE(sqlc.narg('plan'), plan)
WHERE id = $1 AND deleted_at IS NULL
RETURNING *;

-- name: UpdateUserPasswordHash :exec
UPDATE users
SET password_hash = $2
WHERE id = $1 AND deleted_at IS NULL;

-- name: SoftDeleteUser :exec
UPDATE users
SET deleted_at = NOW()
WHERE id = $1 AND deleted_at IS NULL;

-- name: CreateRefreshToken :one
INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetRefreshToken :one
SELECT * FROM refresh_tokens
WHERE token_hash = $1
  AND used_at   IS NULL
  AND revoked_at IS NULL
  AND expires_at > NOW();

-- name: MarkRefreshTokenUsed :exec
UPDATE refresh_tokens
SET used_at = NOW()
WHERE id = $1;

-- name: RevokeAllRefreshTokensForUser :exec
UPDATE refresh_tokens
SET revoked_at = NOW()
WHERE user_id = $1 AND revoked_at IS NULL;

-- name: CreateAPIKey :one
INSERT INTO api_keys (user_id, name, key_hash, key_prefix, expires_at)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetAPIKeyByHash :one
SELECT ak.*, u.id AS user_id_check
FROM api_keys ak
JOIN users u ON u.id = ak.user_id
WHERE ak.key_hash = $1
  AND ak.revoked_at IS NULL
  AND (ak.expires_at IS NULL OR ak.expires_at > NOW());

-- name: ListAPIKeysForUser :many
SELECT id, user_id, name, key_prefix, last_used_at, expires_at, created_at, revoked_at
FROM api_keys
WHERE user_id = $1
ORDER BY created_at DESC;

-- name: RevokeAPIKey :exec
UPDATE api_keys
SET revoked_at = NOW()
WHERE id = $1 AND user_id = $2;

-- name: TouchAPIKeyLastUsed :exec
UPDATE api_keys
SET last_used_at = NOW()
WHERE id = $1;