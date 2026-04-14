package payfast

import (
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestVerifierVerifySignature(t *testing.T) {
	t.Parallel()

	v := &Verifier{log: slog.New(slog.NewTextHandler(io.Discard, nil))}
	params := map[string]string{
		"amount_gross":   "100.00",
		"m_payment_id":   "11111111-1111-1111-1111-111111111111",
		"payment_status": "COMPLETE",
		"signature":      "0bb433da2529c21d71e877d7b00d1e63",
	}

	if !v.VerifySignature(params, "secret") {
		t.Fatal("expected signature to validate")
	}

	params["signature"] = "bad-signature"
	if v.VerifySignature(params, "secret") {
		t.Fatal("expected signature validation to fail")
	}
}

func TestVerifierValidateWithServer(t *testing.T) {
	t.Parallel()

	var gotBody string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, err := io.ReadAll(r.Body)
		if err != nil {
			t.Fatalf("read body: %v", err)
		}
		gotBody = string(body)
		_, _ = w.Write([]byte("VALID"))
	}))
	defer srv.Close()

	v := &Verifier{
		client:               srv.Client(),
		log:                  slog.New(slog.NewTextHandler(io.Discard, nil)),
		productionValidateURL: srv.URL,
		sandboxValidateURL:    srv.URL,
	}

	if !v.ValidateWithServer([]byte("foo=bar"), false) {
		t.Fatal("expected server validation to pass")
	}
	if gotBody != "cmd=_notify-validate&foo=bar" {
		t.Fatalf("unexpected validation payload %q", gotBody)
	}
}
