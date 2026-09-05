"use client";

import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";

type VerificationRequest = {
  code: string;
  status: "pending" | "submitted" | "approved" | "rejected";
  created_at: string;
  submitted_at: string | null;
};

export default function VerifyPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [hasProfile, setHasProfile] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [request, setRequest] = useState<VerificationRequest | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/verification/status");

    if (res.status === 401) {
      router.replace("/login");
      return;
    }

    const data = await res.json();

    if (res.ok) {
      setHasProfile(!!data.hasProfile);
      setIsVerified(!!data.isVerified);
      setRequest(data.request ?? null);
    }

    setLoading(false);
  }, [router]);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      await load();
    })();
  }, [router, supabase, load]);

  async function start() {
    setWorking(true);
    setMsg(null);

    const res = await fetch("/api/verification/start", { method: "POST" });
    const data = await res.json();

    setWorking(false);

    if (!res.ok) {
      setMsg(data.error || "Couldn't start verification.");
      return;
    }

    await load();
  }

  async function submitPhoto() {
    if (!file) {
      setMsg("Choose a photo first.");
      return;
    }

    setWorking(true);
    setMsg(null);

    const fd = new FormData();
    fd.append("photo", file);

    const res = await fetch("/api/verification/submit", { method: "POST", body: fd });
    const data = await res.json();

    setWorking(false);

    if (!res.ok) {
      setMsg(data.error || "Upload failed.");
      return;
    }

    setFile(null);
    setMsg("Submitted. An admin will review it shortly.");
    await load();
  }

  const cardClass = "mt-6 rounded-2xl border border-white/10 bg-[#150109] p-5";

  return (
    <main className="min-h-screen bg-[#060002]">
      <Suspense fallback={<div className="h-14 border-b border-white/10 bg-[#060002]/90 backdrop-blur" />}>
        <SiteHeader />
      </Suspense>

      <div className="mx-auto max-w-2xl px-4 py-10">
        <a href="/dashboard" className="text-sm font-semibold text-[#ff5f8f] hover:text-[#fbecef]">
          ← Back to dashboard
        </a>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl uppercase text-[#fbecef]">
          Get Verified
        </h1>
        <p className="mt-3 text-sm text-[#c9a7b3]">
          Verified profiles carry an &ldquo;Identity verified&rdquo; badge on Browse. It tells people
          you&rsquo;re a real person behind the photos.
        </p>

        {loading ? (
          <p className="mt-6 text-[#c9a7b3]">Loading...</p>
        ) : isVerified ? (
          <div className={cardClass}>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm font-bold text-emerald-300">
              ✓ Identity verified
            </div>
            <p className="mt-3 text-sm text-[#c9a7b3]">
              Your profile is verified. The badge shows on Browse and on your profile.
            </p>
          </div>
        ) : !hasProfile ? (
          <div className={cardClass}>
            <p className="font-bold text-[#fbecef]">Create your profile first</p>
            <p className="mt-2 text-sm text-[#c9a7b3]">
              Verification compares your selfie to your profile photos, so you&rsquo;ll need a
              profile before you can request it.
            </p>
            <a
              href="/create-profile"
              className="mt-4 inline-block rounded-full bg-gradient-to-r from-[#ff115a] to-[#c400ff] px-5 py-2.5 font-bold text-[#060002] hover:opacity-90"
            >
              Create profile
            </a>
          </div>
        ) : request && request.status === "submitted" ? (
          <div className={cardClass}>
            <div className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-sm font-bold text-amber-300">
              Awaiting review
            </div>
            <p className="mt-3 text-sm text-[#c9a7b3]">
              Your photo is in the queue. You&rsquo;ll get the badge once an admin approves it.
            </p>
            <p className="mt-4 text-xs text-[#8f6b78]">
              Sent the wrong photo? Upload a new one below and it&rsquo;ll replace it.
            </p>

            <div className="mt-4 grid gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="rounded-lg border border-white/10 bg-[#220413] p-2 text-sm text-[#fbecef]"
              />
              <button
                onClick={submitPhoto}
                disabled={working || !file}
                className="rounded-full border border-white/20 px-4 py-2 text-sm font-bold text-[#fbecef] hover:bg-white/5 disabled:opacity-50"
              >
                {working ? "Uploading..." : "Replace photo"}
              </button>
            </div>
          </div>
        ) : request && request.status === "pending" ? (
          <div className={cardClass}>
            <p className="text-sm text-[#c9a7b3]">Write this code on paper:</p>
            <div className="mt-3 rounded-xl border border-[#ff115a]/40 bg-[#220413] px-5 py-4 text-center font-[family-name:var(--font-display)] text-4xl tracking-[0.3em] text-[#ff5f8f]">
              {request.code}
            </div>

            <ol className="mt-5 grid gap-2 pl-5 text-sm text-[#c9a7b3]" style={{ listStyleType: "decimal" }}>
              <li>Write the code above on a piece of paper by hand.</li>
              <li>Take a selfie holding the paper, with your face clearly visible.</li>
              <li>Upload it below. An admin compares it to your profile photos.</li>
            </ol>

            <p className="mt-4 text-xs text-[#8f6b78]">
              This photo is private, only visible to admins, and is deleted once reviewed. It never
              appears on your profile.
            </p>

            <div className="mt-5 grid gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="rounded-lg border border-white/10 bg-[#220413] p-2 text-sm text-[#fbecef]"
              />
              <button
                onClick={submitPhoto}
                disabled={working || !file}
                className="rounded-full bg-gradient-to-r from-[#ff115a] to-[#c400ff] px-4 py-2.5 font-bold text-[#060002] hover:opacity-90 disabled:opacity-50"
              >
                {working ? "Uploading..." : "Submit for review"}
              </button>
            </div>
          </div>
        ) : (
          <div className={cardClass}>
            {request?.status === "rejected" ? (
              <p className="mb-3 text-sm text-[#ff5f8f]">
                Your last request wasn&rsquo;t approved. You can try again with a clearer photo.
              </p>
            ) : null}
            <p className="text-sm text-[#c9a7b3]">
              You&rsquo;ll get a one-time code to write on paper and hold in a selfie. An admin
              checks it against your profile photos.
            </p>
            <button
              onClick={start}
              disabled={working}
              className="mt-4 rounded-full bg-gradient-to-r from-[#ff115a] to-[#c400ff] px-5 py-2.5 font-bold text-[#060002] hover:opacity-90 disabled:opacity-50"
            >
              {working ? "Starting..." : "Start verification"}
            </button>
          </div>
        )}

        {msg ? <p className="mt-4 text-sm text-[#ff5f8f]">{msg}</p> : null}
      </div>
    </main>
  );
}
