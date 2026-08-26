"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const trimmed = identifier.trim();
    const isEmail = trimmed.includes("@");

    if (isEmail) {
      const { error } = await supabase.auth.signInWithPassword({
        email: trimmed,
        password,
      });

      setLoading(false);

      if (error) {
        setMessage(error.message);
        return;
      }
    } else {
      const res = await fetch("/api/auth/login-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmed, password }),
      });
      const data = await res.json();

      setLoading(false);

      if (!res.ok) {
        setMessage(data.error || "Login failed.");
        return;
      }
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#060002]">
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="mb-6 font-[family-name:var(--font-display)] text-3xl uppercase text-[#fbecef]">
          Log in
        </h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="text"
            placeholder="Username or email"
            className="w-full rounded-lg border border-white/10 bg-[#220413] px-4 py-3 text-[#fbecef] placeholder:text-[#8f6b78]"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
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
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link href="/forgot-password" className="text-sm text-[#c9a7b3] hover:text-[#ff5f8f]">
            Forgot password?
          </Link>
        </div>

        {message ? <p className="mt-4 text-sm text-[#ff5f8f]">{message}</p> : null}
      </div>
    </main>
  );
}
