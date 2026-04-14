package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/smtp"
	"strings"
)

// Message is the normalized outbound email payload used by all mail transports.
type Message struct {
	ToName    string
	ToEmail   string
	Subject   string
	TextBody  string
	HTMLBody  string
	FromName  string
	FromEmail string
}

// Mailer sends a prepared message through a concrete email transport.
type Mailer interface {
	Send(ctx context.Context, msg Message) error
}

// ResendMailer sends mail through the Resend REST API.
type ResendMailer struct {
	apiKey string
	client *http.Client
}

func NewResendMailer(apiKey string, client *http.Client) *ResendMailer {
	if client == nil {
		client = http.DefaultClient
	}
	return &ResendMailer{apiKey: apiKey, client: client}
}

func (m *ResendMailer) Send(ctx context.Context, msg Message) error {
	payload := map[string]string{
		"from":    formatAddress(msg.FromName, msg.FromEmail),
		"to":      msg.ToEmail,
		"subject": msg.Subject,
		"text":    msg.TextBody,
		"html":    msg.HTMLBody,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal resend payload: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.resend.com/emails", bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("build resend request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+m.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := m.client.Do(req)
	if err != nil {
		return fmt.Errorf("send via resend: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("send via resend: status %d: %s", resp.StatusCode, strings.TrimSpace(string(respBody)))
	}

	return nil
}

// SMTPMailer sends mail through a traditional SMTP server.
type SMTPMailer struct {
	addr     string
	host     string
	username string
	password string
}

func NewSMTPMailer(host string, port int, username, password string) *SMTPMailer {
	return &SMTPMailer{
		addr:     fmt.Sprintf("%s:%d", host, port),
		host:     host,
		username: username,
		password: password,
	}
}

func (m *SMTPMailer) Send(_ context.Context, msg Message) error {
	var auth smtp.Auth
	if m.username != "" || m.password != "" {
		auth = smtp.PlainAuth("", m.username, m.password, m.host)
	}
	raw, err := smtpMessage(msg)
	if err != nil {
		return err
	}
	if err := smtp.SendMail(m.addr, auth, msg.FromEmail, []string{msg.ToEmail}, raw); err != nil {
		return fmt.Errorf("send via smtp: %w", err)
	}
	return nil
}

func smtpMessage(msg Message) ([]byte, error) {
	var body bytes.Buffer
	writer := multipart.NewWriter(&body)

	headers := []string{
		fmt.Sprintf("From: %s", formatAddress(msg.FromName, msg.FromEmail)),
		fmt.Sprintf("To: %s", formatAddress(msg.ToName, msg.ToEmail)),
		fmt.Sprintf("Subject: %s", msg.Subject),
		"MIME-Version: 1.0",
		fmt.Sprintf("Content-Type: multipart/alternative; boundary=%q", writer.Boundary()),
		"",
	}

	for _, part := range []struct {
		contentType string
		body        string
	}{
		{contentType: "text/plain; charset=UTF-8", body: msg.TextBody},
		{contentType: "text/html; charset=UTF-8", body: msg.HTMLBody},
	} {
		w, err := writer.CreatePart(map[string][]string{
			"Content-Type":              {part.contentType},
			"Content-Transfer-Encoding": {"quoted-printable"},
		})
		if err != nil {
			return nil, fmt.Errorf("create smtp part: %w", err)
		}
		if _, err := io.WriteString(w, part.body); err != nil {
			return nil, fmt.Errorf("write smtp part: %w", err)
		}
	}

	if err := writer.Close(); err != nil {
		return nil, fmt.Errorf("close smtp message: %w", err)
	}

	return []byte(strings.Join(headers, "\r\n") + body.String()), nil
}

func formatAddress(name, email string) string {
	if strings.TrimSpace(name) == "" {
		return email
	}
	return fmt.Sprintf("%s <%s>", name, email)
}
