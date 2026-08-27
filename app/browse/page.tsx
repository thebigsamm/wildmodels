"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { SiteHeader } from "@/components/SiteHeader";
import { Suspense } from "react";
import { NG_TOP_STATES } from "@/lib/ngStates";

type Profile = {
  id: string;
  username: string;
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
const CITY_ALIASES: Record<string, string> = {
  lagos: "Lagos",
  fct: "Abuja",
  "f.c.t": "Abuja",
  kano: "Kano",
  katsina: "Katsina",
  kaduna: "Kaduna",
  oyo: "Oyo",
  anambra: "Anambra",
  rivers: "Rivers",
  "port harcourt": "Rivers",
  "p.h": "Rivers",
  ph: "Rivers",
  niger: "Niger",
  benue: "Benue",
  ogun: "Ogun",
  sokoto: "Sokoto",
  delta: "Delta",
  imo: "Imo",
  ondo: "Ondo",
  "akwa ibom": "Akwa Ibom",
  edo: "Edo",
  enugu: "Enugu",
  bayelsa: "Bayelsa",
  "cross river": "Cross River",
  kogi: "Kogi",
  abia: "Abia",
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
  const [hasProfile, setHasProfile] = useState(false);

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
        .select("id, username, display_name, gender, age, city, area, bio, photo_url")
        .eq("status", "approved")
        .eq("is_active", true)
        .eq("is_hidden_by_owner", false)
        .is("deleted_at", null)
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

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const res = await fetch("/api/account/profile");
      if (res.ok) {
        const data = await res.json();
        if (data.profile) setHasProfile(true);
      }
    })();
  }, []);

  // Build city dropdown from your launch cities + whatever exists in DB
  const cityOptions = ["all", ...NG_TOP_STATES] as const;

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

  const gradients = [
    "from-[#ff115a] to-[#c400ff]",
    "from-[#c400ff] to-[#ff115a]",
    "from-[#ff115a] to-[#8f00d6]",
    "from-[#8f00d6] to-[#ff115a]",
    "from-[#ff115a] to-[#c400ff]",
    "from-[#c400ff] to-[#3a0059]",
  ];

  return (
    <main className="min-h-screen bg-[#060002] relative overflow-hidden">
      <div className="pointer-events-none absolute -top-64 right-0 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,rgba(255,17,90,0.16),transparent_68%)]" />

      <Suspense fallback={<div className="h-14 border-b border-white/10 bg-[#060002]/90 backdrop-blur" />}>
        <SiteHeader />
      </Suspense>

      <div className="relative mx-auto max-w-6xl px-6 py-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="font-[family-name:var(--font-display)] text-3xl uppercase tracking-wide text-[#fbecef]">
          Browse
        </h1>
        <div className="flex gap-4 text-sm font-semibold">
          {!hasProfile ? (
            <Link className="text-[#ff5f8f] hover:text-[#fbecef]" href="/create-profile">Create Profile</Link>
          ) : null}
          <Link className="text-[#c9a7b3] hover:text-[#fbecef]" href="/">Home</Link>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-[#ff115a]/25 bg-[#150109] p-4 lg:col-span-3">
          <div className="text-sm font-bold text-[#ff5f8f]">AI Search (v1)</div>
          <div className="mt-2 flex gap-2 flex-wrap">
            <input
              className="min-w-[240px] flex-1 rounded-lg border border-white/10 bg-[#220413] p-2 text-[#fbecef] placeholder:text-[#8f6b78]"
              placeholder='Try: "female lagos lekki 18-25"'
              value={ai}
              onChange={(e) => setAi(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyAi();
              }}
            />
            <button
              className="rounded-lg border border-white/10 bg-[#220413] px-3 py-2 text-[#fbecef] hover:bg-white/5"
              onClick={applyAi}
            >
              Apply
            </button>
            <button
              className="rounded-lg border border-white/10 bg-[#220413] px-3 py-2 text-[#fbecef] hover:bg-white/5"
              onClick={clearFilters}
            >
              Clear
            </button>
          </div>
          <div className="mt-2 text-xs text-[#8f6b78]">
            This converts text into filters. Real ranking/AI comes later.
          </div>
        </div>

        <select
          className="rounded-lg border border-white/10 bg-[#220413] p-2 text-[#fbecef]"
          value={gender}
          onChange={(e) => setGender(e.target.value as any)}
        >
          <option value="all">All genders</option>
          <option value="female">Female</option>
          <option value="male">Male</option>
          <option value="nonbinary">Non-binary</option>
        </select>

        <select
          className="rounded-lg border border-white/10 bg-[#220413] p-2 text-[#fbecef]"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        >
          {cityOptions.map((c) => (
            <option key={c} value={c}>
              {c === "all" ? "All states" : c}
            </option>
          ))}
        </select>

        <input
          className="rounded-lg border border-white/10 bg-[#220413] p-2 text-[#fbecef] placeholder:text-[#8f6b78]"
          placeholder="Area (e.g., Lekki, Wuse)"
          value={area}
          onChange={(e) => setArea(e.target.value)}
        />

        <input
          className="rounded-lg border border-white/10 bg-[#220413] p-2 text-[#fbecef] placeholder:text-[#8f6b78]"
          type="number"
          min={18}
          max={99}
          placeholder="Min age"
          value={minAge}
          onChange={(e) => setMinAge(e.target.value === "" ? "" : Number(e.target.value))}
        />

        <input
          className="rounded-lg border border-white/10 bg-[#220413] p-2 text-[#fbecef] placeholder:text-[#8f6b78]"
          type="number"
          min={18}
          max={99}
          placeholder="Max age"
          value={maxAge}
          onChange={(e) => setMaxAge(e.target.value === "" ? "" : Number(e.target.value))}
        />

        <div className="rounded-lg border border-white/10 bg-[#220413] p-2 text-sm text-[#c9a7b3]">
          Showing <span className="font-bold text-[#ff5f8f]">{filtered.length}</span> profiles
        </div>
      </div>

      {loading ? <p className="mt-6 text-[#c9a7b3]">Loading profiles…</p> : null}

      {errorMsg ? (
        <div className="mt-6 rounded-lg border border-[#ff115a]/40 bg-[#150109] p-3">
          <div className="font-bold text-[#ff5f8f]">Couldn’t load profiles</div>
          <div className="mt-1 text-sm text-[#c9a7b3]">{errorMsg}</div>
        </div>
      ) : null}

      {!loading && !errorMsg ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p, i) => (
            <Link
              key={p.id}
              href={`/profile/${p.username}`}
              className="group overflow-hidden rounded-2xl border border-[#ff115a]/25 bg-[#150109] shadow-[0_16px_34px_-18px_rgba(255,17,90,0.4)] transition hover:border-[#ff115a]/50"
            >
              <div className="aspect-[4/3] overflow-hidden">
                {p.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.photo_url}
                    alt={p.display_name}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div
                    className={`grid h-full w-full place-items-center bg-gradient-to-br ${gradients[i % gradients.length]}`}
                  >
                    <span className="font-[family-name:var(--font-display)] text-6xl text-black/30">
                      {p.display_name?.[0]?.toUpperCase() ?? "?"}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-extrabold text-[#fbecef]">
                    {p.display_name}
                  </div>
                  <div className="text-sm text-[#c9a7b3]">{p.age}</div>
                </div>

                <div className="mt-1 text-sm font-semibold text-[#ff5f8f]">
                  {p.city}, {p.area}
                </div>

                {p.bio ? (
                  <div className="mt-3 line-clamp-2 text-sm text-[#a3808c]">
                    {p.bio}
                  </div>
                ) : null}

                <div className="mt-4 text-xs font-semibold text-[#8f6b78]">
                  View profile →
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : null}
      </div>
    </main>
  );
}
