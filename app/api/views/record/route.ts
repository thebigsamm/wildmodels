import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createRouteHandlerClient } from "@/lib/supabase/server-action";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const EVENTS = ["view", "contact_reveal"] as const;
type ViewEvent = (typeof EVENTS)[number];

/**
 * Identify a logged-out viewer without keeping their IP. The day is mixed in
 * so the value rotates every 24h, and the salt means the hash can't be
 * recomputed from an IP by anyone who only has the table.
 */
function hashGuest(ip: string, day: string) {
  const salt = process.env.VIEW_HASH_SALT ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return createHash("sha256").update(`${ip}|${day}|${salt}`).digest("hex");
}

function clientIp(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: NextRequest) {
  // Analytics must never break the page it's measuring, so every failure path
  // below returns ok rather than an error the profile page would have to
  // handle. Nothing here is worth showing a visitor.
  try {
    const { username, event } = (await req.json()) as {
      username?: string;
      event?: string;
    };

    if (!username || !EVENTS.includes(event as ViewEvent)) {
      return NextResponse.json({ ok: true });
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, user_id")
      .eq("username", username)
      .eq("status", "approved")
      .eq("is_active", true)
      .eq("is_hidden_by_owner", false)
      .is("deleted_at", null)
      .maybeSingle();

    if (!profile) return NextResponse.json({ ok: true });

    const authSupabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await authSupabase.auth.getUser();

    // Looking at your own profile isn't a view.
    if (user && user.id === profile.user_id) {
      return NextResponse.json({ ok: true });
    }

    // This route uses the service role, which bypasses the RLS policy that
    // normally hides blocked profiles - so the block check has to happen here
    // explicitly, or blocks would still show up in the owner's view count.
    if (user) {
      const { data: block } = await supabaseAdmin
        .from("profile_blocks")
        .select("id")
        .or(
          `and(blocker_user_id.eq.${user.id},blocked_user_id.eq.${profile.user_id}),` +
            `and(blocker_user_id.eq.${profile.user_id},blocked_user_id.eq.${user.id})`
        )
        .limit(1)
        .maybeSingle();

      if (block) return NextResponse.json({ ok: true });
    }

    const day = new Date().toISOString().slice(0, 10);

    // A duplicate here is the expected case, not a failure: the unique index
    // on (profile_id, event, day, viewer) is what stops refreshes inflating
    // the count. It's an expression index, so PostgREST can't target it with
    // upsert - inserting and dropping the 23505 is the way to do this.
    await supabaseAdmin.from("profile_views").insert({
      profile_id: profile.id,
      viewer_user_id: user?.id ?? null,
      viewer_hash: user ? null : hashGuest(clientIp(req), day),
      event,
      day,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
