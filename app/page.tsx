import { Button } from "@/components/Button";
import { SiteHeader } from "@/components/SiteHeader";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <SiteHeader />

      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-semibold tracking-tight">
              WildModels
            </h1>
            <p className="mt-3 text-base text-black/70">
              Nigeria-first hookup & dating discovery. Browse profiles as a guest,
              submit your own profile, and get approved fast.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button href="/browse" variant="primary">
                Browse Profiles
              </Button>
              <Button href="/create-profile" variant="outline">
                Create Profile
              </Button>
            </div>

            <p className="mt-6 text-xs text-black/50">
              18+ only. Report & ban tools are coming next.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
