"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();

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

    setMessage("Password updated. Redirecting to your dashboard...");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#060002]">
      <Suspense fallback={<div className="h-14 border-b border-white/10 bg-[#060002]/90 backdrop-blur" />}>
        <SiteHeader />
      </Suspense>
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="mb-6 font-[family-name:var(--font-display)] text-3xl uppercase text-[#fbecef]">
          Set a new password
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="New password"
            className="w-full rounded-lg border border-white/10 bg-[#220413] px-4 py-3 text-[#fbecef] placeholder:text-[#8f6b78]"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Confirm new password"
            className="w-full rounded-lg border border-white/10 bg-[#220413] px-4 py-3 text-[#fbecef] placeholder:text-[#8f6b78]"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-full bg-gradient-to-r from-[#ff115a] to-[#c400ff] px-4 py-3 font-bold text-[#060002] shadow-[0_0_26px_rgba(255,17,90,0.4)] hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Update password"}
          </button>
        </form>

        {message ? <p className="mt-4 text-sm text-[#ff5f8f]">{message}</p> : null}
      </div>
    </main>
  );
}
