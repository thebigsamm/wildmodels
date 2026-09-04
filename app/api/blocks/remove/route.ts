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

    const { data: targetProfile, error: findErr } = await supabaseAdmin
      .from("profiles")
      .select("user_id")
      .eq("username", target)
      .maybeSingle();

    if (findErr) {
      return NextResponse.json({ error: findErr.message }, { status: 400 });
    }

    if (!targetProfile) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    // Scoped to this caller's own block, so one user can't clear another's.
    const { error: deleteErr } = await supabaseAdmin
      .from("profile_blocks")
      .delete()
      .eq("blocker_user_id", user.id)
      .eq("blocked_user_id", targetProfile.user_id);

    if (deleteErr) {
      return NextResponse.json({ error: deleteErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
