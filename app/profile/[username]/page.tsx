"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/Button";
import { useParams } from "next/navigation";
import { Suspense } from "react";

type Profile = {
  id: string;
  display_name: string;
  gender: "female" | "male" | "nonbinary";
  age: number;
  city: string;
  area: string;
  bio: string | null;
  photo_url: string | null;
  whatsapp: string | null;
  telegram: string | null;
};

function maskPhone(s: string) {
  const clean = s.replace(/\s+/g, "");
  if (clean.length < 7) return clean;
  return clean.slice(0, 4) + "***" + clean.slice(-2);
}

export default function ProfilePage() {
  const [p, setP] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showContact, setShowContact] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("Spam/Fake");
  const [reportDetails, setReportDetails] = useState("");
  const [reportMsg, setReportMsg] = useState<string | null>(null);

  const params = useParams<{ username: string }>();
  const username = params?.username;

  useEffect(() => {
    if (!username) return;

    (async () => {
      setLoading(true);
      setP(null);
      setPhotos([]);

      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, gender, age, city, area, bio, photo_url, whatsapp, telegram")
        .eq("username", username)
        .eq("status", "approved")
        .eq("is_active", true)
        .is("deleted_at", null)
        .single();

      if (error || !data) {
        setLoading(false);
        return; // stop here (don’t fetch photos)
      }

      setP(data as Profile);

      const { data: ph } = await supabase
        .from("profile_photos")
        .select("url, sort_order")
        .eq("profile_id", data.id)
        .order("sort_order", { ascending: true });

      setPhotos((ph ?? []).map((x: any) => x.url));
      setLoading(false);
    })();
  }, [username]);

  async function submitReport() {
    if (!p) return;
    setReportMsg(null);
    const res = await fetch("/api/reports/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profileId: p.id,
        reason: reportReason,
        details: reportDetails,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setReportMsg(data.error || "Failed");
      return;
    }

    setReportMsg("Report submitted. Thank you.");
    setReportDetails("");
  }

  if (!username) return <main className="min-h-screen bg-[#060002] p-6 text-[#c9a7b3]">Loading…</main>;
  if (loading) return <main className="min-h-screen bg-[#060002] p-6 text-[#c9a7b3]">Loading…</main>;
  if (!p) return <main className="min-h-screen bg-[#060002] p-6 text-[#c9a7b3]">Profile not available.</main>;

  const whatsappDisplay =
    p.whatsapp ? (showContact ? p.whatsapp : maskPhone(p.whatsapp)) : null;

  return (
    <main className="min-h-screen bg-[#060002] relative overflow-hidden">
      <div className="pointer-events-none absolute -top-56 -left-40 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,rgba(196,0,255,0.2),transparent_68%)]" />

      <Suspense fallback={<div className="h-14 border-b border-white/10 bg-[#060002]/90 backdrop-blur" />}>
        <SiteHeader />
      </Suspense>
      <div className="relative mx-auto max-w-5xl px-6 py-8">
      <Link className="text-sm font-bold text-[#ff5f8f] hover:text-[#fbecef]" href="/browse">
        ← Back to Browse
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <div className="grid grid-cols-2 gap-2">
          {photos.length ? (
            photos.map((u) => (
              <div key={u} className="rounded-2xl overflow-hidden bg-[#150109] aspect-[4/3]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt="photo" className="h-full w-full object-cover" />
              </div>
            ))
          ) : (
            <div className="col-span-2 rounded-2xl overflow-hidden bg-gradient-to-br from-[#ff115a] via-[#c400ff] to-[#3a0059] aspect-[4/3] grid place-items-center">
              <span className="font-[family-name:var(--font-display)] text-8xl text-black/30">
                {p.display_name?.[0]?.toUpperCase() ?? "?"}
              </span>
            </div>
          )}
        </div>

        <div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl uppercase text-[#fbecef]">
            {p.display_name} <span className="text-[#ff5f8f] text-2xl">· {p.age}</span>
          </h1>
          <p className="text-[#c9a7b3] mt-2 text-sm">
            {p.city}, {p.area} · {p.gender}
          </p>

          {p.bio ? <p className="mt-5 text-[#e8d1d8] leading-relaxed">{p.bio}</p> : null}

          <div className="mt-6 rounded-2xl border border-[#ff115a]/30 bg-[#150109] p-5">
            <div className="font-extrabold text-sm uppercase tracking-wide text-[#ff5f8f] mb-3">Contacts</div>

            {p.whatsapp ? (
              <div className="flex items-center justify-between gap-3">
                <div className="text-[#e8d1d8]">
                  WhatsApp:{" "}
                  <span className="font-mono text-[#fbecef]">{whatsappDisplay}</span>
                </div>
                {!showContact ? (
                  <button
                    className="rounded-full bg-gradient-to-r from-[#ff115a] to-[#c400ff] px-4 py-2 text-sm font-extrabold text-[#060002] hover:opacity-90"
                    onClick={() => setShowContact(true)}
                  >
                    Show full
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="text-[#8f6b78]">No WhatsApp provided.</div>
            )}

            {p.telegram ? (
              <div className="mt-3 text-[#e8d1d8]">
                Telegram:{" "}
                {showContact ? (
                  <a
                    className="underline text-[#ff5f8f]"
                    href={`https://t.me/${p.telegram.replace("@", "")}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    @{p.telegram.replace("@", "")}
                  </a>
                ) : (
                  <span className="font-mono text-[#fbecef]">
                    @{p.telegram.replace("@", "").slice(0, 3)}***
                  </span>
                )}
              </div>
            ) : null}

            <p className="text-xs text-[#8f6b78] mt-3">
              Contacts are shown only on profile pages to reduce scraping.
            </p>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-transparent p-4">
            <div className="flex items-center justify-between">
              <div className="font-bold text-[#e8d1d8]">Report</div>
              <Button
                variant="outline"
                onClick={() => {
                  setReportOpen((v) => !v);
                  setReportMsg(null);
                }}
              >
                {reportOpen ? "Close" : "Report profile"}
              </Button>
            </div>

            {reportOpen ? (
              <div className="mt-4 grid gap-3">
                <select
                  className="rounded-lg border border-white/10 bg-[#220413] p-2 text-[#fbecef]"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                >
                  <option>Spam/Fake</option>
                  <option>Scam</option>
                  <option>Underage</option>
                  <option>Harassment</option>
                  <option>Other</option>
                </select>

                <textarea
                  className="rounded-lg border border-white/10 bg-[#220413] p-2 text-[#fbecef] placeholder:text-[#8f6b78]"
                  rows={3}
                  placeholder="Optional details…"
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                />

                <Button variant="primary" onClick={submitReport}>
                  Submit report
                </Button>

                {reportMsg ? <div className="text-sm text-[#c9a7b3]">{reportMsg}</div> : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      </div>
    </main>
  );
}
