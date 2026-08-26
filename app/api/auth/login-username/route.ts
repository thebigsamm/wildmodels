import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createRouteHandlerClient } from "@/lib/supabase/server-action";
import { normalizeUsername } from "@/lib/username";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    const normalized = normalizeUsername(String(username ?? ""));

    if (!normalized || !password) {
      return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
    }

    const { data: row } = await supabaseAdmin
      .from("usernames")
      .select("user_id")
      .eq("username", normalized)
      .maybeSingle();

    if (!row) {
      return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
    }

    const { data: userResp, error: userErr } = await supabaseAdmin.auth.admin.getUserById(row.user_id);

    if (userErr || !userResp?.user?.email) {
      return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
    }

    const authSupabase = await createRouteHandlerClient();
    const { error: signInErr } = await authSupabase.auth.signInWithPassword({
      email: userResp.user.email,
      password,
    });

    if (signInErr) {
      return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
