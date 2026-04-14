package service

import (
	"context"
	"encoding/json"
	"log/slog"
	"sync"
	"time"

	"github.com/google/uuid"

	db "github.com/nyashahama/invoice-chaser-backend/db/gen"
	"github.com/nyashahama/invoice-chaser-backend/internal/domain"
)

// SchedulerService runs the background reminder dispatch loop.
// It is safe to run across multiple server instances — FOR UPDATE SKIP LOCKED
// in the DB query ensures each reminder is processed by exactly one worker.
type SchedulerService struct {
	q         db.Querier
	remSvc    *ReminderService
	emailSvc  *EmailService
	interval  time.Duration
	log       *slog.Logger
	ready     chan struct{} // closed once the first tick completes
	readyOnce sync.Once
}

func NewSchedulerService(
	q db.Querier,
	remSvc *ReminderService,
	emailSvc *EmailService,
	interval time.Duration,
	log *slog.Logger,
) *SchedulerService {
	if interval <= 0 {
		interval = 60 * time.Second
	}
	return &SchedulerService{
		q:        q,
		remSvc:   remSvc,
		emailSvc: emailSvc,
		interval: interval,
		log:      log,
		ready:    make(chan struct{}),
	}
}

// Start begins the scheduler loop. Blocks until ctx is cancelled.
// Call as: go scheduler.Start(ctx)
func (s *SchedulerService) Start(ctx context.Context) {
	s.log.InfoContext(ctx, "scheduler started", slog.Duration("interval", s.interval))

	// Reset any reminders stuck in "sending" from a previous crash.
	if err := s.remSvc.ResetStuckReminders(ctx); err != nil {
		s.log.WarnContext(ctx, "failed to reset stuck reminders on startup",
			slog.String("error", err.Error()))
	}

	ticker := time.NewTicker(s.interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			s.log.InfoContext(ctx, "scheduler stopped")
			return
		case <-ticker.C:
			s.dispatchDueReminders(ctx)
			s.readyOnce.Do(func() { close(s.ready) })
		}
	}
}

// Ready returns a channel that is closed once the scheduler has completed
// its first tick. Used by the /readyz health check.
func (s *SchedulerService) Ready() <-chan struct{} {
	return s.ready
}

// dispatchDueReminders fetches all due pending reminders and processes each
// concurrently, capped at 10 goroutines to match the OpenAI concurrency limit.
func (s *SchedulerService) dispatchDueReminders(ctx context.Context) {
	reminders, err := s.remSvc.GetDueReminders(ctx)
	if err != nil {
		s.log.ErrorContext(ctx, "failed to fetch due reminders", slog.String("error", err.Error()))
		return
	}
	if len(reminders) == 0 {
		return
	}

	s.log.InfoContext(ctx, "dispatching due reminders", slog.Int("count", len(reminders)))

	// Semaphore: max 10 concurrent OpenAI calls as per spec.
	sem := make(chan struct{}, 10)
	var wg sync.WaitGroup

	for _, rem := range reminders {
		rem := rem
		wg.Add(1)
		sem <- struct{}{}
		go func() {
			defer wg.Done()
			defer func() { <-sem }()
			s.processReminder(ctx, rem)
		}()
	}
	wg.Wait()
}

// processReminder handles a single reminder end-to-end:
// lock → load context → generate → store → record event.
func (s *SchedulerService) processReminder(ctx context.Context, rem domain.Reminder) {
	log := s.log.With(
		slog.String("reminder_id", rem.ID.String()),
		slog.String("invoice_id", rem.InvoiceID.String()),
		slog.Int("position", rem.SequencePosition),
	)

	// Step 1: Claim the row. Only one worker wins; others get no rows back.
	locked, err := s.remSvc.MarkSending(ctx, rem.ID)
	if err != nil {
		log.WarnContext(ctx, "reminder already claimed by another worker, skipping")
		return
	}

	// Step 2: Load invoice, user, sequence for prompt context.
	invRow, err := s.q.GetInvoiceByID(ctx, rem.InvoiceID)
	if err != nil {
		log.ErrorContext(ctx, "failed to load invoice", slog.String("error", err.Error()))
		s.fail(ctx, locked.ID, rem.InvoiceID, err)
		return
	}
	inv := domain.InvoiceFromDB(invRow)

	// Guard: invoice may have been paid between scheduler query and now.
	if inv.IsPaid() {
		log.InfoContext(ctx, "invoice already paid, cancelling reminder")
		_ = s.remSvc.MarkFailed(ctx, locked.ID)
		return
	}

	userRow, err := s.q.GetUserByID(ctx, inv.UserID)
	if err != nil {
		log.ErrorContext(ctx, "failed to load user", slog.String("error", err.Error()))
		s.fail(ctx, locked.ID, rem.InvoiceID, err)
		return
	}

	seqRow, err := s.q.GetSequenceByInvoiceID(ctx, rem.InvoiceID)
	if err != nil {
		log.ErrorContext(ctx, "failed to load sequence", slog.String("error", err.Error()))
		s.fail(ctx, locked.ID, rem.InvoiceID, err)
		return
	}

	genParams := GenerateEmailParams{
		User:     domain.UserFromDB(userRow),
		Invoice:  inv,
		Reminder: locked,
		Sequence: domain.SequenceFromDB(seqRow),
	}

	// Step 3: Generate via OpenAI; fall back to static template on failure.
	result, err := s.emailSvc.GenerateWithAI(ctx, genParams)
	if err != nil {
		log.WarnContext(ctx, "openai generation failed, using fallback template",
			slog.String("error", err.Error()))
		result = s.emailSvc.FallbackEmail(genParams)
	}

	// Step 4: Persist generated content and flip status to "sent".
	sent, err := s.remSvc.MarkSent(ctx, MarkSentParams{
		ID:                     locked.ID,
		Subject:                result.Subject,
		BodyText:               result.BodyText,
		BodyHTML:               result.BodyHTML,
		OpenAIPromptTokens:     result.OpenAIPromptTokens,
		OpenAICompletionTokens: result.OpenAICompletionTokens,
	})
	if err != nil {
		log.ErrorContext(ctx, "failed to mark reminder sent", slog.String("error", err.Error()))
		return
	}

	// Step 5: Append sent event to append-only audit log.
	meta := encodeMetadata(map[string]any{
		"subject":                  sent.Subject,
		"openai_prompt_tokens":     sent.OpenAIPromptTokens,
		"openai_completion_tokens": sent.OpenAICompletionTokens,
	})
	if err := s.remSvc.RecordEvent(ctx, sent.ID, sent.InvoiceID, domain.ReminderEventSent, meta); err != nil {
		log.WarnContext(ctx, "failed to record sent event", slog.String("error", err.Error()))
	}

	log.InfoContext(ctx, "reminder dispatched",
		slog.String("subject", sent.Subject),
		slog.Int("prompt_tokens", sent.OpenAIPromptTokens),
		slog.Int("completion_tokens", sent.OpenAICompletionTokens),
	)
}

// fail marks a reminder as failed and appends a failure event.
func (s *SchedulerService) fail(ctx context.Context, reminderID, invoiceID uuid.UUID, cause error) {
	_ = s.remSvc.MarkFailed(ctx, reminderID)
	meta := encodeMetadata(map[string]any{"error": cause.Error()})
	_ = s.remSvc.RecordEvent(ctx, reminderID, invoiceID, domain.ReminderEventFailed, meta)
}

// encodeMetadata safely marshals event metadata to JSON bytes.
// Returns nil on error — a missing metadata field is non-fatal.
func encodeMetadata(v any) []byte {
	b, err := json.Marshal(v)
	if err != nil {
		return nil
	}
	return b
}