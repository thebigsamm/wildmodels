import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { assertAdminSecret } from "@/lib/admin";

export async function POST(req: Request) {
  const { secret, status = "open" } = await req.json();

  const auth = assertAdminSecret(secret);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Pull reports + enough profile info to act quickly
  const { data, error } = await supabase
    .from("reports")
    .select(`
      id,
      profile_id,
      reason,
      details,
      reporter_ip,
      status,
      created_at,
      closed_at,
      profiles:profile_id (
        id,
        display_name,
        gender,
        age,
        city,
        area,
        photo_url,
        status,
        is_active
      )
    `)
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ reports: data ?? [] });
}