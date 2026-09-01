import { NextRequest, NextResponse } from "next/server";
import { resend } from "@/lib/resend";
import { supportRatelimit } from "@/lib/ratelimit";
import { supportNotificationEmail, supportConfirmationEmail } from "@/lib/emails/support";

const CATEGORIES = ["General", "Report a bug", "Account issue", "Profile issue", "Other"];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Honeypot: real users never fill this hidden field. Pretend success
    // without sending anything, so bots don't learn it was caught.
    if (typeof body.website === "string" && body.website.trim() !== "") {
      return NextResponse.json({ ok: true });
    }

    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim();
    const category = String(body.category ?? "").trim();
    const message = String(body.message ?? "").trim();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Please fill in your name, email, and message." }, { status: 400 });
    }

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    if (!CATEGORIES.includes(category)) {
      return NextResponse.json({ error: "Invalid category." }, { status: 400 });
    }

    if (message.length > 4000) {
      return NextResponse.json({ error: "Message is too long (max 4000 characters)." }, { status: 400 });
    }

    const ip = getIp(req);
    const { success } = await supportRatelimit.limit(`support:${ip}`);
    if (!success) {
      return NextResponse.json(
        { error: "Too many messages sent. Please try again later." },
        { status: 429 }
      );
    }

    const notifyTo = process.env.SUPPORT_NOTIFY_EMAIL;
    if (!notifyTo) {
      return NextResponse.json({ error: "Support inbox isn't configured." }, { status: 500 });
    }

    const notification = supportNotificationEmail({ name, email, category, message });
    await resend.emails.send({
      from: "WildModels <no-reply@wildmodels.xyz>",
      to: [notifyTo],
      replyTo: email,
      subject: notification.subject,
      html: notification.html,
    });

    try {
      const confirmation = supportConfirmationEmail({ name });
      await resend.emails.send({
        from: "WildModels <no-reply@wildmodels.xyz>",
        to: [email],
        subject: confirmation.subject,
        html: confirmation.html,
      });
    } catch (confirmErr) {
      console.error("Failed to send support confirmation email:", confirmErr);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
