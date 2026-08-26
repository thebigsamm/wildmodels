import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isValidUsername, normalizeUsername } from "@/lib/username";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { userId, username } = await req.json();
    const normalized = normalizeUsername(String(username ?? ""));

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    if (!isValidUsername(normalized)) {
      return NextResponse.json(
        { error: "Username must be 3-20 characters: lowercase letters, numbers, underscore, starting with a letter." },
        { status: 400 }
      );
    }

    // One username per account — reject if this user already claimed one.
    const { data: existing } = await supabaseAdmin
      .from("usernames")
      .select("username")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "This account already has a username." }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("usernames")
      .insert([{ username: normalized, user_id: userId }]);

    if (error) {
      // Unique violation on username = someone else claimed it first.
      if (error.code === "23505") {
        return NextResponse.json({ error: "That username was just taken. Please try another." }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, username: normalized });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
