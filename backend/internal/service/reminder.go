package service

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"

	db "github.com/nyashahama/invoice-chaser-backend/db/gen"
	"github.com/nyashahama/invoice-chaser-backend/internal/domain"
)

// ReminderService manages reminder sequences and individual reminder state.
type ReminderService struct {
	q   db.Querier
	log *slog.Logger
}

func NewReminderService(q db.Querier, log *slog.Logger) *ReminderService {
	return &ReminderService{q: q, log: log}
}

// BuildSequenceParams is the input for creating a reminder sequence on an invoice.
type BuildSequenceParams struct {
	InvoiceID    uuid.UUID
	UserID       uuid.UUID // used to verify invoice ownership before building
	Tone         domain.Tone
	IntervalDays []int32
	MaxReminders int
}

// BuildSequence creates a ReminderSequence and all its Reminder rows for an invoice.
// The invoice must be in "active" status. Only one sequence per invoice is allowed.
func (s *ReminderService) BuildSequence(ctx context.Context, p BuildSequenceParams, dueDate time.Time) (domain.ReminderSequence, error) {
	if !p.Tone.IsValid() {
		return domain.ReminderSequence{}, fmt.Errorf("%w: invalid tone %q", domain.ErrValidation, p.Tone)
	}
	if len(p.IntervalDays) == 0 {
		return domain.ReminderSequence{}, fmt.Errorf("%w: interval_days must not be empty", domain.ErrValidation)
	}
	if p.MaxReminders <= 0 {
		p.MaxReminders = 4
	}

	// Check for existing sequence — one per invoice.
	if _, err := s.q.GetSequenceByInvoiceID(ctx, p.InvoiceID); err == nil {
		return domain.ReminderSequence{}, domain.ErrSequenceExists
	}

	seq, err := s.q.CreateReminderSequence(ctx, db.CreateReminderSequenceParams{
		InvoiceID:    p.InvoiceID,
		Tone:         string(p.Tone),
		IntervalDays: p.IntervalDays,
		MaxReminders: int32(p.MaxReminders),
	})
	if err != nil {
		return domain.ReminderSequence{}, fmt.Errorf("create sequence: %w", err)
	}

	domSeq := domain.SequenceFromDB(seq)
	scheduledDates := domSeq.ScheduledDates(dueDate)

	for i, t := range scheduledDates {
		_, err := s.q.CreateReminder(ctx, db.CreateReminderParams{
			InvoiceID:        p.InvoiceID,
			SequenceID:       seq.ID,
			SequencePosition: int32(i + 1),
			Tone:             string(p.Tone),
			ScheduledFor:     pgtype.Timestamptz{Time: t.UTC(), Valid: true},
		})
		if err != nil {
			return domain.ReminderSequence{}, fmt.Errorf("create reminder %d: %w", i+1, err)
		}
	}

	s.log.InfoContext(ctx, "reminder sequence built",
		slog.String("invoice_id", p.InvoiceID.String()),
		slog.String("sequence_id", seq.ID.String()),
		slog.Int("reminders", len(scheduledDates)),
	)
	return domSeq, nil
}

// GetSequence returns the sequence config and all reminders for an invoice.
func (s *ReminderService) GetSequence(ctx context.Context, invoiceID uuid.UUID) (domain.ReminderSequence, []domain.Reminder, error) {
	seqRow, err := s.q.GetSequenceByInvoiceID(ctx, invoiceID)
	if err != nil {
		return domain.ReminderSequence{}, nil, mapNotFound(err, "sequence")
	}

	reminderRows, err := s.q.ListRemindersByInvoice(ctx, invoiceID)
	if err != nil {
		return domain.ReminderSequence{}, nil, fmt.Errorf("list reminders: %w", err)
	}

	reminders := make([]domain.Reminder, len(reminderRows))
	for i, r := range reminderRows {
		reminders[i] = domain.ReminderFromDB(r)
	}
	return domain.SequenceFromDB(seqRow), reminders, nil
}

// UpdateSequenceParams carries the patchable sequence fields.
type UpdateSequenceParams struct {
	SequenceID   uuid.UUID
	InvoiceID    uuid.UUID
	DueDate      time.Time  // needed to recompute reminder dates
	Tone         *domain.Tone
	IntervalDays []int32
	MaxReminders *int
}

// UpdateSequence updates tone/schedule on an active sequence.
// Cancels all pending reminders and rebuilds them from the new config.
// Already-sent reminders are untouched.
func (s *ReminderService) UpdateSequence(ctx context.Context, p UpdateSequenceParams) (domain.ReminderSequence, error) {
	// Cancel all pending reminders for this sequence.
	if err := s.q.CancelPendingRemindersForSequence(ctx, p.SequenceID); err != nil {
		return domain.ReminderSequence{}, fmt.Errorf("cancel pending reminders: %w", err)
	}

	arg := db.UpdateSequenceParams{ID: p.SequenceID}
	if p.Tone != nil {
		if !p.Tone.IsValid() {
			return domain.ReminderSequence{}, fmt.Errorf("%w: invalid tone", domain.ErrValidation)
		}
		arg.Tone = pgtype.Text{String: string(*p.Tone), Valid: true}
	}
	if len(p.IntervalDays) > 0 {
		arg.IntervalDays = p.IntervalDays
	}
	if p.MaxReminders != nil {
		arg.MaxReminders = pgtype.Int4{Int32: int32(*p.MaxReminders), Valid: true}
	}

	seqRow, err := s.q.UpdateSequence(ctx, arg)
	if err != nil {
		return domain.ReminderSequence{}, fmt.Errorf("update sequence: %w", err)
	}

	domSeq := domain.SequenceFromDB(seqRow)

	// Determine how many reminders have already been sent so we start from
	// the correct position in the new schedule.
	existingRows, err := s.q.ListRemindersByInvoice(ctx, p.InvoiceID)
	if err != nil {
		return domain.ReminderSequence{}, fmt.Errorf("list reminders: %w", err)
	}

	sentCount := 0
	for _, r := range existingRows {
		if r.Status == string(domain.ReminderStatusSent) {
			sentCount++
		}
	}

	// Rebuild reminders from current position onward.
	scheduledDates := domSeq.ScheduledDates(p.DueDate)
	for i := sentCount; i < len(scheduledDates); i++ {
		_, err := s.q.CreateReminder(ctx, db.CreateReminderParams{
			InvoiceID:        p.InvoiceID,
			SequenceID:       seqRow.ID,
			SequencePosition: int32(i + 1),
			Tone:             string(domSeq.Tone),
			ScheduledFor:     pgtype.Timestamptz{Time: scheduledDates[i].UTC(), Valid: true},
		})
		if err != nil {
			return domain.ReminderSequence{}, fmt.Errorf("rebuild reminder %d: %w", i+1, err)
		}
	}

	s.log.InfoContext(ctx, "sequence updated and reminders rebuilt",
		slog.String("sequence_id", p.SequenceID.String()),
		slog.Int("sent_so_far", sentCount),
		slog.Int("rebuilt", len(scheduledDates)-sentCount),
	)
	return domSeq, nil
}

// CancelAll deactivates the sequence and cancels all pending reminders.
func (s *ReminderService) CancelAll(ctx context.Context, invoiceID uuid.UUID) error {
	if err := s.q.DeactivateSequence(ctx, invoiceID); err != nil {
		return fmt.Errorf("deactivate sequence: %w", err)
	}
	if err := s.q.CancelPendingRemindersForInvoice(ctx, invoiceID); err != nil {
		return fmt.Errorf("cancel reminders: %w", err)
	}
	s.log.InfoContext(ctx, "sequence cancelled", slog.String("invoice_id", invoiceID.String()))
	return nil
}

// GetReminder returns a single reminder by ID.
func (s *ReminderService) GetReminder(ctx context.Context, id uuid.UUID) (domain.Reminder, error) {
	row, err := s.q.GetReminderByID(ctx, id)
	if err != nil {
		return domain.Reminder{}, mapNotFound(err, "reminder")
	}
	return domain.ReminderFromDB(row), nil
}

// GetReminderByOpenToken looks up a reminder by its open-tracking token.
func (s *ReminderService) GetReminderByOpenToken(ctx context.Context, token string) (domain.Reminder, error) {
	row, err := s.q.GetReminderByOpenToken(ctx, token)
	if err != nil {
		return domain.Reminder{}, mapNotFound(err, "reminder")
	}
	return domain.ReminderFromDB(row), nil
}

// GetDueReminders fetches up to 50 pending reminders ready to send,
// locking them via FOR UPDATE SKIP LOCKED.
func (s *ReminderService) GetDueReminders(ctx context.Context) ([]domain.Reminder, error) {
	rows, err := s.q.GetDueRemindersForUpdate(ctx)
	if err != nil {
		return nil, fmt.Errorf("get due reminders: %w", err)
	}
	reminders := make([]domain.Reminder, len(rows))
	for i, r := range rows {
		reminders[i] = domain.ReminderFromDB(r)
	}
	return reminders, nil
}

// ScheduleNow sets a pending reminder's scheduled_for to now so the scheduler
// dispatches it on its next tick.
//
// This is the correct mechanism for "send immediately" — the scheduler owns
// the full send lifecycle (lock → generate → send → record). The handler must
// never call MarkSending directly, as holding that lock without completing the
// send leaves the row permanently stuck in the "sending" state.
func (s *ReminderService) ScheduleNow(ctx context.Context, id uuid.UUID) error {
	err := s.q.RescheduleReminder(ctx, db.RescheduleReminderParams{
		ID:           id,
		ScheduledFor: pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true},
	})
	if err != nil {
		return fmt.Errorf("schedule now: %w", err)
	}
	s.log.InfoContext(ctx, "reminder rescheduled to now",
		slog.String("reminder_id", id.String()))
	return nil
}

// MarkSending sets a reminder to "sending" status as the idempotency guard
// before calling OpenAI. Returns error if the row was already claimed.
func (s *ReminderService) MarkSending(ctx context.Context, id uuid.UUID) (domain.Reminder, error) {
	row, err := s.q.MarkReminderSending(ctx, id)
	if err != nil {
		return domain.Reminder{}, fmt.Errorf("mark sending: %w", err)
	}
	return domain.ReminderFromDB(row), nil
}

// MarkSentParams carries the generated email content and token usage.
type MarkSentParams struct {
	ID                     uuid.UUID
	Subject                string
	BodyText               string
	BodyHTML               string
	OpenAIPromptTokens     int32
	OpenAICompletionTokens int32
}

// MarkSent stores generated email content and marks the reminder as sent.
func (s *ReminderService) MarkSent(ctx context.Context, p MarkSentParams) (domain.Reminder, error) {
	row, err := s.q.MarkReminderSent(ctx, db.MarkReminderSentParams{
		ID:                     p.ID,
		Subject:                pgtype.Text{String: p.Subject, Valid: true},
		BodyText:               pgtype.Text{String: p.BodyText, Valid: true},
		BodyHtml:               pgtype.Text{String: p.BodyHTML, Valid: true},
		OpenaiPromptTokens:     pgtype.Int4{Int32: p.OpenAIPromptTokens, Valid: true},
		OpenaiCompletionTokens: pgtype.Int4{Int32: p.OpenAICompletionTokens, Valid: true},
	})
	if err != nil {
		return domain.Reminder{}, fmt.Errorf("mark sent: %w", err)
	}
	return domain.ReminderFromDB(row), nil
}

// MarkFailed sets a reminder to "failed" status after all retries are exhausted.
func (s *ReminderService) MarkFailed(ctx context.Context, id uuid.UUID) error {
	return s.q.MarkReminderFailed(ctx, id)
}

// RecordEvent appends an event to the reminder_events audit log.
func (s *ReminderService) RecordEvent(ctx context.Context, reminderID, invoiceID uuid.UUID, eventType domain.ReminderEventType, metadata []byte) error {
	_, err := s.q.CreateReminderEvent(ctx, db.CreateReminderEventParams{
		ReminderID: reminderID,
		InvoiceID:  invoiceID,
		EventType:  string(eventType),
		Metadata:   metadata,
	})
	return err
}

// GetEvents returns the full event log for an invoice.
func (s *ReminderService) GetEvents(ctx context.Context, invoiceID uuid.UUID) ([]domain.ReminderEvent, error) {
	rows, err := s.q.ListEventsByInvoice(ctx, invoiceID)
	if err != nil {
		return nil, fmt.Errorf("list events: %w", err)
	}
	events := make([]domain.ReminderEvent, len(rows))
	for i, r := range rows {
		events[i] = domain.ReminderEventFromDB(r)
	}
	return events, nil
}

// ResetStuckReminders resets any "sending" reminders older than 5 minutes
// back to "pending" for recovery after a crash.
func (s *ReminderService) ResetStuckReminders(ctx context.Context) error {
	return s.q.ResetStuckSendingReminders(ctx)
}