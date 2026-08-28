"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type UserState = { email?: string };

export function SideDrawer() {
  const router = useRouter();
  const supabase = createClient();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserState | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;
      setUser(user ? { email: user.email } : null);
      setLoading(false);
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { email: session.user.email } : null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function handleLogout() {
    setOpen(false);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const linkClass = "block rounded-lg px-3 py-2 text-[#fbecef] hover:bg-white/5";
  const sectionLabelClass = "px-3 pt-4 pb-1 text-xs font-bold uppercase tracking-wide text-[#8f6b78]";

  return (
    <>
      <button
        aria-label="Open menu"
        onClick={() => setOpen(true)}
        className="rounded-full border border-white/20 p-2.5 text-[#fbecef] hover:bg-white/5"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M2 4.5H16M2 9H16M2 13.5H16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />

          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] overflow-y-auto border-r border-white/10 bg-[#0d0106] p-4">
            <div className="flex items-center justify-between">
              <div className="bg-gradient-to-r from-[#ff115a] to-[#c400ff] bg-clip-text font-[family-name:var(--font-display)] text-xl tracking-wide text-transparent">
                WILDMODELS
              </div>
              <button
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="rounded-full border border-white/20 px-3 py-1.5 text-sm text-[#fbecef] hover:bg-white/5"
              >
                Close ✕
              </button>
            </div>

            <div className={sectionLabelClass}>Account</div>
            {!loading && user ? (
              <>
                <Link href="/dashboard" className={linkClass} onClick={() => setOpen(false)}>
                  Dashboard
                </Link>
                <button onClick={handleLogout} className={`${linkClass} w-full text-left`}>
                  Log out
                </button>
              </>
            ) : null}
            {!loading && !user ? (
              <>
                <Link href="/login" className={linkClass} onClick={() => setOpen(false)}>
                  Login
                </Link>
                <Link href="/register" className={linkClass} onClick={() => setOpen(false)}>
                  Join free
                </Link>
              </>
            ) : null}

            <div className={sectionLabelClass}>Support</div>
            <Link href="/support" className={linkClass} onClick={() => setOpen(false)}>
              Contact / Support
            </Link>
            <Link href="/reviews" className={linkClass} onClick={() => setOpen(false)}>
              Reviews
            </Link>

            <div className={sectionLabelClass}>Legal</div>
            <Link href="/legal" className={linkClass} onClick={() => setOpen(false)}>
              Legal &amp; Safety
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
}
