import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isValidUsername, normalizeUsername } from "@/lib/username";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { email, password, username } = (await req.json()) as {
      email?: string;
      password?: string;
      username?: string;
    };

    const cleanEmail = String(email ?? "").trim();
    const cleanPassword = String(password ?? "");
    const normalized = normalizeUsername(String(username ?? ""));

    if (!cleanEmail || !cleanPassword) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    if (!isValidUsername(normalized)) {
      return NextResponse.json(
        {
          error:
            "Username must be 3-20 characters: lowercase letters, numbers, underscore, starting with a letter.",
        },
        { status: 400 }
      );
    }

    const { data: taken, error: takenErr } = await supabaseAdmin
      .from("usernames")
      .select("username")
      .eq("username", normalized)
      .maybeSingle();

    if (takenErr) {
      return NextResponse.json({ error: takenErr.message }, { status: 500 });
    }

    if (taken) {
      return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
    }

    // Sign up with the anon key rather than the admin API, so Supabase sends
    // its normal confirmation email through the configured SMTP.
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error: signUpErr } = await supabaseAuth.auth.signUp({
      email: cleanEmail,
      password: cleanPassword,
    });

    if (signUpErr) {
      return NextResponse.json({ error: signUpErr.message }, { status: 400 });
    }

    const userId = data.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Account created, but no user was returned. Please contact support." },
        { status: 500 }
      );
    }

    // The id comes from Supabase's signUp response, never from the client -
    // that's the whole point of doing this server-side.
    const { error: claimErr } = await supabaseAdmin
      .from("usernames")
      .insert([{ username: normalized, user_id: userId }]);

    if (claimErr) {
      // Roll the account back so the user isn't stranded with an auth account
      // that has no username (which would block profile creation entirely).
      await supabaseAdmin.auth.admin.deleteUser(userId);

      if (claimErr.code === "23505") {
        return NextResponse.json(
          { error: "That username was just taken. Please try another." },
          { status: 409 }
        );
      }

      return NextResponse.json({ error: claimErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, username: normalized });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
