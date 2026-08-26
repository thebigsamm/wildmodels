import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/logoutbutton";
import DeleteProfileButton from "@/components/deleteprofilebutton";
import ChangePasswordForm from "@/components/changepasswordform";
import { SiteHeader } from "@/components/SiteHeader";

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
    <main className="min-h-screen bg-[#060002]">
      <Suspense fallback={<div className="h-14 border-b border-white/10 bg-[#060002]/90 backdrop-blur" />}>
        <SiteHeader />
      </Suspense>
      <div className="mx-auto max-w-2xl px-4 py-10">
      <a href="/dashboard" className="text-sm font-semibold text-[#ff5f8f] hover:text-[#fbecef]">
        ← Back to dashboard
      </a>

      <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl uppercase text-[#fbecef]">
        Account settings
      </h1>

      <div className="mt-6 rounded-2xl border border-white/10 bg-[#150109] p-5">
        <h2 className="text-lg font-bold text-[#fbecef]">Email</h2>
        <p className="mt-2 text-sm text-[#c9a7b3]">{user.email}</p>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-[#150109] p-5">
        <h2 className="text-lg font-bold text-[#fbecef]">Change password</h2>
        <div className="mt-3">
          <ChangePasswordForm />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-[#150109] p-5">
        <h2 className="text-lg font-bold text-[#fbecef]">Session</h2>
        <p className="mt-2 text-sm text-[#c9a7b3]">
          Log out of WildModels on this device.
        </p>
        <div className="mt-3">
          <LogoutButton />
        </div>
      </div>

      {profile ? (
        <div className="mt-6 rounded-2xl border border-red-500/20 bg-[#150109] p-5">
          <h2 className="text-lg font-bold text-red-300">Danger zone</h2>
          <p className="mt-2 text-sm text-[#c9a7b3]">
            Deleting your profile hides it immediately. This can&apos;t be
            undone from here.
          </p>
          <div className="mt-3">
            <DeleteProfileButton />
          </div>
        </div>
      ) : null}
      </div>
    </main>
  );
}
