import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { assertAdminSecret } from "@/lib/admin";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { secret } = await req.json();

    const auth = assertAdminSecret(secret);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });

    const { data: requests, error } = await supabaseAdmin
      .from("verification_requests")
      .select("id, user_id, code, photo_path, status, submitted_at")
      .eq("status", "submitted")
      .order("submitted_at", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (!requests || requests.length === 0) {
      return NextResponse.json({ requests: [] });
    }

    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("user_id, username, display_name, photo_url")
      .in(
        "user_id",
        requests.map((r) => r.user_id)
      );

    const byUserId = new Map((profiles ?? []).map((p) => [p.user_id, p]));

    const enriched = await Promise.all(
      requests.map(async (r) => {
        let selfieUrl: string | null = null;

        // Short-lived signed URL - the bucket itself stays private.
        if (r.photo_path) {
          const { data: signed } = await supabaseAdmin.storage
            .from("verification-photos")
            .createSignedUrl(r.photo_path, 60 * 10);
          selfieUrl = signed?.signedUrl ?? null;
        }

        const p = byUserId.get(r.user_id);

        return {
          id: r.id,
          code: r.code,
          status: r.status,
          submitted_at: r.submitted_at,
          selfie_url: selfieUrl,
          username: p?.username ?? null,
          display_name: p?.display_name ?? null,
          profile_photo_url: p?.photo_url ?? null,
        };
      })
    );

    return NextResponse.json({ requests: enriched });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
