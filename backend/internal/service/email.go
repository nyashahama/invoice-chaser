package service

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"strings"

	"github.com/nyashahama/invoice-chaser-backend/internal/domain"
	oai "github.com/nyashahama/invoice-chaser-backend/internal/openai"
)

// EmailService handles AI generation, tracking injection, and fallback templating.
// It owns the HTTP-level concerns (tracking URLs, pixel injection) and delegates
// all OpenAI protocol concerns (retry, JSON parsing, fence stripping) to the
// internal/openai package via the Completer interface.
type EmailService struct {
	ai         oai.Completer // injectable for tests — swap with a fake Completer
	maxTokens  int
	appBaseURL string
	log        *slog.Logger
}

// NewEmailService constructs an EmailService.
// ai must be a *oai.Client in production; inject a fake oai.Completer in tests.
// maxTokens ≤ 0 defaults to 500.
func NewEmailService(ai oai.Completer, maxTokens int, appBaseURL string, log *slog.Logger) *EmailService {
	if maxTokens <= 0 {
		maxTokens = 500
	}
	return &EmailService{
		ai:         ai,
		maxTokens:  maxTokens,
		appBaseURL: strings.TrimRight(appBaseURL, "/"),
		log:        log,
	}
}

// GenerateEmailParams is the full domain context passed to the AI generator.
type GenerateEmailParams struct {
	User     domain.User
	Invoice  domain.Invoice
	Reminder domain.Reminder
	Sequence domain.ReminderSequence
}

// GenerateEmailResult holds the generated email content and token usage.
type GenerateEmailResult struct {
	Subject                string
	BodyText               string
	BodyHTML               string
	OpenAIPromptTokens     int32
	OpenAICompletionTokens int32
}

// GenerateWithAI calls the internal OpenAI client to generate a personalised
// reminder email. Retry, backoff, fence-stripping, and JSON parsing are all
// handled by the oai.Client — this method just builds the request and reads
// the typed result.
//
// Returns an error only when the client exhausts all retries or hits the
// content filter. Callers should fall back to FallbackEmail on any error.
func (s *EmailService) GenerateWithAI(ctx context.Context, p GenerateEmailParams) (GenerateEmailResult, error) {
	req := oai.BuildReminderRequest(oai.ReminderEmailParams{
		User:     p.User,
		Invoice:  p.Invoice,
		Reminder: p.Reminder,
		Sequence: p.Sequence,
	}, s.maxTokens)

	result, err := s.ai.Complete(ctx, req)
	if err != nil {
		// Surface content-filter errors distinctly so callers can log them
		// without treating them the same as transient network failures.
		if errors.Is(err, oai.ErrContentFilter) {
			s.log.WarnContext(ctx, "openai content filter triggered",
				slog.String("reminder_id", p.Reminder.ID.String()),
			)
		}
		return GenerateEmailResult{}, fmt.Errorf("generate email: %w", err)
	}

	var email oai.GeneratedEmail
	if err := result.ParseInto(&email); err != nil {
		return GenerateEmailResult{}, fmt.Errorf("parse generated email: %w", err)
	}

	// Inject tracking pixel and click link. This is an EmailService concern,
	// not an OpenAI concern — the model only ever sees [PAYMENT_LINK].
	email.BodyHTML = s.injectTracking(email.BodyHTML, p.Reminder.OpenToken, p.Invoice.ClickToken)

	return GenerateEmailResult{
		Subject:                email.Subject,
		BodyText:               email.BodyText,
		BodyHTML:               email.BodyHTML,
		OpenAIPromptTokens:     int32(result.PromptTokens),
		OpenAICompletionTokens: int32(result.CompletionTokens),
	}, nil
}

// FallbackEmail returns a deterministic static email used when GenerateWithAI
// fails after all retries. Token counts are zero (correctly, since no API call
// succeeded). Tracking is injected so the code path through the scheduler is
// identical regardless of which branch ran.
func (s *EmailService) FallbackEmail(p GenerateEmailParams) GenerateEmailResult {
	fb := oai.FallbackEmail(oai.ReminderEmailParams{
		User:     p.User,
		Invoice:  p.Invoice,
		Reminder: p.Reminder,
		Sequence: p.Sequence,
	})

	// Inject tracking — [PAYMENT_LINK] is preserved by oai.FallbackEmail
	// specifically so this injection path works uniformly.
	bodyHTML := s.injectTracking(fb.BodyHTML, p.Reminder.OpenToken, p.Invoice.ClickToken)

	return GenerateEmailResult{
		Subject:  fb.Subject,
		BodyText: fb.BodyText,
		BodyHTML: bodyHTML,
		// OpenAIPromptTokens / OpenAICompletionTokens intentionally zero.
	}
}

// injectTracking replaces [PAYMENT_LINK] with a tracked click URL and
// appends a 1×1 transparent open-tracking pixel to the HTML.
func (s *EmailService) injectTracking(html, openToken, clickToken string) string {
	clickURL := fmt.Sprintf("%s/track/click/%s", s.appBaseURL, clickToken)
	html = strings.ReplaceAll(html, "[PAYMENT_LINK]", clickURL)

	pixel := fmt.Sprintf(
		`<img src="%s/track/open/%s" width="1" height="1" style="display:none" alt="">`,
		s.appBaseURL, openToken,
	)
	if strings.Contains(html, "</body>") {
		html = strings.Replace(html, "</body>", pixel+"</body>", 1)
	} else {
		html += pixel
	}
	return html
}

// firstNameOrName returns contact if non-empty, otherwise the company/client name.
// Used by FallbackEmail via oai.FallbackEmail; kept here for local helpers that
// may still need it.
func firstNameOrName(contact, fallback string) string {
	if contact != "" {
		return contact
	}
	return fallback
}