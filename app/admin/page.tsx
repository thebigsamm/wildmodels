"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type ProfileRow = {
  id: string;
  display_name: string;
  gender: string;
  age: number;
  city: string;
  area: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

type ReportRow = {
  id: string;
  profile_id: string;
  reason: string;
  details: string | null;
  reporter_ip: string | null;
  status: "open" | "closed";
  created_at: string;
  closed_at: string | null;
  profiles: {
    id: string;
    display_name: string;
    gender: string;
    age: number;
    city: string;
    area: string;
    photo_url: string | null;
    status: "pending" | "approved" | "rejected";
    is_active: boolean;
  } | null;
};

type AdminPhoto = {
  id: string;
  profile_id: string;
  url: string;
  sort_order: number;
  created_at: string;
};

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad";
}) {
  const toneClass =
    tone === "good"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "warn"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : tone === "bad"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : "border-black/10 bg-black/5 text-black/70";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${toneClass}`}
    >
      {children}
    </span>
  );
}

function Btn({
  children,
  onClick,
  disabled,
  tone = "neutral",
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone?: "neutral" | "primary" | "danger";
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm border transition disabled:opacity-50 disabled:cursor-not-allowed";
  const toneClass =
    tone === "primary"
      ? "border-black bg-black text-white hover:bg-black/90"
      : tone === "danger"
      ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
      : "border-black/10 bg-white hover:bg-black/5";
  return (
    <button
      className={`${base} ${toneClass} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export default function AdminPage() {
  const [secret, setSecret] = useState("");

  // Tabs
  const [tab, setTab] = useState<"reports" | "pending">("reports");

  // Pending approvals
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);

  // Reports inbox
  const [reportStatus, setReportStatus] = useState<"open" | "closed">("open");
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // Photos moderation modal
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [photoProfileId, setPhotoProfileId] = useState<string | null>(null);
  const [photoRows, setPhotoRows] = useState<AdminPhoto[]>([]);
  const [photoLoading, setPhotoLoading] = useState(false);

  // Quick manage photos search
  const [photoSearchId, setPhotoSearchId] = useState("");

  // Messages
  const [msg, setMsg] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<string | null>(null);

  const secretTrim = useMemo(() => secret.trim(), [secret]);

  function showToast(text: string) {
    setToast(text);
    window.clearTimeout((showToast as any)._t);
    (showToast as any)._t = window.setTimeout(() => setToast(null), 1200);
  }

  async function copyText(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      showToast(`${label} copied`);
    } catch {
      // fallback
      try {
        const ta = document.createElement("textarea");
        ta.value = value;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        showToast(`${label} copied`);
      } catch {
        setMsg("Copy failed (browser blocked clipboard).");
      }
    }
  }

  function requireSecret(): boolean {
    setMsg(null);
    if (!secretTrim) {
      setMsg("Enter admin secret first.");
      return false;
    }
    return true;
  }

  async function loadPending() {
    if (!requireSecret()) return;
    setLoadingPending(true);

    const res = await fetch("/api/admin/pending", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: secretTrim }),
    });

    const data = await res.json();
    setLoadingPending(false);

    if (!res.ok) {
      setMsg(data.error || "Failed to load pending profiles");
      setRows([]);
      return;
    }

    setRows((data.rows ?? []) as ProfileRow[]);
  }

  async function updateStatus(id: string, status: "approved" | "rejected") {
    if (!requireSecret()) return;

    const res = await fetch("/api/admin/update-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: secretTrim, id, status }),
    });

    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || "Failed");
      return;
    }

    setMsg(`Updated: ${status}`);
    await loadPending();
  }

  async function loadReports(nextStatus?: "open" | "closed") {
    if (!requireSecret()) return;
    const status = nextStatus ?? reportStatus;

    setLoadingReports(true);
    const res = await fetch("/api/admin/reports/list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: secretTrim, status }),
    });

    const data = await res.json();
    setLoadingReports(false);

    if (!res.ok) {
      setMsg(data.error || "Failed to load reports");
      setReports([]);
      return;
    }

    setReports((data.reports ?? []) as ReportRow[]);
  }

  async function closeReport(reportId: string) {
    if (!requireSecret()) return;

    const res = await fetch("/api/admin/reports/close", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: secretTrim, reportId }),
    });

    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || "Failed to close report");
      return;
    }

    setMsg("Report closed.");
    await loadReports();
  }

  async function setProfileActive(profileId: string, isActive: boolean) {
    if (!requireSecret()) return;

    const res = await fetch("/api/admin/profiles/set-active", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: secretTrim,
        profileId,
        isActive,
        alsoReject: false,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || "Failed to update profile");
      return;
    }

    setMsg(isActive ? "Profile unsuspended." : "Profile suspended.");
    await loadReports();
  }

  // ---- PHOTO MODERATION HELPERS ----
  async function openManagePhotos(profileId: string) {
    if (!requireSecret()) return;
    setPhotoModalOpen(true);
    setPhotoProfileId(profileId);
    await loadPhotos(profileId);
  }

  async function loadPhotos(profileId: string) {
    setPhotoLoading(true);
    const res = await fetch("/api/admin/photos/list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: secretTrim, profileId }),
    });

    const data = await res.json();
    setPhotoLoading(false);

    if (!res.ok) {
      setMsg(data.error || "Failed to load photos");
      setPhotoRows([]);
      return;
    }

    setPhotoRows((data.photos ?? []) as AdminPhoto[]);
  }

  async function setMainPhoto(profileId: string, url: string) {
    if (!requireSecret()) return;

    const res = await fetch("/api/admin/photos/set-main", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: secretTrim, profileId, url }),
    });

    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || "Failed to set main photo");
      return;
    }

    setMsg("Main photo updated.");
    await loadReports();
  }

  async function reorderPhoto(
    profileId: string,
    photoId: string,
    direction: "up" | "down"
  ) {
    if (!requireSecret()) return;

    const res = await fetch("/api/admin/photos/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: secretTrim, profileId, photoId, direction }),
    });

    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || "Failed to reorder photo");
      return;
    }

    await loadPhotos(profileId);
  }

  async function deletePhoto(profileId: string, photoId: string, url: string) {
    if (!requireSecret()) return;

    const ok = confirm("Delete this photo? This cannot be undone.");
    if (!ok) return;

    const res = await fetch("/api/admin/photos/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: secretTrim,
        profileId,
        photoId,
        url,
        deleteFromStorage: false,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || "Failed to delete photo");
      return;
    }

    setMsg("Photo deleted.");
    await loadPhotos(profileId);
    await loadReports();
  }

  function closePhotoModal() {
    setPhotoModalOpen(false);
    setPhotoProfileId(null);
    setPhotoRows([]);
    setPhotoLoading(false);
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="sticky top-0 z-20 border-b border-black/10 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">Admin</div>
            <div className="text-xs text-black/60">Moderation dashboard</div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              className="text-sm underline text-black/70 hover:text-black"
              href="/"
            >
              Home
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8 grid gap-6">
        {/* Top card */}
        <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <label className="grid gap-1">
              <span className="text-sm text-black/70">Admin secret</span>
              <input
                className="border border-black/10 rounded-xl p-3 outline-none focus:ring-2 focus:ring-black/10"
                type="password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="Enter your ADMIN_SECRET"
              />
            </label>

            <div className="flex flex-wrap gap-2 md:justify-end">
              <Btn
                tone="primary"
                onClick={() => {
                  if (tab === "reports") loadReports();
                  else loadPending();
                }}
              >
                Refresh current tab
              </Btn>
              <Btn
                onClick={() => {
                  setRows([]);
                  setReports([]);
                  setMsg(null);
                }}
              >
                Clear
              </Btn>
              {loadingPending || loadingReports ? (
                <span className="self-center text-sm">Loading…</span>
              ) : null}
            </div>
          </div>

          {msg ? <div className="mt-3 text-sm text-black/70">{msg}</div> : null}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-black/10 pt-4">
            {/* Tabs */}
            <div className="flex gap-2">
              <Btn
                onClick={() => setTab("reports")}
                className={
                  tab === "reports"
                    ? "bg-black text-white border-black hover:bg-black/90"
                    : ""
                }
              >
                Reports
              </Btn>
              <Btn
                onClick={() => setTab("pending")}
                className={
                  tab === "pending"
                    ? "bg-black text-white border-black hover:bg-black/90"
                    : ""
                }
              >
                Pending
              </Btn>
            </div>

            {/* Quick photo manage */}
            <div className="flex flex-wrap gap-2 items-center">
              <input
                className="border border-black/10 rounded-xl px-3 py-2 text-sm w-[280px] max-w-full"
                placeholder="Profile ID → Manage photos"
                value={photoSearchId}
                onChange={(e) => setPhotoSearchId(e.target.value)}
              />
              <Btn
                onClick={() => {
                  const id = photoSearchId.trim();
                  if (!id) {
                    setMsg("Paste a profile ID first.");
                    return;
                  }
                  openManagePhotos(id);
                }}
              >
                Open photos
              </Btn>
            </div>
          </div>
        </div>

        {/* REPORTS TAB */}
        {tab === "reports" ? (
          <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="grid gap-1">
                <h2 className="text-lg font-semibold">Reports Inbox</h2>
                <div className="text-sm text-black/60">
                  Review reports and suspend profiles if needed.
                </div>
              </div>

              <div className="flex gap-2">
                <Btn
                  onClick={() => {
                    setReportStatus("open");
                    loadReports("open");
                  }}
                  className={
                    reportStatus === "open"
                      ? "bg-black text-white border-black hover:bg-black/90"
                      : ""
                  }
                >
                  Open
                </Btn>
                <Btn
                  onClick={() => {
                    setReportStatus("closed");
                    loadReports("closed");
                  }}
                  className={
                    reportStatus === "closed"
                      ? "bg-black text-white border-black hover:bg-black/90"
                      : ""
                  }
                >
                  Closed
                </Btn>
                <Btn onClick={() => loadReports()}>Load</Btn>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {reports.length === 0 && !loadingReports ? (
                <div className="text-black/60">
                  No {reportStatus} reports (or not loaded yet).
                </div>
              ) : null}

              {reports.map((r) => {
                const pr = r.profiles;

                async function suspendAndClose() {
                  if (!pr) return;
                  await setProfileActive(pr.id, false);
                  await closeReport(r.id);
                }

                const statusTone =
                  pr?.status === "approved"
                    ? "good"
                    : pr?.status === "pending"
                    ? "warn"
                    : "bad";
                const activeTone = pr?.is_active ? "good" : "bad";

                return (
                  <div key={r.id} className="rounded-2xl border border-black/10 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="grid gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-medium">{r.reason}</div>
                          <Badge tone={r.status === "open" ? "warn" : "neutral"}>
                            {r.status}
                          </Badge>
                          <span className="text-xs text-black/50">
                            • {fmtDate(r.created_at)}
                          </span>
                        </div>

                        {r.details ? (
                          <div className="text-sm text-black/70 whitespace-pre-wrap">
                            {r.details}
                          </div>
                        ) : (
                          <div className="text-sm text-black/50">
                            No details provided.
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Btn onClick={() => copyText("Profile ID", r.profile_id)}>
                          Copy ID
                        </Btn>
                        <Link
                          className="underline text-sm text-black/70 hover:text-black"
                          href={`/profile/${r.profile_id}`}
                        >
                          View profile
                        </Link>
                      </div>
                    </div>

                    <div className="mt-3 rounded-xl border border-black/10 p-3">
                      {pr ? (
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-lg overflow-hidden bg-black/5 shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            {pr.photo_url ? (
                              <img
                                src={pr.photo_url}
                                alt="photo"
                                className="h-full w-full object-cover"
                              />
                            ) : null}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">
                              {pr.display_name} • {pr.age} • {pr.gender}
                            </div>

                            <div className="text-sm text-black/60 truncate">
                              {pr.city}, {pr.area}
                            </div>

                            <div className="mt-2 flex flex-wrap gap-2">
                              <Badge tone={statusTone as any}>status: {pr.status}</Badge>
                              <Badge tone={activeTone as any}>
                                active: {pr.is_active ? "true" : "false"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-black/60">
                          Profile record not available (maybe deleted).
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {pr ? (
                        pr.is_active ? (
                          <Btn tone="danger" onClick={() => setProfileActive(pr.id, false)}>
                            Suspend
                          </Btn>
                        ) : (
                          <Btn onClick={() => setProfileActive(pr.id, true)}>Unsuspend</Btn>
                        )
                      ) : null}

                      {pr ? <Btn onClick={() => openManagePhotos(pr.id)}>Manage photos</Btn> : null}

                      {r.status === "open" ? (
                        <>
                          <Btn onClick={() => closeReport(r.id)}>Close report</Btn>
                          {pr && pr.is_active ? (
                            <Btn tone="danger" onClick={suspendAndClose}>
                              Suspend + Close
                            </Btn>
                          ) : null}
                        </>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* PENDING TAB */}
        {tab === "pending" ? (
          <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="grid gap-1">
                <h2 className="text-lg font-semibold">Pending Profiles</h2>
                <div className="text-sm text-black/60">
                  Approve or reject submissions.
                </div>
              </div>

              <div className="flex gap-2">
                <Btn onClick={loadPending}>Load</Btn>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {rows.length === 0 && !loadingPending ? (
                <div className="text-black/60">
                  No pending profiles (or not loaded yet).
                </div>
              ) : null}

              {rows.map((r) => (
                <div key={r.id} className="rounded-2xl border border-black/10 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        {r.display_name} • {r.age} • {r.gender}
                      </div>
                      <div className="text-sm text-black/60 truncate">
                        {r.city}, {r.area}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge tone="warn">status: pending</Badge>
                        <span className="text-xs text-black/50">
                          • {fmtDate(r.created_at)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Btn onClick={() => copyText("Profile ID", r.id)}>Copy ID</Btn>
                      <Link
                        className="underline text-sm text-black/70 hover:text-black"
                        href={`/profile/${r.id}`}
                      >
                        View
                      </Link>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Btn tone="primary" onClick={() => updateStatus(r.id, "approved")}>
                      Approve
                    </Btn>
                    <Btn tone="danger" onClick={() => updateStatus(r.id, "rejected")}>
                      Reject
                    </Btn>
                    <Btn onClick={() => openManagePhotos(r.id)}>Manage photos</Btn>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* PHOTO MODAL */}
      {photoModalOpen && photoProfileId ? (
        <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4">
          <div className="w-full max-w-4xl rounded-2xl bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="grid gap-1">
                <div className="font-semibold">Manage Photos</div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-black/60 font-mono">{photoProfileId}</div>
                  <Btn
                    onClick={() => copyText("Profile ID", photoProfileId)}
                    className="px-2 py-1 text-xs"
                  >
                    Copy
                  </Btn>
                </div>
              </div>
              <Btn onClick={closePhotoModal}>Close</Btn>
            </div>

            {photoLoading ? <div className="mt-4 text-sm">Loading…</div> : null}

            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {photoRows.map((ph, idx) => (
                <div key={ph.id} className="border border-black/10 rounded-2xl overflow-hidden">
                  <div className="aspect-[4/3] bg-black/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ph.url} alt="photo" className="h-full w-full object-cover" />
                  </div>

                  <div className="p-3 grid gap-2">
                    <div className="text-xs text-black/50">
                      sort: {ph.sort_order} • #{idx + 1}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Btn
                        onClick={() => setMainPhoto(photoProfileId, ph.url)}
                        className="px-2 py-1 text-xs"
                      >
                        Set main
                      </Btn>

                      <Btn
                        onClick={() => reorderPhoto(photoProfileId, ph.id, "up")}
                        disabled={idx === 0}
                        className="px-2 py-1 text-xs"
                      >
                        ←
                      </Btn>

                      <Btn
                        onClick={() => reorderPhoto(photoProfileId, ph.id, "down")}
                        disabled={idx === photoRows.length - 1}
                        className="px-2 py-1 text-xs"
                      >
                        →
                      </Btn>

                      <Btn
                        tone="danger"
                        onClick={() => deletePhoto(photoProfileId, ph.id, ph.url)}
                        className="px-2 py-1 text-xs"
                      >
                        Delete
                      </Btn>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {photoRows.length === 0 && !photoLoading ? (
              <div className="mt-4 text-black/60">No photos found for this profile.</div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* TOAST */}
      {toast ? (
        <div className="fixed bottom-4 right-4 z-[60] rounded-xl border border-black/10 bg-white px-3 py-2 text-sm shadow">
          {toast}
        </div>
      ) : null}
    </main>
  );
}