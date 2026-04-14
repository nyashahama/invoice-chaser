package service

import (
	"context"
	"crypto/sha256"
	"fmt"
	"log/slog"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"golang.org/x/crypto/bcrypt"

	db "github.com/nyashahama/invoice-chaser-backend/db/gen"
	"github.com/nyashahama/invoice-chaser-backend/internal/api/middleware"
	"github.com/nyashahama/invoice-chaser-backend/internal/domain"
)

// TokenPair holds an access token and a raw refresh token string.
// Only the hash of the refresh token is stored in the database.
type TokenPair struct {
	AccessToken  string
	RefreshToken string
}

// UserService handles registration, authentication, and profile management.
type UserService struct {
	q             db.Querier
	jwtSecret     string
	jwtExpiry     time.Duration // sourced from config.JWTExpiry
	refreshExpiry time.Duration // sourced from config.RefreshExpiry
	log           *slog.Logger
}

// NewUserService constructs a UserService.
// jwtExpiry and refreshExpiry must be sourced from config.Config — never hardcoded.
func NewUserService(q db.Querier, jwtSecret string, jwtExpiry, refreshExpiry time.Duration, log *slog.Logger) *UserService {
	return &UserService{
		q:             q,
		jwtSecret:     jwtSecret,
		jwtExpiry:     jwtExpiry,
		refreshExpiry: refreshExpiry,
		log:           log,
	}
}

// RegisterParams is the input for creating a new user account.
type RegisterParams struct {
	Email    string
	Password string
	FullName string
	Timezone string
}

// Register creates a new user and returns a token pair.
func (s *UserService) Register(ctx context.Context, p RegisterParams) (TokenPair, domain.User, error) {
	// Email must be unique.
	if _, err := s.q.GetUserByEmail(ctx, p.Email); err == nil {
		return TokenPair{}, domain.User{}, domain.ErrConflict
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(p.Password), 12)
	if err != nil {
		return TokenPair{}, domain.User{}, fmt.Errorf("hash password: %w", err)
	}
	if p.Timezone == "" {
		p.Timezone = "UTC"
	}

	row, err := s.q.CreateUser(ctx, db.CreateUserParams{
		Email:        p.Email,
		PasswordHash: pgtype.Text{String: string(hash), Valid: true},
		FullName:     p.FullName,
		Plan:         string(domain.PlanFree),
		Timezone:     p.Timezone,
	})
	if err != nil {
		return TokenPair{}, domain.User{}, fmt.Errorf("create user: %w", err)
	}

	user := domain.UserFromDB(row)
	tokens, err := s.issueTokens(ctx, user)
	if err != nil {
		return TokenPair{}, domain.User{}, err
	}

	s.log.InfoContext(ctx, "user registered", slog.String("user_id", user.ID.String()))
	return tokens, user, nil
}

// Login validates credentials and returns a token pair.
// Returns ErrUnauthorized on invalid credentials — generic to prevent enumeration.
func (s *UserService) Login(ctx context.Context, email, password string) (TokenPair, domain.User, error) {
	row, err := s.q.GetUserByEmail(ctx, email)
	if err != nil {
		return TokenPair{}, domain.User{}, domain.ErrUnauthorized
	}
	user := domain.UserFromDB(row)
	if !user.HasPassword() {
		return TokenPair{}, domain.User{}, domain.ErrUnauthorized
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return TokenPair{}, domain.User{}, domain.ErrUnauthorized
	}

	tokens, err := s.issueTokens(ctx, user)
	if err != nil {
		return TokenPair{}, domain.User{}, err
	}
	return tokens, user, nil
}

// RefreshToken validates a refresh token and issues a new token pair.
// Rotates the refresh token on every use — the old one is immediately invalidated.
func (s *UserService) RefreshToken(ctx context.Context, rawToken string) (TokenPair, error) {
	row, err := s.q.GetRefreshToken(ctx, hashToken(rawToken))
	if err != nil {
		return TokenPair{}, domain.ErrUnauthorized
	}
	if err := s.q.MarkRefreshTokenUsed(ctx, row.ID); err != nil {
		return TokenPair{}, fmt.Errorf("mark token used: %w", err)
	}
	userRow, err := s.q.GetUserByID(ctx, row.UserID)
	if err != nil {
		return TokenPair{}, mapNotFound(err, "user")
	}
	return s.issueTokens(ctx, domain.UserFromDB(userRow))
}

// Logout revokes all refresh tokens for the user associated with rawToken.
// Idempotent — returns nil if the token is already invalid.
func (s *UserService) Logout(ctx context.Context, rawToken string) error {
	row, err := s.q.GetRefreshToken(ctx, hashToken(rawToken))
	if err != nil {
		return nil
	}
	return s.q.RevokeAllRefreshTokensForUser(ctx, row.UserID)
}

// GetByID returns a user by primary key.
func (s *UserService) GetByID(ctx context.Context, id uuid.UUID) (domain.User, error) {
	row, err := s.q.GetUserByID(ctx, id)
	if err != nil {
		return domain.User{}, mapNotFound(err, "user")
	}
	return domain.UserFromDB(row), nil
}

// UpdateUserParams carries patchable user profile fields.
type UpdateUserParams struct {
	ID             uuid.UUID
	FullName       *string
	Timezone       *string
	EmailSignature *string
}

// Update applies a partial update to a user profile.
func (s *UserService) Update(ctx context.Context, p UpdateUserParams) (domain.User, error) {
	arg := db.UpdateUserParams{ID: p.ID}
	if p.FullName != nil {
		arg.FullName = pgtype.Text{String: *p.FullName, Valid: true}
	}
	if p.Timezone != nil {
		arg.Timezone = pgtype.Text{String: *p.Timezone, Valid: true}
	}
	if p.EmailSignature != nil {
		arg.EmailSignature = pgtype.Text{String: *p.EmailSignature, Valid: true}
	}
	row, err := s.q.UpdateUser(ctx, arg)
	if err != nil {
		return domain.User{}, mapNotFound(err, "user")
	}
	return domain.UserFromDB(row), nil
}

// ChangePassword verifies current password then stores a new bcrypt hash.
func (s *UserService) ChangePassword(ctx context.Context, userID uuid.UUID, current, newPass string) error {
	row, err := s.q.GetUserByID(ctx, userID)
	if err != nil {
		return mapNotFound(err, "user")
	}
	user := domain.UserFromDB(row)
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(current)); err != nil {
		return domain.ErrUnauthorized
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(newPass), 12)
	if err != nil {
		return fmt.Errorf("hash password: %w", err)
	}
	return s.q.UpdateUserPasswordHash(ctx, db.UpdateUserPasswordHashParams{
		ID:           userID,
		PasswordHash: pgtype.Text{String: string(hash), Valid: true},
	})
}

// issueTokens creates a signed JWT and stores a new hashed refresh token.
// Both expiry durations come from config via the UserService fields —
// never hardcoded here.
func (s *UserService) issueTokens(ctx context.Context, user domain.User) (TokenPair, error) {
	accessToken, err := middleware.IssueAccessToken(s.jwtSecret, user.ID, user.Email, string(user.Plan), s.jwtExpiry)
	if err != nil {
		return TokenPair{}, fmt.Errorf("issue access token: %w", err)
	}

	rawRefresh := uuid.New().String()
	_, err = s.q.CreateRefreshToken(ctx, db.CreateRefreshTokenParams{
		UserID:    user.ID,
		TokenHash: hashToken(rawRefresh),
		ExpiresAt: pgtype.Timestamptz{Time: time.Now().UTC().Add(s.refreshExpiry), Valid: true},
	})
	if err != nil {
		return TokenPair{}, fmt.Errorf("store refresh token: %w", err)
	}

	return TokenPair{
		AccessToken:  accessToken,
		RefreshToken: rawRefresh,
	}, nil
}

// hashToken returns a hex-encoded SHA-256 digest of a raw token string.
// Refresh tokens are stored only as their hash — the raw value is never persisted.
func hashToken(raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return fmt.Sprintf("%x", sum)
}