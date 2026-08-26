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

    const { photoId, direction } = await req.json();

    if (!photoId || (direction !== "up" && direction !== "down")) {
      return NextResponse.json({ error: "Missing/invalid fields" }, { status: 400 });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    // Scoping this lookup to the caller's own profile_id means a photoId
    // belonging to another profile simply won't be found below (idx === -1),
    // so ownership is enforced without a separate check.
    const { data: photos, error: listErr } = await supabaseAdmin
      .from("profile_photos")
      .select("id, sort_order")
      .eq("profile_id", profile.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 });

    const idx = (photos ?? []).findIndex((p) => p.id === photoId);
    if (idx === -1) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    const swapWith = direction === "up" ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= (photos ?? []).length) {
      return NextResponse.json({ ok: true }); // already at the edge, nothing to do
    }

    const a = photos![idx];
    const b = photos![swapWith];

    const { error: errA } = await supabaseAdmin
      .from("profile_photos")
      .update({ sort_order: b.sort_order })
      .eq("id", a.id);

    if (errA) return NextResponse.json({ error: errA.message }, { status: 500 });

    const { error: errB } = await supabaseAdmin
      .from("profile_photos")
      .update({ sort_order: a.sort_order })
      .eq("id", b.id);

    if (errB) return NextResponse.json({ error: errB.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
