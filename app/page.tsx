import { Button } from "@/components/Button";
import { SiteHeader } from "@/components/SiteHeader";
import { Suspense } from "react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#060002] relative overflow-hidden">
      <div className="pointer-events-none absolute -top-64 -right-44 h-[680px] w-[680px] rounded-full bg-[radial-gradient(circle,rgba(255,17,90,0.28),transparent_68%)]" />
      <div className="pointer-events-none absolute -bottom-64 -left-52 h-[640px] w-[640px] rounded-full bg-[radial-gradient(circle,rgba(157,0,255,0.22),transparent_68%)]" />

      <Suspense fallback={<div className="h-14 border-b border-white/10 bg-[#060002]/90 backdrop-blur" />}>
        <SiteHeader />
      </Suspense>

      <div className="relative mx-auto max-w-5xl px-6 py-16">
        <div className="max-w-2xl">
          <h1 className="font-[family-name:var(--font-display)] text-5xl uppercase leading-[0.98] tracking-wide text-[#fbecef]">
            Stop scrolling.
            <br />
            <span className="bg-gradient-to-r from-[#ff115a] to-[#c400ff] bg-clip-text text-transparent">
              Start tonight.
            </span>
          </h1>
          <p className="mt-5 max-w-lg text-base text-[#c9a7b3]">
            Nigeria-first hookup &amp; dating discovery. Browse profiles as a
            guest, submit your own profile, and get approved fast.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/browse" variant="primary">
              Browse Profiles
            </Button>
            <Button href="/create-profile" variant="outline">
              Create Profile
            </Button>
          </div>

          <p className="gradient-text-slide mt-8 text-lg font-bold">
            18+ only.
          </p>
        </div>
      </div>
    </main>
  );
}
