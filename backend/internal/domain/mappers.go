// Package domain provides mappers from sqlc-generated DB types to clean domain structs.
// These live in domain so the service layer never imports db/gen directly for type assertions.
package domain

import (
	"encoding/json"

	db "github.com/nyashahama/invoice-chaser-backend/db/gen"
)

// InvoiceFromDB converts a sqlc Invoice row to the domain Invoice.
func InvoiceFromDB(row db.Invoice) Invoice {
	inv := Invoice{
		ID:               row.ID,
		UserID:           row.UserID,
		InvoiceNumber:    row.InvoiceNumber,
		ClientName:       row.ClientName,
		ClientEmail:      row.ClientEmail,
		AmountCents:      row.AmountCents,
		Currency:         row.Currency,
		Status:           InvoiceStatus(row.Status),
		ClickToken:       row.ClickToken,
		CreatedAt:        row.CreatedAt.Time,
		UpdatedAt:        row.UpdatedAt.Time,
	}
	if row.ClientContact.Valid {
		inv.ClientContact = row.ClientContact.String
	}
	if row.Description.Valid {
		inv.Description = row.Description.String
	}
	if row.Notes.Valid {
		inv.Notes = row.Notes.String
	}
	if row.PaymentSource.Valid {
		inv.PaymentSource = row.PaymentSource.String
	}
	if row.ExternalID.Valid {
		inv.ExternalID = row.ExternalID.String
	}
	if row.PayfastPaymentID.Valid {
		inv.PayfastPaymentID = row.PayfastPaymentID.String
	}
	if row.DueDate.Valid {
		t := row.DueDate.Time
		inv.DueDate = t
	}
	if row.PaidAt.Valid {
		t := row.PaidAt.Time
		inv.PaidAt = &t
	}
	return inv
}

// UserFromDB converts a sqlc User row to the domain User.
func UserFromDB(row db.User) User {
	u := User{
		ID:        row.ID,
		Email:     row.Email,
		FullName:  row.FullName,
		Plan:      Plan(row.Plan),
		Timezone:  row.Timezone,
		CreatedAt: row.CreatedAt.Time,
		UpdatedAt: row.UpdatedAt.Time,
	}
	if row.PasswordHash.Valid {
		u.PasswordHash = row.PasswordHash.String
	}
	if row.EmailSignature.Valid {
		u.EmailSignature = row.EmailSignature.String
	}
	if row.DeletedAt.Valid {
		t := row.DeletedAt.Time
		u.DeletedAt = &t
	}
	return u
}

// ReminderFromDB converts a sqlc Reminder row to the domain Reminder.
func ReminderFromDB(row db.Reminder) Reminder {
	r := Reminder{
		ID:               row.ID,
		InvoiceID:        row.InvoiceID,
		SequenceID:       row.SequenceID,
		SequencePosition: int(row.SequencePosition),
		Tone:             Tone(row.Tone),
		Status:           ReminderStatus(row.Status),
		OpenToken:        row.OpenToken,
		CreatedAt:        row.CreatedAt.Time,
		UpdatedAt:        row.UpdatedAt.Time,
	}
	if row.ScheduledFor.Valid {
		r.ScheduledFor = row.ScheduledFor.Time
	}
	if row.Subject.Valid {
		r.Subject = row.Subject.String
	}
	if row.BodyText.Valid {
		r.BodyText = row.BodyText.String
	}
	if row.BodyHtml.Valid {
		r.BodyHTML = row.BodyHtml.String
	}
	if row.OpenaiPromptTokens.Valid {
		r.OpenAIPromptTokens = int(row.OpenaiPromptTokens.Int32)
	}
	if row.OpenaiCompletionTokens.Valid {
		r.OpenAICompletionTokens = int(row.OpenaiCompletionTokens.Int32)
	}
	if row.SentAt.Valid {
		t := row.SentAt.Time
		r.SentAt = &t
	}
	return r
}

// SequenceFromDB converts a sqlc ReminderSequence row to the domain ReminderSequence.
func SequenceFromDB(row db.ReminderSequence) ReminderSequence {
	return ReminderSequence{
		ID:           row.ID,
		InvoiceID:    row.InvoiceID,
		Tone:         Tone(row.Tone),
		IntervalDays: row.IntervalDays,
		MaxReminders: int(row.MaxReminders),
		Active:       row.Active,
		CreatedAt:    row.CreatedAt.Time,
	}
}

// ReminderEventFromDB converts a sqlc ReminderEvent row to the domain ReminderEvent.
func ReminderEventFromDB(row db.ReminderEvent) ReminderEvent {
	evt := ReminderEvent{
		ID:         row.ID,
		ReminderID: row.ReminderID,
		InvoiceID:  row.InvoiceID,
		EventType:  ReminderEventType(row.EventType),
		OccurredAt: row.OccurredAt.Time,
	}
	if len(row.Metadata) > 0 {
		_ = json.Unmarshal(row.Metadata, &evt.Metadata)
	}
	return evt
}