import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/logoutbutton";

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
    .maybeSingle();

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-2 text-sm text-gray-600">Logged in as: {user.email}</p>

      <div className="mt-4">
        <LogoutButton />
      </div>

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
          <p className="mt-2 text-sm">
            Status: <span className="font-medium">{profile.status}</span>
          </p>
          <p className="mt-1 text-sm">
            Visibility:{" "}
            <span className="font-medium">
              {profile.is_active ? "Active" : "Hidden"}
            </span>
          </p>

          <div className="mt-4 flex gap-3">
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