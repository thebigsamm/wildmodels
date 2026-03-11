import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { assertAdminSecret } from "@/lib/admin";

export async function POST(req: Request) {
  const { secret, profileId, url } = await req.json();

  const auth = assertAdminSecret(secret);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });
  if (!profileId || !url) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase.from("profiles").update({ photo_url: url }).eq("id", profileId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}