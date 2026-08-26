import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/logoutbutton";
import DeleteProfileButton from "@/components/deleteprofilebutton";
import ChangePasswordForm from "@/components/changepasswordform";

export default async function AccountSettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <a href="/dashboard" className="text-sm text-gray-600 underline">
        ← Back to dashboard
      </a>

      <h1 className="mt-4 text-2xl font-semibold">Account settings</h1>

      <div className="mt-6 rounded-xl border p-5">
        <h2 className="text-lg font-semibold">Email</h2>
        <p className="mt-2 text-sm text-gray-600">{user.email}</p>
      </div>

      <div className="mt-6 rounded-xl border p-5">
        <h2 className="text-lg font-semibold">Change password</h2>
        <div className="mt-3">
          <ChangePasswordForm />
        </div>
      </div>

      <div className="mt-6 rounded-xl border p-5">
        <h2 className="text-lg font-semibold">Session</h2>
        <p className="mt-2 text-sm text-gray-600">
          Log out of WildModels on this device.
        </p>
        <div className="mt-3">
          <LogoutButton />
        </div>
      </div>

      {profile ? (
        <div className="mt-6 rounded-xl border p-5">
          <h2 className="text-lg font-semibold">Danger zone</h2>
          <p className="mt-2 text-sm text-gray-600">
            Deleting your profile hides it immediately. This can&apos;t be
            undone from here.
          </p>
          <div className="mt-3">
            <DeleteProfileButton />
          </div>
        </div>
      ) : null}
    </main>
  );
}
