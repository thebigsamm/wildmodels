import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createRouteHandlerClient } from "@/lib/supabase/server-action";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { hidden } = await req.json();

    if (typeof hidden !== "boolean") {
      return NextResponse.json({ error: "Missing or invalid 'hidden' field." }, { status: 400 });
    }

    const authSupabase = await createRouteHandlerClient();

    const {
      data: { user },
      error: authError,
    } = await authSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ is_hidden_by_owner: hidden })
      .eq("id", profile.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
