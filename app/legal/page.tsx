import { SiteHeader } from "@/components/SiteHeader";
import { Suspense } from "react";

const LAST_UPDATED = "August 31, 2026";

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="font-[family-name:var(--font-display)] text-2xl uppercase tracking-wide text-[#fbecef]">
        {title}
      </h2>
      <div className="mt-4 grid gap-4 text-[15px] leading-relaxed text-[#c9a7b3]">
        {children}
      </div>
    </section>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-2 font-bold text-[#fbecef]">{children}</h3>;
}

function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="grid gap-2 pl-5 text-[#c9a7b3]" style={{ listStyleType: "disc" }}>
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export default function LegalPage() {
  return (
    <main className="min-h-screen bg-[#060002]">
      <Suspense fallback={<div className="h-14 border-b border-white/10 bg-[#060002]/90 backdrop-blur" />}>
        <SiteHeader />
      </Suspense>

      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-[family-name:var(--font-display)] text-4xl uppercase text-[#fbecef]">
          Legal &amp; Safety
        </h1>
        <p className="mt-2 text-sm text-[#8f6b78]">Last updated {LAST_UPDATED}</p>

        <div className="mt-6 rounded-2xl border border-[#ff115a]/25 bg-[#150109] p-5 text-sm leading-relaxed text-[#c9a7b3]">
          <p>
            This page is a plain-language description of how WildModels actually works &mdash;
            written to be genuinely useful, not just filler. It is <span className="font-bold text-[#fbecef]">not</span> a
            substitute for advice from a qualified lawyer, and hasn&rsquo;t been reviewed by one. If
            you&rsquo;re relying on this for a business or compliance decision, get that review
            done.
          </p>
        </div>

        {/* Table of contents */}
        <nav className="mt-8 flex flex-wrap gap-3">
          <a
            href="#terms"
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-bold text-[#fbecef] hover:bg-white/5"
          >
            Terms of Service
          </a>
          <a
            href="#privacy"
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-bold text-[#fbecef] hover:bg-white/5"
          >
            Privacy Policy
          </a>
          <a
            href="#safety"
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-bold text-[#fbecef] hover:bg-white/5"
          >
            Safety Guidelines
          </a>
        </nav>

        <div className="mt-12 grid gap-14">
          {/* ---------------- TERMS OF SERVICE ---------------- */}
          <Section id="terms" title="Terms of Service">
            <p>
              These terms cover your use of WildModels (&ldquo;the platform&rdquo;, &ldquo;we&rdquo;,
              &ldquo;us&rdquo;). By creating an account, browsing, or submitting a profile, you agree
              to them.
            </p>

            <SubHeading>1. You must be 18 or older</SubHeading>
            <p>
              WildModels is strictly for adults. By using the platform &mdash; browsing, registering,
              or submitting a profile &mdash; you&rsquo;re confirming you&rsquo;re at least 18 years
              old. Profiles or accounts found to belong to a minor are removed immediately and
              permanently; report suspected underage users using the &ldquo;Underage&rdquo; option on
              any profile.
            </p>

            <SubHeading>2. Your account</SubHeading>
            <p>
              You&rsquo;re responsible for the username and password you register with, and for
              anything that happens under your account. Each account may hold one public profile at
              a time.
            </p>

            <SubHeading>3. Profile review</SubHeading>
            <p>
              Every profile goes through admin review before it&rsquo;s visible to other users &mdash;
              this applies to new submissions and to edits of an existing profile. While a submission
              or edit is pending, it isn&rsquo;t shown on Browse or on your public profile page. We
              may reject a submission or edit, or suspend or remove a profile afterward, at our
              discretion &mdash; most commonly for the reasons in the section below.
            </p>

            <SubHeading>4. What&rsquo;s not allowed</SubHeading>
            <List
              items={[
                "Impersonating someone else, or using photos you don't have the right to use",
                "Fake, misleading, or spam profiles",
                "Scam or financial-solicitation attempts",
                "Harassment, threats, or abusive behavior toward other users",
                "Anything involving a minor, in any form",
                "Illegal goods, services, or activity of any kind",
              ]}
            />
            <p>
              Any of these can get a profile rejected, suspended, or permanently removed, and may be
              reported to the appropriate authorities where required by law.
            </p>

            <SubHeading>5. Contact info you share</SubHeading>
            <p>
              If you add a WhatsApp or Telegram handle to your profile, other users can reveal and
              contact you directly through it. That exchange happens outside WildModels, entirely
              between you and them &mdash; we don&rsquo;t monitor, store, or take responsibility for
              those conversations.
            </p>

            <SubHeading>6. No guarantee about other users</SubHeading>
            <p>
              We review submissions before they go public, but we can&rsquo;t verify every claim a
              user makes about themselves, and we don&rsquo;t run background checks. You&rsquo;re
              responsible for using your own judgment when deciding whether to talk to or meet
              someone &mdash; see the Safety Guidelines below.
            </p>

            <SubHeading>7. Reporting</SubHeading>
            <p>
              Every profile has a &ldquo;Report&rdquo; option. We review reports and can suspend or
              remove a profile as a result, independent of the normal edit-review process.
            </p>

            <SubHeading>8. Ending your account</SubHeading>
            <p>
              You can delete your own profile at any time from Account Settings. We may suspend or
              remove a profile or account that violates these terms, without prior notice.
            </p>

            <SubHeading>9. &ldquo;As is&rdquo;, limitation of liability</SubHeading>
            <p>
              WildModels is provided as-is, without warranties of any kind. To the fullest extent
              the law allows, we&rsquo;re not liable for interactions, meetings, or disputes between
              users, or for content users submit.
            </p>

            <SubHeading>10. Changes</SubHeading>
            <p>
              We may update these terms as the platform changes. Material changes will update the
              &ldquo;Last updated&rdquo; date above.
            </p>
          </Section>

          {/* ---------------- PRIVACY POLICY ---------------- */}
          <Section id="privacy" title="Privacy Policy">
            <p>What we collect, why, and what you can do about it.</p>

            <SubHeading>What we collect</SubHeading>
            <List
              items={[
                <>
                  <span className="font-semibold text-[#fbecef]">Account:</span> email address and
                  password (handled by our authentication provider, Supabase &mdash; we never see
                  your password in plain text), and the username you choose.
                </>,
                <>
                  <span className="font-semibold text-[#fbecef]">Profile:</span> display name,
                  gender, sexual preference, age, state and area, bio, photos, and WhatsApp/Telegram
                  if you add them.
                </>,
                <>
                  <span className="font-semibold text-[#fbecef]">Technical:</span> your IP address,
                  used only to rate-limit profile submissions and prevent abuse.
                </>,
              ]}
            />

            <SubHeading>About sexual preference specifically</SubHeading>
            <p>
              We ask for this because it&rsquo;s core to how Browse&rsquo;s filters work. It&rsquo;s
              sensitive information &mdash; sharing it is your choice, it&rsquo;s only used to power
              filtering, and once your profile is approved it&rsquo;s visible to anyone browsing the
              platform, same as your other profile details.
            </p>

            <SubHeading>How it&rsquo;s used</SubHeading>
            <List
              items={[
                "Showing your approved profile to other users on Browse and your profile page",
                "Letting you and other users filter/search",
                "Reviewing submissions and edits before they go public",
                "Investigating reports made against a profile",
                "Preventing spam and abuse (rate limiting)",
                "Sending you account emails - password resets, confirmations, and updates on your profile's approval status",
              ]}
            />
            <p>We don&rsquo;t sell your data, and we don&rsquo;t use it for advertising.</p>

            <SubHeading>Who else sees it</SubHeading>
            <p>
              We use a small number of service providers to run WildModels, each of whom processes
              data on our behalf:
            </p>
            <List
              items={[
                <>
                  <span className="font-semibold text-[#fbecef]">Supabase</span> &mdash; database,
                  authentication, and photo storage
                </>,
                <>
                  <span className="font-semibold text-[#fbecef]">Resend</span> &mdash; sending
                  account and notification emails
                </>,
                <>
                  <span className="font-semibold text-[#fbecef]">Upstash</span> &mdash; rate limiting
                </>,
                <>
                  <span className="font-semibold text-[#fbecef]">Vercel</span> &mdash; hosting the
                  site
                </>,
              ]}
            />
            <p>
              Once your profile is approved, its details (excluding your email and password) are
              visible to anyone browsing the platform &mdash; that&rsquo;s the nature of a public
              profile listing.
            </p>

            <SubHeading>Your controls</SubHeading>
            <List
              items={[
                "Edit your profile any time from your dashboard (edits are re-reviewed before going live)",
                "Hide your profile from Browse without deleting it",
                "Delete your profile entirely from Account Settings",
              ]}
            />
            <p>
              Deleting your profile removes it from Browse immediately. We keep a copy on our servers
              for a period afterward rather than instantly erasing it, mainly so accidental deletions
              and moderation issues can still be resolved; if you want it removed sooner, reach out
              through Contact / Support.
            </p>

            <SubHeading>Children</SubHeading>
            <p>
              WildModels is for users 18 and older. We don&rsquo;t knowingly collect data from
              anyone under 18, and remove any account found to belong to a minor.
            </p>

            <SubHeading>Security</SubHeading>
            <p>
              We take reasonable measures to protect your data, but no online platform can guarantee
              perfect security. Use a strong, unique password for your account.
            </p>

            <SubHeading>Changes</SubHeading>
            <p>
              We may update this policy as the platform changes. Material changes will update the
              &ldquo;Last updated&rdquo; date above.
            </p>
          </Section>

          {/* ---------------- SAFETY GUIDELINES ---------------- */}
          <Section id="safety" title="Safety Guidelines">
            <p>
              We review every profile before it goes live, but we can&rsquo;t verify everything a
              person tells you, and we&rsquo;re not part of what happens once you&rsquo;re talking to
              someone off-platform. These are the basics worth actually following.
            </p>

            <SubHeading>Before you meet</SubHeading>
            <List
              items={[
                "Talk on a call (voice or video) before meeting in person - it's the single best way to confirm someone is who their profile says they are",
                "Tell a friend where you're going, who you're meeting, and when you expect to be back",
                "Do your own reasonable research on the person if you can",
              ]}
            />

            <SubHeading>When you meet</SubHeading>
            <List
              items={[
                "Meet in a public place for the first time, and get there yourself rather than being picked up",
                "Keep your own transport, phone charged, and enough money to leave whenever you want to",
                "Stay sober enough to make clear decisions, at least until you trust the situation",
                "Trust your gut - if something feels off, it's fine to leave, no explanation needed",
              ]}
            />

            <SubHeading>Protecting yourself online</SubHeading>
            <List
              items={[
                "Never send money, gift cards, or financial details to someone you've met on WildModels, regardless of the story",
                "Be cautious with anyone who avoids a call, cancels plans repeatedly, or pushes you to move off-platform and communicate immediately",
                "Keep sensitive personal information (home address, workplace, financial details) private until you actually trust someone",
              ]}
            />

            <SubHeading>Reporting</SubHeading>
            <p>
              If a profile is fake, abusive, underage, or attempting a scam, use the
              &ldquo;Report&rdquo; button on that profile. If you&rsquo;re ever in immediate physical
              danger, contact your local emergency services before anything else.
            </p>
          </Section>
        </div>
      </div>
    </main>
  );
}
