package middleware

import (
	"context"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type contextKey string

const (
	ctxUserID contextKey = "user_id"
	ctxClaims contextKey = "jwt_claims"
)

// Claims is the JWT payload stored in every access token.
type Claims struct {
	UserID uuid.UUID `json:"sub"`
	Email  string    `json:"email"`
	Plan   string    `json:"plan"`
	jwt.RegisteredClaims
}

// Authenticate validates the Bearer JWT and injects the user ID into context.
// Returns 401 on any validation failure.
func Authenticate(secret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
				respondUnauthorized(w, "missing or malformed Authorization header")
				return
			}
			tokenStr := strings.TrimPrefix(authHeader, "Bearer ")

			claims := &Claims{}
			token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (any, error) {
				if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, jwt.ErrSignatureInvalid
				}
				return []byte(secret), nil
			})
			if err != nil || !token.Valid {
				respondUnauthorized(w, "invalid or expired token")
				return
			}

			ctx := context.WithValue(r.Context(), ctxUserID, claims.UserID)
			ctx = context.WithValue(ctx, ctxClaims, claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// UserIDFromCtx extracts the authenticated user's UUID from context.
// Panics if called outside an authenticated route — missing middleware is a
// programming error, not a runtime condition.
func UserIDFromCtx(ctx context.Context) uuid.UUID {
	id, ok := ctx.Value(ctxUserID).(uuid.UUID)
	if !ok {
		panic("middleware.UserIDFromCtx: no user ID in context — route is missing Authenticate middleware")
	}
	return id
}

// ClaimsFromCtx extracts the full JWT claims from context.
func ClaimsFromCtx(ctx context.Context) *Claims {
	c, _ := ctx.Value(ctxClaims).(*Claims)
	return c
}

// IssueAccessToken creates a signed HS256 JWT access token valid for ttl.
// Pass cfg.JWTExpiry from config.Config — do not hardcode the duration here.
// Callers in service/user.go must be updated to supply the ttl argument.
func IssueAccessToken(secret string, userID uuid.UUID, email, plan string, ttl time.Duration) (string, error) {
	now := time.Now().UTC()
	claims := Claims{
		UserID: userID,
		Email:  email,
		Plan:   plan,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID.String(),
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(ttl)),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func respondUnauthorized(w http.ResponseWriter, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnauthorized)
	_, _ = w.Write([]byte(`{"error":{"code":"UNAUTHORIZED","message":"` + msg + `"}}`))
}