import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createRouteHandlerClient } from "@/lib/supabase/server-action";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, photo_url")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    const form = await req.formData();
    const files = form.getAll("photos").filter(Boolean) as File[];

    if (files.length === 0) {
      return NextResponse.json({ error: "Please select at least 1 photo." }, { status: 400 });
    }

    const { data: existingPhotos, error: existingPhotosError } = await supabaseAdmin
      .from("profile_photos")
      .select("id, sort_order")
      .eq("profile_id", profile.id)
      .order("sort_order", { ascending: true });

    if (existingPhotosError) {
      return NextResponse.json({ error: existingPhotosError.message }, { status: 400 });
    }

    const currentCount = existingPhotos?.length ?? 0;

    if (currentCount + files.length > 5) {
      return NextResponse.json(
        { error: `You can only have up to 5 photos total. You currently have ${currentCount}.` },
        { status: 400 }
      );
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

    const startingSortOrder =
      existingPhotos && existingPhotos.length > 0
        ? Math.max(...existingPhotos.map((p) => p.sort_order)) + 1
        : 0;

    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const ext = (f.name.split(".").pop() || "jpg").toLowerCase();
      const filePath = `profiles/${profile.id}/${crypto.randomUUID()}.${ext}`;

      const arrayBuffer = await f.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      const { error: uploadError } = await supabaseAdmin.storage
        .from("profile-photos")
        .upload(filePath, buffer, {
          contentType: f.type,
          upsert: false,
          cacheControl: "3600",
        });

      if (uploadError) {
        return NextResponse.json(
          { error: `Upload failed: ${uploadError.message}` },
          { status: 400 }
        );
      }

      const { data: pub } = supabaseAdmin.storage
        .from("profile-photos")
        .getPublicUrl(filePath);

      uploadedUrls.push(pub.publicUrl);
    }

    const rows = uploadedUrls.map((url, index) => ({
      profile_id: profile.id,
      url,
      sort_order: startingSortOrder + index,
    }));

    const { error: insertError } = await supabaseAdmin
      .from("profile_photos")
      .insert(rows);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    if (!profile.photo_url && uploadedUrls[0]) {
      const { error: mainError } = await supabaseAdmin
        .from("profiles")
        .update({ photo_url: uploadedUrls[0] })
        .eq("id", profile.id);

      if (mainError) {
        return NextResponse.json({ error: mainError.message }, { status: 400 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}