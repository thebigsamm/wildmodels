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

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function AdminPage() {
  const [secret, setSecret] = useState("");

  // Pending approvals
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);

  // Reports inbox
  const [reportStatus, setReportStatus] = useState<"open" | "closed">("open");
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  const [msg, setMsg] = useState<string | null>(null);

  const secretTrim = useMemo(() => secret.trim(), [secret]);

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
        alsoReject: isActive === false, // ban also rejects (optional behavior)
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || "Failed to update profile");
      return;
    }

    setMsg(isActive ? "Profile unbanned." : "Profile banned.");
    await loadReports();
  }

  return (
    <main className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <Link className="underline" href="/">Home</Link>
      </div>

      <div className="mt-4 border rounded-xl p-4 max-w-xl">
        <label className="grid gap-1">
          <span className="text-sm">Admin secret</span>
          <input
            className="border rounded p-2"
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Enter your ADMIN_SECRET"
          />
        </label>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className="border rounded px-3 py-2 hover:bg-gray-50"
            onClick={loadPending}
          >
            Load pending
          </button>

          <button
            className="border rounded px-3 py-2 hover:bg-gray-50"
            onClick={() => loadReports()}
          >
            Load reports
          </button>

          <button
            className="border rounded px-3 py-2 hover:bg-gray-50"
            onClick={() => {
              setRows([]);
              setReports([]);
              setMsg(null);
            }}
          >
            Clear
          </button>

          {(loadingPending || loadingReports) ? (
            <span className="self-center">Loading…</span>
          ) : null}
        </div>

        {msg ? <div className="mt-3 text-sm">{msg}</div> : null}
      </div>

      {/* REPORTS INBOX */}
      <section className="mt-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Reports Inbox</h2>

          <div className="flex gap-2">
            <button
              className={`border rounded px-3 py-2 hover:bg-gray-50 ${
                reportStatus === "open" ? "bg-gray-50" : ""
              }`}
              onClick={() => {
                setReportStatus("open");
                loadReports("open");
              }}
            >
              Open
            </button>
            <button
              className={`border rounded px-3 py-2 hover:bg-gray-50 ${
                reportStatus === "closed" ? "bg-gray-50" : ""
              }`}
              onClick={() => {
                setReportStatus("closed");
                loadReports("closed");
              }}
            >
              Closed
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          {reports.length === 0 && !loadingReports ? (
            <div className="text-gray-600">
              No {reportStatus} reports (or not loaded yet).
            </div>
          ) : null}

          {reports.map((r) => {
            const pr = r.profiles;
            return (
              <div key={r.id} className="border rounded-xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="grid gap-1">
                    <div className="font-medium">
                      {r.reason}{" "}
                      <span className="text-sm text-gray-500">
                        • {fmtDate(r.created_at)}
                      </span>
                    </div>
                    {r.details ? (
                      <div className="text-sm text-gray-700 whitespace-pre-wrap">
                        {r.details}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">
                        No details provided.
                      </div>
                    )}
                  </div>

                  <Link className="underline text-sm" href={`/profile/${r.profile_id}`}>
                    View profile
                  </Link>
                </div>

                <div className="mt-3 rounded-lg border p-3">
                  {pr ? (
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {pr.photo_url ? (
                          <img
                            src={pr.photo_url}
                            alt="photo"
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>

                      <div className="min-w-0">
                        <div className="font-medium truncate">
                          {pr.display_name} • {pr.age} • {pr.gender}
                        </div>
                        <div className="text-sm text-gray-600 truncate">
                          {pr.city}, {pr.area} • status: {pr.status} • active:{" "}
                          {String(pr.is_active)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600">
                      Profile record not available (maybe deleted).
                    </div>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {pr ? (
                    pr.is_active ? (
                      <button
                        className="border rounded px-3 py-1 hover:bg-gray-50"
                        onClick={() => setProfileActive(pr.id, false)}
                      >
                        Ban profile
                      </button>
                    ) : (
                      <button
                        className="border rounded px-3 py-1 hover:bg-gray-50"
                        onClick={() => setProfileActive(pr.id, true)}
                      >
                        Unban profile
                      </button>
                    )
                  ) : null}

                  {r.status === "open" ? (
                    <button
                      className="border rounded px-3 py-1 hover:bg-gray-50"
                      onClick={() => closeReport(r.id)}
                    >
                      Close report
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* PENDING APPROVALS */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Pending Profiles</h2>

        <div className="mt-4 grid gap-3">
          {rows.length === 0 && !loadingPending ? (
            <div className="text-gray-600">
              No pending profiles (or not loaded yet).
            </div>
          ) : null}

          {rows.map((r) => (
            <div key={r.id} className="border rounded-xl p-4">
              <div className="font-medium">
                {r.display_name} • {r.age} • {r.gender}
              </div>
              <div className="text-sm text-gray-600">
                {r.city}, {r.area}
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  className="border rounded px-3 py-1 hover:bg-gray-50"
                  onClick={() => updateStatus(r.id, "approved")}
                >
                  Approve
                </button>
                <button
                  className="border rounded px-3 py-1 hover:bg-gray-50"
                  onClick={() => updateStatus(r.id, "rejected")}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}