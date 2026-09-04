import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createRouteHandlerClient } from "@/lib/supabase/server-action";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const authSupabase = await createRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await authSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: blocks, error: blocksErr } = await supabaseAdmin
      .from("profile_blocks")
      .select("blocked_user_id, created_at")
      .eq("blocker_user_id", user.id)
      .order("created_at", { ascending: false });

    if (blocksErr) {
      return NextResponse.json({ error: blocksErr.message }, { status: 400 });
    }

    if (!blocks || blocks.length === 0) {
      return NextResponse.json({ blocked: [] });
    }

    // Blocked profiles are invisible to this user under RLS, so the lookup
    // runs with the service role. Only username/display_name go back.
    const { data: profiles, error: profilesErr } = await supabaseAdmin
      .from("profiles")
      .select("user_id, username, display_name, photo_url")
      .in(
        "user_id",
        blocks.map((b) => b.blocked_user_id)
      );

    if (profilesErr) {
      return NextResponse.json({ error: profilesErr.message }, { status: 400 });
    }

    const byUserId = new Map((profiles ?? []).map((p) => [p.user_id, p]));

    const blocked = blocks.map((b) => {
      const p = byUserId.get(b.blocked_user_id);
      return {
        username: p?.username ?? null,
        display_name: p?.display_name ?? null,
        photo_url: p?.photo_url ?? null,
        blocked_at: b.created_at,
      };
    });

    return NextResponse.json({ blocked });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
