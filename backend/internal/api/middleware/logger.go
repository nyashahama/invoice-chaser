package middleware

import (
	"bufio"
	"context"
	"log/slog"
	"net"
	"net/http"
	"time"

	"github.com/google/uuid"
)

const ctxRequestID contextKey = "request_id"

// RequestID injects a unique request ID into context and response headers.
// Accepts X-Request-ID from the caller if present; otherwise generates one.
func RequestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id := r.Header.Get("X-Request-ID")
		if id == "" {
			id = uuid.New().String()
		}
		ctx := context.WithValue(r.Context(), ctxRequestID, id)
		w.Header().Set("X-Request-ID", id)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// RequestIDFromCtx returns the request ID injected by RequestID middleware.
func RequestIDFromCtx(ctx context.Context) string {
	id, _ := ctx.Value(ctxRequestID).(string)
	return id
}

// Logger emits a structured JSON log line after every request:
// method, path, status code, duration, request_id, and client IP.
func Logger(log *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			rw := &responseWriter{ResponseWriter: w, status: http.StatusOK}
			next.ServeHTTP(rw, r)
			log.InfoContext(r.Context(), "http",
				slog.String("method", r.Method),
				slog.String("path", r.URL.Path),
				slog.Int("status", rw.status),
				slog.Duration("dur", time.Since(start)),
				slog.String("rid", RequestIDFromCtx(r.Context())),
				slog.String("ip", realIP(r)),
			)
		})
	}
}

// Recoverer catches panics and returns a 500 instead of crashing the server.
func Recoverer(log *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			defer func() {
				if rv := recover(); rv != nil {
					log.ErrorContext(r.Context(), "panic",
						slog.Any("value", rv),
						slog.String("path", r.URL.Path),
						slog.String("rid", RequestIDFromCtx(r.Context())),
					)
					w.Header().Set("Content-Type", "application/json")
					w.WriteHeader(http.StatusInternalServerError)
					_, _ = w.Write([]byte(`{"error":{"code":"INTERNAL_ERROR","message":"an unexpected error occurred"}}`))
				}
			}()
			next.ServeHTTP(w, r)
		})
	}
}

// responseWriter wraps http.ResponseWriter to capture the written status code.
// It also forwards http.Flusher and http.Hijacker so SSE, chunked streaming,
// and WebSocket upgrade handlers work correctly through this middleware.
type responseWriter struct {
	http.ResponseWriter
	status int
}

func (rw *responseWriter) WriteHeader(status int) {
	rw.status = status
	rw.ResponseWriter.WriteHeader(status)
}

// Flush forwards to the underlying ResponseWriter if it implements http.Flusher.
// Without this, any handler that calls Flush() (e.g. SSE) silently no-ops.
func (rw *responseWriter) Flush() {
	if f, ok := rw.ResponseWriter.(http.Flusher); ok {
		f.Flush()
	}
}

// Hijack forwards to the underlying ResponseWriter if it implements http.Hijacker.
// Required for WebSocket upgrade support through this middleware.
func (rw *responseWriter) Hijack() (net.Conn, *bufio.ReadWriter, error) {
	return rw.ResponseWriter.(http.Hijacker).Hijack()
}