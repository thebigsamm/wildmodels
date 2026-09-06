import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createRouteHandlerClient } from "@/lib/supabase/server-action";
import { resend } from "@/lib/resend";
import { verificationSubmittedEmail } from "@/lib/emails/verification";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MAX_BYTES = 5 * 1024 * 1024;

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

    const form = await req.formData();
    const file = form.get("photo") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Please attach a photo." }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed." }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Photo must be 5MB max." }, { status: 400 });
    }

    const { data: request, error: reqErr } = await supabaseAdmin
      .from("verification_requests")
      .select("id, photo_path, status")
      .eq("user_id", user.id)
      .in("status", ["pending", "submitted"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (reqErr) {
      return NextResponse.json({ error: reqErr.message }, { status: 400 });
    }

    if (!request) {
      return NextResponse.json(
        { error: "Start a verification request first." },
        { status: 400 }
      );
    }

    // The filename comes from the client, so strip it down to a plain
    // extension rather than letting it shape the storage path.
    const rawExt = (file.name.split(".").pop() || "").toLowerCase();
    const ext = /^[a-z0-9]{1,5}$/.test(rawExt) ? rawExt : "jpg";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

    const buffer = new Uint8Array(await file.arrayBuffer());

    // Private bucket - never publicly readable. Admins view it through a
    // short-lived signed URL.
    const { error: upErr } = await supabaseAdmin.storage
      .from("verification-photos")
      .upload(path, buffer, { contentType: file.type, upsert: false });

    if (upErr) {
      return NextResponse.json({ error: `Upload failed: ${upErr.message}` }, { status: 400 });
    }

    // Replacing an earlier attempt - drop the old file rather than orphaning it.
    if (request.photo_path) {
      await supabaseAdmin.storage.from("verification-photos").remove([request.photo_path]);
    }

    const { error: updateErr } = await supabaseAdmin
      .from("verification_requests")
      .update({
        photo_path: path,
        status: "submitted",
        submitted_at: new Date().toISOString(),
      })
      .eq("id", request.id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 400 });
    }

    // Best effort - a failed receipt email shouldn't fail the upload the user
    // just made.
    try {
      if (user.email) {
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("display_name")
          .eq("user_id", user.id)
          .is("deleted_at", null)
          .maybeSingle();

        const { subject, html } = verificationSubmittedEmail({
          displayName: profile?.display_name ?? "",
        });

        await resend.emails.send({
          from: "WildModels <no-reply@wildmodels.xyz>",
          to: [user.email],
          subject,
          html,
        });
      }
    } catch (emailErr) {
      console.error("Failed to send verification receipt email:", emailErr);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
