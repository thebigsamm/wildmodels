import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfileStatusInfo } from "@/lib/profileStatus";

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
    .select("id, display_name, city, area, status, is_active")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  const statusInfo = profile
    ? getProfileStatusInfo(profile.status, profile.is_active)
    : null;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <a
          href="/dashboard/settings"
          className="rounded-lg border px-4 py-2 text-sm"
        >
          Account settings
        </a>
      </div>
      <p className="mt-2 text-sm text-gray-600">Logged in as: {user.email}</p>

      {!profile ? (
        <div className="mt-8 rounded-xl border p-5">
          <h2 className="text-lg font-semibold">No profile yet</h2>
          <p className="mt-2 text-sm text-gray-600">
            You haven’t created a profile yet.
          </p>
          <a
            href="/create-profile"
            className="mt-4 inline-block rounded-lg bg-black px-4 py-2 text-white"
          >
            Create profile
          </a>
        </div>
      ) : (
        <div className="mt-8 rounded-xl border p-5">
          <h2 className="text-lg font-semibold">{profile.display_name}</h2>
          <p className="mt-2 text-sm text-gray-600">
            {profile.area}, {profile.city}
          </p>

          <div className="mt-4 rounded-lg bg-gray-50 p-3">
            <p className="text-sm font-medium">{statusInfo!.label}</p>
            <p className="mt-1 text-sm text-gray-600">
              {statusInfo!.description}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={`/profile/${profile.id}`}
              className="rounded-lg border px-4 py-2"
            >
              View public profile
            </a>

            <a
              href="/dashboard/profile"
              className="rounded-lg border px-4 py-2"
            >
              Edit profile
            </a>
            <a
              href="/dashboard/photos"
              className="rounded-lg border px-4 py-2"
            >
              Manage photos
            </a>
          </div>
        </div>
      )}
    </main>
  );
}
