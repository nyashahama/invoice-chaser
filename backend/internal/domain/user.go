package domain

import (
	"time"

	"github.com/google/uuid"
)

// Plan is the user's subscription tier.
type Plan string

const (
	PlanFree   Plan = "free"
	PlanPro    Plan = "pro"
	PlanAgency Plan = "agency"
)

func (p Plan) String() string { return string(p) }

func (p Plan) IsValid() bool {
	switch p {
	case PlanFree, PlanPro, PlanAgency:
		return true
	}
	return false
}

// User is a registered freelancer or agency owner.
type User struct {
	ID             uuid.UUID
	Email          string
	PasswordHash   string // bcrypt cost 12; empty for OAuth-only accounts
	FullName       string
	Plan           Plan
	Timezone       string // IANA timezone, e.g. "Africa/Johannesburg"
	EmailSignature string // appended to every generated email; may be empty
	CreatedAt      time.Time
	UpdatedAt      time.Time
	DeletedAt      *time.Time // non-nil means soft-deleted
}

// IsDeleted reports whether this user has been soft-deleted.
func (u *User) IsDeleted() bool {
	return u.DeletedAt != nil
}

// HasPassword reports whether the user has a local password (vs OAuth-only).
func (u *User) HasPassword() bool {
	return u.PasswordHash != ""
}

// DisplayName returns the user's full name, falling back to email.
func (u *User) DisplayName() string {
	if u.FullName != "" {
		return u.FullName
	}
	return u.Email
}