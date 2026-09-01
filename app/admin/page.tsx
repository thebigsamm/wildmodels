"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  SNAPSHOT_FIELDS,
  SNAPSHOT_FIELD_LABELS,
  type ProfileSnapshot,
} from "@/lib/profileSnapshot";

type ProfileRow = {
  id: string;
  username: string;
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
    username: string;
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

type PreviewProfile = {
  id: string;
  username: string;
  display_name: string;
  gender: string;
  orientation: string;
  age: number;
  city: string;
  area: string;
  bio: string | null;
  photo_url: string | null;
  whatsapp: string | null;
  telegram: string | null;
  status: "pending" | "approved" | "rejected";
  is_active: boolean;
  is_hidden_by_owner: boolean;
  deleted_at: string | null;
  created_at: string;
  rejection_count: number;
  approved_snapshot: ProfileSnapshot | null;
};

type PreviewPhoto = {
  id: string;
  url: string;
  sort_order: number;
};

type AllProfileRow = {
  id: string;
  username: string;
  display_name: string;
  gender: string;
  age: number;
  city: string;
  area: string;
  status: "pending" | "approved" | "rejected";
  is_active: boolean;
  is_hidden_by_owner: boolean;
  deleted_at: string | null;
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
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : tone === "warn"
      ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
      : tone === "bad"
      ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
      : "border-white/10 bg-white/5 text-[#c9a7b3]";

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
      ? "border-[#ff115a] bg-[#ff115a] text-white hover:bg-[#e00e50]"
      : tone === "danger"
      ? "border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
      : "border-white/10 bg-[#220413] text-[#fbecef] hover:bg-white/5";
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
  const [tab, setTab] = useState<"reports" | "pending" | "all">("reports");

  // All profiles
  const [allRows, setAllRows] = useState<AllProfileRow[]>([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [allSearch, setAllSearch] = useState("");

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

  // Profile preview modal (admin-only view, bypasses the approved-only
  // restriction on the public profile page)
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewProfile, setPreviewProfile] = useState<PreviewProfile | null>(null);
  const [previewPhotos, setPreviewPhotos] = useState<PreviewPhoto[]>([]);

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

  async function loadAll() {
    if (!requireSecret()) return;
    setLoadingAll(true);

    const res = await fetch("/api/admin/profiles/list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: secretTrim }),
    });

    const data = await res.json();
    setLoadingAll(false);

    if (!res.ok) {
      setMsg(data.error || "Failed to load profiles");
      setAllRows([]);
      return;
    }

    setAllRows((data.rows ?? []) as AllProfileRow[]);
  }

  const filteredAllRows = useMemo(() => {
    const q = allSearch.trim().toLowerCase();
    if (!q) return allRows;
    return allRows.filter(
      (r) =>
        r.display_name.toLowerCase().includes(q) ||
        r.username.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q) ||
        r.area.toLowerCase().includes(q)
    );
  }, [allRows, allSearch]);

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
    if (tab === "all") await loadAll();
    else if (tab === "pending") await loadPending();
    else await loadReports();
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

  // ---- PROFILE ARCHIVE / DELETE ----
  async function archiveProfile(profileId: string) {
    if (!requireSecret()) return;

    const ok = confirm(
      "Archive this profile? It disappears from Browse immediately, but nothing is deleted — it can be unarchived later."
    );
    if (!ok) return;

    const res = await fetch("/api/admin/profiles/archive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: secretTrim, profileId }),
    });

    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || "Failed to archive profile");
      return;
    }

    setMsg("Profile archived.");
    if (tab === "all") await loadAll();
    else await loadReports();
  }

  async function unarchiveProfile(profileId: string) {
    if (!requireSecret()) return;

    const res = await fetch("/api/admin/profiles/unarchive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: secretTrim, profileId }),
    });

    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || "Failed to unarchive profile");
      return;
    }

    setMsg("Profile unarchived.");
    if (tab === "all") await loadAll();
    else await loadReports();
  }

  async function deleteProfilePermanently(profileId: string) {
    if (!requireSecret()) return;

    const ok = confirm(
      "Permanently delete this profile? This removes the profile, all its photos, and the underlying image files. This CANNOT be undone."
    );
    if (!ok) return;

    const res = await fetch("/api/admin/profiles/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: secretTrim, profileId }),
    });

    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || "Failed to delete profile");
      return;
    }

    setMsg(data.warning || "Profile permanently deleted.");
    if (tab === "all") await loadAll();
    else await loadReports();
  }

  function withSearchId(fn: (id: string) => void) {
    const id = photoSearchId.trim();
    if (!id) {
      setMsg("Paste a profile ID first.");
      return;
    }
    fn(id);
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

  // ---- PROFILE PREVIEW MODAL ----
  async function openPreview(profileId: string) {
    if (!requireSecret()) return;
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewProfile(null);
    setPreviewPhotos([]);

    const res = await fetch("/api/admin/profiles/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: secretTrim, profileId }),
    });

    const data = await res.json();
    setPreviewLoading(false);

    if (!res.ok) {
      setMsg(data.error || "Failed to load profile.");
      setPreviewOpen(false);
      return;
    }

    setPreviewProfile(data.profile as PreviewProfile);
    setPreviewPhotos((data.photos ?? []) as PreviewPhoto[]);
  }

  function closePreviewModal() {
    setPreviewOpen(false);
    setPreviewProfile(null);
    setPreviewPhotos([]);
    setPreviewLoading(false);
  }

  async function updateStatusFromPreview(status: "approved" | "rejected") {
    if (!previewProfile) return;
    await updateStatus(previewProfile.id, status);
    closePreviewModal();
  }

  return (
    <main className="min-h-screen bg-[#060002]">
      <div className="sticky top-0 z-20 border-b border-white/10 bg-[#060002]/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-lg font-bold text-[#fbecef]">Admin</div>
            <div className="text-xs text-[#8f6b78]">Moderation dashboard</div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              className="text-sm text-[#c9a7b3] hover:text-[#ff5f8f]"
              href="/"
            >
              Home
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8 grid gap-6">
        {/* Top card */}
        <div className="rounded-2xl border border-white/10 bg-[#150109] p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <label className="grid gap-1">
              <span className="text-sm text-[#c9a7b3]">Admin secret</span>
              <input
                className="rounded-xl border border-white/10 bg-[#220413] p-3 text-[#fbecef] outline-none focus:ring-2 focus:ring-[#ff115a]/40"
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
                  else if (tab === "pending") loadPending();
                  else loadAll();
                }}
              >
                Refresh current tab
              </Btn>
              <Btn
                onClick={() => {
                  setRows([]);
                  setReports([]);
                  setAllRows([]);
                  setMsg(null);
                }}
              >
                Clear
              </Btn>
              {loadingPending || loadingReports || loadingAll ? (
                <span className="self-center text-sm text-[#c9a7b3]">Loading…</span>
              ) : null}
            </div>
          </div>

          {msg ? <div className="mt-3 text-sm text-[#ff5f8f]">{msg}</div> : null}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
            {/* Tabs */}
            <div className="flex gap-2">
              <Btn
                onClick={() => setTab("reports")}
                className={tab === "reports" ? "!border-[#ff115a] !bg-[#ff115a] !text-white" : ""}
              >
                Reports
              </Btn>
              <Btn
                onClick={() => setTab("pending")}
                className={tab === "pending" ? "!border-[#ff115a] !bg-[#ff115a] !text-white" : ""}
              >
                Pending
              </Btn>
              <Btn
                onClick={() => {
                  setTab("all");
                  if (allRows.length === 0) loadAll();
                }}
                className={tab === "all" ? "!border-[#ff115a] !bg-[#ff115a] !text-white" : ""}
              >
                All
              </Btn>
            </div>

            {/* Quick profile actions by ID */}
            <div className="flex flex-wrap gap-2 items-center">
              <input
                className="rounded-xl border border-white/10 bg-[#220413] px-3 py-2 text-sm text-[#fbecef] w-[280px] max-w-full placeholder:text-[#8f6b78]"
                placeholder="Profile ID"
                value={photoSearchId}
                onChange={(e) => setPhotoSearchId(e.target.value)}
              />
              <Btn onClick={() => withSearchId(openManagePhotos)}>Open photos</Btn>
              <Btn onClick={() => withSearchId(archiveProfile)}>Archive</Btn>
              <Btn onClick={() => withSearchId(unarchiveProfile)}>Unarchive</Btn>
              <Btn tone="danger" onClick={() => withSearchId(deleteProfilePermanently)}>
                Delete permanently
              </Btn>
            </div>
          </div>
        </div>

        {/* REPORTS TAB */}
        {tab === "reports" ? (
          <div className="rounded-2xl border border-white/10 bg-[#150109] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="grid gap-1">
                <h2 className="text-lg font-bold text-[#fbecef]">Reports Inbox</h2>
                <div className="text-sm text-[#8f6b78]">
                  Review reports and suspend profiles if needed.
                </div>
              </div>

              <div className="flex gap-2">
                <Btn
                  onClick={() => {
                    setReportStatus("open");
                    loadReports("open");
                  }}
                  className={reportStatus === "open" ? "!border-[#ff115a] !bg-[#ff115a] !text-white" : ""}
                >
                  Open
                </Btn>
                <Btn
                  onClick={() => {
                    setReportStatus("closed");
                    loadReports("closed");
                  }}
                  className={reportStatus === "closed" ? "!border-[#ff115a] !bg-[#ff115a] !text-white" : ""}
                >
                  Closed
                </Btn>
                <Btn onClick={() => loadReports()}>Load</Btn>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {reports.length === 0 && !loadingReports ? (
                <div className="text-[#8f6b78]">
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
                  <div key={r.id} className="rounded-2xl border border-white/10 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="grid gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-semibold text-[#fbecef]">{r.reason}</div>
                          <Badge tone={r.status === "open" ? "warn" : "neutral"}>
                            {r.status}
                          </Badge>
                          <span className="text-xs text-[#8f6b78]">
                            • {fmtDate(r.created_at)}
                          </span>
                        </div>

                        {r.details ? (
                          <div className="text-sm text-[#c9a7b3] whitespace-pre-wrap">
                            {r.details}
                          </div>
                        ) : (
                          <div className="text-sm text-[#8f6b78]">
                            No details provided.
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Btn onClick={() => copyText("Profile ID", r.profile_id)}>
                          Copy ID
                        </Btn>
                        {pr ? <Btn onClick={() => openPreview(pr.id)}>Review</Btn> : null}
                        {pr ? (
                          <Link
                            className="underline text-sm text-[#c9a7b3] hover:text-[#ff5f8f]"
                            href={`/profile/${pr.username}`}
                          >
                            View profile
                          </Link>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-3 rounded-xl border border-white/10 p-3">
                      {pr ? (
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-lg overflow-hidden bg-white/5 shrink-0">
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
                            <div className="font-semibold text-[#fbecef] truncate">
                              {pr.display_name} • {pr.age} • {pr.gender}
                            </div>

                            <div className="text-sm text-[#8f6b78] truncate">
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
                        <div className="text-sm text-[#8f6b78]">
                          Profile record not available (maybe deleted).
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {pr && pr.status === "pending" ? (
                        <>
                          <Btn tone="primary" onClick={() => updateStatus(pr.id, "approved")}>
                            Approve
                          </Btn>
                          <Btn tone="danger" onClick={() => updateStatus(pr.id, "rejected")}>
                            Reject
                          </Btn>
                        </>
                      ) : null}

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
                      {pr ? <Btn onClick={() => archiveProfile(pr.id)}>Archive</Btn> : null}
                      {pr ? (
                        <Btn tone="danger" onClick={() => deleteProfilePermanently(pr.id)}>
                          Delete permanently
                        </Btn>
                      ) : null}

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
          <div className="rounded-2xl border border-white/10 bg-[#150109] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="grid gap-1">
                <h2 className="text-lg font-bold text-[#fbecef]">Pending Profiles</h2>
                <div className="text-sm text-[#8f6b78]">
                  Approve or reject submissions.
                </div>
              </div>

              <div className="flex gap-2">
                <Btn onClick={loadPending}>Load</Btn>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {rows.length === 0 && !loadingPending ? (
                <div className="text-[#8f6b78]">
                  No pending profiles (or not loaded yet).
                </div>
              ) : null}

              {rows.map((r) => (
                <div key={r.id} className="rounded-2xl border border-white/10 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-[#fbecef] truncate">
                        {r.display_name} • {r.age} • {r.gender}
                      </div>
                      <div className="text-sm text-[#8f6b78] truncate">
                        {r.city}, {r.area}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge tone="warn">status: pending</Badge>
                        <span className="text-xs text-[#8f6b78]">
                          • {fmtDate(r.created_at)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Btn onClick={() => copyText("Profile ID", r.id)}>Copy ID</Btn>
                      <Btn onClick={() => openPreview(r.id)}>Review</Btn>
                      <Link
                        className="underline text-sm text-[#c9a7b3] hover:text-[#ff5f8f]"
                        href={`/profile/${r.username}`}
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

        {/* ALL PROFILES TAB */}
        {tab === "all" ? (
          <div className="rounded-2xl border border-white/10 bg-[#150109] p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="grid gap-1">
                <h2 className="text-lg font-bold text-[#fbecef]">All Profiles</h2>
                <div className="text-sm text-[#8f6b78]">
                  Every profile, regardless of status. Search by name, username, ID, city, or area.
                </div>
              </div>

              <div className="flex gap-2 items-center">
                <input
                  className="rounded-xl border border-white/10 bg-[#220413] px-3 py-2 text-sm text-[#fbecef] w-[240px] max-w-full placeholder:text-[#8f6b78]"
                  placeholder="Search..."
                  value={allSearch}
                  onChange={(e) => setAllSearch(e.target.value)}
                />
                <Btn onClick={loadAll}>Load</Btn>
              </div>
            </div>

            <div className="mt-4 text-sm text-[#8f6b78]">
              Showing {filteredAllRows.length} of {allRows.length}
            </div>

            <div className="mt-3 grid gap-3">
              {filteredAllRows.length === 0 && !loadingAll ? (
                <div className="text-[#8f6b78]">
                  {allRows.length === 0 ? "No profiles loaded yet." : "No matches for that search."}
                </div>
              ) : null}

              {filteredAllRows.map((row) => {
                const statusTone =
                  row.status === "approved" ? "good" : row.status === "pending" ? "warn" : "bad";
                const activeTone = row.is_active ? "good" : "bad";
                const archived = !!row.deleted_at;

                return (
                  <div key={row.id} className="rounded-2xl border border-white/10 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-[#fbecef] truncate">
                          {row.display_name} • {row.age} • {row.gender}
                        </div>
                        <div className="text-sm text-[#8f6b78] truncate">
                          @{row.username} • {row.city}, {row.area}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge tone={statusTone as any}>status: {row.status}</Badge>
                          <Badge tone={activeTone as any}>
                            active: {row.is_active ? "true" : "false"}
                          </Badge>
                          {archived ? <Badge tone="bad">archived</Badge> : null}
                          {row.is_hidden_by_owner ? <Badge tone="warn">hidden by owner</Badge> : null}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Btn onClick={() => copyText("Profile ID", row.id)}>Copy ID</Btn>
                        <Btn onClick={() => openPreview(row.id)}>Review</Btn>
                        <Link
                          className="underline text-sm text-[#c9a7b3] hover:text-[#ff5f8f]"
                          href={`/profile/${row.username}`}
                        >
                          View
                        </Link>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {row.status === "pending" ? (
                        <>
                          <Btn tone="primary" onClick={() => updateStatus(row.id, "approved")}>
                            Approve
                          </Btn>
                          <Btn tone="danger" onClick={() => updateStatus(row.id, "rejected")}>
                            Reject
                          </Btn>
                        </>
                      ) : null}
                      <Btn onClick={() => openManagePhotos(row.id)}>Manage photos</Btn>
                      {archived ? (
                        <Btn onClick={() => unarchiveProfile(row.id)}>Unarchive</Btn>
                      ) : (
                        <Btn onClick={() => archiveProfile(row.id)}>Archive</Btn>
                      )}
                      <Btn tone="danger" onClick={() => deleteProfilePermanently(row.id)}>
                        Delete permanently
                      </Btn>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      {/* PHOTO MODAL */}
      {photoModalOpen && photoProfileId ? (
        <div className="fixed inset-0 z-50 bg-black/70 grid place-items-center p-4">
          <div className="w-full max-w-4xl rounded-2xl bg-[#150109] border border-white/10 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="grid gap-1">
                <div className="font-bold text-[#fbecef]">Manage Photos</div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-[#8f6b78] font-mono">{photoProfileId}</div>
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

            {photoLoading ? <div className="mt-4 text-sm text-[#c9a7b3]">Loading…</div> : null}

            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {photoRows.map((ph, idx) => (
                <div key={ph.id} className="border border-white/10 rounded-2xl overflow-hidden">
                  <div className="aspect-[4/3] bg-white/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ph.url} alt="photo" className="h-full w-full object-cover" />
                  </div>

                  <div className="p-3 grid gap-2">
                    <div className="text-xs text-[#8f6b78]">
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
              <div className="mt-4 text-[#8f6b78]">No photos found for this profile.</div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* PROFILE PREVIEW MODAL */}
      {previewOpen ? (
        <div className="fixed inset-0 z-50 bg-black/70 grid place-items-center p-4">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-[#150109] border border-white/10 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="font-bold text-[#fbecef]">Review Profile</div>
              <Btn onClick={closePreviewModal}>Close</Btn>
            </div>

            {previewLoading ? <div className="mt-4 text-sm text-[#c9a7b3]">Loading…</div> : null}

            {!previewLoading && previewProfile ? (
              <div className="mt-4 grid gap-4">
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {previewPhotos.length ? (
                    previewPhotos.map((ph) => (
                      <div key={ph.id} className="aspect-[4/3] overflow-hidden rounded-lg bg-white/5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={ph.url} alt="photo" className="h-full w-full object-cover" />
                      </div>
                    ))
                  ) : (
                    <div className="col-span-3 sm:col-span-4 text-sm text-[#8f6b78]">
                      No photos uploaded.
                    </div>
                  )}
                </div>

                <div>
                  <div className="font-semibold text-[#fbecef]">
                    @{previewProfile.username} • {previewProfile.gender}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge
                    tone={
                      previewProfile.status === "approved"
                        ? "good"
                        : previewProfile.status === "pending"
                        ? "warn"
                        : "bad"
                    }
                  >
                    status: {previewProfile.status}
                  </Badge>
                  <Badge tone={previewProfile.is_active ? "good" : "bad"}>
                    active: {previewProfile.is_active ? "true" : "false"}
                  </Badge>
                  {previewProfile.is_hidden_by_owner ? (
                    <Badge tone="warn">hidden by owner</Badge>
                  ) : null}
                  {previewProfile.deleted_at ? <Badge tone="bad">archived</Badge> : null}
                  {previewProfile.status === "rejected" ? (
                    <Badge tone={previewProfile.rejection_count >= 3 ? "bad" : "warn"}>
                      rejected {previewProfile.rejection_count}x
                    </Badge>
                  ) : null}
                </div>

                {/* What changed since the last approved version */}
                <div className="rounded-xl border border-white/10 p-3">
                  <div className="mb-2 text-xs font-bold uppercase tracking-wide text-[#8f6b78]">
                    {previewProfile.approved_snapshot
                      ? "Changes since last approved"
                      : "New submission — nothing approved yet"}
                  </div>

                  <div className="grid gap-3">
                    {SNAPSHOT_FIELDS.map((field) => {
                      const current = String(
                        (previewProfile as unknown as Record<string, unknown>)[field] ?? ""
                      ).trim();
                      const currentDisplay = current || "—";

                      const snapshot = previewProfile.approved_snapshot;
                      const before = snapshot
                        ? String((snapshot as Record<string, unknown>)[field] ?? "").trim()
                        : null;
                      const beforeDisplay = before || "—";
                      const changed = snapshot !== null && before !== current;

                      return (
                        <div key={field} className="grid grid-cols-[110px_1fr] gap-3 text-sm">
                          <div className="text-[#8f6b78]">{SNAPSHOT_FIELD_LABELS[field]}</div>
                          {changed ? (
                            <div>
                              <div className="text-[#8f6b78] line-through">{beforeDisplay}</div>
                              <div className="font-semibold text-[#ff5f8f]">{currentDisplay}</div>
                            </div>
                          ) : (
                            <div className="text-[#c9a7b3]">{currentDisplay}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4">
                  <Btn tone="primary" onClick={() => updateStatusFromPreview("approved")}>
                    {previewProfile.status === "rejected" ? "Approve anyway" : "Approve"}
                  </Btn>
                  <Btn tone="danger" onClick={() => updateStatusFromPreview("rejected")}>
                    Reject
                  </Btn>
                </div>
              </div>
            ) : null}

            {!previewLoading && !previewProfile ? (
              <div className="mt-4 text-sm text-[#8f6b78]">Couldn&apos;t load this profile.</div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* TOAST */}
      {toast ? (
        <div className="fixed bottom-4 right-4 z-[60] rounded-xl border border-white/10 bg-[#150109] px-3 py-2 text-sm text-[#fbecef] shadow">
          {toast}
        </div>
      ) : null}
    </main>
  );
}
