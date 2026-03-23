"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { NG_TOP_STATES, type NgTopState } from "@/lib/ngStates";

type Profile = {
  id: string;
  display_name: string;
  age: number;
  city: string;
  area: string;
  bio: string | null;
  whatsapp: string | null;
  telegram: string | null;
};

export default function EditProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [age, setAge] = useState(18);
  const [city, setCity] = useState<NgTopState | "">("");
  const [area, setArea] = useState("");
  const [bio, setBio] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [telegram, setTelegram] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, display_name, age, city, area, bio, whatsapp, telegram")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile) {
        router.replace("/dashboard");
        return;
      }

      const p = profile as Profile;
      setProfileId(p.id);
      setDisplayName(p.display_name || "");
      setAge(p.age || 18);
      setCity((p.city as NgTopState) || "");
      setArea(p.area || "");
      setBio(p.bio || "");
      setWhatsapp(p.whatsapp || "");
      setTelegram(p.telegram || "");
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

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim(),
        age,
        city,
        area: area.trim(),
        bio: bio.trim(),
        whatsapp: whatsapp.trim() || null,
        telegram: telegram.trim() || null,
      })
      .eq("id", profileId);

    setSaving(false);

    if (error) {
      setMsg(`Error: ${error.message}`);
      return;
    }

    setMsg("Profile updated successfully.");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Edit Profile</h1>

      <div className="mt-6 grid gap-3 rounded-xl border p-5">
        <label className="grid gap-1">
          <span className="text-sm">Display name</span>
          <input
            className="rounded border p-2"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm">Age</span>
          <input
            className="rounded border p-2"
            type="number"
            min={18}
            max={99}
            value={age}
            onChange={(e) => setAge(Number(e.target.value))}
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm">State</span>
          <select
            className="rounded border p-2"
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
          <span className="text-sm">Area</span>
          <input
            className="rounded border p-2"
            value={area}
            onChange={(e) => setArea(e.target.value)}
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm">Bio</span>
          <textarea
            className="rounded border p-2"
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm">WhatsApp</span>
          <input
            className="rounded border p-2"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm">Telegram</span>
          <input
            className="rounded border p-2"
            value={telegram}
            onChange={(e) => setTelegram(e.target.value)}
          />
        </label>

        <button
          onClick={saveProfile}
          disabled={saving}
          className="rounded-lg border px-4 py-2 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>

        {msg ? <p className="text-sm">{msg}</p> : null}
      </div>
    </main>
  );
}