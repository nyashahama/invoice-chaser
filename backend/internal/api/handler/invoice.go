package handler

import (
	"context"
	"net/http"
	"time"

	"github.com/nyashahama/invoice-chaser-backend/internal/api/middleware"
	"github.com/nyashahama/invoice-chaser-backend/internal/domain"
	"github.com/nyashahama/invoice-chaser-backend/internal/service"
)

// InvoiceHandler handles all invoice-related HTTP endpoints.
type InvoiceHandler struct {
	invoices  *service.InvoiceService
	reminders *service.ReminderService
	optimizer *service.CollectionOptimizer
}

func NewInvoiceHandler(invoices *service.InvoiceService, reminders *service.ReminderService, optimizer *service.CollectionOptimizer) *InvoiceHandler {
	return &InvoiceHandler{invoices: invoices, reminders: reminders, optimizer: optimizer}
}

// List godoc — GET /api/v1/invoices
func (h *InvoiceHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserIDFromCtx(r.Context())

	invoices, total, err := h.invoices.ListInvoices(r.Context(), service.ListInvoicesParams{
		UserID: userID,
		Status: r.URL.Query().Get("status"),
		Limit:  int32(intQuery(r, "limit", 20)),
		Offset: int32(intQuery(r, "offset", 0)),
	})
	if err != nil {
		respondErr(w, err)
		return
	}

	items := make([]any, len(invoices))
	for i, inv := range invoices {
		items[i] = h.shapeInvoiceWithCollection(r.Context(), inv)
	}
	respond(w, http.StatusOK, map[string]any{
		"data":   items,
		"total":  total,
		"limit":  intQuery(r, "limit", 20),
		"offset": intQuery(r, "offset", 0),
	})
}

// Create godoc — POST /api/v1/invoices
func (h *InvoiceHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserIDFromCtx(r.Context())

	var req struct {
		InvoiceNumber string `json:"invoice_number"`
		ClientName    string `json:"client_name"`
		ClientEmail   string `json:"client_email"`
		ClientContact string `json:"client_contact"`
		AmountCents   int64  `json:"amount_cents"`
		Currency      string `json:"currency"`
		DueDate       string `json:"due_date"` // "2006-01-02"
		Description   string `json:"description"`
		Notes         string `json:"notes"`
		// Optional — if provided, invoice is immediately activated with a sequence.
		Sequence *struct {
			Tone         string  `json:"tone"`
			IntervalDays []int32 `json:"interval_days"`
		} `json:"sequence"`
	}
	if !decode(w, r, &req) {
		return
	}
	if req.InvoiceNumber == "" || req.ClientName == "" || req.ClientEmail == "" {
		respondErrMsg(w, http.StatusUnprocessableEntity, "VALIDATION_FAILED",
			"invoice_number, client_name, and client_email are required")
		return
	}
	dueDate, err := time.Parse("2006-01-02", req.DueDate)
	if err != nil {
		respondErrMsg(w, http.StatusUnprocessableEntity, "VALIDATION_FAILED",
			"due_date must be in YYYY-MM-DD format")
		return
	}
	if req.Currency == "" {
		req.Currency = "ZAR"
	}

	inv, err := h.invoices.CreateInvoice(r.Context(), service.CreateInvoiceParams{
		UserID:        userID,
		InvoiceNumber: req.InvoiceNumber,
		ClientName:    req.ClientName,
		ClientEmail:   req.ClientEmail,
		ClientContact: req.ClientContact,
		AmountCents:   req.AmountCents,
		Currency:      req.Currency,
		DueDate:       dueDate,
		Description:   req.Description,
		Notes:         req.Notes,
	})
	if err != nil {
		respondErr(w, err)
		return
	}

	// Optionally activate + build sequence in a single request.
	if req.Sequence != nil {
		inv, err = h.invoices.ActivateInvoice(r.Context(), inv.ID, userID)
		if err != nil {
			respondErr(w, err)
			return
		}
		_, err = h.reminders.BuildSequence(r.Context(), service.BuildSequenceParams{
			InvoiceID:    inv.ID,
			UserID:       userID,
			Tone:         domain.Tone(req.Sequence.Tone),
			IntervalDays: req.Sequence.IntervalDays,
			MaxReminders: len(req.Sequence.IntervalDays),
		}, inv.DueDate)
		if err != nil {
			respondErr(w, err)
			return
		}
	}

	respond(w, http.StatusCreated, h.shapeInvoiceWithCollection(r.Context(), inv))
}

// Get godoc — GET /api/v1/invoices/{id}
func (h *InvoiceHandler) Get(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserIDFromCtx(r.Context())
	id, ok := parseUUID(w, r, "id")
	if !ok {
		return
	}
	inv, err := h.invoices.GetInvoice(r.Context(), id, userID)
	if err != nil {
		respondErr(w, err)
		return
	}
	respond(w, http.StatusOK, h.shapeInvoiceWithCollection(r.Context(), inv))
}

// Update godoc — PATCH /api/v1/invoices/{id}
func (h *InvoiceHandler) Update(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserIDFromCtx(r.Context())
	id, ok := parseUUID(w, r, "id")
	if !ok {
		return
	}

	var req struct {
		InvoiceNumber *string `json:"invoice_number"`
		ClientName    *string `json:"client_name"`
		ClientEmail   *string `json:"client_email"`
		ClientContact *string `json:"client_contact"`
		AmountCents   *int64  `json:"amount_cents"`
		Currency      *string `json:"currency"`
		DueDate       *string `json:"due_date"`
		Description   *string `json:"description"`
		Notes         *string `json:"notes"`
	}
	if !decode(w, r, &req) {
		return
	}

	p := service.UpdateInvoiceParams{ID: id, UserID: userID}
	p.InvoiceNumber = req.InvoiceNumber
	p.ClientName = req.ClientName
	p.ClientEmail = req.ClientEmail
	p.ClientContact = req.ClientContact
	p.AmountCents = req.AmountCents
	p.Currency = req.Currency
	p.Description = req.Description
	p.Notes = req.Notes

	if req.DueDate != nil {
		t, err := time.Parse("2006-01-02", *req.DueDate)
		if err != nil {
			respondErrMsg(w, http.StatusUnprocessableEntity, "VALIDATION_FAILED",
				"due_date must be in YYYY-MM-DD format")
			return
		}
		p.DueDate = &t
	}

	inv, err := h.invoices.UpdateInvoice(r.Context(), p)
	if err != nil {
		respondErr(w, err)
		return
	}
	respond(w, http.StatusOK, h.shapeInvoiceWithCollection(r.Context(), inv))
}

// Delete godoc — DELETE /api/v1/invoices/{id}
func (h *InvoiceHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserIDFromCtx(r.Context())
	id, ok := parseUUID(w, r, "id")
	if !ok {
		return
	}
	if err := h.invoices.CancelInvoice(r.Context(), id, userID); err != nil {
		respondErr(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// Pay godoc — POST /api/v1/invoices/{id}/pay
func (h *InvoiceHandler) Pay(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserIDFromCtx(r.Context())
	id, ok := parseUUID(w, r, "id")
	if !ok {
		return
	}
	inv, err := h.invoices.MarkPaid(r.Context(), id, userID)
	if err != nil {
		respondErr(w, err)
		return
	}
	respond(w, http.StatusOK, h.shapeInvoiceWithCollection(r.Context(), inv))
}

// Events godoc — GET /api/v1/invoices/{id}/events
func (h *InvoiceHandler) Events(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserIDFromCtx(r.Context())
	id, ok := parseUUID(w, r, "id")
	if !ok {
		return
	}
	// Ownership check.
	if _, err := h.invoices.GetInvoice(r.Context(), id, userID); err != nil {
		respondErr(w, err)
		return
	}
	events, err := h.reminders.GetEvents(r.Context(), id)
	if err != nil {
		respondErr(w, err)
		return
	}
	items := make([]any, len(events))
	for i, e := range events {
		items[i] = map[string]any{
			"id":          e.ID,
			"reminder_id": e.ReminderID,
			"event_type":  e.EventType,
			"metadata":    e.Metadata,
			"occurred_at": e.OccurredAt,
		}
	}
	respond(w, http.StatusOK, map[string]any{"data": items})
}

// ApplyOptimizer godoc — POST /api/v1/invoices/{id}/optimizer/apply
func (h *InvoiceHandler) ApplyOptimizer(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserIDFromCtx(r.Context())
	invoiceID, ok := parseUUID(w, r, "id")
	if !ok {
		return
	}

	inv, err := h.invoices.GetInvoice(r.Context(), invoiceID, userID)
	if err != nil {
		respondErr(w, err)
		return
	}

	state, err := h.optimizer.RefreshInvoice(r.Context(), invoiceID)
	if err != nil {
		respondErr(w, err)
		return
	}

	_, _, err = h.reminders.ApplyCollectionRecommendation(r.Context(), inv, state)
	if err != nil {
		respondErr(w, err)
		return
	}

	_ = h.optimizer.MarkApplied(r.Context(), invoiceID)
	respond(w, http.StatusOK, map[string]any{"message": "optimizer recommendation applied"})
}

func (h *InvoiceHandler) getCollectionState(ctx context.Context, inv domain.Invoice) *domain.CollectionState {
	if h.optimizer == nil {
		return nil
	}
	if inv.Status == domain.InvoiceStatusPaid || inv.Status == domain.InvoiceStatusCancelled {
		return nil
	}
	state, err := h.optimizer.GetStoredState(ctx, inv.ID)
	if err == nil && state != nil {
		return state
	}
	if inv.Status == domain.InvoiceStatusActive || inv.Status == domain.InvoiceStatusDraft {
		fresh, err := h.optimizer.RefreshInvoice(ctx, inv.ID)
		if err == nil {
			return &fresh
		}
	}
	return nil
}

func (h *InvoiceHandler) shapeInvoiceWithCollection(ctx context.Context, inv domain.Invoice) map[string]any {
	m := shapeInvoice(inv)
	m["collections"] = shapeCollectionState(h.getCollectionState(ctx, inv))
	return m
}

// shapeInvoice produces the invoice JSON envelope.
func shapeInvoice(inv domain.Invoice) map[string]any {
	m := map[string]any{
		"id":               inv.ID,
		"invoice_number":   inv.InvoiceNumber,
		"client_name":      inv.ClientName,
		"client_email":     inv.ClientEmail,
		"client_contact":   inv.ClientContact,
		"amount_cents":     inv.AmountCents,
		"amount_formatted": inv.AmountFormatted(),
		"currency":         inv.Currency,
		"due_date":         inv.DueDate.Format("2006-01-02"),
		"description":      inv.Description,
		"notes":            inv.Notes,
		"status":           inv.Status,
		"payment_source":   inv.PaymentSource,
		"click_token":      inv.ClickToken,
		"days_overdue":     inv.DaysOverdue(),
		"created_at":       inv.CreatedAt,
		"updated_at":       inv.UpdatedAt,
	}
	if inv.PaidAt != nil {
		m["paid_at"] = inv.PaidAt
	}
	return m
}

func shapeCollectionState(state *domain.CollectionState) map[string]any {
	if state == nil {
		return nil
	}
	m := map[string]any{
		"risk_score":        state.RiskScore,
		"engagement_state":  state.EngagementState,
		"next_best_action":  state.NextBestAction,
		"recommended_tone":  state.RecommendedTone,
		"reasons":           state.Reasons,
		"metrics":           state.Metrics,
		"last_evaluated_at": state.LastEvaluatedAt,
	}
	if state.RecommendedSendAt != nil {
		m["recommended_send_at"] = state.RecommendedSendAt.Format(time.RFC3339)
	}
	if state.LastEventAt != nil {
		m["last_event_at"] = state.LastEventAt.Format(time.RFC3339)
	}
	if state.AppliedAt != nil {
		m["applied_at"] = state.AppliedAt.Format(time.RFC3339)
	}
	return m
}
