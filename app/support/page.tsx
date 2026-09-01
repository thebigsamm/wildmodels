"use client";

import { useEffect, useState, Suspense } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { createClient } from "@/lib/supabase/client";

const CATEGORIES = ["General", "Report a bug", "Account issue", "Profile issue", "Other"];

export default function SupportPage() {
  const supabase = createClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot

  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      if (user.email) setEmail(user.email);

      const res = await fetch("/api/account/profile");
      if (res.ok) {
        const data = await res.json();
        if (data.profile?.display_name) setName(data.profile.display_name);
      }
    })();
  }, [supabase]);

  const inputClass =
    "rounded-lg border border-white/10 bg-[#220413] p-3 text-[#fbecef] placeholder:text-[#8f6b78] outline-none focus:ring-2 focus:ring-[#ff115a]/40";
  const labelClass = "text-sm text-[#c9a7b3]";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);

    if (!name.trim() || !email.trim() || !message.trim()) {
      setStatus({ type: "error", text: "Please fill in your name, email, and message." });
      return;
    }

    setSending(true);

    const res = await fetch("/api/support/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim(),
        category,
        message: message.trim(),
        website,
      }),
    });

    const data = await res.json();
    setSending(false);

    if (!res.ok) {
      setStatus({ type: "error", text: data.error || "Something went wrong. Please try again." });
      return;
    }

    setStatus({
      type: "ok",
      text: "Message sent! Check your email for a confirmation, and we'll get back to you soon.",
    });
    setMessage("");
  }

  return (
    <main className="min-h-screen bg-[#060002]">
      <Suspense fallback={<div className="h-14 border-b border-white/10 bg-[#060002]/90 backdrop-blur" />}>
        <SiteHeader />
      </Suspense>

      <div className="mx-auto max-w-xl px-6 py-16">
        <h1 className="font-[family-name:var(--font-display)] text-3xl uppercase text-[#fbecef]">
          Contact / Support
        </h1>
        <p className="mt-3 text-[#c9a7b3]">
          Questions, bug reports, or account issues &mdash; send us a message and we&rsquo;ll get
          back to you by email.
        </p>

        <form onSubmit={submit} className="mt-8 grid gap-4 rounded-2xl border border-white/10 bg-[#150109] p-5">
          <label className="grid gap-1">
            <span className={labelClass}>Name</span>
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>

          <label className="grid gap-1">
            <span className={labelClass}>Email</span>
            <input
              className={inputClass}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="grid gap-1">
            <span className={labelClass}>What&rsquo;s this about?</span>
            <select
              className={inputClass}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1">
            <span className={labelClass}>Message</span>
            <textarea
              className={inputClass}
              rows={6}
              maxLength={4000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </label>

          {/* Honeypot - hidden from real users, left empty by them */}
          <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
            <label>
              Website
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={sending}
            className="rounded-full bg-gradient-to-r from-[#ff115a] to-[#c400ff] p-3 font-bold text-[#060002] shadow-[0_0_20px_rgba(255,17,90,0.4)] hover:opacity-90 disabled:opacity-50"
          >
            {sending ? "Sending..." : "Send message"}
          </button>

          {status ? (
            <p className={`text-sm ${status.type === "ok" ? "text-[#4ade80]" : "text-[#ff5f8f]"}`}>
              {status.text}
            </p>
          ) : null}
        </form>
      </div>
    </main>
  );
}
