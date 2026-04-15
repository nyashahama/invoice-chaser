package handler

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestSetRefreshCookieUsesConfiguredExpiry(t *testing.T) {
	t.Parallel()

	rec := httptest.NewRecorder()
	setRefreshCookie(rec, "refresh-token", 48*time.Hour, true, http.SameSiteStrictMode)

	res := rec.Result()
	cookies := res.Cookies()
	if len(cookies) != 1 {
		t.Fatalf("expected 1 cookie, got %d", len(cookies))
	}
	if cookies[0].MaxAge != int((48 * time.Hour).Seconds()) {
		t.Fatalf("expected max age %d, got %d", int((48*time.Hour).Seconds()), cookies[0].MaxAge)
	}
}

func TestSetRefreshCookieUsesConfiguredSecurityAttributes(t *testing.T) {
	t.Parallel()

	rec := httptest.NewRecorder()
	setRefreshCookie(rec, "refresh-token", 24*time.Hour, false, http.SameSiteLaxMode)

	res := rec.Result()
	cookies := res.Cookies()
	if len(cookies) != 1 {
		t.Fatalf("expected 1 cookie, got %d", len(cookies))
	}
	if cookies[0].Secure {
		t.Fatal("expected cookie to be insecure for local development")
	}
	if cookies[0].SameSite != http.SameSiteLaxMode {
		t.Fatalf("expected SameSite=%v, got %v", http.SameSiteLaxMode, cookies[0].SameSite)
	}
}
