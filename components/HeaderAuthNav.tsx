"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type UserState = {
  email?: string;
};

export default function HeaderAuthNav() {
  const router = useRouter();
  const supabase = createClient();

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

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return <div className="text-sm text-gray-500">...</div>;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Link href="/login" className="rounded-lg border px-3 py-2 text-sm">
          Login
        </Link>
        <Link href="/register" className="rounded-lg bg-black px-3 py-2 text-sm text-white">
          Register
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/dashboard" className="rounded-lg border px-3 py-2 text-sm">
        Dashboard
      </Link>
      <button
        onClick={handleLogout}
        className="rounded-lg border px-3 py-2 text-sm"
      >
        Log out
      </button>
    </div>
  );
}