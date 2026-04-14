package domain

import (
	"time"

	"github.com/google/uuid"
)

// InvoiceStatus represents the lifecycle state of an invoice.
type InvoiceStatus string

const (
	InvoiceStatusDraft     InvoiceStatus = "draft"
	InvoiceStatusActive    InvoiceStatus = "active"
	InvoiceStatusPaid      InvoiceStatus = "paid"
	InvoiceStatusCancelled InvoiceStatus = "cancelled"
)

func (s InvoiceStatus) String() string { return string(s) }

func (s InvoiceStatus) IsValid() bool {
	switch s {
	case InvoiceStatusDraft, InvoiceStatusActive, InvoiceStatusPaid, InvoiceStatusCancelled:
		return true
	}
	return false
}

// Invoice is the central domain entity. All money is stored as cents.
type Invoice struct {
	ID               uuid.UUID
	UserID           uuid.UUID
	InvoiceNumber    string
	ClientName       string
	ClientEmail      string
	ClientContact    string // nullable — empty string means not set
	AmountCents      int64
	Currency         string
	DueDate          time.Time
	Description      string
	Notes            string
	Status           InvoiceStatus
	PaidAt           *time.Time
	PaymentSource    string // "manual" | "payfast" | "stripe_webhook" | "freshbooks"
	ExternalID       string
	ClickToken       string
	PayfastPaymentID string
	CreatedAt        time.Time
	UpdatedAt        time.Time
}

// AmountFormatted returns the amount as a decimal string suitable for display
// and for PayFast params (e.g. "1250.00").
func (inv *Invoice) AmountFormatted() string {
	rands := inv.AmountCents / 100
	cents := inv.AmountCents % 100
	return formatMoney(rands, cents)
}

// DaysOverdue returns how many days past due the invoice is.
// Returns 0 if not yet due.
func (inv *Invoice) DaysOverdue() int {
	if inv.DueDate.IsZero() {
		return 0
	}
	days := int(time.Since(inv.DueDate).Hours() / 24)
	if days < 0 {
		return 0
	}
	return days
}

// IsPaid reports whether the invoice has been paid.
func (inv *Invoice) IsPaid() bool {
	return inv.Status == InvoiceStatusPaid
}

// IsActive reports whether reminders should be sent for this invoice.
func (inv *Invoice) IsActive() bool {
	return inv.Status == InvoiceStatusActive
}

func formatMoney(rands, cents int64) string {
	if cents < 0 {
		cents = -cents
	}
	// Simple zero-dependency formatting: "1250.00"
	return itoa(rands) + "." + pad2(cents)
}

func itoa(n int64) string {
	if n == 0 {
		return "0"
	}
	buf := make([]byte, 0, 20)
	for n > 0 {
		buf = append([]byte{byte('0' + n%10)}, buf...)
		n /= 10
	}
	return string(buf)
}

func pad2(n int64) string {
	if n < 10 {
		return "0" + itoa(n)
	}
	return itoa(n)
}