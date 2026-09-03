"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { InterestPicker } from "@/components/InterestPicker";
import { isLockedOut } from "@/lib/profileStatus";

type Profile = {
  id: string;
  display_name: string;
  orientation: "straight" | "gay" | "bisexual";
  age: number;
  city: string;
  area: string;
  bio: string | null;
  whatsapp: string | null;
  telegram: string | null;
  interests: string[] | null;
  status: string;
  rejection_count: number;
};

export default function ManageInterestsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [lockedOut, setLockedOut] = useState(false);
  const [interests, setInterests] = useState<string[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const res = await fetch("/api/account/profile");
      const data = res.ok ? await res.json() : { profile: null };

      if (!data.profile) {
        router.replace("/dashboard");
        return;
      }

      const p = data.profile as Profile;
      setProfile(p);
      setLockedOut(isLockedOut(p.status, p.rejection_count));
      setInterests(p.interests || []);
      setLoading(false);
    }

    loadProfile();
  }, [router, supabase]);

  async function save() {
    if (!profile) return;
    setMsg(null);
    setSaving(true);

    // /api/profiles/edit updates the whole editable record, so the other
    // fields ride along unchanged - only interests actually changes here.
    const res = await fetch("/api/profiles/edit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        display_name: profile.display_name,
        orientation: profile.orientation,
        age: profile.age,
        city: profile.city,
        area: profile.area,
        bio: profile.bio ?? "",
        whatsapp: profile.whatsapp,
        telegram: profile.telegram,
        interests,
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setMsg(`Error: ${data.error || "Failed"}`);
      return;
    }

    setMsg("Saved. Your changes are pending admin review before they go live again.");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#060002]">
        <Suspense fallback={<div className="h-14 border-b border-white/10 bg-[#060002]/90 backdrop-blur" />}>
          <SiteHeader />
        </Suspense>
        <div className="mx-auto max-w-2xl px-4 py-10">
          <p className="text-[#c9a7b3]">Loading...</p>
        </div>
      </main>
    );
  }

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
          Manage Interests
        </h1>

        {lockedOut ? (
          <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
            <p className="font-bold text-amber-300">You&rsquo;ve used all your resubmission attempts</p>
            <p className="mt-2 text-sm text-[#c9a7b3]">
              Your profile stays hidden from Browse for now. Contact support and we&rsquo;ll help
              you get it sorted.
            </p>
            <a
              href="/support"
              className="mt-4 inline-block rounded-full bg-gradient-to-r from-[#ff115a] to-[#c400ff] px-5 py-2.5 font-bold text-[#060002] shadow-[0_0_20px_rgba(255,17,90,0.4)] hover:opacity-90"
            >
              Contact support
            </a>
          </div>
        ) : null}

        <div className="mt-6 rounded-2xl border border-white/10 bg-[#150109] p-5">
          <InterestPicker selected={interests} onChange={setInterests} />

          <button
            onClick={save}
            disabled={saving || lockedOut}
            className="mt-6 rounded-full bg-gradient-to-r from-[#ff115a] to-[#c400ff] px-4 py-2.5 font-bold text-[#060002] shadow-[0_0_20px_rgba(255,17,90,0.4)] hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving..." : lockedOut ? "Contact support to continue" : "Save changes"}
          </button>

          {msg ? <p className="mt-3 text-sm text-[#ff5f8f]">{msg}</p> : null}
        </div>
      </div>
    </main>
  );
}
