package payfast

import (
	"bytes"
	"context"
	"crypto/md5"
	"crypto/subtle"
	"encoding/hex"
	"io"
	"log/slog"
	"net"
	"net/http"
	"net/url"
	"sort"
	"strings"
)

type hostResolver func(ctx context.Context, host string) ([]net.IP, error)

// Verifier validates PayFast webhook requests.
type Verifier struct {
	client                *http.Client
	log                   *slog.Logger
	resolve               hostResolver
	productionValidateURL string
	sandboxValidateURL    string
	allowedHosts          []string
}

func NewVerifier(client *http.Client, log *slog.Logger) *Verifier {
	if client == nil {
		client = http.DefaultClient
	}
	return &Verifier{
		client:                client,
		log:                   log,
		resolve:               defaultResolve,
		productionValidateURL: "https://www.payfast.co.za/eng/query/validate",
		sandboxValidateURL:    "https://sandbox.payfast.co.za/eng/query/validate",
		allowedHosts: []string{
			"www.payfast.co.za",
			"sandbox.payfast.co.za",
		},
	}
}

func (v *Verifier) IsAllowedIP(raw string) bool {
	ip := normalizeIP(raw)
	if ip == nil {
		return false
	}
	if ip.IsLoopback() || ip.IsPrivate() {
		return true
	}

	for _, host := range v.allowedHosts {
		ips, err := v.resolve(context.Background(), host)
		if err != nil {
			v.log.Warn("payfast: resolve allowlist host failed", slog.String("host", host), slog.String("error", err.Error()))
			continue
		}
		for _, allowed := range ips {
			if allowed.Equal(ip) {
				return true
			}
		}
	}
	return false
}

func (v *Verifier) VerifySignature(params map[string]string, passphrase string) bool {
	expected := strings.ToLower(strings.TrimSpace(params["signature"]))
	if expected == "" {
		return false
	}
	actual := signature(params, passphrase)
	return subtle.ConstantTimeCompare([]byte(actual), []byte(expected)) == 1
}

func (v *Verifier) ValidateWithServer(body []byte, sandbox bool) bool {
	payload := bytes.TrimSpace(body)
	if len(payload) == 0 {
		return false
	}
	if !bytes.HasPrefix(payload, []byte("cmd=_notify-validate")) {
		payload = append([]byte("cmd=_notify-validate&"), payload...)
	}

	endpoint := v.productionValidateURL
	if sandbox {
		endpoint = v.sandboxValidateURL
	}

	req, err := http.NewRequestWithContext(context.Background(), http.MethodPost, endpoint, bytes.NewReader(payload))
	if err != nil {
		v.log.Warn("payfast: build validation request failed", slog.String("error", err.Error()))
		return false
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := v.client.Do(req)
	if err != nil {
		v.log.Warn("payfast: validation request failed", slog.String("error", err.Error()))
		return false
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		v.log.Warn("payfast: read validation response failed", slog.String("error", err.Error()))
		return false
	}

	return resp.StatusCode < 300 && strings.EqualFold(strings.TrimSpace(string(respBody)), "VALID")
}

func defaultResolve(ctx context.Context, host string) ([]net.IP, error) {
	addrs, err := net.DefaultResolver.LookupIPAddr(ctx, host)
	if err != nil {
		return nil, err
	}
	ips := make([]net.IP, 0, len(addrs))
	for _, addr := range addrs {
		ips = append(ips, addr.IP)
	}
	return ips, nil
}

func normalizeIP(raw string) net.IP {
	candidate := strings.TrimSpace(raw)
	if candidate == "" {
		return nil
	}
	if idx := strings.Index(candidate, ","); idx >= 0 {
		candidate = strings.TrimSpace(candidate[:idx])
	}
	if host, _, err := net.SplitHostPort(candidate); err == nil {
		candidate = host
	}
	return net.ParseIP(strings.Trim(candidate, "[]"))
}

func signature(params map[string]string, passphrase string) string {
	keys := make([]string, 0, len(params))
	for key, value := range params {
		if key == "signature" || strings.TrimSpace(value) == "" {
			continue
		}
		keys = append(keys, key)
	}
	sort.Strings(keys)

	parts := make([]string, 0, len(keys)+1)
	for _, key := range keys {
		parts = append(parts, key+"="+escape(params[key]))
	}
	if strings.TrimSpace(passphrase) != "" {
		parts = append(parts, "passphrase="+escape(passphrase))
	}

	sum := md5.Sum([]byte(strings.Join(parts, "&")))
	return hex.EncodeToString(sum[:])
}

func escape(value string) string {
	return strings.ReplaceAll(url.QueryEscape(strings.TrimSpace(value)), "+", "%20")
}
