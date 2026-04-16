package service

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	db "github.com/nyashahama/invoice-chaser-backend/db/gen"
	"github.com/nyashahama/invoice-chaser-backend/internal/domain"
)

type CollectionOptimizer struct {
	q   db.Querier
	log *slog.Logger
	now func() time.Time
}

func NewCollectionOptimizer(q db.Querier, log *slog.Logger) *CollectionOptimizer {
	return &CollectionOptimizer{q: q, log: log, now: time.Now}
}

type EvaluateParams struct {
	Invoice   domain.Invoice
	Sequence  *domain.ReminderSequence
	Reminders []domain.Reminder
	Events    []domain.ReminderEvent
}

type eventSummary struct {
	sentCount   int
	openCount   int
	clickCount  int
	bounceCount int
	failedCount int
	lastSentAt  *time.Time
	lastEventAt *time.Time
}

func aggregateEvents(events []domain.ReminderEvent) eventSummary {
	var summary eventSummary
	for _, e := range events {
		if summary.lastEventAt == nil || e.OccurredAt.After(*summary.lastEventAt) {
			summary.lastEventAt = &e.OccurredAt
		}
		switch e.EventType {
		case domain.ReminderEventSent:
			summary.sentCount++
			summary.lastSentAt = &e.OccurredAt
		case domain.ReminderEventOpened:
			summary.openCount++
		case domain.ReminderEventClicked:
			summary.clickCount++
		case domain.ReminderEventBounced:
			summary.bounceCount++
		case domain.ReminderEventFailed:
			summary.failedCount++
		}
	}
	return summary
}

func computeRecommendedTone(current domain.Tone, daysOverdue int, summary eventSummary) domain.Tone {
	if summary.openCount >= 2 && summary.clickCount == 0 {
		if current == domain.TonePolite {
			return domain.ToneFirm
		}
		if current == domain.ToneFirm {
			return domain.ToneFinal
		}
	}
	if daysOverdue >= 30 && summary.clickCount == 0 && summary.openCount == 0 {
		return domain.ToneFinal
	}
	return current
}

func recommendedSendAt(now time.Time, inv domain.Invoice, summary eventSummary) *time.Time {
	daysOverdue := inv.DaysOverdue()
	if daysOverdue >= 30 && summary.sentCount == 0 {
		sendAt := now.Add(24 * time.Hour)
		return &sendAt
	}
	if summary.lastSentAt != nil {
		sinceLast := now.Sub(*summary.lastSentAt)
		if sinceLast < 48*time.Hour {
			sendAt := now.Add(48 * time.Hour)
			return &sendAt
		}
	}
	return nil
}

func (o *CollectionOptimizer) Evaluate(p EvaluateParams) domain.CollectionState {
	now := o.now()

	if p.Invoice.IsPaid() {
		return domain.CollectionState{
			RiskScore:       0,
			EngagementState: domain.CollectionEngagementPaid,
			NextBestAction:  domain.CollectionActionNone,
			RecommendedTone: domain.TonePolite,
			Reasons:         []domain.CollectionReason{{Code: "invoice_paid", Message: "Invoice has been paid"}},
			LastEvaluatedAt: now,
		}
	}

	summary := aggregateEvents(p.Events)
	daysOverdue := p.Invoice.DaysOverdue()

	var reasons []domain.CollectionReason
	var riskScore int
	var engagementState domain.CollectionEngagementState
	var nextBestAction domain.CollectionNextBestAction
	var recommendedTone domain.Tone

	currentTone := domain.TonePolite
	if p.Sequence != nil {
		currentTone = p.Sequence.Tone
	}
	recommendedTone = computeRecommendedTone(currentTone, daysOverdue, summary)

	if summary.bounceCount > 0 {
		riskScore = 85 + min(summary.bounceCount*5, 15)
		engagementState = domain.CollectionEngagementBounced
		nextBestAction = domain.CollectionActionFixEmail
		reasons = append(reasons, domain.CollectionReason{Code: "bounced_detected", Message: "Email bounced - email address may be invalid"})
	}

	if summary.failedCount >= 3 {
		if riskScore < 85 {
			riskScore = 85 + min(summary.failedCount*2, 15)
		}
		if nextBestAction == "" {
			nextBestAction = domain.CollectionActionFixEmail
		}
		reasons = append(reasons, domain.CollectionReason{Code: "repeated_failures", Message: "Multiple send failures - check email validity"})
	}

	if summary.clickCount > 0 && summary.lastEventAt != nil {
		hoursSinceClick := now.Sub(*summary.lastEventAt).Hours()
		if hoursSinceClick < 48 {
			riskScore = 45 + summary.openCount*3 + summary.clickCount*2
			if riskScore > 60 {
				riskScore = 60
			}
			engagementState = domain.CollectionEngagementClicked
			if nextBestAction == "" {
				nextBestAction = domain.CollectionActionWait
			}
			reasons = append(reasons, domain.CollectionReason{Code: "recent_click", Message: "Customer clicked recently - allow time to pay"})
			recommendedTone = currentTone
			if recommendedTone == domain.TonePolite {
				recommendedTone = domain.ToneFirm
			}
		}
	}

	if summary.openCount >= 2 && summary.clickCount == 0 && summary.bounceCount == 0 && summary.failedCount == 0 {
		riskScore = 70 + min(summary.openCount*5, 20)
		engagementState = domain.CollectionEngagementOpened
		if nextBestAction == "" {
			nextBestAction = domain.CollectionActionEscalateTone
		}
		reasons = append(reasons, domain.CollectionReason{Code: "multiple_opens_no_click", Message: "Opened multiple reminders but hasn't clicked or paid"})
	}

	if daysOverdue >= 30 && summary.clickCount == 0 && summary.openCount <= 1 && summary.bounceCount == 0 {
		riskScore = 90
		engagementState = domain.CollectionEngagementUnengaged
		if nextBestAction == "" {
			if summary.sentCount > 0 && summary.lastSentAt != nil && now.Sub(*summary.lastSentAt) > 72*time.Hour {
				nextBestAction = domain.CollectionActionSendNow
			} else {
				nextBestAction = domain.CollectionActionManualFollowUp
			}
		}
		reasons = append(reasons, domain.CollectionReason{Code: "long_overdue_unengaged", Message: "30+ days overdue with no engagement"})
		recommendedTone = domain.ToneFinal
	}

	if riskScore == 0 {
		riskScore = 30 + daysOverdue
		if riskScore > 80 {
			riskScore = 80
		}
	}

	if riskScore > 100 {
		riskScore = 100
	}
	if riskScore < 0 {
		riskScore = 0
	}

	if nextBestAction == "" {
		if daysOverdue > 14 {
			nextBestAction = domain.CollectionActionSendNow
			reasons = append(reasons, domain.CollectionReason{Code: "overdue_no_engagement", Message: "Overdue with no recent engagement"})
		} else {
			nextBestAction = domain.CollectionActionWait
			reasons = append(reasons, domain.CollectionReason{Code: "normal_collection", Message: "Normal collection flow"})
		}
	}

	if engagementState == "" {
		if summary.openCount > 0 {
			engagementState = domain.CollectionEngagementOpened
		} else {
			engagementState = domain.CollectionEngagementUnengaged
		}
	}

	metrics := domain.CollectionMetrics{
		ReminderCount: summary.sentCount,
		OpenCount:     summary.openCount,
		ClickCount:    summary.clickCount,
		FailedCount:   summary.failedCount,
		LastSentAt:    summary.lastSentAt,
	}

	return domain.CollectionState{
		RiskScore:         riskScore,
		EngagementState:   engagementState,
		NextBestAction:    nextBestAction,
		RecommendedTone:   recommendedTone,
		RecommendedSendAt: recommendedSendAt(now, p.Invoice, summary),
		Reasons:           reasons,
		Metrics:           metrics,
		LastEventAt:       summary.lastEventAt,
		LastEvaluatedAt:   now,
	}
}

func (o *CollectionOptimizer) RefreshInvoice(ctx context.Context, invoiceID uuid.UUID) (domain.CollectionState, error) {
	invoiceRow, err := o.q.GetInvoiceByID(ctx, invoiceID)
	if err != nil {
		return domain.CollectionState{}, fmt.Errorf("get invoice: %w", err)
	}
	inv := domain.InvoiceFromDB(invoiceRow)

	var seq *domain.ReminderSequence
	seqRow, err := o.q.GetSequenceByInvoiceID(ctx, invoiceID)
	if err == nil {
		domSeq := domain.SequenceFromDB(seqRow)
		seq = &domSeq
	}

	reminderRows, err := o.q.ListRemindersByInvoice(ctx, invoiceID)
	if err != nil {
		return domain.CollectionState{}, fmt.Errorf("list reminders: %w", err)
	}
	reminders := make([]domain.Reminder, len(reminderRows))
	for i, r := range reminderRows {
		reminders[i] = domain.ReminderFromDB(r)
	}

	eventRows, err := o.q.ListEventsByInvoice(ctx, invoiceID)
	if err != nil {
		return domain.CollectionState{}, fmt.Errorf("list events: %w", err)
	}
	events := make([]domain.ReminderEvent, len(eventRows))
	for i, e := range eventRows {
		events[i] = domain.ReminderEventFromDB(e)
	}

	state := o.Evaluate(EvaluateParams{
		Invoice:   inv,
		Sequence:  seq,
		Reminders: reminders,
		Events:    events,
	})

	reasonsJSON, err := json.Marshal(state.Reasons)
	if err != nil {
		return domain.CollectionState{}, fmt.Errorf("marshal reasons: %w", err)
	}

	metricsJSON, err := json.Marshal(state.Metrics)
	if err != nil {
		return domain.CollectionState{}, fmt.Errorf("marshal metrics: %w", err)
	}

	var recSendAt pgtype.Timestamptz
	if state.RecommendedSendAt != nil {
		recSendAt = pgtype.Timestamptz{Time: *state.RecommendedSendAt, Valid: true}
	}

	var lastEventAt pgtype.Timestamptz
	if state.LastEventAt != nil {
		lastEventAt = pgtype.Timestamptz{Time: *state.LastEventAt, Valid: true}
	}

	err = o.q.UpsertInvoiceCollectionState(ctx, db.UpsertInvoiceCollectionStateParams{
		InvoiceID:         invoiceID,
		RiskScore:         int32(state.RiskScore),
		EngagementState:   string(state.EngagementState),
		NextBestAction:    string(state.NextBestAction),
		RecommendedTone:   string(state.RecommendedTone),
		RecommendedSendAt: recSendAt,
		Reasons:           reasonsJSON,
		Metrics:           metricsJSON,
		LastEventAt:       lastEventAt,
		LastEvaluatedAt:   pgtype.Timestamptz{Time: state.LastEvaluatedAt, Valid: true},
		AppliedAt:         pgtype.Timestamptz{Time: o.now(), Valid: true},
	})
	if err != nil {
		return domain.CollectionState{}, fmt.Errorf("upsert collection state: %w", err)
	}

	return state, nil
}

func (o *CollectionOptimizer) MarkApplied(ctx context.Context, invoiceID uuid.UUID) error {
	return o.q.MarkCollectionStateApplied(ctx, invoiceID)
}

func (o *CollectionOptimizer) GetStoredState(ctx context.Context, invoiceID uuid.UUID) (*domain.CollectionState, error) {
	row, err := o.q.GetInvoiceCollectionState(ctx, invoiceID)
	if err != nil {
		return nil, err
	}

	var reasons []domain.CollectionReason
	if err := json.Unmarshal(row.Reasons, &reasons); err != nil {
		return nil, fmt.Errorf("unmarshal reasons: %w", err)
	}

	var metrics domain.CollectionMetrics
	if err := json.Unmarshal(row.Metrics, &metrics); err != nil {
		return nil, fmt.Errorf("unmarshal metrics: %w", err)
	}

	var recommendedSendAt *time.Time
	if row.RecommendedSendAt.Valid {
		recommendedSendAt = &row.RecommendedSendAt.Time
	}

	var lastEventAt *time.Time
	if row.LastEventAt.Valid {
		lastEventAt = &row.LastEventAt.Time
	}

	var appliedAt *time.Time
	if row.AppliedAt.Valid {
		appliedAt = &row.AppliedAt.Time
	}

	return &domain.CollectionState{
		RiskScore:         int(row.RiskScore),
		EngagementState:   domain.CollectionEngagementState(row.EngagementState),
		NextBestAction:    domain.CollectionNextBestAction(row.NextBestAction),
		RecommendedTone:   domain.Tone(row.RecommendedTone),
		RecommendedSendAt: recommendedSendAt,
		Reasons:           reasons,
		Metrics:           metrics,
		LastEventAt:       lastEventAt,
		LastEvaluatedAt:   row.LastEvaluatedAt.Time,
		AppliedAt:         appliedAt,
	}, nil
}
