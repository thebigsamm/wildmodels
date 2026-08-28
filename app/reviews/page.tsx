import { SiteHeader } from "@/components/SiteHeader";
import { Suspense } from "react";

export default function ReviewsPage() {
  return (
    <main className="min-h-screen bg-[#060002]">
      <Suspense fallback={<div className="h-14 border-b border-white/10 bg-[#060002]/90 backdrop-blur" />}>
        <SiteHeader />
      </Suspense>

      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-[family-name:var(--font-display)] text-3xl uppercase text-[#fbecef]">
          Reviews
        </h1>
        <p className="mt-4 text-[#c9a7b3]">
          Reviews are coming soon.
        </p>
      </div>
    </main>
  );
}
