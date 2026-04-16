package domain

import "time"

type CollectionEngagementState string

const (
	CollectionEngagementUnengaged CollectionEngagementState = "unengaged"
	CollectionEngagementOpened    CollectionEngagementState = "opened"
	CollectionEngagementClicked   CollectionEngagementState = "clicked"
	CollectionEngagementBounced   CollectionEngagementState = "bounced"
	CollectionEngagementPaid      CollectionEngagementState = "paid"
)

type CollectionNextBestAction string

const (
	CollectionActionNone           CollectionNextBestAction = "none"
	CollectionActionWait           CollectionNextBestAction = "wait"
	CollectionActionSendNow        CollectionNextBestAction = "send_now"
	CollectionActionEscalateTone   CollectionNextBestAction = "escalate_tone"
	CollectionActionFixEmail       CollectionNextBestAction = "fix_email"
	CollectionActionManualFollowUp CollectionNextBestAction = "manual_follow_up"
)

type CollectionReason struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

type CollectionMetrics struct {
	ReminderCount int        `json:"reminder_count"`
	OpenCount     int        `json:"open_count"`
	ClickCount    int        `json:"click_count"`
	FailedCount   int        `json:"failed_count"`
	LastSentAt    *time.Time `json:"last_sent_at,omitempty"`
}

type CollectionState struct {
	RiskScore         int
	EngagementState   CollectionEngagementState
	NextBestAction    CollectionNextBestAction
	RecommendedTone   Tone
	RecommendedSendAt *time.Time
	Reasons           []CollectionReason
	Metrics           CollectionMetrics
	LastEventAt       *time.Time
	LastEvaluatedAt   time.Time
	AppliedAt         *time.Time
}
