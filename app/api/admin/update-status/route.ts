import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resend } from "@/lib/resend";
import { approvedEmail, rejectedEmail } from "@/lib/emails/profileStatus";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { secret, id, status } = body as {
      secret: string;
      id: string;
      status: "approved" | "rejected" | "pending";
    };

    if (!secret || secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!id || !status) {
      return NextResponse.json({ error: "Missing id/status" }, { status: 400 });
    }

    const { data: profile, error: fetchErr } = await supabaseAdmin
      .from("profiles")
      .select("id, user_id, username, display_name, status, first_approved_at, rejection_count")
      .eq("id", id)
      .maybeSingle();

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 400 });
    }

    if (!profile) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    const previousStatus = profile.status;
    // If this profile has ever been approved before, any subsequent
    // approval/rejection is for an edit, not the original submission.
    const isEdit = !!profile.first_approved_at;

    const update: {
      status: typeof status;
      first_approved_at?: string;
      rejection_count?: number;
    } = { status };

    if (status === "approved") {
      if (!isEdit) update.first_approved_at = new Date().toISOString();
      // A fresh approval clears past rejections - they've since produced an
      // acceptable profile, so a future edit shouldn't inherit an old count.
      update.rejection_count = 0;
    }

    let newRejectionCount = profile.rejection_count;
    if (status === "rejected") {
      newRejectionCount = profile.rejection_count + 1;
      update.rejection_count = newRejectionCount;
    }

    const { error } = await supabaseAdmin
      .from("profiles")
      .update(update)
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Notify the owner on an actual status change to approved/rejected. Best
    // effort - a failed notification email should never fail the underlying
    // moderation action.
    if (status !== previousStatus && (status === "approved" || status === "rejected")) {
      try {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(
          profile.user_id
        );
        const email = authUser?.user?.email;

        if (email) {
          const { subject, html } =
            status === "approved"
              ? approvedEmail({
                  displayName: profile.display_name,
                  username: profile.username,
                  isEdit,
                })
              : rejectedEmail({
                  displayName: profile.display_name,
                  isEdit,
                  rejectionCount: newRejectionCount,
                });

          await resend.emails.send({
            from: "WildModels <no-reply@wildmodels.xyz>",
            to: [email],
            subject,
            html,
          });
        }
      } catch (emailErr) {
        console.error("Failed to send status notification email:", emailErr);
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
