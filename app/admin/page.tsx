"use client";

import { useState } from "react";
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

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function loadPending() {
    setMsg(null);
    if (!secret.trim()) {
      setMsg("Enter admin secret first.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/admin/pending", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: secret.trim() }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setMsg(data.error || "Failed to load pending profiles");
      setRows([]);
      return;
    }

    setRows((data.rows ?? []) as ProfileRow[]);
  }

  async function updateStatus(id: string, status: "approved" | "rejected") {
    setMsg(null);
    if (!secret.trim()) {
      setMsg("Enter admin secret first.");
      return;
    }

    const res = await fetch("/api/admin/update-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: secret.trim(), id, status }),
    });

    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || "Failed");
      return;
    }

    setMsg(`Updated: ${status}`);
    await loadPending();
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

        <div className="mt-3 flex gap-2">
          <button className="border rounded px-3 py-2 hover:bg-gray-50" onClick={loadPending}>
            Load pending
          </button>
          <button className="border rounded px-3 py-2 hover:bg-gray-50" onClick={() => { setRows([]); setMsg(null); }}>
            Clear
          </button>
          {loading ? <span className="self-center">Loading…</span> : null}
        </div>

        {msg ? <div className="mt-3 text-sm">{msg}</div> : null}
      </div>

      <div className="mt-6 grid gap-3">
        {rows.length === 0 && !loading ? (
          <div className="text-gray-600">No pending profiles (or not loaded yet).</div>
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
    </main>
  );
}
