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
    return NextResponse.json({ error: "Missing profileId" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", profileId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
