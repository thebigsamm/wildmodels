import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const reportRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 h"), // 10 reports per hour per IP
});

function getIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function POST(req: NextRequest) {
  try {
    const ip = getIp(req);
    const rl = await reportRatelimit.limit(`report:${ip}`);
    if (!rl.success) {
      return NextResponse.json({ error: "Too many reports. Try later." }, { status: 429 });
    }

    const { profileId, reason, details } = (await req.json()) as {
      profileId: string;
      reason: string;
      details?: string;
    };

    if (!profileId || !reason?.trim()) {
      return NextResponse.json({ error: "Missing profileId/reason" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("reports").insert([
      {
        profile_id: profileId,
        reason: reason.trim(),
        details: (details ?? "").trim(),
        reporter_ip: ip,
        status: "open",
      },
    ]);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}