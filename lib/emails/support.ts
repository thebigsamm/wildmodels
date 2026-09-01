import { emailShell, escapeHtml } from "./shell";

const SITE_URL = "https://wildmodels.xyz";

/** Sent to the support inbox when someone submits the contact form. */
export function supportNotificationEmail({
  name,
  email,
  category,
  message,
}: {
  name: string;
  email: string;
  category: string;
  message: string;
}) {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeCategory = escapeHtml(category);
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");

  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>New support message</title>
</head>
<body bgcolor="#060002" style="margin:0; padding:0; background-color:#060002; -webkit-text-size-adjust:100%; text-size-adjust:100%;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#060002" style="background-color:#060002;">
    <tr>
      <td align="center" bgcolor="#060002" style="background-color:#060002; padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">

          <tr>
            <td align="center" bgcolor="#060002" style="background-color:#060002; padding-bottom:24px;">
              <span style="font-family:'Helvetica Neue', Helvetica, Arial, sans-serif; font-size:20px; font-weight:900; letter-spacing:2px; color:#ff2f74;">
                WILDMODELS
              </span>
            </td>
          </tr>

          <tr>
            <td bgcolor="#150109" style="background-color:#150109; border:1px solid #2a0f18; border-radius:16px; overflow:hidden;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td height="4" bgcolor="#ff115a" style="background-color:#ff115a; background-image:linear-gradient(90deg,#ff115a,#c400ff); font-size:0; line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td bgcolor="#150109" style="background-color:#150109; padding:32px 32px 28px 32px;">

                    <h1 style="margin:0 0 20px 0; font-family:'Helvetica Neue', Helvetica, Arial, sans-serif; font-size:22px; line-height:1.3; font-weight:800; color:#fbecef;">
                      New support message
                    </h1>

                    <table role="presentation" width="100%" cellpadding="0" cellspacing="6" border="0" style="font-family:'Helvetica Neue', Helvetica, Arial, sans-serif; font-size:14px;">
                      <tr>
                        <td width="90" style="color:#8f6b78; vertical-align:top;">From</td>
                        <td style="color:#fbecef; font-weight:600;">${safeName}</td>
                      </tr>
                      <tr>
                        <td width="90" style="color:#8f6b78; vertical-align:top;">Email</td>
                        <td style="color:#fbecef;"><a href="mailto:${safeEmail}" style="color:#ff5f8f;">${safeEmail}</a></td>
                      </tr>
                      <tr>
                        <td width="90" style="color:#8f6b78; vertical-align:top;">Category</td>
                        <td style="color:#fbecef;">${safeCategory}</td>
                      </tr>
                    </table>

                    <div style="margin-top:20px; padding:16px; background-color:#220413; border-left:3px solid #ff115a; border-radius:4px; font-family:'Helvetica Neue', Helvetica, Arial, sans-serif; font-size:15px; line-height:1.6; color:#e8d1d8;">
                      ${safeMessage}
                    </div>

                    <p style="margin:20px 0 0 0; font-family:'Helvetica Neue', Helvetica, Arial, sans-serif; font-size:12px; line-height:1.6; color:#6b4c55;">
                      Reply directly to this email to respond to ${safeName}.
                    </p>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  return { subject: `[Support] ${category}: ${name}`, html };
}

/** Auto-reply confirmation sent back to whoever submitted the form. */
export function supportConfirmationEmail({ name }: { name: string }) {
  const safeName = name ? escapeHtml(name) : "there";

  return {
    subject: "We got your message",
    html: emailShell({
      preheader: "Thanks for reaching out to WildModels - we'll get back to you soon.",
      eyebrow: "Message received",
      heading: "We got your message",
      bodyHtml: [
        `Hey ${safeName} &mdash; thanks for reaching out. Your message has been sent to our team and we&rsquo;ll get back to you as soon as we can.`,
        `This inbox isn&rsquo;t monitored in real time yet, so a reply may take a little while &mdash; we appreciate your patience.`,
      ],
      ctaLabel: "Back to WildModels",
      ctaUrl: SITE_URL,
    }),
  };
}
