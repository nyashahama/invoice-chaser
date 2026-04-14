package service

import (
	"context"
	"errors"
	"io"
	"log/slog"
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/nyashahama/invoice-chaser-backend/internal/domain"
	oai "github.com/nyashahama/invoice-chaser-backend/internal/openai"
)

type fakeCompleter struct {
	result oai.CompletionResult
	err    error
}

func (f fakeCompleter) Complete(context.Context, oai.CompletionRequest) (oai.CompletionResult, error) {
	return f.result, f.err
}

type sentMessage struct {
	ToName   string
	ToEmail  string
	Subject  string
	TextBody string
	HTMLBody string
}

type fakeMailer struct {
	messages []sentMessage
	err      error
}

func (f *fakeMailer) Send(_ context.Context, msg Message) error {
	f.messages = append(f.messages, sentMessage{
		ToName:   msg.ToName,
		ToEmail:  msg.ToEmail,
		Subject:  msg.Subject,
		TextBody: msg.TextBody,
		HTMLBody: msg.HTMLBody,
	})
	return f.err
}

func TestEmailServiceGenerateAndSendUsesMailer(t *testing.T) {
	t.Parallel()

	mailer := &fakeMailer{}
	svc := NewEmailService(
		fakeCompleter{
			result: oai.CompletionResult{
				RawJSON: `{"subject":"Reminder","body_text":"Plain body [PAYMENT_LINK]","body_html":"<body><p>Hello</p><a href=\"[PAYMENT_LINK]\">Pay</a></body>"}`,
			},
		},
		mailer,
		"InvoiceChaser",
		"noreply@example.com",
		500,
		"https://app.example.com",
		slog.New(slog.NewTextHandler(io.Discard, nil)),
	)

	result, err := svc.GenerateAndSend(context.Background(), GenerateEmailParams{
		User: domain.User{
			ID:             uuid.New(),
			Email:          "owner@example.com",
			FullName:       "Owner",
			EmailSignature: "Owner",
		},
		Invoice: domain.Invoice{
			ID:            uuid.New(),
			UserID:        uuid.New(),
			InvoiceNumber: "INV-123",
			ClientName:    "Acme",
			ClientEmail:   "client@example.com",
			ClientContact: "Alex",
			AmountCents:   125000,
			Currency:      "ZAR",
			DueDate:       time.Now().Add(-48 * time.Hour),
			ClickToken:    "click-token",
		},
		Reminder: domain.Reminder{
			ID:               uuid.New(),
			InvoiceID:        uuid.New(),
			OpenToken:        "open-token",
			SequencePosition: 1,
		},
		Sequence: domain.ReminderSequence{
			ID:           uuid.New(),
			InvoiceID:    uuid.New(),
			Tone:         domain.TonePolite,
			MaxReminders: 3,
		},
	})
	if err != nil {
		t.Fatalf("GenerateAndSend returned error: %v", err)
	}
	if result.Subject != "Reminder" {
		t.Fatalf("unexpected subject %q", result.Subject)
	}
	if len(mailer.messages) != 1 {
		t.Fatalf("expected 1 outbound message, got %d", len(mailer.messages))
	}
	if mailer.messages[0].ToEmail != "client@example.com" {
		t.Fatalf("unexpected recipient %q", mailer.messages[0].ToEmail)
	}
	if want := "https://app.example.com/track/click/click-token"; !contains(mailer.messages[0].HTMLBody, want) {
		t.Fatalf("html body missing tracked click url %q: %s", want, mailer.messages[0].HTMLBody)
	}
	if want := "https://app.example.com/track/open/open-token"; !contains(mailer.messages[0].HTMLBody, want) {
		t.Fatalf("html body missing tracking pixel %q: %s", want, mailer.messages[0].HTMLBody)
	}
	if want := "https://app.example.com/track/click/click-token"; !contains(mailer.messages[0].TextBody, want) {
		t.Fatalf("text body missing tracked click url %q: %s", want, mailer.messages[0].TextBody)
	}
}

func TestEmailServiceGenerateAndSendFallsBackWhenAIShutsDown(t *testing.T) {
	t.Parallel()

	mailer := &fakeMailer{}
	svc := NewEmailService(
		fakeCompleter{err: errors.New("openai unavailable")},
		mailer,
		"InvoiceChaser",
		"noreply@example.com",
		500,
		"https://app.example.com",
		slog.New(slog.NewTextHandler(io.Discard, nil)),
	)

	result, err := svc.GenerateAndSend(context.Background(), GenerateEmailParams{
		User: domain.User{
			ID:             uuid.New(),
			Email:          "owner@example.com",
			FullName:       "Owner",
			EmailSignature: "Owner",
		},
		Invoice: domain.Invoice{
			ID:            uuid.New(),
			UserID:        uuid.New(),
			InvoiceNumber: "INV-456",
			ClientName:    "Acme",
			ClientEmail:   "client@example.com",
			ClientContact: "Alex",
			AmountCents:   50000,
			Currency:      "ZAR",
			DueDate:       time.Now().Add(-24 * time.Hour),
			ClickToken:    "fallback-click",
		},
		Reminder: domain.Reminder{
			ID:               uuid.New(),
			InvoiceID:        uuid.New(),
			OpenToken:        "fallback-open",
			SequencePosition: 2,
		},
		Sequence: domain.ReminderSequence{
			ID:           uuid.New(),
			InvoiceID:    uuid.New(),
			Tone:         domain.ToneFirm,
			MaxReminders: 3,
		},
	})
	if err != nil {
		t.Fatalf("GenerateAndSend returned error: %v", err)
	}
	if result.Subject == "" {
		t.Fatal("expected fallback subject to be populated")
	}
	if len(mailer.messages) != 1 {
		t.Fatalf("expected fallback email to be sent once, got %d sends", len(mailer.messages))
	}
}

func contains(s, want string) bool {
	return len(s) >= len(want) && (s == want || len(s) > len(want) && containsAt(s, want))
}

func containsAt(s, want string) bool {
	for i := 0; i+len(want) <= len(s); i++ {
		if s[i:i+len(want)] == want {
			return true
		}
	}
	return false
}
