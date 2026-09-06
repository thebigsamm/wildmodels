import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { assertAdminSecret } from "@/lib/admin";
import { MAX_REJECTIONS } from "@/lib/profileStatus";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DAYS = 30;

/** Profiles are fetched whole for the demographic breakdowns. Cap it so a
 *  runaway table can't take the admin page down with it. */
const PROFILE_SCAN_LIMIT = 20000;

type ProfileRow = {
  created_at: string;
  status: string;
  is_active: boolean;
  is_hidden_by_owner: boolean;
  is_verified: boolean;
  rejection_count: number;
  first_approved_at: string | null;
  gender: string | null;
  orientation: string | null;
  age: number | null;
  city: string | null;
};

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

/** Zero-filled day series, so a quiet day reads as 0 rather than vanishing. */
function emptySeries(days: number) {
  const out: Record<string, number> = {};
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    out[d.toISOString().slice(0, 10)] = 0;
  }
  return out;
}

function tally(values: (string | null)[]) {
  const out: Record<string, number> = {};
  for (const v of values) {
    const key = v ?? "unknown";
    out[key] = (out[key] ?? 0) + 1;
  }
  return out;
}

function topN(counts: Record<string, number>, n: number) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([label, count]) => ({ label, count }));
}

export async function POST(req: Request) {
  try {
    const { secret } = await req.json();

    const auth = assertAdminSecret(secret);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });

    const since = new Date();
    since.setUTCDate(since.getUTCDate() - (DAYS - 1));
    const sinceIso = since.toISOString().slice(0, 10);

    const [
      accountsCount,
      profileRows,
      accountRows,
      reportsOpen,
      reportsClosed,
      blocksTotal,
      verificationQueue,
      viewsDaily,
      viewsByVerified,
      topProfiles,
    ] = await Promise.all([
      supabaseAdmin.from("usernames").select("*", { count: "exact", head: true }),
      supabaseAdmin
        .from("profiles")
        .select(
          "created_at, status, is_active, is_hidden_by_owner, is_verified, rejection_count, first_approved_at, gender, orientation, age, city"
        )
        .is("deleted_at", null)
        .limit(PROFILE_SCAN_LIMIT),
      supabaseAdmin.from("usernames").select("created_at").gte("created_at", sinceIso),
      supabaseAdmin
        .from("reports")
        .select("*", { count: "exact", head: true })
        .eq("status", "open"),
      supabaseAdmin
        .from("reports")
        .select("*", { count: "exact", head: true })
        .eq("status", "closed"),
      supabaseAdmin.from("profile_blocks").select("*", { count: "exact", head: true }),
      supabaseAdmin
        .from("verification_requests")
        .select("status")
        .in("status", ["pending", "submitted", "approved", "rejected"]),
      supabaseAdmin.rpc("analytics_views_daily", { days: DAYS }),
      supabaseAdmin.rpc("analytics_views_by_verified"),
      supabaseAdmin.rpc("analytics_top_profiles", { limit_count: 10 }),
    ]);

    const profiles = (profileRows.data ?? []) as ProfileRow[];

    const approved = profiles.filter((p) => p.status === "approved");
    const live = approved.filter((p) => p.is_active && !p.is_hidden_by_owner);

    // --- Signups over time -------------------------------------------------
    const accountSeries = emptySeries(DAYS);
    for (const row of (accountRows.data ?? []) as { created_at: string }[]) {
      const k = dayKey(row.created_at);
      if (k in accountSeries) accountSeries[k] += 1;
    }

    const profileSeries = emptySeries(DAYS);
    for (const p of profiles) {
      const k = dayKey(p.created_at);
      if (k in profileSeries) profileSeries[k] += 1;
    }

    const viewSeries = emptySeries(DAYS);
    const revealSeries = emptySeries(DAYS);
    for (const row of (viewsDaily.data ?? []) as {
      day: string;
      views: number;
      contact_reveals: number;
    }[]) {
      const k = dayKey(row.day);
      if (k in viewSeries) {
        viewSeries[k] = Number(row.views ?? 0);
        revealSeries[k] = Number(row.contact_reveals ?? 0);
      }
    }

    const timeline = Object.keys(accountSeries).map((day) => ({
      day,
      accounts: accountSeries[day],
      profiles: profileSeries[day],
      views: viewSeries[day],
      reveals: revealSeries[day],
    }));

    // --- Moderation --------------------------------------------------------
    const reviewed = profiles.filter(
      (p) => p.status === "approved" || p.status === "rejected"
    ).length;

    const turnarounds = approved
      .filter((p) => p.first_approved_at)
      .map(
        (p) =>
          (new Date(p.first_approved_at!).getTime() - new Date(p.created_at).getTime()) /
          3_600_000
      )
      .filter((h) => h >= 0)
      .sort((a, b) => a - b);

    const medianHours = turnarounds.length
      ? turnarounds[Math.floor(turnarounds.length / 2)]
      : null;

    // --- Verification ------------------------------------------------------
    const vrStatuses = ((verificationQueue.data ?? []) as { status: string }[]).map(
      (r) => r.status
    );
    const vrTally = tally(vrStatuses);

    // --- Views -------------------------------------------------------------
    const byVerified = ((viewsByVerified.data ?? []) as {
      is_verified: boolean;
      profiles: number;
      views: number;
      contact_reveals: number;
    }[]).map((r) => ({
      isVerified: !!r.is_verified,
      profiles: Number(r.profiles ?? 0),
      views: Number(r.views ?? 0),
      contactReveals: Number(r.contact_reveals ?? 0),
      viewsPerProfile: Number(r.profiles) ? Number(r.views) / Number(r.profiles) : 0,
    }));

    // The RPCs are the only part that needs a migration, so say plainly when
    // it hasn't been run rather than rendering zeros that look like real data.
    const viewsReady = !viewsDaily.error && !viewsByVerified.error && !topProfiles.error;

    return NextResponse.json({
      viewsReady,
      viewsError: viewsReady ? null : viewsDaily.error?.message ?? "Views tracking not set up yet.",
      totals: {
        accounts: accountsCount.count ?? 0,
        profiles: profiles.length,
        approved: approved.length,
        live: live.length,
        pending: profiles.filter((p) => p.status === "pending").length,
        rejected: profiles.filter((p) => p.status === "rejected").length,
        verified: profiles.filter((p) => p.is_verified).length,
        hiddenByOwner: approved.filter((p) => p.is_hidden_by_owner).length,
        suspended: approved.filter((p) => !p.is_active).length,
      },
      moderation: {
        approvalRate: reviewed ? approved.length / reviewed : null,
        lockedOut: profiles.filter(
          (p) => p.status === "rejected" && p.rejection_count >= MAX_REJECTIONS
        ).length,
        medianHoursToApproval: medianHours,
      },
      verification: {
        verified: profiles.filter((p) => p.is_verified).length,
        awaitingReview: vrTally["submitted"] ?? 0,
        codeIssued: vrTally["pending"] ?? 0,
        approved: vrTally["approved"] ?? 0,
        rejected: vrTally["rejected"] ?? 0,
      },
      demographics: {
        gender: tally(approved.map((p) => p.gender)),
        orientation: tally(approved.map((p) => p.orientation)),
        ageBuckets: (() => {
          const buckets = { "18-24": 0, "25-34": 0, "35-44": 0, "45+": 0 };
          for (const p of approved) {
            const a = p.age ?? 0;
            if (a < 25) buckets["18-24"] += 1;
            else if (a < 35) buckets["25-34"] += 1;
            else if (a < 45) buckets["35-44"] += 1;
            else buckets["45+"] += 1;
          }
          return buckets;
        })(),
        topStates: topN(tally(approved.map((p) => p.city)), 8),
      },
      safety: {
        reportsOpen: reportsOpen.count ?? 0,
        reportsClosed: reportsClosed.count ?? 0,
        blocks: blocksTotal.count ?? 0,
      },
      views: {
        totalViews: Object.values(viewSeries).reduce((a, b) => a + b, 0),
        totalReveals: Object.values(revealSeries).reduce((a, b) => a + b, 0),
        byVerified,
        top: (topProfiles.data ?? []) as {
          username: string;
          display_name: string;
          is_verified: boolean;
          views: number;
          contact_reveals: number;
        }[],
      },
      timeline,
      windowDays: DAYS,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
