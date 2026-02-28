"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/Button";
import { useParams } from "next/navigation";

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

  const params = useParams<{ id: string }>();
  const id = params?.id;
  
  useEffect(() => {
    if (!id) return;

    (async () => {
      setLoading(true);
      setP(null);
      setPhotos([]);

      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, gender, age, city, area, bio, photo_url, whatsapp, telegram")
        .eq("id", id)
        .eq("status", "approved")
        .eq("is_active", true)
        .single();

      if (error || !data) {
        setLoading(false);
        return; // stop here (don’t fetch photos)
      }

      setP(data as Profile);

      const { data: ph } = await supabase
        .from("profile_photos")
        .select("url, sort_order")
        .eq("profile_id", id)
        .order("sort_order", { ascending: true });

      setPhotos((ph ?? []).map((x: any) => x.url));
      setLoading(false);
    })();
  }, [id]);

  async function submitReport() {
    setReportMsg(null);
    const res = await fetch("/api/reports/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profileId: id,
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
  
  if (!id) return <main className="p-6">Loading…</main>;
  if (loading) return <main className="p-6">Loading…</main>;
  if (!p) return <main className="p-6">Profile not available.</main>;
  
  const whatsappDisplay =
    p.whatsapp ? (showContact ? p.whatsapp : maskPhone(p.whatsapp)) : null;

  return (
    <main className="min-h-screen bg-white">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-6 py-8">
      <Link className="underline" href="/browse">
        ← Back to Browse
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <div className="grid grid-cols-2 gap-2">
          {photos.length ? (
            photos.map((u) => (
              <div key={u} className="rounded-xl overflow-hidden bg-gray-100 aspect-[4/3]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt="photo" className="h-full w-full object-cover" />
              </div>
            ))
          ) : (
            <div className="rounded-xl overflow-hidden bg-gray-100 aspect-[4/3] grid place-items-center text-gray-500">
              No photos
            </div>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-semibold">
            {p.display_name} • {p.age}
          </h1>
          <p className="text-gray-600 mt-1">
            {p.city}, {p.area} • {p.gender}
          </p>

          {p.bio ? <p className="mt-4">{p.bio}</p> : null}

          <div className="mt-6 border rounded-xl p-4">
            <div className="font-medium mb-2">Contacts</div>


            {p.whatsapp ? (
              <div className="flex items-center justify-between gap-3">
                <div>
                  WhatsApp:{" "}
                  <span className="font-mono">{whatsappDisplay}</span>
                </div>
                {!showContact ? (
                  <button
                    className="border rounded px-3 py-1 hover:bg-gray-50"
                    onClick={() => setShowContact(true)}
                  >
                    Show full
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="text-gray-600">No WhatsApp provided.</div>
            )}

            {p.telegram ? (
              <div className="mt-3">
                Telegram:{" "}
                {showContact ? (
                  <a
                    className="underline"
                    href={`https://t.me/${p.telegram.replace("@", "")}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    @{p.telegram.replace("@", "")}
                  </a>
                ) : (
                  <span className="font-mono">
                    @{p.telegram.replace("@", "").slice(0, 3)}***
                  </span>
                )}
              </div>
            ) : null}

            <p className="text-xs text-gray-500 mt-3">
              Contacts are shown only on profile pages to reduce scraping.
            </p>
          </div>
          
          <div className="mt-6 rounded-2xl border border-black/10 bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="font-medium">Report</div>
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
                  className="border rounded p-2"
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
                  className="border rounded p-2"
                  rows={3}
                  placeholder="Optional details…"
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                />

                <Button variant="primary" onClick={submitReport}>
                  Submit report
                </Button>

                {reportMsg ? <div className="text-sm text-black/70">{reportMsg}</div> : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      </div>
    </main>
  );
}
