package handler

import (
	"net/http"
	"time"

	"github.com/nyashahama/invoice-chaser-backend/internal/domain"
	"github.com/nyashahama/invoice-chaser-backend/internal/service"
)

// AuthHandler handles registration, login, token refresh, and logout.
type AuthHandler struct {
	users         *service.UserService
	refreshExpiry time.Duration
	cookieSecure  bool
	sameSite      http.SameSite
}

func NewAuthHandler(users *service.UserService, refreshExpiry time.Duration, cookieSecure bool, sameSite http.SameSite) *AuthHandler {
	if refreshExpiry <= 0 {
		refreshExpiry = 7 * 24 * time.Hour
	}
	return &AuthHandler{
		users:         users,
		refreshExpiry: refreshExpiry,
		cookieSecure:  cookieSecure,
		sameSite:      sameSite,
	}
}

// Register godoc — POST /api/v1/auth/register
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
		FullName string `json:"full_name"`
		Timezone string `json:"timezone"`
	}
	if !decode(w, r, &req) {
		return
	}
	if req.Email == "" || req.Password == "" || req.FullName == "" {
		respondErrMsg(w, http.StatusUnprocessableEntity, "VALIDATION_FAILED",
			"email, password, and full_name are required")
		return
	}
	if len(req.Password) < 8 {
		respondErrMsg(w, http.StatusUnprocessableEntity, "VALIDATION_FAILED",
			"password must be at least 8 characters")
		return
	}
	if req.Timezone == "" {
		req.Timezone = "UTC"
	}

	tokens, user, err := h.users.Register(r.Context(), service.RegisterParams{
		Email:    req.Email,
		Password: req.Password,
		FullName: req.FullName,
		Timezone: req.Timezone,
	})
	if err != nil {
		respondErr(w, err)
		return
	}

	setRefreshCookie(w, tokens.RefreshToken, h.refreshExpiry, h.cookieSecure, h.sameSite)
	respond(w, http.StatusCreated, map[string]any{
		"access_token": tokens.AccessToken,
		"user":         shapeUser(user),
	})
}

// Login godoc — POST /api/v1/auth/login
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if !decode(w, r, &req) {
		return
	}

	tokens, user, err := h.users.Login(r.Context(), req.Email, req.Password)
	if err != nil {
		respondErr(w, err)
		return
	}

	setRefreshCookie(w, tokens.RefreshToken, h.refreshExpiry, h.cookieSecure, h.sameSite)
	respond(w, http.StatusOK, map[string]any{
		"access_token": tokens.AccessToken,
		"user":         shapeUser(user),
	})
}

// Refresh godoc — POST /api/v1/auth/refresh
func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("refresh_token")
	if err != nil {
		respondErrMsg(w, http.StatusUnauthorized, "UNAUTHORIZED", "refresh token cookie missing")
		return
	}

	tokens, err := h.users.RefreshToken(r.Context(), cookie.Value)
	if err != nil {
		respondErr(w, err)
		return
	}

	setRefreshCookie(w, tokens.RefreshToken, h.refreshExpiry, h.cookieSecure, h.sameSite)
	respond(w, http.StatusOK, map[string]any{
		"access_token": tokens.AccessToken,
	})
}

// Logout godoc — POST /api/v1/auth/logout
func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("refresh_token")
	if err == nil {
		// Best-effort — revoke even if the response fails.
		_ = h.users.Logout(r.Context(), cookie.Value)
	}
	// Expire the cookie regardless of whether the token was valid.
	clearRefreshCookie(w, h.cookieSecure, h.sameSite)
	w.WriteHeader(http.StatusNoContent)
}

// setRefreshCookie writes the refresh token as an httpOnly Secure cookie.
func setRefreshCookie(w http.ResponseWriter, token string, expiry time.Duration, secure bool, sameSite http.SameSite) {
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   secure,
		SameSite: sameSite,
		MaxAge:   int(expiry.Seconds()),
	})
}

func clearRefreshCookie(w http.ResponseWriter, secure bool, sameSite http.SameSite) {
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   secure,
		SameSite: sameSite,
		MaxAge:   -1,
	})
}

// shapeUser produces the user JSON envelope — never exposes password hash.
func shapeUser(u domain.User) map[string]any {
	return map[string]any{
		"id":         u.ID,
		"email":      u.Email,
		"full_name":  u.FullName,
		"plan":       u.Plan,
		"timezone":   u.Timezone,
		"created_at": u.CreatedAt,
	}
}
