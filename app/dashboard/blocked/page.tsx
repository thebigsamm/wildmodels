"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";

type BlockedUser = {
  username: string | null;
  display_name: string | null;
  photo_url: string | null;
  blocked_at: string;
};

export default function BlockedUsersPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState<BlockedUser[]>([]);
  const [working, setWorking] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/blocks/list");

    if (res.status === 401) {
      router.replace("/login");
      return;
    }

    const data = await res.json();

    if (!res.ok) {
      setMsg(data.error || "Couldn't load your blocked list.");
      setBlocked([]);
    } else {
      setBlocked((data.blocked ?? []) as BlockedUser[]);
    }

    setLoading(false);
  }, [router]);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      await load();
    })();
  }, [router, supabase, load]);

  async function unblock(username: string) {
    setWorking(username);
    setMsg(null);

    const res = await fetch("/api/blocks/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });

    const data = await res.json();
    setWorking(null);

    if (!res.ok) {
      setMsg(data.error || "Couldn't unblock.");
      return;
    }

    setMsg("Unblocked.");
    await load();
  }

  return (
    <main className="min-h-screen bg-[#060002]">
      <Suspense fallback={<div className="h-14 border-b border-white/10 bg-[#060002]/90 backdrop-blur" />}>
        <SiteHeader />
      </Suspense>

      <div className="mx-auto max-w-2xl px-4 py-10">
        <a href="/dashboard" className="text-sm font-semibold text-[#ff5f8f] hover:text-[#fbecef]">
          ← Back to dashboard
        </a>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl uppercase text-[#fbecef]">
          Blocked Users
        </h1>
        <p className="mt-3 text-sm text-[#c9a7b3]">
          You and anyone here can&rsquo;t see each other on WildModels. Unblock to undo that.
        </p>

        {loading ? (
          <p className="mt-6 text-[#c9a7b3]">Loading...</p>
        ) : blocked.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-[#150109] p-6 text-center">
            <div className="font-bold text-[#fbecef]">You haven&rsquo;t blocked anyone</div>
            <div className="mt-1 text-sm text-[#c9a7b3]">
              You can block someone from their profile page.
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-3">
            {blocked.map((b) => (
              <div
                key={b.username ?? b.blocked_at}
                className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#150109] p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-white/5">
                    {b.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={b.photo_url} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-[#fbecef]">
                      {b.display_name ?? "Deleted profile"}
                    </div>
                    {b.username ? (
                      <div className="truncate text-sm text-[#8f6b78]">@{b.username}</div>
                    ) : null}
                  </div>
                </div>

                {b.username ? (
                  <button
                    onClick={() => unblock(b.username!)}
                    disabled={working === b.username}
                    className="shrink-0 rounded-full border border-white/20 px-4 py-2 text-sm font-bold text-[#fbecef] hover:bg-white/5 disabled:opacity-50"
                  >
                    {working === b.username ? "Unblocking..." : "Unblock"}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        )}

        {msg ? <p className="mt-4 text-sm text-[#ff5f8f]">{msg}</p> : null}
      </div>
    </main>
  );
}
