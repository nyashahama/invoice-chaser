package api

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"

	"github.com/nyashahama/invoice-chaser-backend/internal/api/handler"
	"github.com/nyashahama/invoice-chaser-backend/internal/api/middleware"
	"github.com/nyashahama/invoice-chaser-backend/internal/service"
)

// RouterConfig holds all dependencies the router needs to wire up handlers.
type RouterConfig struct {
	JWTSecret      string
	AllowedOrigins []string
	Log            *slog.Logger
	RefreshExpiry  time.Duration
	CookieSecure   bool
	CookieSameSite http.SameSite

	// Services
	Invoices  *service.InvoiceService
	Reminders *service.ReminderService
	Users     *service.UserService
	Scheduler *service.SchedulerService
	Optimizer *service.CollectionOptimizer

	// PayFast — sourced from config.Config, never hardcoded.
	PayFastVerifier    handler.PayFastVerifier
	PayFastMerchantID  string
	PayFastMerchantKey string
	PayFastPassphrase  string // config.PayFastPassphrase; may be empty
	PayFastSandbox     bool   // config.PayFastSandbox
	AppBaseURL         string
}

// NewRouter builds and returns the fully configured chi router.
func NewRouter(cfg RouterConfig) http.Handler {
	r := chi.NewRouter()

	// ── Global middleware ────────────────────────────────────────────────────
	r.Use(middleware.RequestID)
	r.Use(middleware.Logger(cfg.Log))
	r.Use(middleware.Recoverer(cfg.Log))
	r.Use(middleware.CORS(cfg.AllowedOrigins))
	r.Use(chimw.StripSlashes)

	// ── Handler instances ────────────────────────────────────────────────────
	authH := handler.NewAuthHandler(cfg.Users, cfg.RefreshExpiry, cfg.CookieSecure, cfg.CookieSameSite)
	userH := handler.NewUserHandler(cfg.Users)
	invoiceH := handler.NewInvoiceHandler(cfg.Invoices, cfg.Reminders, cfg.Optimizer)
	remH := handler.NewReminderHandler(cfg.Invoices, cfg.Reminders)
	webhookH := handler.NewWebhookHandler(
		cfg.Invoices,
		cfg.Reminders,
		cfg.PayFastVerifier,
		cfg.PayFastMerchantID,
		cfg.PayFastMerchantKey,
		cfg.PayFastPassphrase,
		cfg.PayFastSandbox,
		cfg.AppBaseURL,
		cfg.Log,
	)

	globalRL := middleware.GlobalRateLimiter()
	authRL := middleware.AuthRateLimiter()
	auth := middleware.Authenticate(cfg.JWTSecret)

	// ── Health checks ────────────────────────────────────────────────────────
	r.Get("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	})
	r.Get("/readyz", func(w http.ResponseWriter, r *http.Request) {
		select {
		case <-cfg.Scheduler.Ready():
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(`{"status":"ready"}`))
		default:
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusServiceUnavailable)
			_, _ = w.Write([]byte(`{"status":"starting"}`))
		}
	})

	// ── Auth routes — rate-limited, no JWT ───────────────────────────────────
	r.Group(func(r chi.Router) {
		r.Use(globalRL.Limit)
		r.Use(authRL.Limit)
		r.Post("/api/v1/auth/register", authH.Register)
		r.Post("/api/v1/auth/login", authH.Login)
		r.Post("/api/v1/auth/refresh", authH.Refresh)
		r.Post("/api/v1/auth/logout", authH.Logout)
	})

	// ── Protected routes — JWT required ──────────────────────────────────────
	r.Group(func(r chi.Router) {
		r.Use(globalRL.Limit)
		r.Use(auth)

		// Users
		r.Get("/api/v1/users/me", userH.Me)
		r.Patch("/api/v1/users/me", userH.UpdateMe)
		r.Post("/api/v1/users/me/password", userH.ChangePassword)

		// Invoices
		r.Get("/api/v1/invoices", invoiceH.List)
		r.Post("/api/v1/invoices", invoiceH.Create)
		r.Get("/api/v1/invoices/{id}", invoiceH.Get)
		r.Patch("/api/v1/invoices/{id}", invoiceH.Update)
		r.Delete("/api/v1/invoices/{id}", invoiceH.Delete)
		r.Post("/api/v1/invoices/{id}/pay", invoiceH.Pay)
		r.Get("/api/v1/invoices/{id}/events", invoiceH.Events)
		r.Post("/api/v1/invoices/{id}/optimizer/apply", invoiceH.ApplyOptimizer)

		// Sequences
		r.Get("/api/v1/invoices/{id}/sequence", remH.GetSequence)
		r.Post("/api/v1/invoices/{id}/sequence", remH.CreateSequence)
		r.Patch("/api/v1/invoices/{id}/sequence", remH.UpdateSequence)
		r.Delete("/api/v1/invoices/{id}/sequence", remH.DeleteSequence)

		// Reminders
		r.Get("/api/v1/reminders/{id}", remH.GetReminder)
		r.Post("/api/v1/reminders/{id}/send-now", remH.SendNow)
		r.Post("/api/v1/reminders/{id}/regenerate", remH.Regenerate)
	})

	// ── Webhooks — server-to-server, no JWT, no rate limit ──────────────────
	r.Group(func(r chi.Router) {
		r.Post("/webhooks/payfast", webhookH.PayFastITN)
		r.Post("/webhooks/sendgrid", webhookH.SendGridEvents)
	})

	// ── Tracking — no auth, no rate limit ───────────────────────────────────
	r.Get("/track/open/{token}", webhookH.TrackOpen)
	r.Get("/track/click/{token}", webhookH.TrackClick)

	return r
}
