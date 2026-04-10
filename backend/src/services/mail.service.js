import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { buildOtpEmailHtml } from "./mail-templates.js";

const transporter =
  env.smtpHost && env.smtpUser && env.smtpPass
    ? nodemailer.createTransport({
        host: env.smtpHost,
        port: env.smtpPort,
        secure: env.smtpSecure,
        auth: { user: env.smtpUser, pass: env.smtpPass },
      })
    : null;

export const sendMail = async ({ to, subject, html, text }) => {
  if (!transporter) {
    console.warn(`[mail] SMTP not configured — email not sent (would have gone to: ${to}, subject: ${subject})`);
    return;
  }
  await transporter.sendMail({
    from: env.smtpFrom || env.smtpUser,
    to,
    subject,
    html,
    ...(text ? { text } : {}),
  });
  console.log(`[mail] Sent email to ${to} — subject: "${subject}"`);
};

export const sendOtpEmail = async ({ email, otp, purpose }) => {
  const subject =
    purpose === "verify" ? "Verify your eNlight account" : "Reset your eNlight password";
  const html = buildOtpEmailHtml({ otp, purpose });
  const purposeLine =
    purpose === "verify"
      ? "Use this code to verify your email address."
      : "Use this code to reset your password.";
  const text = [
    "eNlight Talent Intelligence",
    "",
    purposeLine,
    "",
    `Your code: ${otp}`,
    "",
    "This code expires in 10 minutes. If you did not request this, ignore this email.",
  ].join("\n");
  await sendMail({ to: email, subject, html, text });
};
