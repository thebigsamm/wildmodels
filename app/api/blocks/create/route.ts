import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createRouteHandlerClient } from "@/lib/supabase/server-action";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const authSupabase = await createRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await authSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { username } = (await req.json()) as { username?: string };
    const target = String(username ?? "").trim();

    if (!target) {
      return NextResponse.json({ error: "Missing username." }, { status: 400 });
    }

    // Resolve username -> user_id server-side; the client never sees ids.
    const { data: targetProfile, error: findErr } = await supabaseAdmin
      .from("profiles")
      .select("user_id")
      .eq("username", target)
      .is("deleted_at", null)
      .maybeSingle();

    if (findErr) {
      return NextResponse.json({ error: findErr.message }, { status: 400 });
    }

    if (!targetProfile) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    if (targetProfile.user_id === user.id) {
      return NextResponse.json({ error: "You can't block yourself." }, { status: 400 });
    }

    const { error: insertErr } = await supabaseAdmin.from("profile_blocks").insert({
      blocker_user_id: user.id,
      blocked_user_id: targetProfile.user_id,
    });

    // Unique constraint - already blocked, treat as success.
    if (insertErr && insertErr.code !== "23505") {
      return NextResponse.json({ error: insertErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
