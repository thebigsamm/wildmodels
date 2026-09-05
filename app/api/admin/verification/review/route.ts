import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { assertAdminSecret } from "@/lib/admin";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { secret, requestId, decision } = (await req.json()) as {
      secret?: string;
      requestId?: string;
      decision?: "approved" | "rejected";
    };

    const auth = assertAdminSecret(secret);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });

    if (!requestId || (decision !== "approved" && decision !== "rejected")) {
      return NextResponse.json({ error: "Missing requestId/decision." }, { status: 400 });
    }

    const { data: request, error: findErr } = await supabaseAdmin
      .from("verification_requests")
      .select("id, user_id, photo_path")
      .eq("id", requestId)
      .maybeSingle();

    if (findErr) return NextResponse.json({ error: findErr.message }, { status: 400 });
    if (!request) return NextResponse.json({ error: "Request not found." }, { status: 404 });

    if (decision === "approved") {
      const { error: verifyErr } = await supabaseAdmin
        .from("profiles")
        .update({ is_verified: true })
        .eq("user_id", request.user_id);

      if (verifyErr) {
        return NextResponse.json({ error: verifyErr.message }, { status: 400 });
      }
    }

    const { error: updateErr } = await supabaseAdmin
      .from("verification_requests")
      .update({
        status: decision,
        reviewed_at: new Date().toISOString(),
        photo_path: null,
      })
      .eq("id", request.id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 400 });
    }

    // The selfie has served its purpose - don't keep people's verification
    // photos around after the decision is made.
    if (request.photo_path) {
      await supabaseAdmin.storage.from("verification-photos").remove([request.photo_path]);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
