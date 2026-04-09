import { runPrompt } from "../services/ai.service.js";
import { sendMail } from "../services/mail.service.js";

export const invokeAi = async (req, res) => {
  const { prompt, response_json_schema: responseJsonSchema, file_urls: fileUrls = [] } = req.body || {};
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ message: "prompt is required" });
  }
  const { output, ragUsed } = await runPrompt({ prompt, responseJsonSchema, fileUrls });
  return res.json({ data: output, rag_used: ragUsed });
};

export const sendEmail = async (req, res) => {
  const { to, subject, body } = req.body || {};
  if (!to || !subject || !body) {
    return res.status(400).json({ message: "to, subject and body are required" });
  }
  const escapeHtml = (value) =>
    String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  const bodyText = String(body || "").replace(/\r\n/g, "\n").trim();
  const htmlBody = escapeHtml(bodyText)
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/\n/g, "<br/>");
  const html = `
    <div style="margin:0;padding:24px;background:#f3f6fb;font-family:Segoe UI,Arial,sans-serif;color:#0f172a;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #dbe4f0;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="background:#003d82;color:#ffffff;padding:16px 20px;">
            <div style="font-size:14px;letter-spacing:.6px;text-transform:uppercase;opacity:.9;">eNlight Talent Intelligence</div>
            <div style="font-size:18px;font-weight:700;margin-top:4px;">${escapeHtml(subject)}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:20px;">
            ${htmlBody ? `<div style="margin:0;font-size:14px;line-height:1.7;color:#1e293b;">${htmlBody}</div>` : ""}
          </td>
        </tr>
        <tr>
          <td style="border-top:1px solid #e2e8f0;padding:14px 20px;background:#f8fafc;">
            <div style="font-size:12px;color:#64748b;">This email was sent by eNlight Talent Intelligence.</div>
          </td>
        </tr>
      </table>
    </div>
  `;
  await sendMail({ to, subject, html });
  return res.json({ success: true });
};
