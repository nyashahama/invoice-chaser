package middleware

import (
	"net/http"
	"sync"
	"time"
)

// RateLimiter is an in-process sliding-window counter per IP.
// For multi-instance deployments, replace with a Redis-backed implementation.
type RateLimiter struct {
	mu      sync.Mutex
	buckets map[string]*bucket
	limit   int
	window  time.Duration
}

type bucket struct {
	count   int
	resetAt time.Time
}

// NewRateLimiter constructs a limiter allowing limit requests per window per IP.
func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	rl := &RateLimiter{
		buckets: make(map[string]*bucket),
		limit:   limit,
		window:  window,
	}
	go rl.cleanup()
	return rl
}

// Limit returns an http.Handler middleware that enforces the rate limit.
func (rl *RateLimiter) Limit(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !rl.allow(realIP(r)) {
			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("Retry-After", "60")
			w.WriteHeader(http.StatusTooManyRequests)
			_, _ = w.Write([]byte(`{"error":{"code":"RATE_LIMITED","message":"too many requests, please slow down"}}`))
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (rl *RateLimiter) allow(ip string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	b, ok := rl.buckets[ip]
	if !ok || now.After(b.resetAt) {
		rl.buckets[ip] = &bucket{count: 1, resetAt: now.Add(rl.window)}
		return true
	}
	if b.count >= rl.limit {
		return false
	}
	b.count++
	return true
}

func (rl *RateLimiter) cleanup() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()
	for range ticker.C {
		rl.mu.Lock()
		now := time.Now()
		for ip, b := range rl.buckets {
			if now.After(b.resetAt) {
				delete(rl.buckets, ip)
			}
		}
		rl.mu.Unlock()
	}
}

// GlobalRateLimiter allows 60 req/min per IP — applied to all routes.
func GlobalRateLimiter() *RateLimiter {
	return NewRateLimiter(60, time.Minute)
}

// AuthRateLimiter allows 10 req/min per IP — applied to /auth/* routes only.
func AuthRateLimiter() *RateLimiter {
	return NewRateLimiter(10, time.Minute)
}

// realIP extracts the client IP, preferring proxy-set headers over RemoteAddr.
func realIP(r *http.Request) string {
	if ip := r.Header.Get("X-Real-IP"); ip != "" {
		return ip
	}
	if ip := r.Header.Get("X-Forwarded-For"); ip != "" {
		// May be comma-separated; take leftmost (original client).
		for i, c := range ip {
			if c == ',' {
				return ip[:i]
			}
		}
		return ip
	}
	return r.RemoteAddr
}