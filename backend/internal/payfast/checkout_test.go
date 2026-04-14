package payfast

import (
	"testing"

	"github.com/google/uuid"

	"github.com/nyashahama/invoice-chaser-backend/internal/domain"
)

func TestCheckoutURLBuildsSandboxLink(t *testing.T) {
	t.Parallel()

	url, err := CheckoutURL(CheckoutConfig{
		MerchantID:  "10000100",
		MerchantKey: "46f0cd694581a",
		Passphrase:  "secret",
		NotifyURL:   "http://localhost:8080/webhooks/payfast",
		Sandbox:     true,
	}, domain.Invoice{
		ID:            uuid.MustParse("11111111-1111-1111-1111-111111111111"),
		InvoiceNumber: "INV-123",
		AmountCents:   125000,
		Currency:      "ZAR",
		ClientEmail:   "client@example.com",
		ClientName:    "Acme Co",
	})
	if err != nil {
		t.Fatalf("CheckoutURL returned error: %v", err)
	}
	if !contains(url, "https://sandbox.payfast.co.za/eng/process?") {
		t.Fatalf("expected sandbox process url, got %q", url)
	}
	if !contains(url, "merchant_id=10000100") {
		t.Fatalf("expected merchant id in query, got %q", url)
	}
	if !contains(url, "notify_url=http%3A%2F%2Flocalhost%3A8080%2Fwebhooks%2Fpayfast") {
		t.Fatalf("expected encoded notify url in query, got %q", url)
	}
	if !contains(url, "m_payment_id=11111111-1111-1111-1111-111111111111") {
		t.Fatalf("expected invoice id in query, got %q", url)
	}
	if !contains(url, "signature=") {
		t.Fatalf("expected signed checkout url, got %q", url)
	}
}

func contains(s, want string) bool {
	return len(s) >= len(want) && (s == want || len(s) > len(want) && containsAt(s, want))
}

func containsAt(s, want string) bool {
	for i := 0; i+len(want) <= len(s); i++ {
		if s[i:i+len(want)] == want {
			return true
		}
	}
	return false
}
