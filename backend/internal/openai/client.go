// Package openai provides a thin wrapper around the OpenAI chat-completion API.
// It owns:
//   - The Client interface (for easy mocking in tests)
//   - Retry logic with exponential backoff
//   - JSON-envelope parsing of structured model responses
//   - Token-usage tracking surfaced to callers
//
// Nothing in this package imports domain or service — it is a pure infrastructure
// adapter. Callers pass raw strings in and get structured results back.
package openai

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"strings"
	"time"

	goOpenAI "github.com/sashabaranov/go-openai"
)

// ─── public types ─────────────────────────────────────────────────────────────

// CompletionRequest is the input to a single chat-completion call.
type CompletionRequest struct {
	SystemPrompt string
	UserPrompt   string
	MaxTokens    int
}

// CompletionResult is the structured response from a successful call.
type CompletionResult struct {
	// Raw JSON string returned by the model (markdown fences stripped).
	RawJSON string

	PromptTokens     int
	CompletionTokens int
}

// TotalTokens returns combined prompt + completion usage.
func (r CompletionResult) TotalTokens() int {
	return r.PromptTokens + r.CompletionTokens
}

// ParseInto unmarshals RawJSON into dst.
// dst must be a pointer (e.g. *GeneratedEmail).
func (r CompletionResult) ParseInto(dst any) error {
	if err := json.Unmarshal([]byte(r.RawJSON), dst); err != nil {
		return fmt.Errorf("openai: parse response JSON: %w", err)
	}
	return nil
}

// ─── interface (for mocking) ──────────────────────────────────────────────────

// Completer is the interface the rest of the application depends on.
// Swap in a fake during tests without touching the service layer.
type Completer interface {
	Complete(ctx context.Context, req CompletionRequest) (CompletionResult, error)
}

// ─── production client ────────────────────────────────────────────────────────

// Client wraps the upstream go-openai SDK with retry and structured-output
// handling. Implements Completer.
type Client struct {
	inner     *goOpenAI.Client
	model     string
	log       *slog.Logger
	retryConf retryConfig
}

// retryConfig controls the exponential-backoff retry behaviour.
type retryConfig struct {
	maxAttempts int
	delays      []time.Duration
}

// defaultRetry is 3 attempts with delays of 1 s → 3 s → 9 s.
var defaultRetry = retryConfig{
	maxAttempts: 3,
	delays:      []time.Duration{1 * time.Second, 3 * time.Second, 9 * time.Second},
}

// New constructs a production Client. apiKey must be non-empty.
// model defaults to GPT-4o when empty.
func New(apiKey, model string, log *slog.Logger) *Client {
	if model == "" {
		model = goOpenAI.GPT4o
	}
	return &Client{
		inner:     goOpenAI.NewClient(apiKey),
		model:     model,
		log:       log,
		retryConf: defaultRetry,
	}
}

// Complete sends a chat-completion request and returns structured output.
//
// Retry behaviour:
//   - Up to 3 attempts with 1 s / 3 s / 9 s back-off.
//   - Context cancellation aborts immediately between retries.
//
// Structured output contract:
//   - The model is expected to reply with a raw JSON object.
//   - Markdown fences (```json … ```) are stripped before parsing.
//   - ErrContentFilter is returned when the model's finish_reason is
//     "content_filter", so callers can fall back gracefully.
func (c *Client) Complete(ctx context.Context, req CompletionRequest) (CompletionResult, error) {
	if req.MaxTokens <= 0 {
		req.MaxTokens = 500
	}

	apiReq := goOpenAI.ChatCompletionRequest{
		Model:     c.model,
		MaxTokens: req.MaxTokens,
		Messages: []goOpenAI.ChatCompletionMessage{
			{Role: goOpenAI.ChatMessageRoleSystem, Content: req.SystemPrompt},
			{Role: goOpenAI.ChatMessageRoleUser, Content: req.UserPrompt},
		},
	}

	var (
		resp    goOpenAI.ChatCompletionResponse
		lastErr error
	)

	for attempt := 0; attempt < c.retryConf.maxAttempts; attempt++ {
		resp, lastErr = c.inner.CreateChatCompletion(ctx, apiReq)
		if lastErr == nil {
			break
		}

		c.log.WarnContext(ctx, "openai request failed",
			slog.Int("attempt", attempt+1),
			slog.Int("max_attempts", c.retryConf.maxAttempts),
			slog.String("error", lastErr.Error()),
		)

		// Don't sleep after the final attempt.
		if attempt < len(c.retryConf.delays) {
			select {
			case <-ctx.Done():
				return CompletionResult{}, fmt.Errorf("openai: context cancelled during retry: %w", ctx.Err())
			case <-time.After(c.retryConf.delays[attempt]):
			}
		}
	}

	if lastErr != nil {
		return CompletionResult{}, fmt.Errorf("openai: all %d attempts failed: %w", c.retryConf.maxAttempts, lastErr)
	}

	if len(resp.Choices) == 0 {
		return CompletionResult{}, ErrNoChoices
	}

	choice := resp.Choices[0]
	if string(choice.FinishReason) == "content_filter" {
		return CompletionResult{}, ErrContentFilter
	}

	raw := stripFences(choice.Message.Content)

	return CompletionResult{
		RawJSON:          raw,
		PromptTokens:     resp.Usage.PromptTokens,
		CompletionTokens: resp.Usage.CompletionTokens,
	}, nil
}

// ─── sentinel errors ──────────────────────────────────────────────────────────

// ErrContentFilter is returned when the model's finish_reason is "content_filter".
// Callers should fall back to a static template rather than retrying.
var ErrContentFilter = fmt.Errorf("openai: content filter triggered")

// ErrNoChoices is returned when the API responds with an empty choices array.
var ErrNoChoices = fmt.Errorf("openai: response contained no choices")

// ─── helpers ─────────────────────────────────────────────────────────────────

// stripFences removes markdown code fences that the model sometimes wraps its
// JSON output in, e.g.:
//
//	```json
//	{ "subject": "..." }
//	```
func stripFences(s string) string {
	s = strings.TrimPrefix(s, "```json")
	s = strings.TrimPrefix(s, "```")
	s = strings.TrimSuffix(s, "```")
	return strings.TrimSpace(s)
}