import { emailShell, escapeHtml } from "./shell";

const SITE_URL = "https://wildmodels.xyz";

export function verificationSubmittedEmail({ displayName }: { displayName: string }) {
  const name = displayName ? escapeHtml(displayName) : "there";

  return {
    subject: "We got your verification photo",
    html: emailShell({
      preheader: "Your verification photo is in the queue - we'll email you once it's reviewed.",
      eyebrow: "Awaiting verification",
      heading: "Your photo is in the queue",
      bodyHtml: [
        `Thanks, ${name} &mdash; we&rsquo;ve received your verification photo and it&rsquo;s now waiting on review.`,
        `Someone will compare it against the photos on your profile. As soon as there&rsquo;s a decision, we&rsquo;ll email you.`,
        `Sent the wrong photo? You can replace it from your dashboard until it&rsquo;s reviewed.`,
      ],
      ctaLabel: "Check your status",
      ctaUrl: `${SITE_URL}/dashboard/verify`,
      noteHtml:
        "Your verification photo is private, only ever seen by our review team, and is deleted as soon as a decision is made. It never appears on your profile.",
    }),
  };
}

export function verificationApprovedEmail({
  displayName,
  username,
}: {
  displayName: string;
  username: string;
}) {
  const name = displayName ? escapeHtml(displayName) : "there";

  return {
    subject: "You're verified on WildModels",
    html: emailShell({
      preheader: "Your profile now carries the Identity verified badge.",
      eyebrow: "Verified",
      heading: "You&rsquo;re verified",
      bodyHtml: [
        `Good news, ${name} &mdash; your photo checked out. Your profile now carries the &ldquo;Identity verified&rdquo; badge.`,
        `The badge shows on Browse and on your profile, so people can see there&rsquo;s a real person behind the photos. Most people only reach out to verified profiles, so expect more replies.`,
      ],
      ctaLabel: username ? "View your profile" : "Go to your dashboard",
      ctaUrl: username ? `${SITE_URL}/profile/${encodeURIComponent(username)}` : `${SITE_URL}/dashboard`,
      noteHtml:
        "Your verification photo has been deleted from our storage now that the review is done.",
    }),
  };
}

export function verificationRejectedEmail({ displayName }: { displayName: string }) {
  const name = displayName ? escapeHtml(displayName) : "there";

  return {
    subject: "An update on your WildModels verification",
    html: emailShell({
      preheader: "Your verification wasn't approved this time - you can try again.",
      eyebrow: "Verification update",
      heading: "We couldn&rsquo;t verify that photo",
      bodyHtml: [
        `Hey ${name} &mdash; the photo you sent in wasn&rsquo;t enough to verify you this time.`,
        `That usually means the face wasn&rsquo;t clear enough, the handwritten code was hard to read, or it didn&rsquo;t match the photos on your profile.`,
        `You&rsquo;re welcome to try again. Start a new request, write the fresh code clearly on paper, and take the selfie in good light with your whole face visible.`,
      ],
      ctaLabel: "Try again",
      ctaUrl: `${SITE_URL}/dashboard/verify`,
      noteHtml:
        "The photo you sent has been deleted from our storage. Your profile stays live either way &mdash; verification is optional.",
    }),
  };
}
