package domain

import (
	"time"

	"github.com/google/uuid"
)

// ReminderStatus is the lifecycle state of a single scheduled email send.
type ReminderStatus string

const (
	ReminderStatusPending   ReminderStatus = "pending"
	ReminderStatusSending   ReminderStatus = "sending" // idempotency lock held
	ReminderStatusSent      ReminderStatus = "sent"
	ReminderStatusFailed    ReminderStatus = "failed"
	ReminderStatusCancelled ReminderStatus = "cancelled"
)

func (s ReminderStatus) String() string { return string(s) }

func (s ReminderStatus) IsValid() bool {
	switch s {
	case ReminderStatusPending, ReminderStatusSending, ReminderStatusSent,
		ReminderStatusFailed, ReminderStatusCancelled:
		return true
	}
	return false
}

// Tone controls the AI prompt injected when generating the email.
type Tone string

const (
	TonePolite Tone = "polite"
	ToneFirm   Tone = "firm"
	ToneFinal  Tone = "final"
)

func (t Tone) String() string { return string(t) }

func (t Tone) IsValid() bool {
	switch t {
	case TonePolite, ToneFirm, ToneFinal:
		return true
	}
	return false
}

// ToneGuide returns the instruction injected into the OpenAI prompt for this tone.
func (t Tone) ToneGuide() string {
	switch t {
	case TonePolite:
		return "Warm, friendly, professional. Assume they simply forgot. No pressure language. " +
			"Offer help if there is an issue. Use the client's first name."
	case ToneFirm:
		return "Direct and clear. Professional but no-nonsense. Reference the overdue duration. " +
			"State that prompt payment is expected. No threats, but no fluff."
	case ToneFinal:
		return "Serious and final in tone. Non-negotiable. Clearly state this is the final " +
			"communication before the matter is escalated. Include urgency without being aggressive."
	default:
		return ""
	}
}

// Reminder is a single scheduled email send within a sequence.
// One row = one email attempt.
type Reminder struct {
	ID               uuid.UUID
	InvoiceID        uuid.UUID
	SequenceID       uuid.UUID
	SequencePosition int    // 1-based index within the sequence
	Tone             Tone
	ScheduledFor     time.Time
	Status           ReminderStatus

	// Populated after AI generation, before send.
	Subject  string
	BodyText string
	BodyHTML string

	// Tracking
	OpenToken string

	// OpenAI cost tracking
	OpenAIPromptTokens     int
	OpenAICompletionTokens int

	SentAt    *time.Time
	CreatedAt time.Time
	UpdatedAt time.Time
}

// IsDue reports whether this reminder should be dispatched now.
func (r *Reminder) IsDue() bool {
	return r.Status == ReminderStatusPending && !time.Now().Before(r.ScheduledFor)
}

// TotalTokens returns the total OpenAI tokens used for this reminder.
func (r *Reminder) TotalTokens() int {
	return r.OpenAIPromptTokens + r.OpenAICompletionTokens
}

// ReminderSequence is the configuration record for a chain of reminders
// attached to one invoice. One invoice has at most one sequence.
type ReminderSequence struct {
	ID           uuid.UUID
	InvoiceID    uuid.UUID
	Tone         Tone
	IntervalDays []int32 // e.g. [1, 7, 14, 30] — days after invoice.DueDate
	MaxReminders int
	Active       bool
	CreatedAt    time.Time
}

// ScheduledDates computes the absolute UTC send times for each reminder
// in the sequence, based on the invoice due date.
func (s *ReminderSequence) ScheduledDates(dueDate time.Time) []time.Time {
	cap := s.MaxReminders
	if len(s.IntervalDays) < cap {
		cap = len(s.IntervalDays)
	}
	dates := make([]time.Time, cap)
	for i := 0; i < cap; i++ {
		dates[i] = dueDate.AddDate(0, 0, int(s.IntervalDays[i]))
	}
	return dates
}

// ReminderEventType is the kind of tracking event recorded in reminder_events.
type ReminderEventType string

const (
	ReminderEventSent      ReminderEventType = "sent"
	ReminderEventOpened    ReminderEventType = "opened"
	ReminderEventClicked   ReminderEventType = "clicked"
	ReminderEventBounced   ReminderEventType = "bounced"
	ReminderEventFailed    ReminderEventType = "failed"
	ReminderEventCancelled ReminderEventType = "cancelled"
)

func (e ReminderEventType) String() string { return string(e) }

func (e ReminderEventType) IsValid() bool {
	switch e {
	case ReminderEventSent, ReminderEventOpened, ReminderEventClicked,
		ReminderEventBounced, ReminderEventFailed, ReminderEventCancelled:
		return true
	}
	return false
}

// ReminderEvent is an append-only audit log entry for a reminder.
type ReminderEvent struct {
	ID         uuid.UUID
	ReminderID uuid.UUID
	InvoiceID  uuid.UUID
	EventType  ReminderEventType
	Metadata   map[string]any // flexible payload (bounce reason, click URL, etc.)
	OccurredAt time.Time
}