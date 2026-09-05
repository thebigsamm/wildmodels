import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createRouteHandlerClient } from "@/lib/supabase/server-action";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// No 0/O/1/I - these get handwritten and then read back off a photo.
const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function generateCode(length = 6) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes)
    .map((b) => CODE_ALPHABET[b % CODE_ALPHABET.length])
    .join("");
}

export async function POST() {
  try {
    const authSupabase = await createRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await authSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, is_verified")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json(
        { error: "Create your profile before requesting verification." },
        { status: 400 }
      );
    }

    if (profile.is_verified) {
      return NextResponse.json({ error: "You're already verified." }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin
      .from("verification_requests")
      .select("id, code, status")
      .eq("user_id", user.id)
      .in("status", ["pending", "submitted"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Reuse an in-flight request rather than stacking up codes.
    if (existing) {
      return NextResponse.json({ ok: true, code: existing.code, status: existing.status });
    }

    const code = generateCode();

    const { error: insertErr } = await supabaseAdmin
      .from("verification_requests")
      .insert({ user_id: user.id, code, status: "pending" });

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, code, status: "pending" });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
