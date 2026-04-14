package service

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"

	db "github.com/nyashahama/invoice-chaser-backend/db/gen"
	"github.com/nyashahama/invoice-chaser-backend/internal/domain"
)

// InvoiceService handles all invoice business logic.
type InvoiceService struct {
	q   db.Querier
	log *slog.Logger
}

func NewInvoiceService(q db.Querier, log *slog.Logger) *InvoiceService {
	return &InvoiceService{q: q, log: log}
}

// CreateInvoiceParams is the input for creating a new invoice.
type CreateInvoiceParams struct {
	UserID        uuid.UUID
	InvoiceNumber string
	ClientName    string
	ClientEmail   string
	ClientContact string
	AmountCents   int64
	Currency      string
	DueDate       time.Time
	Description   string
	Notes         string
}

// CreateInvoice creates a new invoice in draft status.
func (s *InvoiceService) CreateInvoice(ctx context.Context, p CreateInvoiceParams) (domain.Invoice, error) {
	if p.Currency != "ZAR" {
		return domain.Invoice{}, fmt.Errorf("%w: got %s", domain.ErrCurrencyInvalid, p.Currency)
	}
	if p.AmountCents <= 0 {
		return domain.Invoice{}, fmt.Errorf("%w: amount_cents must be > 0", domain.ErrValidation)
	}

	row, err := s.q.CreateInvoice(ctx, db.CreateInvoiceParams{
		UserID:        p.UserID,
		InvoiceNumber: p.InvoiceNumber,
		ClientName:    p.ClientName,
		ClientEmail:   p.ClientEmail,
		ClientContact: pgtype.Text{String: p.ClientContact, Valid: p.ClientContact != ""},
		AmountCents:   p.AmountCents,
		Currency:      p.Currency,
		DueDate:       pgtype.Date{Time: p.DueDate, Valid: !p.DueDate.IsZero()},
		Description:   pgtype.Text{String: p.Description, Valid: p.Description != ""},
		Notes:         pgtype.Text{String: p.Notes, Valid: p.Notes != ""},
		Status:        string(domain.InvoiceStatusDraft),
	})
	if err != nil {
		return domain.Invoice{}, fmt.Errorf("create invoice: %w", err)
	}

	s.log.InfoContext(ctx, "invoice created",
		slog.String("invoice_id", row.ID.String()),
		slog.String("user_id", p.UserID.String()),
	)
	return domain.InvoiceFromDB(row), nil
}

// GetInvoice returns an invoice by ID, scoped to the requesting user.
func (s *InvoiceService) GetInvoice(ctx context.Context, id, userID uuid.UUID) (domain.Invoice, error) {
	row, err := s.q.GetInvoiceByIDForUser(ctx, db.GetInvoiceByIDForUserParams{
		ID:     id,
		UserID: userID,
	})
	if err != nil {
		return domain.Invoice{}, mapNotFound(err, "invoice")
	}
	return domain.InvoiceFromDB(row), nil
}

// ListInvoicesParams is the input for listing invoices with optional filtering.
type ListInvoicesParams struct {
	UserID uuid.UUID
	Status string // empty = all statuses
	Limit  int32
	Offset int32
}

// ListInvoices returns a paginated list of invoices for a user.
func (s *InvoiceService) ListInvoices(ctx context.Context, p ListInvoicesParams) ([]domain.Invoice, int64, error) {
	if p.Limit <= 0 {
		p.Limit = 20
	}
	if p.Limit > 100 {
		p.Limit = 100
	}

	rows, err := s.q.ListInvoicesForUser(ctx, db.ListInvoicesForUserParams{
		UserID:  p.UserID,
		Column2: p.Status,
		Limit:   p.Limit,
		Offset:  p.Offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list invoices: %w", err)
	}

	total, err := s.q.CountInvoicesForUser(ctx, db.CountInvoicesForUserParams{
		UserID:  p.UserID,
		Column2: p.Status,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("count invoices: %w", err)
	}

	invoices := make([]domain.Invoice, len(rows))
	for i, row := range rows {
		invoices[i] = domain.InvoiceFromDB(row)
	}
	return invoices, total, nil
}

// UpdateInvoiceParams carries the patchable fields. Nil/zero = no change.
type UpdateInvoiceParams struct {
	ID            uuid.UUID
	UserID        uuid.UUID
	InvoiceNumber *string
	ClientName    *string
	ClientEmail   *string
	ClientContact *string
	AmountCents   *int64
	Currency      *string
	DueDate       *time.Time
	Description   *string
	Notes         *string
}

// UpdateInvoice applies a partial update to an invoice.
func (s *InvoiceService) UpdateInvoice(ctx context.Context, p UpdateInvoiceParams) (domain.Invoice, error) {
	arg := db.UpdateInvoiceParams{ID: p.ID, UserID: p.UserID}

	if p.InvoiceNumber != nil {
		arg.InvoiceNumber = pgtype.Text{String: *p.InvoiceNumber, Valid: true}
	}
	if p.ClientName != nil {
		arg.ClientName = pgtype.Text{String: *p.ClientName, Valid: true}
	}
	if p.ClientEmail != nil {
		arg.ClientEmail = pgtype.Text{String: *p.ClientEmail, Valid: true}
	}
	if p.ClientContact != nil {
		arg.ClientContact = pgtype.Text{String: *p.ClientContact, Valid: true}
	}
	if p.AmountCents != nil {
		arg.AmountCents = pgtype.Int8{Int64: *p.AmountCents, Valid: true}
	}
	if p.Currency != nil {
		if *p.Currency != "ZAR" {
			return domain.Invoice{}, domain.ErrCurrencyInvalid
		}
		arg.Currency = pgtype.Text{String: *p.Currency, Valid: true}
	}
	if p.DueDate != nil {
		arg.DueDate = pgtype.Date{Time: *p.DueDate, Valid: true}
	}
	if p.Description != nil {
		arg.Description = pgtype.Text{String: *p.Description, Valid: true}
	}
	if p.Notes != nil {
		arg.Notes = pgtype.Text{String: *p.Notes, Valid: true}
	}

	row, err := s.q.UpdateInvoice(ctx, arg)
	if err != nil {
		return domain.Invoice{}, mapNotFound(err, "invoice")
	}
	return domain.InvoiceFromDB(row), nil
}

// ActivateInvoice moves an invoice from draft → active, enabling reminder dispatch.
func (s *InvoiceService) ActivateInvoice(ctx context.Context, id, userID uuid.UUID) (domain.Invoice, error) {
	row, err := s.q.ActivateInvoice(ctx, db.ActivateInvoiceParams{ID: id, UserID: userID})
	if err != nil {
		return domain.Invoice{}, mapNotFound(err, "invoice")
	}
	s.log.InfoContext(ctx, "invoice activated", slog.String("invoice_id", id.String()))
	return domain.InvoiceFromDB(row), nil
}

// MarkPaid marks an invoice as paid manually (dashboard action).
// Cancels all pending reminders atomically.
func (s *InvoiceService) MarkPaid(ctx context.Context, id, userID uuid.UUID) (domain.Invoice, error) {
	// Verify ownership before writing.
	existing, err := s.GetInvoice(ctx, id, userID)
	if err != nil {
		return domain.Invoice{}, err
	}
	if existing.IsPaid() {
		return existing, nil // idempotent — already paid
	}

	err = s.q.MarkInvoicePaidAndCancelReminders(ctx, db.MarkInvoicePaidAndCancelRemindersParams{
		ID:            id,
		PaidAt:        pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true},
		PaymentSource: pgtype.Text{String: "manual", Valid: true},
	})
	if err != nil {
		return domain.Invoice{}, fmt.Errorf("mark paid: %w", err)
	}

	s.log.InfoContext(ctx, "invoice marked paid",
		slog.String("invoice_id", id.String()),
		slog.String("source", "manual"),
	)

	return s.GetInvoice(ctx, id, userID)
}

// MarkPaidFromPayFast marks an invoice as paid from a verified PayFast ITN.
// Idempotent: silently returns if already paid.
func (s *InvoiceService) MarkPaidFromPayFast(ctx context.Context, invoiceID, pfPaymentID string) error {
	id, err := uuid.Parse(invoiceID)
	if err != nil {
		return fmt.Errorf("%w: invalid invoice id", domain.ErrValidation)
	}

	// Fetch without user scoping — PayFast ITN has no user context.
	row, err := s.q.GetInvoiceByID(ctx, id)
	if err != nil {
		return mapNotFound(err, "invoice")
	}

	inv := domain.InvoiceFromDB(row)
	if inv.IsPaid() {
		s.log.InfoContext(ctx, "duplicate ITN ignored — invoice already paid",
			slog.String("invoice_id", invoiceID),
			slog.String("pf_payment_id", pfPaymentID),
		)
		return nil
	}

	err = s.q.MarkInvoicePaidAndCancelReminders(ctx, db.MarkInvoicePaidAndCancelRemindersParams{
		ID:               id,
		PaidAt:           pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true},
		PaymentSource:    pgtype.Text{String: "payfast", Valid: true},
		PayfastPaymentID: pgtype.Text{String: pfPaymentID, Valid: pfPaymentID != ""},
	})
	if err != nil {
		return fmt.Errorf("mark paid from payfast: %w", err)
	}

	s.log.InfoContext(ctx, "invoice paid via payfast",
		slog.String("invoice_id", invoiceID),
		slog.String("pf_payment_id", pfPaymentID),
	)
	return nil
}

// CancelInvoice soft-cancels an invoice and stops all pending reminders.
func (s *InvoiceService) CancelInvoice(ctx context.Context, id, userID uuid.UUID) error {
	if err := s.q.CancelInvoice(ctx, db.CancelInvoiceParams{ID: id, UserID: userID}); err != nil {
		return mapNotFound(err, "invoice")
	}
	if err := s.q.CancelPendingRemindersForInvoice(ctx, id); err != nil {
		return fmt.Errorf("cancel reminders: %w", err)
	}
	s.log.InfoContext(ctx, "invoice cancelled", slog.String("invoice_id", id.String()))
	return nil
}

// ListOverdue returns all active invoices past their due date (for dashboard/reporting).
func (s *InvoiceService) ListOverdue(ctx context.Context) ([]domain.Invoice, error) {
	rows, err := s.q.ListOverdueInvoices(ctx)
	if err != nil {
		return nil, fmt.Errorf("list overdue: %w", err)
	}
	invoices := make([]domain.Invoice, len(rows))
	for i, row := range rows {
		invoices[i] = domain.InvoiceFromDB(row)
	}
	return invoices, nil
}

// GetByClickToken returns the invoice associated with a PayFast click token.
func (s *InvoiceService) GetByClickToken(ctx context.Context, token string) (domain.Invoice, error) {
	row, err := s.q.GetInvoiceByClickToken(ctx, token)
	if err != nil {
		return domain.Invoice{}, mapNotFound(err, "invoice")
	}
	return domain.InvoiceFromDB(row), nil
}

// mapNotFound converts pgx "no rows" errors to domain.ErrNotFound.
func mapNotFound(err error, resource string) error {
	if err == nil {
		return nil
	}
	if errors.Is(err, domain.ErrNotFound) {
		return err
	}
	// pgx returns this string for no rows
	if err.Error() == "no rows in result set" {
		return fmt.Errorf("%s: %w", resource, domain.ErrNotFound)
	}
	return err
}