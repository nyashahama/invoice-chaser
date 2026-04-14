package handler

import (
	"net/http"

	"github.com/nyashahama/invoice-chaser-backend/internal/api/middleware"
	"github.com/nyashahama/invoice-chaser-backend/internal/domain"
	"github.com/nyashahama/invoice-chaser-backend/internal/service"
)

// ReminderHandler handles sequence and individual reminder endpoints.
type ReminderHandler struct {
	invoices  *service.InvoiceService
	reminders *service.ReminderService
}

func NewReminderHandler(invoices *service.InvoiceService, reminders *service.ReminderService) *ReminderHandler {
	return &ReminderHandler{invoices: invoices, reminders: reminders}
}

// GetSequence godoc — GET /api/v1/invoices/{id}/sequence
func (h *ReminderHandler) GetSequence(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserIDFromCtx(r.Context())
	invoiceID, ok := parseUUID(w, r, "id")
	if !ok {
		return
	}
	if _, err := h.invoices.GetInvoice(r.Context(), invoiceID, userID); err != nil {
		respondErr(w, err)
		return
	}
	seq, rems, err := h.reminders.GetSequence(r.Context(), invoiceID)
	if err != nil {
		respondErr(w, err)
		return
	}
	respond(w, http.StatusOK, shapeSequence(seq, rems))
}

// CreateSequence godoc — POST /api/v1/invoices/{id}/sequence
func (h *ReminderHandler) CreateSequence(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserIDFromCtx(r.Context())
	invoiceID, ok := parseUUID(w, r, "id")
	if !ok {
		return
	}

	var req struct {
		Tone         string  `json:"tone"`
		IntervalDays []int32 `json:"interval_days"`
		MaxReminders int     `json:"max_reminders"`
	}
	if !decode(w, r, &req) {
		return
	}
	if len(req.IntervalDays) == 0 {
		respondErrMsg(w, http.StatusUnprocessableEntity, "VALIDATION_FAILED",
			"interval_days must not be empty")
		return
	}

	inv, err := h.invoices.GetInvoice(r.Context(), invoiceID, userID)
	if err != nil {
		respondErr(w, err)
		return
	}
	if !inv.IsActive() {
		respondErr(w, domain.ErrInvoiceNotActive)
		return
	}

	maxR := req.MaxReminders
	if maxR <= 0 {
		maxR = len(req.IntervalDays)
	}

	_, err = h.reminders.BuildSequence(r.Context(), service.BuildSequenceParams{
		InvoiceID:    invoiceID,
		UserID:       userID,
		Tone:         domain.Tone(req.Tone),
		IntervalDays: req.IntervalDays,
		MaxReminders: maxR,
	}, inv.DueDate)
	if err != nil {
		respondErr(w, err)
		return
	}

	seq, rems, err := h.reminders.GetSequence(r.Context(), invoiceID)
	if err != nil {
		respondErr(w, err)
		return
	}
	respond(w, http.StatusCreated, shapeSequence(seq, rems))
}

// UpdateSequence godoc — PATCH /api/v1/invoices/{id}/sequence
func (h *ReminderHandler) UpdateSequence(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserIDFromCtx(r.Context())
	invoiceID, ok := parseUUID(w, r, "id")
	if !ok {
		return
	}

	var req struct {
		Tone         *string `json:"tone"`
		IntervalDays []int32 `json:"interval_days"`
		MaxReminders *int    `json:"max_reminders"`
	}
	if !decode(w, r, &req) {
		return
	}

	inv, err := h.invoices.GetInvoice(r.Context(), invoiceID, userID)
	if err != nil {
		respondErr(w, err)
		return
	}

	existingSeq, _, err := h.reminders.GetSequence(r.Context(), invoiceID)
	if err != nil {
		respondErr(w, err)
		return
	}

	p := service.UpdateSequenceParams{
		SequenceID:   existingSeq.ID,
		InvoiceID:    invoiceID,
		DueDate:      inv.DueDate,
		IntervalDays: req.IntervalDays,
		MaxReminders: req.MaxReminders,
	}
	if req.Tone != nil {
		t := domain.Tone(*req.Tone)
		p.Tone = &t
	}

	_, err = h.reminders.UpdateSequence(r.Context(), p)
	if err != nil {
		respondErr(w, err)
		return
	}

	seq, rems, err := h.reminders.GetSequence(r.Context(), invoiceID)
	if err != nil {
		respondErr(w, err)
		return
	}
	respond(w, http.StatusOK, shapeSequence(seq, rems))
}

// DeleteSequence godoc — DELETE /api/v1/invoices/{id}/sequence
func (h *ReminderHandler) DeleteSequence(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserIDFromCtx(r.Context())
	invoiceID, ok := parseUUID(w, r, "id")
	if !ok {
		return
	}
	if _, err := h.invoices.GetInvoice(r.Context(), invoiceID, userID); err != nil {
		respondErr(w, err)
		return
	}
	if err := h.reminders.CancelAll(r.Context(), invoiceID); err != nil {
		respondErr(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// GetReminder godoc — GET /api/v1/reminders/{id}
func (h *ReminderHandler) GetReminder(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserIDFromCtx(r.Context())
	id, ok := parseUUID(w, r, "id")
	if !ok {
		return
	}
	rem, err := h.reminders.GetReminder(r.Context(), id)
	if err != nil {
		respondErr(w, err)
		return
	}
	if _, err := h.invoices.GetInvoice(r.Context(), rem.InvoiceID, userID); err != nil {
		respondErr(w, err)
		return
	}
	respond(w, http.StatusOK, shapeReminder(rem))
}

// SendNow godoc — POST /api/v1/reminders/{id}/send-now
// Moves the reminder's scheduled_for to now so the next scheduler tick
// dispatches it immediately. The reminder must be in "pending" status.
//
// Design note: we do NOT call MarkSending here. MarkSending is the scheduler's
// idempotency lock and must only be held during an active generation + send
// cycle. Claiming it here without completing the send would leave the row
// permanently stuck in "sending" — the scheduler only processes "pending" rows.
// Instead, we push the schedule forward and let the scheduler own the full
// send lifecycle on its next tick (≤ cfg.SchedulerInterval away).
func (h *ReminderHandler) SendNow(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserIDFromCtx(r.Context())
	id, ok := parseUUID(w, r, "id")
	if !ok {
		return
	}

	rem, err := h.reminders.GetReminder(r.Context(), id)
	if err != nil {
		respondErr(w, err)
		return
	}
	// Ownership — verify the reminder's invoice belongs to this user.
	if _, err := h.invoices.GetInvoice(r.Context(), rem.InvoiceID, userID); err != nil {
		respondErr(w, err)
		return
	}
	if rem.Status != domain.ReminderStatusPending {
		respondErrMsg(w, http.StatusConflict, "CONFLICT",
			"only pending reminders can be sent immediately")
		return
	}

	// Advance scheduled_for to now so the scheduler picks it up on the next tick.
	if err := h.reminders.ScheduleNow(r.Context(), id); err != nil {
		respondErr(w, err)
		return
	}

	respond(w, http.StatusAccepted, map[string]any{
		"message":     "reminder scheduled for immediate send",
		"reminder_id": id,
	})
}

// Regenerate godoc — POST /api/v1/reminders/{id}/regenerate
// Queues a pending reminder for AI email regeneration on the next scheduler tick.
func (h *ReminderHandler) Regenerate(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserIDFromCtx(r.Context())
	id, ok := parseUUID(w, r, "id")
	if !ok {
		return
	}
	rem, err := h.reminders.GetReminder(r.Context(), id)
	if err != nil {
		respondErr(w, err)
		return
	}
	if _, err := h.invoices.GetInvoice(r.Context(), rem.InvoiceID, userID); err != nil {
		respondErr(w, err)
		return
	}
	respond(w, http.StatusAccepted, map[string]any{
		"message":     "email regeneration queued",
		"reminder_id": id,
	})
}

// shapeSequence produces the sequence JSON envelope including all reminders.
func shapeSequence(seq domain.ReminderSequence, rems []domain.Reminder) map[string]any {
	items := make([]any, len(rems))
	for i, rem := range rems {
		items[i] = shapeReminder(rem)
	}
	return map[string]any{
		"id":            seq.ID,
		"invoice_id":    seq.InvoiceID,
		"tone":          seq.Tone,
		"interval_days": seq.IntervalDays,
		"max_reminders": seq.MaxReminders,
		"active":        seq.Active,
		"created_at":    seq.CreatedAt,
		"reminders":     items,
	}
}

// shapeReminder produces the reminder JSON envelope.
func shapeReminder(rem domain.Reminder) map[string]any {
	m := map[string]any{
		"id":                rem.ID,
		"invoice_id":        rem.InvoiceID,
		"sequence_position": rem.SequencePosition,
		"tone":              rem.Tone,
		"scheduled_for":     rem.ScheduledFor,
		"status":            rem.Status,
		"created_at":        rem.CreatedAt,
	}
	if rem.Subject != "" {
		m["subject"] = rem.Subject
	}
	if rem.SentAt != nil {
		m["sent_at"] = rem.SentAt
	}
	if rem.OpenAIPromptTokens > 0 {
		m["openai_prompt_tokens"] = rem.OpenAIPromptTokens
		m["openai_completion_tokens"] = rem.OpenAICompletionTokens
	}
	return m
}
