import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getProfileStatusInfo, isLockedOut } from "@/lib/profileStatus";
import { SiteHeader } from "@/components/SiteHeader";
import ToggleProfileVisibilityButton from "@/components/toggleprofilevisibilitybutton";
import { BackButton } from "@/components/BackButton";

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
    .select(
      "id, username, display_name, city, area, status, is_active, is_hidden_by_owner, rejection_count"
    )
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  const statusInfo = profile
    ? getProfileStatusInfo(
        profile.status,
        profile.is_active,
        profile.is_hidden_by_owner,
        profile.rejection_count
      )
    : null;

  const lockedOut = profile ? isLockedOut(profile.status, profile.rejection_count) : false;

  return (
    <main className="min-h-screen bg-[#060002]">
      <Suspense fallback={<div className="h-14 border-b border-white/10 bg-[#060002]/90 backdrop-blur" />}>
        <SiteHeader />
      </Suspense>
      <div className="mx-auto max-w-2xl px-4 py-10">
        <BackButton />
        <div className="mt-4 flex items-center justify-between gap-3">
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
          <div className="mt-8 rounded-2xl border border-white/10 bg-[#150109] p-7">
            <h2 className="text-lg font-bold text-[#fbecef]">No profile yet</h2>
            <p className="mt-3 text-base font-medium text-[#c9a7b3]">
              You haven’t created a profile yet, but you can still{" "}
              <a href="/browse" className="text-[#ff5f8f] underline hover:text-[#fbecef]">
                browse
              </a>{" "}
              and find people you like.
            </p>
            <a
              href="/create-profile"
              className="mt-6 inline-block rounded-full bg-gradient-to-r from-[#ff115a] to-[#c400ff] px-5 py-2.5 font-bold text-[#060002] shadow-[0_0_20px_rgba(255,17,90,0.4)] hover:opacity-90"
            >
              Create profile
            </a>
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-[#ff115a]/25 bg-[#150109] p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-extrabold text-[#fbecef]">{profile.display_name}</h2>
              {profile.is_hidden_by_owner ? (
                <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-300">
                  Hidden from public view
                </span>
              ) : null}
            </div>
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

              {lockedOut ? (
                <a
                  href="/support"
                  className="rounded-full bg-gradient-to-r from-[#ff115a] to-[#c400ff] px-4 py-2 text-sm font-bold text-[#060002] shadow-[0_0_20px_rgba(255,17,90,0.4)] hover:opacity-90"
                >
                  Contact support
                </a>
              ) : (
                <a
                  href="/dashboard/profile"
                  className="rounded-full border border-white/20 px-4 py-2 text-sm font-bold text-[#fbecef] hover:bg-white/5"
                >
                  Edit Profile/Photos
                </a>
              )}

              {profile.status === "approved" ? (
                <ToggleProfileVisibilityButton initialHidden={profile.is_hidden_by_owner} />
              ) : null}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
