"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteProfileButton() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [working, setWorking] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleDelete() {
    setWorking(true);
    setMsg(null);

    const res = await fetch("/api/account/profile/delete", { method: "POST" });
    const data = await res.json();

    setWorking(false);

    if (!res.ok) {
      setMsg(`Error: ${data.error || "Delete failed."}`);
      return;
    }

    router.refresh();
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
      >
        Delete profile
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-red-300 bg-red-50 p-4">
      <p className="text-sm text-red-700">
        This removes your profile from Browse right away. You&apos;ll be able to
        create a new profile afterward if you want to.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={handleDelete}
          disabled={working}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {working ? "Deleting..." : "Yes, delete my profile"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={working}
          className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
      {msg ? <p className="mt-2 text-sm text-red-700">{msg}</p> : null}
    </div>
  );
}
