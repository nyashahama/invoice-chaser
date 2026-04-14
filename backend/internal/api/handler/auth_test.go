package handler

import (
	"net/http/httptest"
	"testing"
	"time"
)

func TestSetRefreshCookieUsesConfiguredExpiry(t *testing.T) {
	t.Parallel()

	rec := httptest.NewRecorder()
	setRefreshCookie(rec, "refresh-token", 48*time.Hour)

	res := rec.Result()
	cookies := res.Cookies()
	if len(cookies) != 1 {
		t.Fatalf("expected 1 cookie, got %d", len(cookies))
	}
	if cookies[0].MaxAge != int((48 * time.Hour).Seconds()) {
		t.Fatalf("expected max age %d, got %d", int((48*time.Hour).Seconds()), cookies[0].MaxAge)
	}
}
