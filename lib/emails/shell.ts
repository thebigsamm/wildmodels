export function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type EmailShellOptions = {
  preheader: string;
  eyebrow?: string;
  heading: string;
  /** Pre-escaped/trusted HTML paragraphs. Escape any user-controlled values before passing in. */
  bodyHtml: string[];
  ctaLabel: string;
  ctaUrl: string;
  /** Pre-escaped/trusted HTML. */
  noteHtml?: string;
};

/**
 * Shared table-based, inline-styled shell for all WildModels transactional
 * emails. Matches the Supabase auth email templates exactly (same colors,
 * same bgcolor-attribute fix for Gmail's mobile app stripping
 * background-color from body/table/td). Deliberately does NOT force
 * dark-only via [data-ogsc] overrides - Gmail's dark-mode auto-adaptation
 * (light card in Gmail dark mode) was a conscious choice to keep, not a bug.
 */
export function emailShell({
  preheader,
  eyebrow,
  heading,
  bodyHtml,
  ctaLabel,
  ctaUrl,
  noteHtml,
}: EmailShellOptions): string {
  const eyebrowHtml = eyebrow
    ? `<p style="margin:0 0 6px 0; font-family:'Helvetica Neue', Helvetica, Arial, sans-serif; font-size:13px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#ff5f8f;">
        ${eyebrow}
      </p>`
    : "";

  const bodyParagraphsHtml = bodyHtml
    .map(
      (p, i) => `<p style="margin:0 0 ${i === bodyHtml.length - 1 ? "32" : "12"}px 0; font-family:'Helvetica Neue', Helvetica, Arial, sans-serif; font-size:15px; line-height:1.6; color:#c9a7b3;">
        ${p}
      </p>`
    )
    .join("\n");

  const noteBlockHtml = noteHtml
    ? `<p style="margin:32px 0 0 0; font-family:'Helvetica Neue', Helvetica, Arial, sans-serif; font-size:13px; line-height:1.6; color:#8f6b78;">
        ${noteHtml}
      </p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${heading}</title>
</head>
<body bgcolor="#060002" style="margin:0; padding:0; background-color:#060002; -webkit-text-size-adjust:100%; text-size-adjust:100%;">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
    ${preheader}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#060002" style="background-color:#060002;">
    <tr>
      <td align="center" bgcolor="#060002" style="background-color:#060002; padding:40px 16px;">

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">

          <!-- Wordmark -->
          <tr>
            <td align="center" bgcolor="#060002" style="background-color:#060002; padding-bottom:28px;">
              <span style="font-family:'Helvetica Neue', Helvetica, Arial, sans-serif; font-size:22px; font-weight:900; letter-spacing:2px; color:#ff2f74;">
                WILDMODELS
              </span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td bgcolor="#150109" style="background-color:#150109; border:1px solid #2a0f18; border-radius:16px; overflow:hidden;">

              <!-- Accent bar -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td height="4" bgcolor="#ff115a" style="background-color:#ff115a; background-image:linear-gradient(90deg,#ff115a,#c400ff); font-size:0; line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td bgcolor="#150109" style="background-color:#150109; padding:40px 36px 36px 36px;">

                    ${eyebrowHtml}

                    <h1 style="margin:0 0 16px 0; font-family:'Helvetica Neue', Helvetica, Arial, sans-serif; font-size:26px; line-height:1.25; font-weight:800; color:#fbecef;">
                      ${heading}
                    </h1>

                    ${bodyParagraphsHtml}

                    <!-- CTA button -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" bgcolor="#ff115a" style="border-radius:999px; background-color:#ff115a; background-image:linear-gradient(135deg,#ff115a,#c400ff);">
                          <a href="${ctaUrl}" target="_blank" style="display:inline-block; padding:14px 32px; font-family:'Helvetica Neue', Helvetica, Arial, sans-serif; font-size:15px; font-weight:700; color:#060002; text-decoration:none; border-radius:999px;">
                            ${ctaLabel}
                          </a>
                        </td>
                      </tr>
                    </table>

                    ${noteBlockHtml}

                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td bgcolor="#150109" style="background-color:#150109; border-top:1px solid #2a0f18; padding:20px 36px;">
                    <p style="margin:0; font-family:'Helvetica Neue', Helvetica, Arial, sans-serif; font-size:12px; line-height:1.6; color:#6b4c55;">
                      Button not working? Copy and paste this link into your browser:
                      <br>
                      <a href="${ctaUrl}" style="color:#ff5f8f; word-break:break-all;">${ctaUrl}</a>
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" bgcolor="#060002" style="background-color:#060002; padding-top:28px;">
              <p style="margin:0; font-family:'Helvetica Neue', Helvetica, Arial, sans-serif; font-size:12px; line-height:1.7; color:#6b4c55;">
                &copy; WildModels &middot; wildmodels.xyz<br>
                Naija&rsquo;s wild side. 18+ only.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
`;
}
