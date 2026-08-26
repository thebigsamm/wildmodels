import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getProfileStatusInfo } from "@/lib/profileStatus";
import { SiteHeader } from "@/components/SiteHeader";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, city, area, status, is_active")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  const statusInfo = profile
    ? getProfileStatusInfo(profile.status, profile.is_active)
    : null;

  return (
    <main className="min-h-screen bg-[#060002]">
      <Suspense fallback={<div className="h-14 border-b border-white/10 bg-[#060002]/90 backdrop-blur" />}>
        <SiteHeader />
      </Suspense>
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-[family-name:var(--font-display)] text-3xl uppercase text-[#fbecef]">
            Dashboard
          </h1>
          <a
            href="/dashboard/settings"
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-bold text-[#fbecef] hover:bg-white/5"
          >
            Account settings
          </a>
        </div>
        <p className="mt-2 text-sm text-[#c9a7b3]">Logged in as: {user.email}</p>

        {!profile ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-[#150109] p-5">
            <h2 className="text-lg font-bold text-[#fbecef]">No profile yet</h2>
            <p className="mt-2 text-sm text-[#c9a7b3]">
              You haven’t created a profile yet.
            </p>
            <a
              href="/create-profile"
              className="mt-4 inline-block rounded-full bg-gradient-to-r from-[#ff115a] to-[#c400ff] px-5 py-2.5 font-bold text-[#060002] shadow-[0_0_20px_rgba(255,17,90,0.4)] hover:opacity-90"
            >
              Create profile
            </a>
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-[#ff115a]/25 bg-[#150109] p-5">
            <h2 className="text-lg font-extrabold text-[#fbecef]">{profile.display_name}</h2>
            <p className="mt-2 text-sm text-[#c9a7b3]">
              {profile.area}, {profile.city}
            </p>

            <div className="mt-4 rounded-lg border border-white/10 bg-[#220413] p-3">
              <p className="text-sm font-bold text-[#ff5f8f]">{statusInfo!.label}</p>
              <p className="mt-1 text-sm text-[#a3808c]">
                {statusInfo!.description}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href={`/profile/${profile.username}`}
                className="rounded-full border border-white/20 px-4 py-2 text-sm font-bold text-[#fbecef] hover:bg-white/5"
              >
                View public profile
              </a>

              <a
                href="/dashboard/profile"
                className="rounded-full border border-white/20 px-4 py-2 text-sm font-bold text-[#fbecef] hover:bg-white/5"
              >
                Edit profile
              </a>
              <a
                href="/dashboard/photos"
                className="rounded-full border border-white/20 px-4 py-2 text-sm font-bold text-[#fbecef] hover:bg-white/5"
              >
                Manage photos
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
