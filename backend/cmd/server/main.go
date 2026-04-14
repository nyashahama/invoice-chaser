package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	db "github.com/nyashahama/invoice-chaser-backend/db/gen"
	api "github.com/nyashahama/invoice-chaser-backend/internal/api"
	"github.com/nyashahama/invoice-chaser-backend/internal/config"
	oai "github.com/nyashahama/invoice-chaser-backend/internal/openai"
	"github.com/nyashahama/invoice-chaser-backend/internal/payfast"
	"github.com/nyashahama/invoice-chaser-backend/internal/service"
)

func main() {
	// ── Logger (structured JSON, level from config) ───────────────────────────
	// Build a temporary info-level logger for the config/startup phase.
	// It is replaced with the configured level once cfg is loaded.
	log := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))

	// ── Config ───────────────────────────────────────────────────────────────
	cfg, err := config.Load()
	if err != nil {
		log.Error("startup: config invalid", slog.String("error", err.Error()))
		os.Exit(1)
	}

	// Replace bootstrap logger with the configured log level.
	log = newLogger(cfg.LogLevel)
	log.Info("config loaded",
		slog.String("env", cfg.Env),
		slog.String("addr", cfg.HTTPAddr),
	)

	// ── Database pool ─────────────────────────────────────────────────────────
	pool, err := buildPool(cfg)
	if err != nil {
		log.Error("startup: database connection failed", slog.String("error", err.Error()))
		os.Exit(1)
	}
	defer pool.Close()
	log.Info("database connected",
		slog.Int("max_conns", int(cfg.DBMaxConns)),
		slog.Int("min_conns", int(cfg.DBMinConns)),
	)

	// ── DB query layer (sqlc) ─────────────────────────────────────────────────
	queries := db.New(pool)

	// ── OpenAI client ─────────────────────────────────────────────────────────
	// Declared as oai.Completer (not *oai.Client) so EmailService never takes
	// a concrete dependency on the SDK, and tests can inject a fake Completer.
	var openaiClient oai.Completer = oai.New(cfg.OpenAIAPIKey, "", log) // model="" → GPT-4o

	// ── Email transport ───────────────────────────────────────────────────────
	mailer := buildMailer(cfg)

	// ── Services ──────────────────────────────────────────────────────────────
	invoiceSvc := service.NewInvoiceService(queries, log)

	reminderSvc := service.NewReminderService(queries, log)

	emailSvc := service.NewEmailService(
		openaiClient,
		mailer,
		cfg.EmailFromName,
		cfg.EmailFromAddr,
		cfg.OpenAIMaxTokens,
		cfg.AppBaseURL,
		log,
	)

	userSvc := service.NewUserService(
		queries,
		cfg.JWTSecret,
		cfg.JWTExpiry,
		cfg.RefreshExpiry,
		log,
	)

	schedulerSvc := service.NewSchedulerService(
		queries,
		reminderSvc,
		emailSvc,
		cfg.SchedulerInterval,
		log,
	)

	// ── PayFast verifier ──────────────────────────────────────────────────────
	pfVerifier := payfast.NewVerifier(nil, log)

	// ── HTTP router ───────────────────────────────────────────────────────────
	router := api.NewRouter(api.RouterConfig{
		JWTSecret:         cfg.JWTSecret,
		AllowedOrigins:    allowedOrigins(cfg),
		Log:               log,
		RefreshExpiry:     cfg.RefreshExpiry,
		Invoices:          invoiceSvc,
		Reminders:         reminderSvc,
		Users:             userSvc,
		Scheduler:         schedulerSvc,
		PayFastVerifier:   pfVerifier,
		PayFastPassphrase: cfg.PayFastPassphrase,
		PayFastSandbox:    cfg.PayFastSandbox,
	})

	srv := &http.Server{
		Addr:         cfg.HTTPAddr,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// ── Background scheduler ──────────────────────────────────────────────────
	// Use a separate cancelable context so we can stop the scheduler cleanly
	// before the HTTP server drains in-flight requests.
	schedCtx, stopScheduler := context.WithCancel(context.Background())
	defer stopScheduler()
	go schedulerSvc.Start(schedCtx)

	// ── Server start ──────────────────────────────────────────────────────────
	serverErr := make(chan error, 1)
	go func() {
		log.Info("http server listening", slog.String("addr", cfg.HTTPAddr))
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			serverErr <- fmt.Errorf("http server: %w", err)
		}
	}()

	// ── Graceful shutdown ─────────────────────────────────────────────────────
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	select {
	case sig := <-quit:
		log.Info("shutdown signal received", slog.String("signal", sig.String()))
	case err := <-serverErr:
		log.Error("server error", slog.String("error", err.Error()))
	}

	// 1. Stop the scheduler — no new work should start.
	stopScheduler()
	log.Info("scheduler stopped")

	// 2. Drain in-flight HTTP requests within the configured window.
	shutdownCtx, cancel := context.WithTimeout(context.Background(), cfg.ShutdownTimeout)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Error("graceful shutdown failed", slog.String("error", err.Error()))
		os.Exit(1)
	}

	log.Info("shutdown complete")
}

func buildMailer(cfg *config.Config) service.Mailer {
	switch cfg.EmailDriver {
	case "smtp":
		return service.NewSMTPMailer(cfg.SMTPHost, cfg.SMTPPort, cfg.SMTPUsername, cfg.SMTPPassword)
	default:
		return service.NewResendMailer(cfg.ResendAPIKey, nil)
	}
}

// ── helpers ───────────────────────────────────────────────────────────────────

// buildPool creates and validates a pgxpool connection pool from config.
func buildPool(cfg *config.Config) (*pgxpool.Pool, error) {
	poolCfg, err := pgxpool.ParseConfig(cfg.DatabaseURL)
	if err != nil {
		return nil, fmt.Errorf("parse database URL: %w", err)
	}

	poolCfg.MaxConns = cfg.DBMaxConns
	poolCfg.MinConns = cfg.DBMinConns
	poolCfg.MaxConnLifetime = 30 * time.Minute
	poolCfg.MaxConnIdleTime = 5 * time.Minute
	poolCfg.HealthCheckPeriod = 1 * time.Minute

	// Use a timeout for the initial connection so a bad DATABASE_URL fails
	// fast at startup rather than hanging indefinitely.
	ctx, cancel := context.WithTimeout(context.Background(), cfg.DBConnTimeout)
	defer cancel()

	pool, err := pgxpool.NewWithConfig(ctx, poolCfg)
	if err != nil {
		return nil, fmt.Errorf("create pool: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("ping database: %w", err)
	}

	return pool, nil
}

// newLogger creates a JSON slog.Logger at the given level string.
func newLogger(level string) *slog.Logger {
	var l slog.Level
	switch level {
	case "debug":
		l = slog.LevelDebug
	case "warn":
		l = slog.LevelWarn
	case "error":
		l = slog.LevelError
	default:
		l = slog.LevelInfo
	}
	return slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: l}))
}

// allowedOrigins builds the CORS origin list from config.
// In development, localhost variants are added automatically so the frontend
// dev server works without extra env config.
func allowedOrigins(cfg *config.Config) []string {
	origins := []string{cfg.AppBaseURL}
	if cfg.IsDevelopment() {
		origins = append(origins,
			"http://localhost:3000",
			"http://localhost:5173",
			"http://127.0.0.1:3000",
			"http://127.0.0.1:5173",
		)
	}
	return origins
}
