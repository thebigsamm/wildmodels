"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isValidUsername, normalizeUsername } from "@/lib/username";
import { SiteHeader } from "@/components/SiteHeader";

export default function RegisterPage() {
  const supabase = createClient();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    const normalizedUsername = normalizeUsername(username);

    if (!isValidUsername(normalizedUsername)) {
      setMessage(
        "Username must be 3-20 characters: lowercase letters, numbers, underscore, starting with a letter."
      );
      return;
    }

    setLoading(true);

    const availRes = await fetch("/api/auth/check-username", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: normalizedUsername }),
    });
    const availData = await availRes.json();

    if (!availRes.ok || !availData.available) {
      setLoading(false);
      setMessage(availData.error || "That username is already taken.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      setMessage(error.message);
      return;
    }

    if (!data.user) {
      setLoading(false);
      setMessage("Account created. Check your email to confirm, then log in.");
      return;
    }

    const claimRes = await fetch("/api/auth/claim-username", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: data.user.id, username: normalizedUsername }),
    });
    const claimData = await claimRes.json();

    setLoading(false);

    if (!claimRes.ok) {
      setMessage(
        `Account created, but your username couldn't be saved: ${claimData.error || "unknown error"}. You can still log in with your email.`
      );
      return;
    }

    setMessage("Account created. Check your email to confirm, then log in.");
    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-[#060002]">
      <Suspense fallback={<div className="h-14 border-b border-white/10 bg-[#060002]/90 backdrop-blur" />}>
        <SiteHeader />
      </Suspense>
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="mb-6 font-[family-name:var(--font-display)] text-3xl uppercase text-[#fbecef]">
          Create account
        </h1>

        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            className="w-full rounded-lg border border-white/10 bg-[#220413] px-4 py-3 text-[#fbecef] placeholder:text-[#8f6b78]"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <input
            type="email"
            placeholder="Email"
            className="w-full rounded-lg border border-white/10 bg-[#220413] px-4 py-3 text-[#fbecef] placeholder:text-[#8f6b78]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-lg border border-white/10 bg-[#220413] px-4 py-3 text-[#fbecef] placeholder:text-[#8f6b78]"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-gradient-to-r from-[#ff115a] to-[#c400ff] px-4 py-3 font-bold text-[#060002] shadow-[0_0_26px_rgba(255,17,90,0.4)] hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>

        {message ? <p className="mt-4 text-sm text-[#ff5f8f]">{message}</p> : null}
      </div>
    </main>
  );
}
