"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { NG_TOP_STATES, type NgTopState } from "@/lib/ngStates";
import { SiteHeader } from "@/components/SiteHeader";
import { isLockedOut } from "@/lib/profileStatus";
import { InterestPicker } from "@/components/InterestPicker";

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

export default function EditProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [lockedOut, setLockedOut] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [orientation, setOrientation] = useState<"straight" | "gay" | "bisexual">("straight");
  const [age, setAge] = useState(18);
  const [city, setCity] = useState<NgTopState | "">("");
  const [area, setArea] = useState("");
  const [bio, setBio] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [telegram, setTelegram] = useState("");
  const [interests, setInterests] = useState<string[]>([]);

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
      setProfileId(p.id);
      setLockedOut(isLockedOut(p.status, p.rejection_count));
      setDisplayName(p.display_name || "");
      setOrientation(p.orientation || "straight");
      setAge(p.age || 18);
      setCity((p.city as NgTopState) || "");
      setArea(p.area || "");
      setBio(p.bio || "");
      setWhatsapp(p.whatsapp || "");
      setTelegram(p.telegram || "");
      setInterests(p.interests || []);
      setLoading(false);
    }

    loadProfile();
  }, [router, supabase]);

  async function saveProfile() {
    if (!profileId) return;

    setMsg(null);

    if (!displayName.trim()) return setMsg("Please enter a display name.");
    if (!city) return setMsg("Please select a state.");
    if (!area.trim()) return setMsg("Please enter an area.");
    if (age < 18 || age > 99) return setMsg("Age must be between 18 and 99.");

    setSaving(true);

    const res = await fetch("/api/profiles/edit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        display_name: displayName.trim(),
        orientation,
        age,
        city,
        area: area.trim(),
        bio: bio.trim(),
        whatsapp: whatsapp.trim() || null,
        telegram: telegram.trim() || null,
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
        <div className="mt-4 flex items-center justify-between gap-3">
          <h1 className="font-[family-name:var(--font-display)] text-3xl uppercase text-[#fbecef]">
            Edit Profile
          </h1>
          <a
            href="/dashboard/photos"
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-bold text-[#fbecef] hover:bg-white/5"
          >
            Manage photos
          </a>
        </div>

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

        <div className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-[#150109] p-5">
          <label className="grid gap-1">
            <span className="text-sm text-[#c9a7b3]">Display name</span>
            <input
              className="rounded-lg border border-white/10 bg-[#220413] p-2 text-[#fbecef]"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm text-[#c9a7b3]">Preference</span>
            <select
              className="rounded-lg border border-white/10 bg-[#220413] p-2 text-[#fbecef]"
              value={orientation}
              onChange={(e) =>
                setOrientation(e.target.value as "straight" | "gay" | "bisexual")
              }
            >
              <option value="straight">Straight</option>
              <option value="gay">Gay</option>
              <option value="bisexual">Bisexual</option>
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-sm text-[#c9a7b3]">Age</span>
            <input
              className="rounded-lg border border-white/10 bg-[#220413] p-2 text-[#fbecef]"
              type="number"
              min={18}
              max={99}
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm text-[#c9a7b3]">State</span>
            <select
              className="rounded-lg border border-white/10 bg-[#220413] p-2 text-[#fbecef]"
              value={city}
              onChange={(e) => setCity(e.target.value as NgTopState | "")}
            >
              <option value="">Select a state</option>
              {NG_TOP_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-sm text-[#c9a7b3]">Area</span>
            <input
              className="rounded-lg border border-white/10 bg-[#220413] p-2 text-[#fbecef]"
              value={area}
              onChange={(e) => setArea(e.target.value)}
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm text-[#c9a7b3]">Bio</span>
            <textarea
              className="rounded-lg border border-white/10 bg-[#220413] p-2 text-[#fbecef]"
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </label>

          <div className="grid gap-1">
            <span className="text-sm text-[#c9a7b3]">Interests</span>
            <InterestPicker selected={interests} onChange={setInterests} />
          </div>

          <label className="grid gap-1">
            <span className="text-sm text-[#c9a7b3]">WhatsApp</span>
            <input
              className="rounded-lg border border-white/10 bg-[#220413] p-2 text-[#fbecef]"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm text-[#c9a7b3]">Telegram</span>
            <input
              className="rounded-lg border border-white/10 bg-[#220413] p-2 text-[#fbecef]"
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
            />
          </label>

          <button
            onClick={saveProfile}
            disabled={saving || lockedOut}
            className="rounded-full bg-gradient-to-r from-[#ff115a] to-[#c400ff] px-4 py-2.5 font-bold text-[#060002] shadow-[0_0_20px_rgba(255,17,90,0.4)] hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving..." : lockedOut ? "Contact support to continue" : "Save changes"}
          </button>

          {msg ? <p className="text-sm text-[#ff5f8f]">{msg}</p> : null}
        </div>
      </div>
    </main>
  );
}
