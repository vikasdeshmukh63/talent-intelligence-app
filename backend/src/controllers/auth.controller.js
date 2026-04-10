import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/user.model.js";
import { sendOtpEmail } from "../services/mail.service.js";

const ALLOWED_ROLES = ["admin", "recruiter", "candidate", "ceo_chro", "interviewer"];

const getUserRoles = (user) => {
  const extra = Array.isArray(user.additionalRoles) ? user.additionalRoles : [];
  return [...new Set([user.role, ...extra].filter(Boolean))];
};

const signToken = (user, activeRole = user.role) =>
  jwt.sign({ sub: user.id, role: activeRole }, env.jwtSecret, { expiresIn: "7d" });

const createOtp = () => Math.floor(100000 + Math.random() * 900000).toString();
const otpExpiry = () => new Date(Date.now() + 10 * 60 * 1000);

const toPublicUser = (user, activeRole = null) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: activeRole || user.role,
  roles: getUserRoles(user),
  phone: user.phone,
  location: user.location,
});

export const signup = async (req, res) => {
  const { name, email, password, role, phone, location } = req.body || {};
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "name, email, password, role are required" });
  }
  if (!ALLOWED_ROLES.includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }
  const existing = await User.findOne({ where: { email: email.toLowerCase() } });
  if (existing) {
    const ok = await bcrypt.compare(password, existing.passwordHash);
    if (!ok) return res.status(409).json({ message: "User already exists with different password" });
    const currentRoles = getUserRoles(existing);
    if (currentRoles.includes(role)) {
      if (!existing.emailVerified) {
        const otp = createOtp();
        existing.emailOtp = otp;
        existing.emailOtpExpiresAt = otpExpiry();
        await existing.save();
        await sendOtpEmail({ email: existing.email, otp, purpose: "verify" });
        return res.status(200).json({
          requiresEmailVerification: true,
          message: "Email not verified. A new verification code was sent to your inbox.",
        });
      }
      return res.status(409).json({ message: "User already registered with this role" });
    }
    existing.additionalRoles = [...new Set([...(Array.isArray(existing.additionalRoles) ? existing.additionalRoles : []), role])];
    await existing.save();
    if (!existing.emailVerified) {
      const otp = createOtp();
      existing.emailOtp = otp;
      existing.emailOtpExpiresAt = otpExpiry();
      await existing.save();
      await sendOtpEmail({ email: existing.email, otp, purpose: "verify" });
      return res.status(200).json({
        requiresEmailVerification: true,
        message: "Role added. Verify OTP sent to email.",
      });
    }
    return res.status(200).json({
      requiresEmailVerification: false,
      message: "Role added to existing account. Please login.",
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const otp = createOtp();
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role,
    phone: phone || null,
    location: location || null,
    emailVerified: false,
    emailOtp: otp,
    emailOtpExpiresAt: otpExpiry(),
  });
  await sendOtpEmail({ email: user.email, otp, purpose: "verify" });
  return res.status(201).json({
    requiresEmailVerification: true,
    message: "Registration successful. Verify OTP sent to email.",
  });
};

export const login = async (req, res) => {
  const { email, password, role } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: "email and password are required" });
  const user = await User.findOne({ where: { email: email.toLowerCase() } });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });
  const roles = getUserRoles(user);
  if (role && !roles.includes(role)) return res.status(403).json({ message: "Role mismatch" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });
  if (!user.emailVerified) {
    return res.status(403).json({
      message: "Email not verified. Please verify OTP.",
      code: "EMAIL_NOT_VERIFIED",
    });
  }

  const activeRole = role || user.role;
  const token = signToken(user, activeRole);
  return res.json({ token, user: toPublicUser(user, activeRole) });
};

export const me = async (req, res) => {
  const roles = getUserRoles(req.user);
  const activeRole = roles.includes(req.authRole) ? req.authRole : req.user.role;
  return res.json({ user: toPublicUser(req.user, activeRole) });
};

export const updateProfile = async (req, res) => {
  const { name, phone, location } = req.body || {};
  const user = req.user;
  if (typeof name === "string" && name.trim()) user.name = name.trim();
  if (typeof phone === "string") user.phone = phone.trim() || null;
  if (typeof location === "string") user.location = location.trim() || null;
  await user.save();
  return res.json({ user: toPublicUser(user) });
};

export const verifyEmailOtp = async (req, res) => {
  const { email, otp } = req.body || {};
  if (!email || !otp) return res.status(400).json({ message: "email and otp are required" });
  const user = await User.findOne({ where: { email: email.toLowerCase() } });
  if (!user) return res.status(404).json({ message: "User not found" });
  if (user.emailVerified) {
    const token = signToken(user, user.role);
    return res.json({ token, user: toPublicUser(user, user.role) });
  }
  if (!user.emailOtp || user.emailOtp !== otp || !user.emailOtpExpiresAt || user.emailOtpExpiresAt < new Date()) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }
  user.emailVerified = true;
  user.emailOtp = null;
  user.emailOtpExpiresAt = null;
  await user.save();
  const token = signToken(user, user.role);
  return res.json({ token, user: toPublicUser(user, user.role) });
};

export const resendVerifyOtp = async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ message: "email is required" });
  const user = await User.findOne({ where: { email: email.toLowerCase() } });
  if (!user) return res.status(404).json({ message: "User not found" });
  if (user.emailVerified) return res.status(400).json({ message: "Email already verified" });
  const otp = createOtp();
  user.emailOtp = otp;
  user.emailOtpExpiresAt = otpExpiry();
  await user.save();
  await sendOtpEmail({ email: user.email, otp, purpose: "verify" });
  return res.json({ message: "Verification OTP resent." });
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ message: "email is required" });
  const user = await User.findOne({ where: { email: email.toLowerCase() } });
  if (!user) return res.json({ message: "If account exists, reset OTP is sent." });
  const otp = createOtp();
  user.resetOtp = otp;
  user.resetOtpExpiresAt = otpExpiry();
  await user.save();
  await sendOtpEmail({ email: user.email, otp, purpose: "reset" });
  return res.json({ message: "If account exists, reset OTP is sent." });
};

export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body || {};
  if (!email || !otp || !newPassword) {
    return res.status(400).json({ message: "email, otp and newPassword are required" });
  }
  const user = await User.findOne({ where: { email: email.toLowerCase() } });
  if (!user) return res.status(404).json({ message: "User not found" });
  if (!user.resetOtp || user.resetOtp !== otp || !user.resetOtpExpiresAt || user.resetOtpExpiresAt < new Date()) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }
  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.resetOtp = null;
  user.resetOtpExpiresAt = null;
  await user.save();
  return res.json({ message: "Password reset successful." });
};
