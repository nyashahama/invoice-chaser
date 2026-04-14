package handler

import (
	"net/http"

	"github.com/nyashahama/invoice-chaser-backend/internal/api/middleware"
	"github.com/nyashahama/invoice-chaser-backend/internal/service"
)

// UserHandler handles user profile endpoints.
type UserHandler struct {
	users *service.UserService
}

func NewUserHandler(users *service.UserService) *UserHandler {
	return &UserHandler{users: users}
}

// Me godoc — GET /api/v1/users/me
func (h *UserHandler) Me(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserIDFromCtx(r.Context())

	user, err := h.users.GetByID(r.Context(), userID)
	if err != nil {
		respondErr(w, err)
		return
	}
	respond(w, http.StatusOK, shapeUser(user))
}

// UpdateMe godoc — PATCH /api/v1/users/me
func (h *UserHandler) UpdateMe(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserIDFromCtx(r.Context())

	var req struct {
		FullName       *string `json:"full_name"`
		Timezone       *string `json:"timezone"`
		EmailSignature *string `json:"email_signature"`
	}
	if !decode(w, r, &req) {
		return
	}

	user, err := h.users.Update(r.Context(), service.UpdateUserParams{
		ID:             userID,
		FullName:       req.FullName,
		Timezone:       req.Timezone,
		EmailSignature: req.EmailSignature,
	})
	if err != nil {
		respondErr(w, err)
		return
	}
	respond(w, http.StatusOK, shapeUser(user))
}

// ChangePassword godoc — POST /api/v1/users/me/password
func (h *UserHandler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserIDFromCtx(r.Context())

	var req struct {
		CurrentPassword string `json:"current_password"`
		NewPassword     string `json:"new_password"`
	}
	if !decode(w, r, &req) {
		return
	}
	if req.CurrentPassword == "" || req.NewPassword == "" {
		respondErrMsg(w, http.StatusUnprocessableEntity, "VALIDATION_FAILED",
			"current_password and new_password are required")
		return
	}
	if len(req.NewPassword) < 8 {
		respondErrMsg(w, http.StatusUnprocessableEntity, "VALIDATION_FAILED",
			"new_password must be at least 8 characters")
		return
	}

	if err := h.users.ChangePassword(r.Context(), userID, req.CurrentPassword, req.NewPassword); err != nil {
		respondErr(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}