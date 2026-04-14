package config

import (
	"errors"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

// Config holds every runtime setting for the application.
// All values are loaded once at startup from environment variables.
// Zero values are never valid — Load returns an error if a required field
// is missing.
type Config struct {
	// ── Server ──────────────────────────────────────────────────────────────
	HTTPAddr        string        // e.g. ":8080"
	AppBaseURL      string        // e.g. "https://app.invoicechaser.co.za" (no trailing slash)
	ShutdownTimeout time.Duration // graceful shutdown window

	// ── Database ────────────────────────────────────────────────────────────
	DatabaseURL     string // postgres://user:pass@host:5432/dbname?sslmode=...
	DBMaxConns      int32  // pgxpool max_conns (default 20)
	DBMinConns      int32  // pgxpool min_conns (default 2)
	DBConnTimeout   time.Duration

	// ── Auth / JWT ───────────────────────────────────────────────────────────
	JWTSecret      string        // HS256 signing key — must be ≥ 32 bytes
	JWTExpiry      time.Duration // access token lifetime (default 15m)
	RefreshExpiry  time.Duration // refresh token lifetime (default 7d)

	// ── OpenAI ──────────────────────────────────────────────────────────────
	OpenAIAPIKey   string
	OpenAIMaxTokens int // per-call cap (default 500)

	// ── PayFast ─────────────────────────────────────────────────────────────
	PayFastMerchantID  string
	PayFastMerchantKey string
	PayFastPassphrase  string // empty = not set (optional in PayFast sandbox)
	PayFastSandbox     bool   // true → use sandbox endpoint

	// ── Email (SMTP / Resend) ────────────────────────────────────────────────
	// Set EMAIL_DRIVER to "smtp" or "resend" (default "resend").
	EmailDriver   string
	ResendAPIKey  string // required when EMAIL_DRIVER=resend
	SMTPHost      string // required when EMAIL_DRIVER=smtp
	SMTPPort      int    // default 587
	SMTPUsername  string
	SMTPPassword  string
	EmailFromName string // e.g. "InvoiceChaser"
	EmailFromAddr string // e.g. "noreply@invoicechaser.co.za"

	// ── Scheduler ───────────────────────────────────────────────────────────
	SchedulerInterval time.Duration // how often to poll for due reminders (default 60s)

	// ── Observability ───────────────────────────────────────────────────────
	LogLevel   string // "debug" | "info" | "warn" | "error" (default "info")
	Env        string // "development" | "staging" | "production"
	SentryDSN  string // optional; empty disables Sentry
}

// Load reads all configuration from environment variables, applies defaults
// for optional fields, and validates that required fields are present.
// Returns a fully-populated *Config or an error listing every missing/invalid value.
func Load() (*Config, error) {
	l := &loader{}

	c := &Config{
		// ── Server
		HTTPAddr:        l.optional("HTTP_ADDR", ":8080"),
		AppBaseURL:      l.required("APP_BASE_URL"),
		ShutdownTimeout: l.duration("SHUTDOWN_TIMEOUT", 30*time.Second),

		// ── Database
		DatabaseURL:   l.required("DATABASE_URL"),
		DBMaxConns:    int32(l.intVal("DB_MAX_CONNS", 20)),
		DBMinConns:    int32(l.intVal("DB_MIN_CONNS", 2)),
		DBConnTimeout: l.duration("DB_CONN_TIMEOUT", 5*time.Second),

		// ── Auth
		JWTSecret:     l.required("JWT_SECRET"),
		JWTExpiry:     l.duration("JWT_EXPIRY", 15*time.Minute),
		RefreshExpiry: l.duration("REFRESH_EXPIRY", 7*24*time.Hour),

		// ── OpenAI
		OpenAIAPIKey:    l.required("OPENAI_API_KEY"),
		OpenAIMaxTokens: l.intVal("OPENAI_MAX_TOKENS", 500),

		// ── PayFast
		PayFastMerchantID:  l.required("PAYFAST_MERCHANT_ID"),
		PayFastMerchantKey: l.required("PAYFAST_MERCHANT_KEY"),
		PayFastPassphrase:  l.optional("PAYFAST_PASSPHRASE", ""),
		PayFastSandbox:     l.boolVal("PAYFAST_SANDBOX", false),

		// ── Email
		EmailDriver:   l.optional("EMAIL_DRIVER", "resend"),
		ResendAPIKey:  l.optional("RESEND_API_KEY", ""),
		SMTPHost:      l.optional("SMTP_HOST", ""),
		SMTPPort:      l.intVal("SMTP_PORT", 587),
		SMTPUsername:  l.optional("SMTP_USERNAME", ""),
		SMTPPassword:  l.optional("SMTP_PASSWORD", ""),
		EmailFromName: l.optional("EMAIL_FROM_NAME", "InvoiceChaser"),
		EmailFromAddr: l.required("EMAIL_FROM_ADDR"),

		// ── Scheduler
		SchedulerInterval: l.duration("SCHEDULER_INTERVAL", 60*time.Second),

		// ── Observability
		LogLevel:  l.optional("LOG_LEVEL", "info"),
		Env:       l.optional("ENV", "production"),
		SentryDSN: l.optional("SENTRY_DSN", ""),
	}

	// Collect env-loader errors first.
	if len(l.errs) > 0 {
		return nil, fmt.Errorf("config: missing required environment variables:\n  %s",
			strings.Join(l.errs, "\n  "))
	}

	// Cross-field validation.
	if err := validate(c); err != nil {
		return nil, err
	}

	return c, nil
}

// IsDevelopment reports whether the app is running in local/dev mode.
func (c *Config) IsDevelopment() bool { return c.Env == "development" }

// IsProduction reports whether the app is running in production mode.
func (c *Config) IsProduction() bool { return c.Env == "production" }

// ─── internal helpers ────────────────────────────────────────────────────────

type loader struct {
	errs []string
}

// required returns the value of key or records a missing-variable error.
func (l *loader) required(key string) string {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		l.errs = append(l.errs, key)
	}
	return v
}

// optional returns the value of key, falling back to def if unset or blank.
func (l *loader) optional(key, def string) string {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		return v
	}
	return def
}

// intVal parses key as a base-10 integer, returning def if unset.
// Panics on a non-numeric value so misconfigured deployments fail fast.
func (l *loader) intVal(key string, def int) int {
	raw := strings.TrimSpace(os.Getenv(key))
	if raw == "" {
		return def
	}
	n, err := strconv.Atoi(raw)
	if err != nil {
		// Surface as a config error rather than a silent fallback.
		l.errs = append(l.errs, fmt.Sprintf("%s (invalid integer %q)", key, raw))
		return def
	}
	return n
}

// boolVal parses key as a boolean ("true"/"1"/"yes"), returning def if unset.
func (l *loader) boolVal(key string, def bool) bool {
	raw := strings.ToLower(strings.TrimSpace(os.Getenv(key)))
	if raw == "" {
		return def
	}
	switch raw {
	case "true", "1", "yes":
		return true
	case "false", "0", "no":
		return false
	default:
		l.errs = append(l.errs, fmt.Sprintf("%s (invalid boolean %q)", key, raw))
		return def
	}
}

// duration parses key as a Go duration string (e.g. "15m", "24h"), returning
// def if unset. Records an error for unparseable values.
func (l *loader) duration(key string, def time.Duration) time.Duration {
	raw := strings.TrimSpace(os.Getenv(key))
	if raw == "" {
		return def
	}
	d, err := time.ParseDuration(raw)
	if err != nil {
		l.errs = append(l.errs, fmt.Sprintf("%s (invalid duration %q)", key, raw))
		return def
	}
	return d
}

// ─── cross-field validation ──────────────────────────────────────────────────

func validate(c *Config) error {
	var errs []string

	if len(c.JWTSecret) < 32 {
		errs = append(errs, "JWT_SECRET must be at least 32 characters")
	}

	switch c.EmailDriver {
	case "resend":
		if c.ResendAPIKey == "" {
			errs = append(errs, "RESEND_API_KEY is required when EMAIL_DRIVER=resend")
		}
	case "smtp":
		if c.SMTPHost == "" {
			errs = append(errs, "SMTP_HOST is required when EMAIL_DRIVER=smtp")
		}
	default:
		errs = append(errs, fmt.Sprintf("EMAIL_DRIVER must be \"resend\" or \"smtp\", got %q", c.EmailDriver))
	}

	switch c.LogLevel {
	case "debug", "info", "warn", "error":
		// valid
	default:
		errs = append(errs, fmt.Sprintf("LOG_LEVEL must be debug|info|warn|error, got %q", c.LogLevel))
	}

	switch c.Env {
	case "development", "staging", "production":
		// valid
	default:
		errs = append(errs, fmt.Sprintf("ENV must be development|staging|production, got %q", c.Env))
	}

	if c.DBMaxConns < c.DBMinConns {
		errs = append(errs, "DB_MAX_CONNS must be ≥ DB_MIN_CONNS")
	}

	if len(errs) > 0 {
		return errors.New("config: validation failed:\n  " + strings.Join(errs, "\n  "))
	}
	return nil
}