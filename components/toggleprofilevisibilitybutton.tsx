"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ToggleProfileVisibilityButton({
  initialHidden,
}: {
  initialHidden: boolean;
}) {
  const router = useRouter();
  const [hidden, setHidden] = useState(initialHidden);
  const [working, setWorking] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function toggle() {
    setWorking(true);
    setMsg(null);

    const next = !hidden;

    const res = await fetch("/api/account/profile/visibility", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hidden: next }),
    });

    const data = await res.json();
    setWorking(false);

    if (!res.ok) {
      setMsg(`Error: ${data.error || "Failed to update visibility."}`);
      return;
    }

    setHidden(next);
    router.refresh();
  }

  return (
    <div className="inline-flex flex-col">
      <button
        onClick={toggle}
        disabled={working}
        className="rounded-full border border-white/20 px-4 py-2 text-sm font-bold text-[#fbecef] hover:bg-white/5 disabled:opacity-50"
      >
        {working ? "Updating..." : hidden ? "Show profile" : "Hide profile"}
      </button>
      {msg ? <p className="mt-2 text-sm text-[#ff5f8f]">{msg}</p> : null}
    </div>
  );
}
