import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ratelimit } from "@/lib/ratelimit";

export async function POST(req: Request) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";

    const { success } = await ratelimit.limit(`reports:${ip}`);
    if (!success) {
      return NextResponse.json(
        { error: "Too many reports. Try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { profileId, reason, details } = body ?? {};

    if (!profileId || !reason) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase.from("reports").insert({
      profile_id: profileId,
      reason,
      details: details?.slice(0, 500) ?? null,
      reporter_ip: ip,
      status: "open",
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}