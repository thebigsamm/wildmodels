import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { assertAdminSecret } from "@/lib/admin";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const { secret, profileId } = await req.json();

  const auth = assertAdminSecret(secret);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });

  if (!profileId) {
    return NextResponse.json({ error: "Missing profileId." }, { status: 400 });
  }

  // Uses the service role deliberately: this is the one place admins need to
  // see a profile regardless of status/is_active/is_hidden_by_owner, since
  // the public profile page is intentionally restricted to approved+live
  // profiles only.
  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select(
      "id, username, display_name, gender, orientation, age, city, area, bio, photo_url, whatsapp, telegram, price_short_time, price_overnight, price_weekend, status, is_active, is_hidden_by_owner, deleted_at, created_at, rejection_count, approved_snapshot"
    )
    .eq("id", profileId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!profile) return NextResponse.json({ error: "Profile not found." }, { status: 404 });

  const { data: photos } = await supabaseAdmin
    .from("profile_photos")
    .select("id, url, sort_order")
    .eq("profile_id", profileId)
    .order("sort_order", { ascending: true });

  return NextResponse.json({ profile, photos: photos ?? [] });
}
