"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function CreateProfilePage() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [gender, setGender] = useState<"female" | "male" | "nonbinary">("female");
  const [age, setAge] = useState<number>(18);
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [bio, setBio] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [telegram, setTelegram] = useState("");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);

  async function submit() {
  setMsg(null);

  if (!displayName.trim()) return setMsg("Please enter a display name.");
  if (!city.trim()) return setMsg("Please enter a city (e.g., Lagos).");
  if (!area.trim()) return setMsg("Please enter an area (e.g., Lekki).");
  if (age < 18) return setMsg("You must be 18+.");
  if (photoFiles.length < 1) return setMsg("Upload at least 1 photo.");
  if (photoFiles.length > 5) return setMsg("Max 5 photos.");

  // Client-side safety (server also enforces)
  const total = photoFiles.reduce((s, f) => s + f.size, 0);
  if (photoFiles.some((f) => f.size > 2 * 1024 * 1024)) return setMsg("Each photo must be 2MB max.");
  if (total > 10 * 1024 * 1024) return setMsg("Total upload must be 10MB max.");

  setLoading(true);

  const fd = new FormData();
  fd.append("display_name", displayName.trim());
  fd.append("gender", gender);
  fd.append("age", String(age));
  fd.append("city", city.trim());
  fd.append("area", area.trim());
  fd.append("bio", bio.trim());
  if (whatsapp.trim()) fd.append("whatsapp", whatsapp.trim());
  if (telegram.trim()) fd.append("telegram", telegram.trim());

  for (const f of photoFiles) fd.append("photos", f);

  const res = await fetch("/api/profiles/submit", { method: "POST", body: fd });
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

  return (
    <main className="p-6 max-w-xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Create Profile</h1>
        <Link className="underline" href="/">Home</Link>
      </div>

      <p className="mt-3 text-gray-600">
        Submit your profile. It will appear on WildModels after approval.
      </p>

      <div className="mt-6 grid gap-3">
        <label className="grid gap-1">
          <span className="text-sm">Display name</span>
          <input className="border rounded p-2" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1">
            <span className="text-sm">Gender</span>
            <select className="border rounded p-2" value={gender} onChange={(e) => setGender(e.target.value as any)}>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="nonbinary">Non-binary</option>
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-sm">Age (18+)</span>
            <input
              className="border rounded p-2"
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
            <span className="text-sm">City</span>
            <input className="border rounded p-2" value={city} onChange={(e) => setCity(e.target.value)} />
          </label>
          <label className="grid gap-1">
            <span className="text-sm">Area</span>
            <input className="border rounded p-2" value={area} onChange={(e) => setArea(e.target.value)} />
          </label>
        </div>

        <label className="grid gap-1">
          <span className="text-sm">Bio</span>
          <textarea className="border rounded p-2" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
        </label>

        <label className="grid gap-1">
          <span className="text-sm">Main photo (upload)</span>
          <input
            className="border rounded p-2"
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
          <span className="text-sm">WhatsApp</span>
          <input className="border rounded p-2" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
        </label>

        <label className="grid gap-1">
          <span className="text-sm">Telegram (username)</span>
          <input className="border rounded p-2" value={telegram} onChange={(e) => setTelegram(e.target.value)} />
        </label>

        <button
          className="border rounded p-2 hover:bg-gray-50 disabled:opacity-50"
          disabled={loading}
          onClick={submit}
        >
          {loading ? "Submitting..." : "Submit profile"}
        </button>

        {msg ? <div className="text-sm mt-2">{msg}</div> : null}

        <p className="text-xs text-gray-500 mt-2">
          By submitting, you confirm you’re 18+ and consent to your profile being listed publicly after approval.
        </p>
      </div>
    </main>
  );
}
