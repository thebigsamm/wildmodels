import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createProfileRatelimit } from "@/lib/ratelimit";
import { isAllowedNgState } from "@/lib/ngStates";
import { createRouteHandlerClient } from "@/lib/supabase/server-action";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function POST(req: NextRequest) {
  try {
    // 1) Require logged-in user
    const authSupabase = await createRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await authSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2) Rate limit
    const ip = getIp(req);
    const { success } = await createProfileRatelimit.limit(`create-profile:${ip}`);
    if (!success) {
      return NextResponse.json(
        { error: "Too many submissions. Try again later." },
        { status: 429 }
      );
    }

    // 3) Block duplicate profile for same account
    const { data: existingProfile, error: existingProfileError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingProfileError) {
      return NextResponse.json(
        { error: existingProfileError.message },
        { status: 400 }
      );
    }

    if (existingProfile) {
      return NextResponse.json(
        { error: "You already have a profile." },
        { status: 400 }
      );
    }

    // 4) Parse form
    const form = await req.formData();

    const display_name = String(form.get("display_name") ?? "").trim();
    const gender = String(form.get("gender") ?? "").trim();
    const age = Number(form.get("age") ?? 0);
    const city = String(form.get("city") ?? "").trim();
    const area = String(form.get("area") ?? "").trim();
    const bio = String(form.get("bio") ?? "").trim();
    const whatsapp = String(form.get("whatsapp") ?? "").trim() || null;
    const telegram = String(form.get("telegram") ?? "").trim() || null;

    if (!isAllowedNgState(city)) {
      return NextResponse.json(
        { error: "Invalid state selected." },
        { status: 400 }
      );
    }

    if (!display_name || !city || !area) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    if (!["female", "male", "nonbinary"].includes(gender)) {
      return NextResponse.json({ error: "Invalid gender." }, { status: 400 });
    }

    if (!Number.isFinite(age) || age < 18 || age > 99) {
      return NextResponse.json(
        { error: "Invalid age (18+)." },
        { status: 400 }
      );
    }

    // 5) Collect files (up to 5)
    const files = form.getAll("photos").filter(Boolean) as File[];

    if (files.length === 0) {
      return NextResponse.json(
        { error: "Please upload at least 1 photo." },
        { status: 400 }
      );
    }

    if (files.length > 5) {
      return NextResponse.json({ error: "Max 5 photos." }, { status: 400 });
    }

    let totalBytes = 0;
    for (const f of files) {
      totalBytes += f.size;

      if (f.size > 2 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Each photo must be 2MB max." },
          { status: 400 }
        );
      }

      if (!f.type.startsWith("image/")) {
        return NextResponse.json(
          { error: "Only image files are allowed." },
          { status: 400 }
        );
      }
    }

    if (totalBytes > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Total upload must be 10MB max." },
        { status: 400 }
      );
    }

    // 6) Create profile first (pending)
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .insert([
        {
          user_id: user.id,
          display_name,
          gender,
          age,
          city,
          area,
          bio,
          whatsapp,
          telegram,
          is_active: true,
          status: "pending",
        },
      ])
      .select("id")
      .single();

    if (profileErr || !profile?.id) {
      return NextResponse.json(
        { error: profileErr?.message ?? "Failed to create profile." },
        { status: 400 }
      );
    }

    const profileId = profile.id as string;

    // 7) Upload images to Storage
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const ext = (f.name.split(".").pop() || "jpg").toLowerCase();
      const filePath = `profiles/${profileId}/${crypto.randomUUID()}.${ext}`;

      const arrayBuffer = await f.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      const { error: upErr } = await supabaseAdmin.storage
        .from("profile-photos")
        .upload(filePath, buffer, {
          contentType: f.type,
          upsert: false,
          cacheControl: "3600",
        });

      if (upErr) {
        return NextResponse.json(
          { error: `Upload failed: ${upErr.message}` },
          { status: 400 }
        );
      }

      const { data: pub } = supabaseAdmin.storage
        .from("profile-photos")
        .getPublicUrl(filePath);

      uploadedUrls.push(pub.publicUrl);
    }

    // 8) Save main photo_url on profiles
    const mainUrl = uploadedUrls[0] ?? null;

    const { error: mainErr } = await supabaseAdmin
      .from("profiles")
      .update({ photo_url: mainUrl })
      .eq("id", profileId);

    if (mainErr) {
      return NextResponse.json({ error: mainErr.message }, { status: 400 });
    }

    // 9) Save all images to profile_photos
    const rows = uploadedUrls.map((url, idx) => ({
      profile_id: profileId,
      url,
      sort_order: idx,
    }));

    const { error: photosErr } = await supabaseAdmin
      .from("profile_photos")
      .insert(rows);

    if (photosErr) {
      return NextResponse.json({ error: photosErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, profileId });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}