"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  display_name: string;
  gender: "female" | "male" | "nonbinary";
  age: number;
  city: string;
  area: string;
  bio: string | null;
  photo_url: string | null;
};

// Launch cities (your list)
const LAUNCH_CITIES = ["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Benin City", "Enugu"] as const;

// “AI” parsing helpers
const CITY_ALIASES: Record<string, (typeof LAUNCH_CITIES)[number]> = {
  lagos: "Lagos",
  abuja: "Abuja",
  "port harcourt": "Port Harcourt",
  "p.h": "Port Harcourt",
  ph: "Port Harcourt",
  ibadan: "Ibadan",
  "benin city": "Benin City",
  benin: "Benin City",
  enugu: "Enugu",
};

const AREA_KEYWORDS = [
  // Lagos
  "lekki",
  "ajah",
  "ikeja",
  "yaba",
  "surulere",
  "victoria island",
  "vi",
  "v.i",
  "ikoyi",
  "maryland",
  // Abuja
  "wuse",
  "garki",
  "gwarinpa",
  "maitama",
  "asokoro",
  // PH
  "gra",
  "rumuola",
  "rumuokoro",
  // General
  "new haven",
  "trans ekulu",
];

function titleCase(s: string) {
  return s
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function normalizeArea(raw: string) {
  const t = raw.toLowerCase().trim();
  if (t === "vi" || t === "v.i") return "Victoria Island";
  return titleCase(t);
}

function parseAiQuery(input: string) {
  const text = input.toLowerCase().trim();

  let gender: "female" | "male" | "nonbinary" | null = null;
  let city: string | null = null;
  let area: string | null = null;
  let minAge: number | null = null;
  let maxAge: number | null = null;

  // gender
  if (/\b(female|woman|women|girl|girls|lady|ladies)\b/.test(text)) gender = "female";
  if (/\b(male|man|men|guy|guys|boy|boys)\b/.test(text)) gender = "male";
  if (/\b(nonbinary|non-binary|nb)\b/.test(text)) gender = "nonbinary";

  // age range e.g. "18-25"
  const range = text.match(/(\d{2})\s*-\s*(\d{2})/);
  if (range) {
    minAge = Number(range[1]);
    maxAge = Number(range[2]);
  } else {
    // single age e.g. "23"
    const single = text.match(/\b(1[89]|[2-9]\d)\b/);
    if (single) {
      minAge = Number(single[1]);
      maxAge = Number(single[1]);
    }
  }

  // city aliases
  for (const [k, v] of Object.entries(CITY_ALIASES)) {
    if (text.includes(k)) {
      city = v;
      break;
    }
  }

  // area keywords
  for (const a of AREA_KEYWORDS) {
    if (text.includes(a)) {
      area = normalizeArea(a);
      break;
    }
  }

  return { gender, city, area, minAge, maxAge };
}

export default function Page() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [ai, setAi] = useState("");
  const [gender, setGender] = useState<"all" | Profile["gender"]>("all");
  const [city, setCity] = useState<string>("all");
  const [area, setArea] = useState("");
  const [minAge, setMinAge] = useState<number | "">("");
  const [maxAge, setMaxAge] = useState<number | "">("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErrorMsg(null);

      // Since RLS only shows approved+active, guests will only see live profiles
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, gender, age, city, area, bio, photo_url")
        .order("created_at", { ascending: false });

      if (error) {
        setErrorMsg(error.message);
        setProfiles([]);
      } else {
        setProfiles((data ?? []) as Profile[]);
      }

      setLoading(false);
    })();
  }, []);

  // Build city dropdown from your launch cities + whatever exists in DB
  const cityOptions = useMemo(() => {
    const fromDb = new Set(profiles.map((p) => p.city));
    const combined = new Set<string>(["all", ...LAUNCH_CITIES, ...Array.from(fromDb)]);
    return Array.from(combined);
  }, [profiles]);

  const filtered = useMemo(() => {
    const min = minAge === "" ? null : Number(minAge);
    const max = maxAge === "" ? null : Number(maxAge);

    return profiles.filter((p) => {
      if (gender !== "all" && p.gender !== gender) return false;
      if (city !== "all" && p.city !== city) return false;

      if (area.trim()) {
        if (!p.area?.toLowerCase().includes(area.trim().toLowerCase())) return false;
      }

      if (min !== null && p.age < min) return false;
      if (max !== null && p.age > max) return false;

      return true;
    });
  }, [profiles, gender, city, area, minAge, maxAge]);

  function applyAi() {
    const parsed = parseAiQuery(ai);

    if (parsed.gender) setGender(parsed.gender);
    if (parsed.city) setCity(parsed.city);
    if (parsed.area) setArea(parsed.area);
    if (parsed.minAge !== null) setMinAge(parsed.minAge);
    if (parsed.maxAge !== null) setMaxAge(parsed.maxAge);
  }

  function clearFilters() {
    setAi("");
    setGender("all");
    setCity("all");
    setArea("");
    setMinAge("");
    setMaxAge("");
  }

  return (
    <main className="p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-semibold">Browse</h1>
        <div className="flex gap-3">
          <Link className="underline" href="/create-profile">Create Profile</Link>
          <Link className="underline" href="/">Home</Link>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        <div className="border rounded-xl p-4 lg:col-span-3">
          <div className="text-sm font-medium">AI Search (v1)</div>
          <div className="mt-2 flex gap-2 flex-wrap">
            <input
              className="border rounded p-2 flex-1 min-w-[240px]"
              placeholder='Try: "female lagos lekki 18-25"'
              value={ai}
              onChange={(e) => setAi(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyAi();
              }}
            />
            <button className="border rounded px-3 py-2 hover:bg-gray-50" onClick={applyAi}>
              Apply
            </button>
            <button className="border rounded px-3 py-2 hover:bg-gray-50" onClick={clearFilters}>
              Clear
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            This converts text into filters. Real ranking/AI comes later.
          </div>
        </div>

        <select
          className="border rounded p-2"
          value={gender}
          onChange={(e) => setGender(e.target.value as any)}
        >
          <option value="all">All genders</option>
          <option value="female">Female</option>
          <option value="male">Male</option>
          <option value="nonbinary">Non-binary</option>
        </select>

        <select className="border rounded p-2" value={city} onChange={(e) => setCity(e.target.value)}>
          {cityOptions.map((c) => (
            <option key={c} value={c}>
              {c === "all" ? "All cities" : c}
            </option>
          ))}
        </select>

        <input
          className="border rounded p-2"
          placeholder="Area (e.g., Lekki, Wuse)"
          value={area}
          onChange={(e) => setArea(e.target.value)}
        />

        <input
          className="border rounded p-2"
          type="number"
          min={18}
          max={99}
          placeholder="Min age"
          value={minAge}
          onChange={(e) => setMinAge(e.target.value === "" ? "" : Number(e.target.value))}
        />

        <input
          className="border rounded p-2"
          type="number"
          min={18}
          max={99}
          placeholder="Max age"
          value={maxAge}
          onChange={(e) => setMaxAge(e.target.value === "" ? "" : Number(e.target.value))}
        />

        <div className="border rounded p-2 text-sm text-gray-600">
          Showing <span className="font-medium text-black">{filtered.length}</span> profiles
        </div>
      </div>

      {loading ? <p className="mt-6">Loading profiles…</p> : null}

      {errorMsg ? (
        <div className="mt-6 border border-red-300 bg-red-50 p-3 rounded">
          <div className="font-medium">Couldn’t load profiles</div>
          <div className="text-sm mt-1">{errorMsg}</div>
        </div>
      ) : null}

      {!loading && !errorMsg ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <Link
              key={p.id}
              href={`/profile/${p.id}`}
              className="border rounded-xl overflow-hidden hover:shadow-sm transition"
            >
              <div className="aspect-[4/3] bg-gray-100">
                {p.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.photo_url} alt={p.display_name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full grid place-items-center text-gray-500">No photo</div>
                )}
              </div>

              <div className="p-3">
                <div className="font-medium">
                  {p.display_name} • {p.age}
                </div>
                <div className="text-sm text-gray-600">
                  {p.city}, {p.area}
                </div>
                {p.bio ? <div className="text-sm mt-2 line-clamp-2">{p.bio}</div> : null}
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </main>
  );
}
