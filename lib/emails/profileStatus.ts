import { emailShell, escapeHtml } from "./shell";

const SITE_URL = "https://wildmodels.xyz";

export function approvedEmail({
  displayName,
  username,
}: {
  displayName: string;
  username: string;
}) {
  const name = displayName ? escapeHtml(displayName) : "there";

  return {
    subject: "Your WildModels profile is live",
    html: emailShell({
      preheader: "Your WildModels profile just got approved and is now visible on Browse.",
      eyebrow: "You're live",
      heading: "Your profile is approved",
      bodyHtml: [
        `Good news, ${name} &mdash; your WildModels profile just got approved and is now visible on Browse.`,
        `People can find and reach out to you starting now.`,
      ],
      ctaLabel: "View your profile",
      ctaUrl: `${SITE_URL}/profile/${encodeURIComponent(username)}`,
      noteHtml:
        "Want to make changes? You can edit your profile anytime from your dashboard &mdash; edits go through a quick review before they go live, same as this one did.",
    }),
  };
}

export function rejectedEmail({ displayName }: { displayName: string }) {
  const name = displayName ? escapeHtml(displayName) : "there";

  return {
    subject: "An update on your WildModels profile",
    html: emailShell({
      preheader: "Your WildModels profile wasn't approved this time.",
      eyebrow: "Review update",
      heading: "Your profile wasn&rsquo;t approved",
      bodyHtml: [
        `Hey ${name} &mdash; after review, your WildModels profile wasn&rsquo;t approved this time.`,
        `You&rsquo;re welcome to make changes and submit again. Edits go through a quick review before they go live.`,
      ],
      ctaLabel: "Edit your profile",
      ctaUrl: `${SITE_URL}/dashboard/profile`,
    }),
  };
}
