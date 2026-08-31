import { emailShell, escapeHtml } from "./shell";

const SITE_URL = "https://wildmodels.xyz";

export function approvedEmail({
  displayName,
  username,
  isEdit,
}: {
  displayName: string;
  username: string;
  isEdit: boolean;
}) {
  const name = displayName ? escapeHtml(displayName) : "there";

  return {
    subject: isEdit ? "Your WildModels edit is approved" : "Your WildModels profile is live",
    html: emailShell({
      preheader: isEdit
        ? "Your latest WildModels profile edit just got approved and is live."
        : "Your WildModels profile just got approved and is now visible on Browse.",
      eyebrow: isEdit ? "Edit approved" : "You're live",
      heading: isEdit ? "Your edit is approved" : "Your profile is approved",
      bodyHtml: isEdit
        ? [
            `Good news, ${name} &mdash; the changes you made to your WildModels profile were just approved and are now live.`,
          ]
        : [
            `Good news, ${name} &mdash; your WildModels profile just got approved and is now visible on Browse.`,
            `People can find and reach out to you starting now.`,
          ],
      ctaLabel: "View your profile",
      ctaUrl: `${SITE_URL}/profile/${encodeURIComponent(username)}`,
      noteHtml:
        "Want to make more changes? You can edit your profile anytime from your dashboard &mdash; edits go through a quick review before they go live, same as this one did.",
    }),
  };
}

export function rejectedEmail({
  displayName,
  isEdit,
}: {
  displayName: string;
  isEdit: boolean;
}) {
  const name = displayName ? escapeHtml(displayName) : "there";

  return {
    subject: isEdit
      ? "An update on your WildModels profile edit"
      : "An update on your WildModels profile",
    html: emailShell({
      preheader: isEdit
        ? "Your latest WildModels profile edit wasn't approved."
        : "Your WildModels profile wasn't approved this time.",
      eyebrow: "Review update",
      heading: isEdit ? "Your edit wasn&rsquo;t approved" : "Your profile wasn&rsquo;t approved",
      bodyHtml: isEdit
        ? [
            `Hey ${name} &mdash; after review, the latest changes to your WildModels profile weren&rsquo;t approved, so your profile isn&rsquo;t visible on Browse right now.`,
            `You&rsquo;re welcome to review your changes and submit again.`,
          ]
        : [
            `Hey ${name} &mdash; after review, your WildModels profile wasn&rsquo;t approved this time.`,
            `You&rsquo;re welcome to make changes and submit again. Edits go through a quick review before they go live.`,
          ],
      ctaLabel: "Edit your profile",
      ctaUrl: `${SITE_URL}/dashboard/profile`,
    }),
  };
}
