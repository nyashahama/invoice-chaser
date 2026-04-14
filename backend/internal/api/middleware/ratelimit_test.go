package middleware

import (
	"net/http/httptest"
	"testing"
)

func TestRealIPStripsPortFromRemoteAddr(t *testing.T) {
	t.Parallel()

	req := httptest.NewRequest("GET", "/", nil)
	req.RemoteAddr = "203.0.113.10:54321"

	if got := realIP(req); got != "203.0.113.10" {
		t.Fatalf("expected host-only ip, got %q", got)
	}
}
