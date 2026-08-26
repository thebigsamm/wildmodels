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
        className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/20"
      >
        Delete profile
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4">
      <p className="text-sm text-red-300">
        This removes your profile from Browse right away. You&apos;ll be able to
        create a new profile afterward if you want to.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={handleDelete}
          disabled={working}
          className="rounded-full bg-red-500 px-4 py-2 text-sm font-bold text-[#060002] hover:bg-red-400 disabled:opacity-50"
        >
          {working ? "Deleting..." : "Yes, delete my profile"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={working}
          className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-[#fbecef] hover:bg-white/5 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
      {msg ? <p className="mt-2 text-sm text-red-300">{msg}</p> : null}
    </div>
  );
}
