import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { assertAdminSecret } from "@/lib/admin";

export async function POST(req: Request) {
  const { secret, profileId, photoId, direction } = await req.json();
  // direction: "up" | "down"

  const auth = assertAdminSecret(secret);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });

  if (!profileId || !photoId || (direction !== "up" && direction !== "down")) {
    return NextResponse.json({ error: "Missing/invalid fields" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Load ordered list
  const { data: photos, error: listErr } = await supabase
    .from("profile_photos")
    .select("id, sort_order")
    .eq("profile_id", profileId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 });

  const idx = (photos ?? []).findIndex((p) => p.id === photoId);
  if (idx === -1) return NextResponse.json({ error: "Photo not found" }, { status: 404 });

  const swapWith = direction === "up" ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= (photos ?? []).length) {
    return NextResponse.json({ ok: true }); // nothing to do
  }

  const a = photos![idx];
  const b = photos![swapWith];

  // swap sort_order values
  const { error: errA } = await supabase
    .from("profile_photos")
    .update({ sort_order: b.sort_order })
    .eq("id", a.id);

  if (errA) return NextResponse.json({ error: errA.message }, { status: 500 });

  const { error: errB } = await supabase
    .from("profile_photos")
    .update({ sort_order: a.sort_order })
    .eq("id", b.id);

  if (errB) return NextResponse.json({ error: errB.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}