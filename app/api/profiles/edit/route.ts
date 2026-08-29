import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAllowedNgState } from "@/lib/ngStates";
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

    const body = await req.json();

    const display_name = String(body.display_name ?? "").trim();
    const orientation = String(body.orientation ?? "").trim();
    const age = Number(body.age ?? 0);
    const city = String(body.city ?? "").trim();
    const area = String(body.area ?? "").trim();
    const bio = String(body.bio ?? "").trim();
    const whatsapp = String(body.whatsapp ?? "").trim() || null;
    const telegram = String(body.telegram ?? "").trim() || null;

    if (!isAllowedNgState(city)) {
      return NextResponse.json({ error: "Invalid state selected." }, { status: 400 });
    }

    if (!display_name || !city || !area) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    if (!["straight", "gay", "bisexual"].includes(orientation)) {
      return NextResponse.json({ error: "Invalid preference." }, { status: 400 });
    }

    if (!Number.isFinite(age) || age < 18 || age > 99) {
      return NextResponse.json({ error: "Invalid age (18+)." }, { status: 400 });
    }

    // Look up the caller's own profile server-side — never trust a client-supplied id.
    const { data: profile, error: findErr } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (findErr) {
      return NextResponse.json({ error: findErr.message }, { status: 400 });
    }

    if (!profile) {
      return NextResponse.json({ error: "No profile found." }, { status: 404 });
    }

    // Edits always drop back to pending — an admin has to re-approve before the
    // updated content goes public again, so approval can't be reused to slip
    // unvetted changes past moderation.
    const { error: updateErr } = await supabaseAdmin
      .from("profiles")
      .update({
        display_name,
        orientation,
        age,
        city,
        area,
        bio,
        whatsapp,
        telegram,
        status: "pending",
      })
      .eq("id", profile.id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
