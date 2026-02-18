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

  async function submit() {
    setMsg(null);

    // tiny validation
    if (!displayName.trim()) return setMsg("Please enter a display name.");
    if (!city.trim()) return setMsg("Please enter a city (e.g., Lagos).");
    if (!area.trim()) return setMsg("Please enter an area (e.g., Lekki).");
    if (age < 18) return setMsg("You must be 18+.");

    setLoading(true);
    
let uploadedPhotoUrl: string | null = null;

if (photoFile) {
  const ext = photoFile.name.split(".").pop() || "jpg";
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const filePath = `main/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("profile-photos")
    .upload(filePath, photoFile, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    setLoading(false);
    setMsg(`Photo upload failed: ${uploadError.message}`);
    return;
  }

  const { data } = supabase.storage.from("profile-photos").getPublicUrl(filePath);
  uploadedPhotoUrl = data.publicUrl;
}

    const { error } = await supabase.from("profiles").insert([
      {
        display_name: displayName.trim(),
        gender,
        age,
        city: city.trim(),
        area: area.trim(),
        bio: bio.trim(),
        photo_url: uploadedPhotoUrl,
        whatsapp: whatsapp.trim() || null,
        telegram: telegram.trim() || null,
        is_active: true,
        status: "pending",
      },
    ]);

    setLoading(false);

    if (error) {
      setMsg(`Error: ${error.message}`);
      return;
    }

    setMsg("Submitted ✅ Your profile is pending approval.");
    // clear form
    setDisplayName("");
    setGender("female");
    setAge(18);
    setCity("");
    setArea("");
    setBio("");
    setPhotoUrl("");
    setWhatsapp("");
    setTelegram("");
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
            onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
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
