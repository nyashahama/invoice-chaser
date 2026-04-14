package middleware

import (
	"net/http"
	"slices"
)

// CORS returns middleware that enforces a strict origin allowlist.
// Credentials mode (cookies) is permitted only for listed origins.
func CORS(allowedOrigins []string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")

			if origin != "" && slices.Contains(allowedOrigins, origin) {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Access-Control-Allow-Credentials", "true")
				w.Header().Set("Access-Control-Allow-Headers",
					"Content-Type, Authorization, X-Request-ID")
				w.Header().Set("Access-Control-Allow-Methods",
					"GET, POST, PATCH, DELETE, OPTIONS")
				w.Header().Set("Vary", "Origin")
			}

			// Respond to preflight without passing to next handler.
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}