package handler

import (
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

// parseUUID extracts and parses a UUID chi route parameter.
// Writes 400 and returns false if the parameter is missing or malformed.
func parseUUID(w http.ResponseWriter, r *http.Request, param string) (uuid.UUID, bool) {
	raw := chi.URLParam(r, param)
	id, err := uuid.Parse(raw)
	if err != nil {
		respondErrMsg(w, http.StatusBadRequest, "BAD_REQUEST",
			"invalid "+param+": must be a UUID")
		return uuid.UUID{}, false
	}
	return id, true
}

// intQuery parses an integer query parameter, returning def if absent or invalid.
func intQuery(r *http.Request, key string, def int) int {
	if v := r.URL.Query().Get(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return def
}