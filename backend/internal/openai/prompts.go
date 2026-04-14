package openai

import (
	"fmt"
	"strings"

	"github.com/nyashahama/invoice-chaser-backend/internal/domain"
)

// ─── model response shape ─────────────────────────────────────────────────────

// GeneratedEmail is the structured JSON envelope the model must return.
// Use CompletionResult.ParseInto(&GeneratedEmail{}) to decode it.
type GeneratedEmail struct {
	Subject  string `json:"subject"`
	BodyText string `json:"body_text"`
	BodyHTML string `json:"body_html"`
}

// ─── prompts ──────────────────────────────────────────────────────────────────

// systemPrompt is sent as the "system" role message on every request.
// It establishes the model's persona, output format, and hard constraints.
const systemPrompt = `You are an expert at writing invoice payment reminder emails.
Write concise, human-sounding emails — not templates, not robotic.
Max 150 words. Output JSON with keys: subject, body_text, body_html.
body_html should be minimal inline-styled HTML suitable for email clients.
Do not mention InvoiceChaser or that the email was automated.
Replace [PAYMENT_LINK] with the placeholder — do not invent URLs.`

// userPromptTemplate is the per-request "user" role message.
// Double-brace tokens are replaced by BuildReminderRequest before sending.
const userPromptTemplate = `Generate a reminder email with these details:
Sender: {{sender_name}} <{{sender_email}}>
Client contact: {{client_contact}} at {{client_name}}
Invoice #: {{invoice_number}}
Amount: {{amount}} {{currency}}
Due date: {{due_date}}
Days overdue: {{days_overdue}}
Work description: {{description}}
Context: {{notes}}
Email signature: {{email_signature}}
Sequence position: {{position}} of {{total}} ({{label}})
Tone guidance: {{tone_guide}}`

// ─── request builder ──────────────────────────────────────────────────────────

// ReminderEmailParams is the full domain context required to generate a
// personalised reminder email.  All fields are value types — no pointers —
// so callers cannot pass partially-constructed structs silently.
type ReminderEmailParams struct {
	User     domain.User
	Invoice  domain.Invoice
	Reminder domain.Reminder
	Sequence domain.ReminderSequence
}

// BuildReminderRequest constructs a CompletionRequest ready to pass to
// Client.Complete.  It fills every token in userPromptTemplate from the
// provided domain objects and attaches the fixed system prompt.
//
// maxTokens ≤ 0 falls back to the client default (500).
func BuildReminderRequest(p ReminderEmailParams, maxTokens int) CompletionRequest {
	return CompletionRequest{
		SystemPrompt: systemPrompt,
		UserPrompt:   buildUserPrompt(p),
		MaxTokens:    maxTokens,
	}
}

// buildUserPrompt fills all {{token}} placeholders in userPromptTemplate.
func buildUserPrompt(p ReminderEmailParams) string {
	inv := p.Invoice
	user := p.User
	seq := p.Sequence
	rem := p.Reminder

	label := fmt.Sprintf("reminder %d", rem.SequencePosition)
	if rem.SequencePosition == seq.MaxReminders {
		label = "final reminder"
	}

	r := strings.NewReplacer(
		"{{sender_name}}", user.FullName,
		"{{sender_email}}", user.Email,
		"{{client_contact}}", firstNameOrName(inv.ClientContact, inv.ClientName),
		"{{client_name}}", inv.ClientName,
		"{{invoice_number}}", inv.InvoiceNumber,
		"{{amount}}", inv.AmountFormatted(),
		"{{currency}}", inv.Currency,
		"{{due_date}}", inv.DueDate.Format("2 January 2006"),
		"{{days_overdue}}", fmt.Sprintf("%d", inv.DaysOverdue()),
		"{{description}}", inv.Description,
		"{{notes}}", inv.Notes,
		"{{email_signature}}", user.EmailSignature,
		"{{position}}", fmt.Sprintf("%d", rem.SequencePosition),
		"{{total}}", fmt.Sprintf("%d", seq.MaxReminders),
		"{{label}}", label,
		"{{tone_guide}}", seq.Tone.ToneGuide(),
	)
	return r.Replace(userPromptTemplate)
}

// ─── fallback template ────────────────────────────────────────────────────────

// FallbackEmail returns a deterministic, static GeneratedEmail used when
// the OpenAI call fails after all retries.  It never returns an error and
// never sets token counts (they will be zero, correctly reflecting no API
// usage).
//
// The [PAYMENT_LINK] placeholder is preserved so the caller's tracking-
// injection logic can replace it uniformly, regardless of code path.
func FallbackEmail(p ReminderEmailParams) GeneratedEmail {
	inv := p.Invoice
	user := p.User
	clientName := firstNameOrName(inv.ClientContact, inv.ClientName)

	subject := fmt.Sprintf("Payment reminder: Invoice %s", inv.InvoiceNumber)

	bodyText := fmt.Sprintf(
		"Hi %s,\n\n"+
			"This is a reminder that Invoice %s for %s %s is overdue by %d days.\n\n"+
			"Please arrange payment at your earliest convenience.\n\n"+
			"View and pay: [PAYMENT_LINK]\n\n"+
			"%s",
		clientName,
		inv.InvoiceNumber,
		inv.AmountFormatted(),
		inv.Currency,
		inv.DaysOverdue(),
		user.EmailSignature,
	)

	bodyHTML := fmt.Sprintf(
		`<p>Hi %s,</p>`+
			`<p>This is a reminder that Invoice <strong>%s</strong> `+
			`for <strong>%s %s</strong> is overdue by <strong>%d days</strong>.</p>`+
			`<p>Please arrange payment at your earliest convenience.</p>`+
			`<p><a href="[PAYMENT_LINK]">View and pay invoice &rarr;</a></p>`+
			`<p>%s</p>`,
		clientName,
		inv.InvoiceNumber,
		inv.AmountFormatted(),
		inv.Currency,
		inv.DaysOverdue(),
		user.EmailSignature,
	)

	return GeneratedEmail{
		Subject:  subject,
		BodyText: bodyText,
		BodyHTML: bodyHTML,
	}
}

// ─── helpers ──────────────────────────────────────────────────────────────────

// firstNameOrName returns contact if non-empty, otherwise the company/client name.
// Mirrors the helper in service/email.go; kept here so this package is self-contained.
func firstNameOrName(contact, fallback string) string {
	if contact != "" {
		return contact
	}
	return fallback
}