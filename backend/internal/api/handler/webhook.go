package handler

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/nyashahama/invoice-chaser-backend/internal/domain"
	"github.com/nyashahama/invoice-chaser-backend/internal/payfast"
	"github.com/nyashahama/invoice-chaser-backend/internal/service"
)

// PayFastVerifier abstracts PayFast verification so it can be mocked in tests.
type PayFastVerifier interface {
	IsAllowedIP(ip string) bool
	VerifySignature(params map[string]string, passphrase string) bool
	ValidateWithServer(body []byte, sandbox bool) bool
}

// WebhookHandler handles inbound events from PayFast and SendGrid.
type WebhookHandler struct {
	invoices      *service.InvoiceService
	reminders     *service.ReminderService
	pfVerifier    PayFastVerifier
	pfMerchantID  string
	pfMerchantKey string
	pfPassphrase  string // from config.PayFastPassphrase; may be empty
	pfSandbox     bool   // from config.PayFastSandbox
	appBaseURL    string
	log           *slog.Logger
}

// NewWebhookHandler constructs the handler.
// pfPassphrase and pfSandbox must be sourced from config.Config, not hardcoded.
func NewWebhookHandler(
	invoices *service.InvoiceService,
	reminders *service.ReminderService,
	pfVerifier PayFastVerifier,
	pfMerchantID string,
	pfMerchantKey string,
	pfPassphrase string,
	pfSandbox bool,
	appBaseURL string,
	log *slog.Logger,
) *WebhookHandler {
	return &WebhookHandler{
		invoices:      invoices,
		reminders:     reminders,
		pfVerifier:    pfVerifier,
		pfMerchantID:  pfMerchantID,
		pfMerchantKey: pfMerchantKey,
		pfPassphrase:  pfPassphrase,
		pfSandbox:     pfSandbox,
		appBaseURL:    strings.TrimRight(appBaseURL, "/"),
		log:           log,
	}
}

// PayFastITN godoc — POST /webhooks/payfast
// No JWT auth — this is a server-to-server callback.
// Always returns 200 first; PayFast retries on any other status.
func (h *WebhookHandler) PayFastITN(w http.ResponseWriter, r *http.Request) {
	// Write 200 before doing any processing — PayFast requires this.
	w.WriteHeader(http.StatusOK)

	body, err := io.ReadAll(r.Body)
	if err != nil {
		h.log.ErrorContext(r.Context(), "payfast: read body", slog.String("err", err.Error()))
		return
	}

	values, err := url.ParseQuery(string(body))
	if err != nil {
		h.log.ErrorContext(r.Context(), "payfast: parse body", slog.String("err", err.Error()))
		return
	}
	params := flattenValues(values)

	// 5-step PayFast verification — fail any step, log and return silently.
	if !h.pfVerifier.IsAllowedIP(proxyRealIP(r)) {
		h.log.WarnContext(r.Context(), "payfast: ip not in allowlist",
			slog.String("ip", proxyRealIP(r)))
		return
	}
	// Passphrase is sourced from config — empty string is valid for accounts
	// that have not set one, but must be an explicit config decision.
	if !h.pfVerifier.VerifySignature(params, h.pfPassphrase) {
		h.log.WarnContext(r.Context(), "payfast: signature invalid")
		return
	}
	// Sandbox flag is sourced from config — never hardcoded to false.
	if !h.pfVerifier.ValidateWithServer(body, h.pfSandbox) {
		h.log.WarnContext(r.Context(), "payfast: server validation failed")
		return
	}
	if params["payment_status"] != "COMPLETE" {
		h.log.InfoContext(r.Context(), "payfast: non-complete status, ignoring",
			slog.String("status", params["payment_status"]))
		return
	}

	if err := h.invoices.MarkPaidFromPayFast(
		r.Context(),
		params["m_payment_id"],
		params["pf_payment_id"],
	); err != nil {
		h.log.ErrorContext(r.Context(), "payfast: mark paid failed",
			slog.String("invoice_id", params["m_payment_id"]),
			slog.String("err", err.Error()),
		)
	}
}

// SendGridEvents godoc — POST /webhooks/sendgrid
// Handles open/click/bounce tracking events from SendGrid's Event Webhook.
func (h *WebhookHandler) SendGridEvents(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)

	body, err := io.ReadAll(r.Body)
	if err != nil {
		return
	}

	var events []struct {
		Event      string `json:"event"`
		CustomArgs struct {
			OpenToken string `json:"open_token"`
		} `json:"custom_args"`
	}
	if err := json.Unmarshal(body, &events); err != nil {
		return
	}

	for _, e := range events {
		if e.CustomArgs.OpenToken == "" {
			continue
		}
		rem, err := h.reminders.GetReminderByOpenToken(r.Context(), e.CustomArgs.OpenToken)
		if err != nil {
			continue
		}
		var evtType domain.ReminderEventType
		switch e.Event {
		case "open":
			evtType = domain.ReminderEventOpened
		case "click":
			evtType = domain.ReminderEventClicked
		case "bounce", "blocked":
			evtType = domain.ReminderEventBounced
		default:
			continue
		}
		meta, _ := json.Marshal(map[string]string{"sendgrid_event": e.Event})
		_ = h.reminders.RecordEvent(r.Context(), rem.ID, rem.InvoiceID, evtType, meta)
	}
}

// TrackOpen godoc — GET /track/open/{token}
// Returns a 1×1 transparent GIF and records an open event.
func (h *WebhookHandler) TrackOpen(w http.ResponseWriter, r *http.Request) {
	// Pixel first — don't let tracking failures delay the response.
	w.Header().Set("Content-Type", "image/gif")
	w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(transparentGIF)

	token := chi.URLParam(r, "token")
	if token == "" {
		return
	}
	rem, err := h.reminders.GetReminderByOpenToken(r.Context(), token)
	if err != nil {
		return
	}
	meta, _ := json.Marshal(map[string]string{"user_agent": r.UserAgent()})
	_ = h.reminders.RecordEvent(r.Context(), rem.ID, rem.InvoiceID, domain.ReminderEventOpened, meta)
}

// TrackClick godoc — GET /track/click/{token}
// Records a click event and redirects the client to the PayFast payment page.
func (h *WebhookHandler) TrackClick(w http.ResponseWriter, r *http.Request) {
	token := chi.URLParam(r, "token")

	inv, err := h.invoices.GetByClickToken(r.Context(), token)
	if err != nil {
		http.NotFound(w, r)
		return
	}
	if inv.IsPaid() {
		http.Error(w, "invoice already paid", http.StatusGone)
		return
	}

	meta, _ := json.Marshal(map[string]string{"user_agent": r.UserAgent()})
	// A click token is scoped to an invoice, not a specific reminder — there is
	// no reminder ID available here. uuid.Nil is used explicitly so event queries
	// that join on reminder_id are not corrupted with a spurious invoice ID.
	_ = h.reminders.RecordEvent(r.Context(), uuid.Nil, inv.ID, domain.ReminderEventClicked, meta)

	redirectURL, err := payfast.CheckoutURL(payfast.CheckoutConfig{
		MerchantID:  h.pfMerchantID,
		MerchantKey: h.pfMerchantKey,
		Passphrase:  h.pfPassphrase,
		NotifyURL:   h.appBaseURL + "/webhooks/payfast",
		Sandbox:     h.pfSandbox,
	}, inv)
	if err != nil {
		h.log.ErrorContext(r.Context(), "payfast: build checkout url failed",
			slog.String("invoice_id", inv.ID.String()),
			slog.String("err", err.Error()))
		http.Error(w, "payment link unavailable", http.StatusInternalServerError)
		return
	}
	http.Redirect(w, r, redirectURL, http.StatusFound)
}

// flattenValues converts url.Values to map[string]string (first value per key).
func flattenValues(v url.Values) map[string]string {
	m := make(map[string]string, len(v))
	for k, vals := range v {
		if len(vals) > 0 {
			m[k] = vals[0]
		}
	}
	return m
}

// proxyRealIP reads the real client IP, trusting the X-Forwarded-For header
// set by a trusted reverse proxy (nginx/Caddy).
func proxyRealIP(r *http.Request) string {
	if ip := r.Header.Get("X-Forwarded-For"); ip != "" {
		return ip
	}
	return r.RemoteAddr
}

// transparentGIF is a 1×1 transparent GIF in binary form.
var transparentGIF = []byte{
	0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00,
	0x01, 0x00, 0x80, 0x00, 0x00, 0xff, 0xff, 0xff,
	0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x00,
	0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00,
	0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
	0x01, 0x00, 0x3b,
}
