import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { assertAdminSecret } from "@/lib/admin";

function tryExtractStoragePath(publicUrl: string) {
  // public URL pattern usually contains "/storage/v1/object/public/<bucket>/<path>"
  const marker = "/storage/v1/object/public/profile-photos/";
  const i = publicUrl.indexOf(marker);
  if (i === -1) return null;
  return publicUrl.slice(i + marker.length);
}

export async function POST(req: Request) {
  const { secret, profileId, photoId, url, deleteFromStorage = false } = await req.json();

  const auth = assertAdminSecret(secret);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });
  if (!profileId || !photoId) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Remove row
  const { error: delErr } = await supabase
    .from("profile_photos")
    .delete()
    .eq("id", photoId)
    .eq("profile_id", profileId);

  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  // Optional: delete from storage too
  if (deleteFromStorage && url) {
    const path = tryExtractStoragePath(url);
    if (path) {
      await supabase.storage.from("profile-photos").remove([path]);
    }
  }

  // If the deleted photo was the main photo_url, clear it or set to next photo
  // (simple version: set to next available photo if any)
  const { data: remaining } = await supabase
    .from("profile_photos")
    .select("url")
    .eq("profile_id", profileId)
    .order("sort_order", { ascending: true })
    .limit(1);

  const nextMain = remaining?.[0]?.url ?? null;
  await supabase.from("profiles").update({ photo_url: nextMain }).eq("id", profileId);

  return NextResponse.json({ ok: true });
}