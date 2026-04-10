import { runPrompt } from "../services/ai.service.js";
import { sendMail } from "../services/mail.service.js";
import { escapeHtml, buildGenericNotificationHtml } from "../services/mail-templates.js";

const ROLE_SIGNATURE_LINE = {
  recruiter: "Recruiter · ESDS Software Solutions",
  interviewer: "Interviewer · ESDS Software Solutions",
  admin: "Administrator · ESDS eNlight Talent Platform",
  ceo_chro: "Leadership · ESDS eNlight Talent Platform",
  candidate: "Candidate · ESDS eNlight Talent Platform",
};

const stripTrailingSignOff = (text) =>
  String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{2,}(?:Best regards|Kind regards|Warm regards|Regards|Sincerely|Thanks,?|Thank you)[,\s]*(?:\n[\s\S]*)?$/i, "")
    .trim();

export const invokeAi = async (req, res) => {
  const { prompt, response_json_schema: responseJsonSchema, file_urls: fileUrls = [] } = req.body || {};
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ message: "prompt is required" });
  }
  const { output, ragUsed } = await runPrompt({ prompt, responseJsonSchema, fileUrls });
  return res.json({ data: output, rag_used: ragUsed });
};

export const sendEmail = async (req, res) => {
  const { to, subject, body, includeSignature } = req.body || {};
  if (!to || !subject || !body) {
    return res.status(400).json({ message: "to, subject and body are required" });
  }
  const user = req.user;
  const wantSignature = includeSignature !== false;
  const rawBody = String(body || "").replace(/\r\n/g, "\n").trim();
  const bodyText = wantSignature ? stripTrailingSignOff(rawBody) : rawBody;
  const chunks = bodyText.split(/\n\n+/).filter(Boolean);
  const bodyParagraphsHtml =
    chunks.length > 0
      ? chunks
          .map(
            (p) =>
              `<p style="margin:0 0 14px;">${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`,
          )
          .join("")
      : `<p style="margin:0;">${escapeHtml(bodyText).replace(/\n/g, "<br/>")}</p>`;

  const roleForSig = req.authRole || user?.role;
  const senderTitle =
    roleForSig && ROLE_SIGNATURE_LINE[roleForSig]
      ? ROLE_SIGNATURE_LINE[roleForSig]
      : "ESDS eNlight Talent Platform";
  const senderName = (user?.name && String(user.name).trim()) || user?.email || "Team member";

  const html = buildGenericNotificationHtml({
    subject,
    bodyParagraphsHtml,
    ...(wantSignature ? { senderName, senderTitle } : {}),
  });

  let plainText = bodyText;
  if (wantSignature) {
    plainText += `\n\nBest regards,\n${senderName}\n${senderTitle}`;
  }

  await sendMail({ to, subject, html, text: plainText });
  return res.json({ success: true });
};
