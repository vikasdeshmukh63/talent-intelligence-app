/** @param {string} value */
export const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * Table-based layout for broad email client support (inline styles only).
 * @param {{ title: string; preheader?: string; innerHtml: string }} opts
 */
export const baseLayout = ({ title, preheader = "", innerHtml }) => {
  const safeTitle = escapeHtml(title);
  const safePre = escapeHtml(preheader);
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>${safeTitle}</title>
</head>
<body style="margin:0;padding:0;background-color:#e8eef5;">
<span style="display:none !important;visibility:hidden;mso-hide:all;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${safePre}</span>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#e8eef5;padding:32px 16px;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #d6dee8;box-shadow:0 8px 32px rgba(0,61,130,0.08);">
        <tr>
          <td style="background-color:#003d82;background-image:linear-gradient(135deg,#003d82 0%,#0a5cad 100%);padding:28px 24px;text-align:center;">
            <div style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;line-height:1.2;">eNlight</div>
            <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:11px;color:rgba(255,255,255,0.88);text-transform:uppercase;letter-spacing:0.14em;margin-top:8px;">Talent Intelligence</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 28px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#1e293b;font-size:15px;line-height:1.65;">
            ${innerHtml}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 28px;background-color:#f1f5f9;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
              © ${year} ESDS eNlight Talent Platform. This message was sent automatically; please do not reply directly to this email.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
};

/**
 * @param {{ otp: string; purpose: 'verify' | 'reset' }} opts
 */
export const buildOtpEmailHtml = ({ otp, purpose }) => {
  const isVerify = purpose === "verify";
  const headline = isVerify ? "Verify your email" : "Reset your password";
  const intro = isVerify
    ? "Thanks for joining eNlight. Enter this one-time code to verify your email and finish setting up your account."
    : "We received a request to reset your password. Use the code below on the reset page. If you did not ask for this, you can ignore this email.";
  const safeOtp = escapeHtml(String(otp || "").trim());
  const innerHtml = `
    <h1 style="margin:0 0 10px;font-size:22px;font-weight:700;color:#0f172a;line-height:1.3;">${escapeHtml(headline)}</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.65;color:#475569;">${escapeHtml(intro)}</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:8px 0 24px;">
      <tr>
        <td align="center" style="padding:20px 16px;background-color:#f8fafc;border:2px solid #003d82;border-radius:14px;">
          <div style="font-family:'SF Mono',Consolas,'Courier New',monospace;font-size:32px;font-weight:700;letter-spacing:10px;color:#003d82;line-height:1.2;">${safeOtp}</div>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">This code expires in <strong style="color:#334155;">10 minutes</strong>. Never share it with anyone — our team will never ask for your code.</p>
  `;
  return baseLayout({
    title: headline,
    preheader: isVerify ? `Your verification code: ${otp}` : `Your password reset code: ${otp}`,
    innerHtml,
  });
};

/**
 * @param {{ subject: string; bodyParagraphsHtml: string; senderName?: string; senderTitle?: string }} opts — bodyParagraphsHtml must already be safe HTML
 */
export const buildGenericNotificationHtml = ({
  subject,
  bodyParagraphsHtml,
  senderName,
  senderTitle,
}) => {
  const signatureBlock =
    senderName && String(senderName).trim()
      ? `
    <div style="margin-top:28px;padding-top:22px;border-top:1px solid #e2e8f0;">
      <p style="margin:0;font-size:15px;line-height:1.6;color:#334155;">Best regards,</p>
      <p style="margin:6px 0 0;font-size:16px;font-weight:600;color:#0f172a;">${escapeHtml(String(senderName).trim())}</p>
      ${
        senderTitle && String(senderTitle).trim()
          ? `<p style="margin:4px 0 0;font-size:13px;line-height:1.5;color:#64748b;">${escapeHtml(String(senderTitle).trim())}</p>`
          : ""
      }
    </div>`
      : "";
  const innerHtml = `
    <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#0f172a;line-height:1.3;">${escapeHtml(subject)}</h1>
    <div style="font-size:15px;line-height:1.7;color:#334155;">${bodyParagraphsHtml}</div>
    ${signatureBlock}
  `;
  return baseLayout({
    title: subject,
    preheader: subject,
    innerHtml,
  });
};

/**
 * @param {{
 *   candidateName: string;
 *   jobTitle: string;
 *   scheduledDate: string;
 *   timeSlot: string;
 *   hostNames: string;
 *   customBodyHtml?: string;
 *   teamsJoinUrl?: string | null;
 * }} opts
 */
export const buildInterviewCandidateEmailHtml = ({
  candidateName,
  jobTitle,
  scheduledDate,
  timeSlot,
  hostNames,
  customBodyHtml,
  teamsJoinUrl,
}) => {
  const meetingBlock = teamsJoinUrl
    ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;">
        <tr>
          <td style="border-radius:10px;background-color:#003d82;">
            <a href="${escapeHtml(teamsJoinUrl)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">Join Microsoft Teams meeting</a>
          </td>
        </tr>
      </table>
      <p style="margin:0;font-size:13px;color:#64748b;">Or copy this link: <span style="word-break:break-all;color:#003d82;">${escapeHtml(teamsJoinUrl)}</span></p>`
    : "";

  const defaultBody = `
    <p style="margin:0 0 16px;">Hello ${escapeHtml(candidateName)},</p>
    <p style="margin:0 0 16px;">Your interview for <strong style="color:#0f172a;">${escapeHtml(jobTitle)}</strong> is scheduled on <strong>${escapeHtml(scheduledDate)}</strong> at <strong>${escapeHtml(timeSlot)}</strong> (IST) with <strong>${escapeHtml(hostNames)}</strong>.</p>
  `;

  const innerHtml = `
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0f172a;">Interview scheduled</h1>
    <p style="margin:0 0 20px;font-size:14px;color:#64748b;">${escapeHtml(jobTitle)}</p>
    ${customBodyHtml ? `<div style="margin-bottom:20px;">${customBodyHtml}</div>` : defaultBody}
    ${meetingBlock}
    <p style="margin:24px 0 0;font-size:14px;color:#475569;">Best regards,<br/><strong style="color:#003d82;">eNlight Talent</strong></p>
  `;

  return baseLayout({
    title: `Interview — ${jobTitle}`,
    preheader: `Your interview for ${jobTitle} is confirmed.`,
    innerHtml,
  });
};

/**
 * @param {{
 *   hostName: string;
 *   jobTitle: string;
 *   scheduledDate: string;
 *   timeSlot: string;
 *   candidateName: string;
 *   candidateEmail: string;
 *   hostNames: string;
 *   teamsJoinUrl?: string | null;
 * }} opts
 */
export const buildInterviewHostEmailHtml = ({
  hostName,
  jobTitle,
  scheduledDate,
  timeSlot,
  candidateName,
  candidateEmail,
  hostNames,
  teamsJoinUrl,
}) => {
  const meetingBlock = teamsJoinUrl
    ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:20px 0;">
        <tr>
          <td style="border-radius:10px;background-color:#003d82;">
            <a href="${escapeHtml(teamsJoinUrl)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">Open Teams meeting</a>
          </td>
        </tr>
      </table>`
    : "";

  const innerHtml = `
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0f172a;">New interview on your calendar</h1>
    <p style="margin:0 0 20px;font-size:14px;color:#64748b;">Hi ${escapeHtml(hostName)}, a recruiter scheduled the following interview.</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;margin:0 0 20px;">
      <tr><td style="padding:16px 18px;font-size:14px;color:#334155;"><strong style="color:#0f172a;display:inline-block;min-width:100px;">When</strong> ${escapeHtml(scheduledDate)} · ${escapeHtml(timeSlot)} (IST)</td></tr>
      <tr><td style="padding:0 18px 16px;font-size:14px;color:#334155;"><strong style="color:#0f172a;display:inline-block;min-width:100px;">Role</strong> ${escapeHtml(jobTitle)}</td></tr>
      <tr><td style="padding:0 18px 16px;font-size:14px;color:#334155;"><strong style="color:#0f172a;display:inline-block;min-width:100px;">Candidate</strong> ${escapeHtml(candidateName)} · <a href="mailto:${escapeHtml(candidateEmail)}" style="color:#003d82;">${escapeHtml(candidateEmail)}</a></td></tr>
      <tr><td style="padding:0 18px 16px;font-size:14px;color:#334155;"><strong style="color:#0f172a;display:inline-block;min-width:100px;">Hosts</strong> ${escapeHtml(hostNames)}</td></tr>
    </table>
    ${meetingBlock}
    <p style="margin:0;font-size:13px;color:#64748b;">— eNlight Talent Intelligence</p>
  `;

  return baseLayout({
    title: `Interview booked — ${jobTitle}`,
    preheader: `Interview: ${jobTitle} with ${candidateName}`,
    innerHtml,
  });
};
