"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { Suspense } from "react";
import { NG_TOP_STATES, type NgTopState } from "@/lib/ngStates";
import { createClient } from "@/lib/supabase/client";

export default function CreateProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [gender, setGender] = useState<"female" | "male" | "nonbinary">("female");
  const [age, setAge] = useState<number>(18);
  const [city, setCity] = useState<NgTopState | "">("");
  const [area, setArea] = useState("");
  const [bio, setBio] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [telegram, setTelegram] = useState("");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .maybeSingle();

      if (profile) {
        setHasProfile(true);
      }

      setCheckingAuth(false);
    }

    checkUser();
  }, [router, supabase]);

  async function submit() {
    setMsg(null);

    if (!displayName.trim()) return setMsg("Please enter a display name.");
    if (!city) return setMsg("Please select a state.");
    if (!area.trim()) return setMsg("Please enter an area (e.g., Lekki).");
    if (age < 18) return setMsg("You must be 18+.");
    if (photoFiles.length < 1) return setMsg("Upload at least 1 photo.");
    if (photoFiles.length > 5) return setMsg("Max 5 photos.");

    const total = photoFiles.reduce((s, f) => s + f.size, 0);
    if (photoFiles.some((f) => f.size > 2 * 1024 * 1024)) {
      return setMsg("Each photo must be 2MB max.");
    }
    if (total > 10 * 1024 * 1024) {
      return setMsg("Total upload must be 10MB max.");
    }

    setLoading(true);

    const fd = new FormData();
    fd.append("display_name", displayName.trim());
    fd.append("gender", gender);
    fd.append("age", String(age));
    fd.append("city", city);
    fd.append("area", area.trim());
    fd.append("bio", bio.trim());
    if (whatsapp.trim()) fd.append("whatsapp", whatsapp.trim());
    if (telegram.trim()) fd.append("telegram", telegram.trim());

    for (const f of photoFiles) {
      fd.append("photos", f);
    }

    const res = await fetch("/api/profiles/submit", {
      method: "POST",
      body: fd,
    });

    const data = await res.json();

    setLoading(false);

    if (!res.ok) {
      setMsg(`Error: ${data.error || "Failed"}`);
      return;
    }

    setMsg("Submitted ✅ Your profile is pending approval.");
    setDisplayName("");
    setGender("female");
    setAge(18);
    setCity("");
    setArea("");
    setBio("");
    setWhatsapp("");
    setTelegram("");
    setPhotoFiles([]);
  }

  const inputClass =
    "rounded-lg border border-white/10 bg-[#220413] p-2 text-[#fbecef] placeholder:text-[#8f6b78]";
  const labelClass = "text-sm text-[#c9a7b3]";

  if (checkingAuth) {
    return (
      <main className="min-h-screen bg-[#060002]">
        <Suspense
          fallback={<div className="h-14 border-b border-white/10 bg-[#060002]/90 backdrop-blur" />}
        >
          <SiteHeader />
        </Suspense>
        <div className="mx-auto max-w-3xl px-6 py-8">
          <p className="text-sm text-[#c9a7b3]">Checking account...</p>
        </div>
      </main>
    );
  }

  if (hasProfile) {
    return (
      <main className="min-h-screen bg-[#060002]">
        <Suspense
          fallback={<div className="h-14 border-b border-white/10 bg-[#060002]/90 backdrop-blur" />}
        >
          <SiteHeader />
        </Suspense>

        <div className="mx-auto max-w-3xl px-6 py-8">
          <h1 className="font-[family-name:var(--font-display)] text-3xl uppercase text-[#fbecef]">
            Create Profile
          </h1>

          <div className="mt-6 rounded-2xl border border-white/10 bg-[#150109] p-5">
            <p className="text-[#fbecef]">You already have a public profile.</p>
            <p className="mt-2 text-sm text-[#c9a7b3]">
              Each account can only manage one profile at a time. Head to your dashboard to edit it,
              manage photos, or delete it if you want to start over.
            </p>
            <a
              href="/dashboard"
              className="mt-4 inline-block rounded-full bg-gradient-to-r from-[#ff115a] to-[#c400ff] px-5 py-2.5 font-bold text-[#060002] shadow-[0_0_20px_rgba(255,17,90,0.4)] hover:opacity-90"
            >
              Go to dashboard
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#060002]">
      <Suspense
        fallback={<div className="h-14 border-b border-white/10 bg-[#060002]/90 backdrop-blur" />}
      >
        <SiteHeader />
      </Suspense>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="flex items-center justify-between">
          <h1 className="font-[family-name:var(--font-display)] text-3xl uppercase text-[#fbecef]">
            Create Profile
          </h1>
          <Link className="text-sm font-semibold text-[#ff5f8f] hover:text-[#fbecef]" href="/">
            Home
          </Link>
        </div>

        <p className="mt-3 text-[#c9a7b3]">
          Submit your profile. It will appear on WildModels after approval.
        </p>

        <div className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-[#150109] p-5">
          <label className="grid gap-1">
            <span className={labelClass}>Display name</span>
            <input
              className={inputClass}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1">
              <span className={labelClass}>Gender</span>
              <select
                className={inputClass}
                value={gender}
                onChange={(e) => setGender(e.target.value as "female" | "male" | "nonbinary")}
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="nonbinary">Non-binary</option>
              </select>
            </label>

            <label className="grid gap-1">
              <span className={labelClass}>Age (18+)</span>
              <input
                className={inputClass}
                type="number"
                min={18}
                max={99}
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1">
              <span className={labelClass}>City</span>
              <select
                className={inputClass}
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
              <span className={labelClass}>Area</span>
              <input
                className={inputClass}
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
            </label>
          </div>

          <label className="grid gap-1">
            <span className={labelClass}>Bio</span>
            <textarea
              className={inputClass}
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </label>

          <label className="grid gap-1">
            <span className={labelClass}>Main photo (upload)</span>
            <input
              className={inputClass}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const list = Array.from(e.target.files ?? []);
                setPhotoFiles(list.slice(0, 5));
              }}
            />
          </label>

          <label className="grid gap-1">
            <span className={labelClass}>WhatsApp</span>
            <input
              className={inputClass}
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
            />
          </label>

          <label className="grid gap-1">
            <span className={labelClass}>Telegram (username)</span>
            <input
              className={inputClass}
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
            />
          </label>

          <button
            className="rounded-full bg-gradient-to-r from-[#ff115a] to-[#c400ff] p-2.5 font-bold text-[#060002] shadow-[0_0_20px_rgba(255,17,90,0.4)] hover:opacity-90 disabled:opacity-50"
            disabled={loading}
            onClick={submit}
          >
            {loading ? "Submitting..." : "Submit profile"}
          </button>

          {msg ? <div className="mt-2 text-sm text-[#ff5f8f]">{msg}</div> : null}

          <p className="mt-2 text-xs text-[#8f6b78]">
            By submitting, you confirm you’re 18+ and consent to your profile being listed publicly
            after approval.
          </p>
        </div>
      </div>
    </main>
  );
}
