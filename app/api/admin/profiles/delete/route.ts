import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { assertAdminSecret } from "@/lib/admin";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function extractStoragePath(url: string): string | null {
  const marker = "/profile-photos/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

export async function POST(req: Request) {
  const { secret, profileId } = await req.json();

  const auth = assertAdminSecret(secret);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });

  if (!profileId) {
    return NextResponse.json({ error: "Missing profileId" }, { status: 400 });
  }

  const { data: profile, error: profileErr } = await supabaseAdmin
    .from("profiles")
    .select("id, photo_url")
    .eq("id", profileId)
    .maybeSingle();

  if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const { data: photos, error: photosErr } = await supabaseAdmin
    .from("profile_photos")
    .select("id, url")
    .eq("profile_id", profileId);

  if (photosErr) return NextResponse.json({ error: photosErr.message }, { status: 500 });

  // Collect every storage path referenced by this profile (photo_url can
  // point at a file not present in profile_photos, so include both).
  const paths = new Set<string>();
  for (const p of photos ?? []) {
    const path = extractStoragePath(p.url);
    if (path) paths.add(path);
  }
  if (profile.photo_url) {
    const path = extractStoragePath(profile.photo_url);
    if (path) paths.add(path);
  }

  let storageWarning: string | null = null;
  if (paths.size > 0) {
    const { error: storageErr } = await supabaseAdmin.storage
      .from("profile-photos")
      .remove([...paths]);

    if (storageErr) {
      storageWarning = `Profile deleted, but storage cleanup failed: ${storageErr.message}`;
    }
  }

  // Delete photo rows explicitly rather than relying on a FK cascade we
  // haven't verified — this is correct whether or not one exists.
  const { error: deletePhotosErr } = await supabaseAdmin
    .from("profile_photos")
    .delete()
    .eq("profile_id", profileId);

  if (deletePhotosErr) {
    return NextResponse.json({ error: deletePhotosErr.message }, { status: 500 });
  }

  const { error: deleteProfileErr } = await supabaseAdmin
    .from("profiles")
    .delete()
    .eq("id", profileId);

  if (deleteProfileErr) {
    return NextResponse.json({ error: deleteProfileErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, warning: storageWarning });
}
