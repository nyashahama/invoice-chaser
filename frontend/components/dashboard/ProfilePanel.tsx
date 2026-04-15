"use client";

import { useEffect, useState } from "react";

import type { ApiUser, ChangePasswordInput, UpdateUserInput } from "@/lib/api/types";

interface ProfilePanelProps {
  onChangePassword: (input: ChangePasswordInput) => Promise<void>;
  onSaveProfile: (input: UpdateUserInput) => Promise<void>;
  user: ApiUser;
}

const FIELD = "bg-white/[0.03] border border-border-default rounded-md text-text px-3.5 py-3 w-full";
const BTN_PRIMARY = "inline-flex items-center gap-2.5 bg-green text-black font-mono text-[13px] font-bold tracking-[0.05em] uppercase px-8 py-4 rounded-[2px] transition-all hover:bg-[#1fffaa] hover:-translate-y-px hover:shadow-[0_8px_32px_rgba(0,230,118,0.3)] border-none cursor-pointer";

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
    <section className="grid gap-[18px] rounded-lg border border-border-default bg-white/[0.02] p-5">
      <div>
        <h2 className="mt-0">Profile</h2>
        <p className="mt-2 text-text-dim">
          Keep your account details accurate for reminder generation and
          reporting.
        </p>
      </div>

      <form onSubmit={handleProfileSave} className="grid gap-3">
        <label className="grid gap-2">
          <span className="text-text-dim">Full name</span>
          <input
            onChange={(event) => setFullName(event.target.value)}
            className={FIELD}
            value={fullName}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-text-dim">Timezone</span>
          <input
            onChange={(event) => setTimezone(event.target.value)}
            className={FIELD}
            value={timezone}
          />
        </label>

        <div className="flex flex-wrap items-center justify-between gap-3">
          {profileMessage ? (
            <span className="text-text-dim">{profileMessage}</span>
          ) : (
            <span className="text-text-dim">{user.email}</span>
          )}
          <button className={BTN_PRIMARY} disabled={savingProfile} type="submit">
            <span>{savingProfile ? "Saving..." : "Save profile"}</span>
            <span>→</span>
          </button>
        </div>
      </form>

      <form onSubmit={handlePasswordSave} className="grid gap-3">
        <label className="grid gap-2">
          <span className="text-text-dim">Current password</span>
          <input
            onChange={(event) => setCurrentPassword(event.target.value)}
            className={FIELD}
            type="password"
            value={currentPassword}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-text-dim">New password</span>
          <input
            onChange={(event) => setNewPassword(event.target.value)}
            className={FIELD}
            type="password"
            value={newPassword}
          />
        </label>

        <div className="flex flex-wrap items-center justify-between gap-3">
          {passwordMessage ? (
            <span className="text-text-dim">{passwordMessage}</span>
          ) : (
            <span className="text-text-dim">
              Passwords must be at least 8 characters.
            </span>
          )}
          <button className={BTN_PRIMARY} disabled={savingPassword} type="submit">
            <span>{savingPassword ? "Saving..." : "Change password"}</span>
            <span>→</span>
          </button>
        </div>
      </form>
    </section>
  );
}