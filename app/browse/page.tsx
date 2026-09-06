"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Suspense } from "react";
import { NG_TOP_STATES } from "@/lib/ngStates";

type Profile = {
  username: string;
  is_verified: boolean;
  display_name: string;
  gender: "female" | "male";
  orientation: "straight" | "gay" | "bisexual";
  age: number;
  city: string;
  area: string;
  bio: string | null;
  photo_url: string | null;
};

const PAGE_SIZE = 24;

/** Escape LIKE wildcards so a typed "%" searches for a literal "%". */
function escapeLike(input: string) {
  return input.replace(/[%_\\]/g, (m) => `\\${m}`);
}

export default function Page() {
  // Session-aware client. The plain supabase-js client doesn't read the auth
  // cookies, so its queries run anonymously — which silently defeats any RLS
  // policy that depends on auth.uid(), like block visibility.
  const supabase = useMemo(() => createClient(), []);

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasProfile, setHasProfile] = useState(false);

  // Filters
  const [gender, setGender] = useState<"all" | Profile["gender"]>("all");
  const [orientation, setOrientation] = useState<"all" | Profile["orientation"]>("all");
  const [city, setCity] = useState<string>("all");
  const [area, setArea] = useState("");
  const [minAge, setMinAge] = useState<number | "">("");
  const [maxAge, setMaxAge] = useState<number | "">("");

  // Debounced copy of the filters — typing in Area or the age boxes shouldn't
  // fire a query per keystroke.
  const [applied, setApplied] = useState({
    gender: "all" as string,
    orientation: "all" as string,
    city: "all" as string,
    area: "",
    minAge: "" as number | "",
    maxAge: "" as number | "",
  });

  useEffect(() => {
    const t = setTimeout(() => {
      setApplied({ gender, orientation, city, area, minAge, maxAge });
    }, 300);
    return () => clearTimeout(t);
  }, [gender, orientation, city, area, minAge, maxAge]);

  const fetchPage = useCallback(
    (offset: number) => {
      // RLS also restricts this to approved+active, so guests only ever see
      // live profiles; these filters keep the query explicit either way.
      let query = supabase
        .from("profiles")
        // id is deliberately NOT selected — nothing here needs it, so it never
        // reaches the browser. It's still used as a sort tiebreaker below,
        // which happens server-side.
        .select(
          "username, display_name, gender, orientation, age, city, area, bio, photo_url, is_verified",
          { count: "exact" }
        )
        .eq("status", "approved")
        .eq("is_active", true)
        .eq("is_hidden_by_owner", false)
        .is("deleted_at", null);

      if (applied.gender !== "all") query = query.eq("gender", applied.gender);
      if (applied.orientation !== "all") query = query.eq("orientation", applied.orientation);
      if (applied.city !== "all") query = query.eq("city", applied.city);
      if (applied.area.trim()) {
        query = query.ilike("area", `%${escapeLike(applied.area.trim())}%`);
      }
      if (applied.minAge !== "") query = query.gte("age", Number(applied.minAge));
      if (applied.maxAge !== "") query = query.lte("age", Number(applied.maxAge));

      return query
        .order("created_at", { ascending: false })
        // Tiebreaker: created_at alone isn't unique (two profiles approved in
        // the same instant), and Postgres doesn't guarantee a stable order
        // under ties — which can duplicate or skip rows across page boundaries.
        .order("id", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);
    },
    [applied, supabase]
  );

  // Reset to page one whenever the applied filters change.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setErrorMsg(null);

      const { data, error, count } = await fetchPage(0);
      if (cancelled) return;

      if (error) {
        setErrorMsg(error.message);
        setProfiles([]);
        setTotal(0);
        setHasMore(false);
      } else {
        const rows = (data ?? []) as Profile[];
        setProfiles(rows);
        setTotal(count ?? rows.length);
        setHasMore(rows.length < (count ?? rows.length));
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [fetchPage]);

  async function loadMore() {
    setLoadingMore(true);

    const { data, error, count } = await fetchPage(profiles.length);

    if (error) {
      setErrorMsg(error.message);
    } else {
      const rows = (data ?? []) as Profile[];
      const next = [...profiles, ...rows];
      setProfiles(next);
      setTotal(count ?? next.length);
      setHasMore(next.length < (count ?? next.length));
    }

    setLoadingMore(false);
  }

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
  }, [supabase]);

  const cityOptions = ["all", ...NG_TOP_STATES] as const;

  const hasActiveFilters =
    gender !== "all" ||
    orientation !== "all" ||
    city !== "all" ||
    area.trim() !== "" ||
    minAge !== "" ||
    maxAge !== "";

  function clearFilters() {
    setGender("all");
    setOrientation("all");
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
        <div className="flex items-center gap-3">
          {!hasProfile ? (
            <Link
              href="/create-profile"
              className="rounded-full border border-[#ff115a]/40 px-4 py-2 text-sm font-bold text-[#ff5f8f] hover:bg-[#ff115a]/10"
            >
              Create Profile
            </Link>
          ) : null}
          <Link
            href="/"
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-bold text-[#fbecef] hover:bg-white/5"
          >
            Home
          </Link>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-2.5">
        <div className="flex items-start gap-2.5">
          <span className="text-base leading-tight">⚠️</span>
          <div>
            <div className="text-[13px] font-bold text-amber-300">
              Only trust profiles with the{" "}
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-300">
                ✓ Verified
              </span>{" "}
              badge
            </div>
            <p className="mt-1 text-xs leading-relaxed text-[#e8d1d8]">
              A verified badge means we&rsquo;ve checked that the person matches the photos on their
              profile. Anyone without it is unverified.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2.5 lg:grid-cols-3">
        <div className="flex gap-2.5">
          <select
            className="w-full min-w-0 rounded-lg border border-white/10 bg-[#220413] px-3 py-1.5 text-sm text-[#fbecef]"
            value={gender}
            onChange={(e) => setGender(e.target.value as any)}
          >
            <option value="all">Gender</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>

          <select
            className="w-full min-w-0 rounded-lg border border-white/10 bg-[#220413] px-3 py-1.5 text-sm text-[#fbecef]"
            value={orientation}
            onChange={(e) => setOrientation(e.target.value as any)}
          >
            <option value="all">Preference</option>
            <option value="straight">Straight</option>
            <option value="gay">Gay</option>
            <option value="bisexual">Bisexual</option>
          </select>
        </div>

        <div className="flex gap-2.5">
          <select
            className="w-full min-w-0 rounded-lg border border-white/10 bg-[#220413] px-3 py-1.5 text-sm text-[#fbecef]"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          >
            {cityOptions.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "State" : c}
              </option>
            ))}
          </select>

          <input
            className="w-full min-w-0 rounded-lg border border-white/10 bg-[#220413] px-3 py-1.5 text-sm text-[#fbecef] placeholder:text-[#8f6b78]"
            placeholder="Area (e.g., Lekki)"
            value={area}
            onChange={(e) => setArea(e.target.value)}
          />
        </div>

        <div className="flex gap-2.5">
          <input
            className="w-full min-w-0 rounded-lg border border-white/10 bg-[#220413] px-3 py-1.5 text-sm text-[#fbecef] placeholder:text-[#8f6b78]"
            type="number"
            min={18}
            max={99}
            placeholder="Min age"
            value={minAge}
            onChange={(e) => setMinAge(e.target.value === "" ? "" : Number(e.target.value))}
          />

          <input
            className="w-full min-w-0 rounded-lg border border-white/10 bg-[#220413] px-3 py-1.5 text-sm text-[#fbecef] placeholder:text-[#8f6b78]"
            type="number"
            min={18}
            max={99}
            placeholder="Max age"
            value={maxAge}
            onChange={(e) => setMaxAge(e.target.value === "" ? "" : Number(e.target.value))}
          />
        </div>

        <div className="flex min-w-0 items-center gap-2.5">
          <div className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#220413] px-3 py-1.5 text-[13px] text-[#c9a7b3]">
            Showing <span className="font-bold text-[#ff5f8f]">{profiles.length}</span> of{" "}
            <span className="font-bold text-[#ff5f8f]">{total}</span> profiles
          </div>
          {hasActiveFilters ? (
            <button
              className="shrink-0 rounded-lg border border-white/10 bg-[#220413] px-3 py-1.5 text-[13px] text-[#fbecef] hover:bg-white/5"
              onClick={clearFilters}
            >
              Clear
            </button>
          ) : null}
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
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {profiles.map((p, i) => (
            <Link
              key={p.username}
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
                    <span className="font-[family-name:var(--font-display)] text-4xl text-black/30">
                      {p.display_name?.[0]?.toUpperCase() ?? "?"}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <div className="truncate text-sm font-extrabold text-[#fbecef]">
                      {p.display_name}
                    </div>
                    {p.is_verified ? (
                      <span
                        title="Identity verified"
                        className="shrink-0 whitespace-nowrap rounded-full border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300"
                      >
                        ✓ Verified
                      </span>
                    ) : null}
                  </div>
                  <div className="text-xs text-[#c9a7b3]">{p.age}</div>
                </div>

                <div className="mt-1 text-xs font-semibold text-[#ff5f8f]">
                  {p.city}, {p.area}
                </div>

                {p.bio ? (
                  <div className="mt-2 line-clamp-2 text-xs text-[#a3808c]">
                    {p.bio}
                  </div>
                ) : null}

                <div className="mt-3 text-xs font-semibold text-[#8f6b78]">
                  View profile →
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : null}

      {!loading && !errorMsg && profiles.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-white/10 bg-[#150109] p-6 text-center">
          <div className="font-bold text-[#fbecef]">No profiles match those filters</div>
          <div className="mt-1 text-sm text-[#c9a7b3]">
            Try widening your search — fewer filters, or a different state.
          </div>
        </div>
      ) : null}

      {!loading && !errorMsg && hasMore ? (
        <div className="mt-8 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="rounded-full border border-[#ff115a]/40 px-6 py-3 text-sm font-bold text-[#ff5f8f] hover:bg-[#ff115a]/10 disabled:opacity-50"
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      ) : null}
      </div>
    </main>
  );
}
