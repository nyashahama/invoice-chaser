package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/nyashahama/invoice-chaser-backend/internal/domain"
)

// respond encodes v as JSON with the given status code.
func respond(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

// errResp is the standard error envelope from the design doc.
type errResp struct {
	Error errBody `json:"error"`
}

type errBody struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

// respondErr maps a domain error to the correct HTTP status and error body.
func respondErr(w http.ResponseWriter, err error) {
	code, status := mapDomainError(err)
	respond(w, status, errResp{Error: errBody{Code: code, Message: err.Error()}})
}

// respondErrMsg writes a hand-crafted error envelope without wrapping an error.
func respondErrMsg(w http.ResponseWriter, status int, code, msg string) {
	respond(w, status, errResp{Error: errBody{Code: code, Message: msg}})
}

func mapDomainError(err error) (code string, status int) {
	switch {
	case errors.Is(err, domain.ErrNotFound):
		return "NOT_FOUND", http.StatusNotFound
	case errors.Is(err, domain.ErrUnauthorized):
		return "UNAUTHORIZED", http.StatusUnauthorized
	case errors.Is(err, domain.ErrForbidden):
		return "FORBIDDEN", http.StatusForbidden
	case errors.Is(err, domain.ErrConflict), errors.Is(err, domain.ErrSequenceExists):
		return "CONFLICT", http.StatusConflict
	case errors.Is(err, domain.ErrValidation):
		return "VALIDATION_FAILED", http.StatusUnprocessableEntity
	case errors.Is(err, domain.ErrCurrencyInvalid):
		return "CURRENCY_INVALID", http.StatusUnprocessableEntity
	case errors.Is(err, domain.ErrInvoiceAlreadyPaid):
		return "INVOICE_ALREADY_PAID", http.StatusConflict
	case errors.Is(err, domain.ErrInvoiceNotActive):
		return "INVOICE_NOT_ACTIVE", http.StatusUnprocessableEntity
	case errors.Is(err, domain.ErrAmountMismatch):
		return "AMOUNT_MISMATCH", http.StatusUnprocessableEntity
	default:
		return "INTERNAL_ERROR", http.StatusInternalServerError
	}
}

// decode reads and JSON-decodes the request body into v.
// Writes a 400 and returns false on any error.
func decode(w http.ResponseWriter, r *http.Request, v any) bool {
	if err := json.NewDecoder(r.Body).Decode(v); err != nil {
		respondErrMsg(w, http.StatusBadRequest, "BAD_REQUEST", "invalid JSON body: "+err.Error())
		return false
	}
	return true
}