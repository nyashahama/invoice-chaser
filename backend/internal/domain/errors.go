package domain

import "errors"

// Sentinel errors used by the service layer.
// Handlers map these to HTTP status codes.
var (
	ErrNotFound         = errors.New("resource not found")
	ErrUnauthorized     = errors.New("unauthorized")
	ErrForbidden        = errors.New("forbidden")
	ErrConflict         = errors.New("resource already exists")
	ErrValidation       = errors.New("validation failed")
	ErrInvoiceNotActive = errors.New("invoice is not active")
	ErrInvoiceAlreadyPaid = errors.New("invoice is already paid")
	ErrSequenceExists   = errors.New("reminder sequence already exists for this invoice")
	ErrCurrencyInvalid  = errors.New("only ZAR invoices are supported for PayFast payments")
	ErrAmountMismatch   = errors.New("payment amount does not match invoice amount")
)