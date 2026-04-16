package handler

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"

	"github.com/nyashahama/invoice-chaser-backend/internal/domain"
)

func TestShapeCollectionState(t *testing.T) {
	state := &domain.CollectionState{
		RiskScore:       50,
		EngagementState: domain.CollectionEngagementOpened,
		NextBestAction:  domain.CollectionActionWait,
		RecommendedTone: domain.TonePolite,
		LastEvaluatedAt: time.Now(),
	}

	result := shapeCollectionState(state)
	assert.Equal(t, 50, result["risk_score"])
	assert.Equal(t, domain.CollectionEngagementOpened, result["engagement_state"])
	assert.Equal(t, domain.CollectionActionWait, result["next_best_action"])
	assert.Equal(t, domain.TonePolite, result["recommended_tone"])
}

func TestShapeCollectionState_NilReturnsNil(t *testing.T) {
	result := shapeCollectionState(nil)
	assert.Nil(t, result)
}

func TestShapeCollectionState_AllFields(t *testing.T) {
	now := time.Now()
	sendAt := now.Add(24 * time.Hour)
	lastEvent := now.Add(-2 * time.Hour)
	appliedAt := now.Add(-1 * time.Hour)

	state := &domain.CollectionState{
		RiskScore:         75,
		EngagementState:   domain.CollectionEngagementUnengaged,
		NextBestAction:    domain.CollectionActionSendNow,
		RecommendedTone:   domain.ToneFirm,
		RecommendedSendAt: &sendAt,
		LastEventAt:       &lastEvent,
		LastEvaluatedAt:   now,
		AppliedAt:         &appliedAt,
		Reasons: []domain.CollectionReason{
			{Code: "test_code", Message: "test message"},
		},
		Metrics: domain.CollectionMetrics{
			ReminderCount: 5,
			OpenCount:     2,
			ClickCount:    0,
			FailedCount:   1,
		},
	}

	result := shapeCollectionState(state)

	assert.Equal(t, 75, result["risk_score"])
	assert.Equal(t, domain.CollectionEngagementUnengaged, result["engagement_state"])
	assert.Equal(t, domain.CollectionActionSendNow, result["next_best_action"])
	assert.Equal(t, domain.ToneFirm, result["recommended_tone"])
	assert.NotNil(t, result["recommended_send_at"])
	assert.NotNil(t, result["last_event_at"])
	assert.NotNil(t, result["applied_at"])
	assert.NotNil(t, result["reasons"])
	assert.NotNil(t, result["metrics"])
}

func TestShapeInvoiceIncludesCollectionsKey(t *testing.T) {
	h := &InvoiceHandler{}

	inv := domain.Invoice{
		ID:            uuid.New(),
		Status:        domain.InvoiceStatusActive,
		InvoiceNumber: "INV-001",
		ClientName:    "Test Client",
		ClientEmail:   "test@example.com",
		AmountCents:   10000,
		Currency:      "ZAR",
		DueDate:       time.Now().Add(-20 * 24 * time.Hour),
	}

	result := h.shapeInvoiceWithCollection(context.Background(), inv)

	_, hasCollections := result["collections"]
	assert.True(t, hasCollections, "collections key should be present in shaped invoice")
}

func TestShapeInvoiceCollectionsIsNil(t *testing.T) {
	h := &InvoiceHandler{}

	inv := domain.Invoice{
		ID:            uuid.New(),
		Status:        domain.InvoiceStatusPaid,
		InvoiceNumber: "INV-001",
		ClientName:    "Test Client",
		ClientEmail:   "test@example.com",
		AmountCents:   10000,
		Currency:      "ZAR",
		DueDate:       time.Now(),
	}

	result := h.shapeInvoiceWithCollection(context.Background(), inv)

	collections := result["collections"]
	assert.Nil(t, collections, "collections should be nil for paid invoice")
}

func TestCollectionsShapeJSONRoundTrip(t *testing.T) {
	state := &domain.CollectionState{
		RiskScore:         45,
		EngagementState:   domain.CollectionEngagementOpened,
		NextBestAction:    domain.CollectionActionWait,
		RecommendedTone:   domain.TonePolite,
		RecommendedSendAt: nil,
		LastEvaluatedAt:   time.Now(),
		Reasons: []domain.CollectionReason{
			{Code: "multiple_opens_no_click", Message: "Opened multiple reminders but hasn't clicked or paid"},
		},
		Metrics: domain.CollectionMetrics{
			ReminderCount: 3,
			OpenCount:     2,
			ClickCount:    0,
			FailedCount:   0,
		},
	}

	shaped := shapeCollectionState(state)

	jsonBytes, err := json.Marshal(shaped)
	assert.NoError(t, err)

	var parsed map[string]any
	err = json.Unmarshal(jsonBytes, &parsed)
	assert.NoError(t, err)
	assert.Equal(t, float64(45), parsed["risk_score"])
	assert.Equal(t, "opened", parsed["engagement_state"])
	assert.Equal(t, "wait", parsed["next_best_action"])
	assert.Equal(t, "polite", parsed["recommended_tone"])

	reasons := parsed["reasons"].([]any)
	assert.Len(t, reasons, 1)

	metrics := parsed["metrics"].(map[string]any)
	assert.Equal(t, float64(3), metrics["reminder_count"])
	assert.Equal(t, float64(2), metrics["open_count"])
}

func TestGetCollectionStateForPaidInvoice(t *testing.T) {
	h := &InvoiceHandler{}

	inv := domain.Invoice{
		ID:            uuid.New(),
		Status:        domain.InvoiceStatusPaid,
		InvoiceNumber: "INV-001",
		ClientName:    "Test Client",
		ClientEmail:   "test@example.com",
		AmountCents:   10000,
		Currency:      "ZAR",
		DueDate:       time.Now(),
	}

	result := h.getCollectionState(context.Background(), inv)
	assert.Nil(t, result, "collection state should be nil for paid invoice")
}

func TestGetCollectionStateForCancelledInvoice(t *testing.T) {
	h := &InvoiceHandler{}

	inv := domain.Invoice{
		ID:            uuid.New(),
		Status:        domain.InvoiceStatusCancelled,
		InvoiceNumber: "INV-001",
		ClientName:    "Test Client",
		ClientEmail:   "test@example.com",
		AmountCents:   10000,
		Currency:      "ZAR",
		DueDate:       time.Now(),
	}

	result := h.getCollectionState(context.Background(), inv)
	assert.Nil(t, result, "collection state should be nil for cancelled invoice")
}
