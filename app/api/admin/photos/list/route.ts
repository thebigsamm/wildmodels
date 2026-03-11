import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { assertAdminSecret } from "@/lib/admin";

export async function POST(req: Request) {
  const { secret, profileId } = await req.json();

  const auth = assertAdminSecret(secret);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });
  if (!profileId) return NextResponse.json({ error: "Missing profileId" }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("profile_photos")
    .select("id, profile_id, url, sort_order, created_at")
    .eq("profile_id", profileId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ photos: data ?? [] });
}