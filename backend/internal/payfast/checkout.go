package payfast

import (
	"fmt"
	"net/url"
	"strings"

	"github.com/nyashahama/invoice-chaser-backend/internal/domain"
)

// CheckoutConfig is the merchant/runtime context needed to build a PayFast checkout link.
type CheckoutConfig struct {
	MerchantID  string
	MerchantKey string
	Passphrase  string
	NotifyURL   string
	Sandbox     bool
}

// CheckoutURL builds a signed PayFast checkout URL for the given invoice.
func CheckoutURL(cfg CheckoutConfig, inv domain.Invoice) (string, error) {
	if strings.TrimSpace(cfg.MerchantID) == "" || strings.TrimSpace(cfg.MerchantKey) == "" {
		return "", fmt.Errorf("payfast checkout: merchant credentials are required")
	}
	if inv.ID.String() == "" || inv.AmountCents <= 0 {
		return "", fmt.Errorf("payfast checkout: invoice id and amount are required")
	}

	params := map[string]string{
		"merchant_id":  cfg.MerchantID,
		"merchant_key": cfg.MerchantKey,
		"m_payment_id": inv.ID.String(),
		"amount":       inv.AmountFormatted(),
		"item_name":    fmt.Sprintf("Invoice %s", inv.InvoiceNumber),
	}
	if strings.TrimSpace(cfg.NotifyURL) != "" {
		params["notify_url"] = cfg.NotifyURL
	}
	if strings.TrimSpace(inv.ClientEmail) != "" {
		params["email_address"] = inv.ClientEmail
	}
	if strings.TrimSpace(inv.Description) != "" {
		params["item_description"] = inv.Description
	}
	params["signature"] = signature(params, cfg.Passphrase)

	values := url.Values{}
	for key, value := range params {
		values.Set(key, value)
	}

	baseURL := "https://www.payfast.co.za/eng/process"
	if cfg.Sandbox {
		baseURL = "https://sandbox.payfast.co.za/eng/process"
	}
	return baseURL + "?" + values.Encode(), nil
}
