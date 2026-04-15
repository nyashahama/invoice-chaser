"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";

import type { ApiUser, ChangePasswordInput, UpdateUserInput } from "@/lib/api/types";

interface ProfilePanelProps {
  onChangePassword: (input: ChangePasswordInput) => Promise<void>;
  onSaveProfile: (input: UpdateUserInput) => Promise<void>;
  user: ApiUser;
}

export default function ProfilePanel({
  onChangePassword,
  onSaveProfile,
  user,
}: ProfilePanelProps) {
  const [fullName, setFullName] = useState(user.full_name);
  const [timezone, setTimezone] = useState(user.timezone);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    setFullName(user.full_name);
    setTimezone(user.timezone);
  }, [user.full_name, user.timezone]);

  async function handleProfileSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileMessage(null);
    setSavingProfile(true);

    try {
      await onSaveProfile({
        full_name: fullName,
        timezone,
      });
      setProfileMessage("Profile updated.");
    } catch (error) {
      setProfileMessage(
        error instanceof Error ? error.message : "Could not update profile.",
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordMessage(null);
    setSavingPassword(true);

    try {
      await onChangePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setPasswordMessage("Password updated.");
    } catch (error) {
      setPasswordMessage(
        error instanceof Error ? error.message : "Could not update password.",
      );
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <section
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        display: "grid",
        gap: "18px",
        padding: "20px",
      }}
    >
      <div>
        <h2 style={{ marginTop: 0 }}>Profile</h2>
        <p style={{ color: "var(--text-dim)", margin: "8px 0 0" }}>
          Keep your account details accurate for reminder generation and
          reporting.
        </p>
      </div>

      <form onSubmit={handleProfileSave} style={{ display: "grid", gap: "12px" }}>
        <label style={{ display: "grid", gap: "8px" }}>
          <span style={{ color: "var(--text-dim)" }}>Full name</span>
          <input
            onChange={(event) => setFullName(event.target.value)}
            style={fieldStyle}
            value={fullName}
          />
        </label>

        <label style={{ display: "grid", gap: "8px" }}>
          <span style={{ color: "var(--text-dim)" }}>Timezone</span>
          <input
            onChange={(event) => setTimezone(event.target.value)}
            style={fieldStyle}
            value={timezone}
          />
        </label>

        <div
          style={{
            alignItems: "center",
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            justifyContent: "space-between",
          }}
        >
          {profileMessage ? (
            <span style={{ color: "var(--text-dim)" }}>{profileMessage}</span>
          ) : (
            <span style={{ color: "var(--text-dim)" }}>{user.email}</span>
          )}
          <button className="btn-primary" disabled={savingProfile} type="submit">
            <span>{savingProfile ? "Saving..." : "Save profile"}</span>
            <span>→</span>
          </button>
        </div>
      </form>

      <form onSubmit={handlePasswordSave} style={{ display: "grid", gap: "12px" }}>
        <label style={{ display: "grid", gap: "8px" }}>
          <span style={{ color: "var(--text-dim)" }}>Current password</span>
          <input
            onChange={(event) => setCurrentPassword(event.target.value)}
            style={fieldStyle}
            type="password"
            value={currentPassword}
          />
        </label>

        <label style={{ display: "grid", gap: "8px" }}>
          <span style={{ color: "var(--text-dim)" }}>New password</span>
          <input
            onChange={(event) => setNewPassword(event.target.value)}
            style={fieldStyle}
            type="password"
            value={newPassword}
          />
        </label>

        <div
          style={{
            alignItems: "center",
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            justifyContent: "space-between",
          }}
        >
          {passwordMessage ? (
            <span style={{ color: "var(--text-dim)" }}>{passwordMessage}</span>
          ) : (
            <span style={{ color: "var(--text-dim)" }}>
              Passwords must be at least 8 characters.
            </span>
          )}
          <button className="btn-primary" disabled={savingPassword} type="submit">
            <span>{savingPassword ? "Saving..." : "Change password"}</span>
            <span>→</span>
          </button>
        </div>
      </form>
    </section>
  );
}

const fieldStyle = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid var(--border)",
  borderRadius: "6px",
  color: "var(--text)",
  padding: "12px 14px",
  width: "100%",
} satisfies CSSProperties;
