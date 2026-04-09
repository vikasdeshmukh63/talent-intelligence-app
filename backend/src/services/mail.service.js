import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const transporter =
  env.smtpHost && env.smtpUser && env.smtpPass
    ? nodemailer.createTransport({
        host: env.smtpHost,
        port: env.smtpPort,
        secure: env.smtpSecure,
        auth: { user: env.smtpUser, pass: env.smtpPass },
      })
    : null;

export const sendMail = async ({ to, subject, html }) => {
  if (!transporter) {
    console.warn(`[mail] SMTP not configured — email not sent (would have gone to: ${to}, subject: ${subject})`);
    return;
  }
  await transporter.sendMail({
    from: env.smtpFrom || env.smtpUser,
    to,
    subject,
    html,
  });
  console.log(`[mail] Sent email to ${to} — subject: "${subject}"`);
};

export const sendOtpEmail = async ({ email, otp, purpose }) => {
  const subject =
    purpose === "verify" ? "Verify your eNlight account" : "Reset your eNlight password";
  const html = `
    <div style="font-family: Arial, sans-serif; line-height:1.5">
      <h2>eNlight Talent Intelligence</h2>
      <p>Your one-time password is:</p>
      <p style="font-size:24px;font-weight:700;letter-spacing:4px">${otp}</p>
      <p>This OTP expires in 10 minutes.</p>
    </div>
  `;
  await sendMail({ to: email, subject, html });
};
