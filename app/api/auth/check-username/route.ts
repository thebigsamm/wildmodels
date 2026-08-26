import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isValidUsername } from "@/lib/username";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json();
    const normalized = String(username ?? "").trim().toLowerCase();

    if (!isValidUsername(normalized)) {
      return NextResponse.json({ available: false, error: "Invalid username." });
    }

    const { data, error } = await supabaseAdmin
      .from("usernames")
      .select("username")
      .eq("username", normalized)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ available: !data });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
