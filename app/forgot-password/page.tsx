"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("If an account exists for that email, a reset link has been sent.");
  }

  return (
    <main className="min-h-screen bg-[#060002]">
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="mb-6 font-[family-name:var(--font-display)] text-3xl uppercase text-[#fbecef]">
          Reset your password
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full rounded-lg border border-white/10 bg-[#220413] px-4 py-3 text-[#fbecef] placeholder:text-[#8f6b78]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-gradient-to-r from-[#ff115a] to-[#c400ff] px-4 py-3 font-bold text-[#060002] shadow-[0_0_26px_rgba(255,17,90,0.4)] hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link href="/login" className="text-sm text-[#c9a7b3] hover:text-[#ff5f8f]">
            Back to login
          </Link>
        </div>

        {message ? <p className="mt-4 text-sm text-[#ff5f8f]">{message}</p> : null}
      </div>
    </main>
  );
}
