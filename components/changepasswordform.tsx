"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ChangePasswordForm() {
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords don't match.");
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setPassword("");
    setConfirmPassword("");
    setMessage("Password updated.");
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      <input
        type="password"
        placeholder="New password"
        className="rounded-lg border p-2 text-sm"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <input
        type="password"
        placeholder="Confirm new password"
        className="rounded-lg border p-2 text-sm"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
      />

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50"
      >
        {saving ? "Saving..." : "Update password"}
      </button>

      {message ? <p className="text-sm">{message}</p> : null}
    </form>
  );
}
