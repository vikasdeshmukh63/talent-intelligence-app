import { Router } from "express";
import {
  forgotPassword,
  login,
  me,
  resendVerifyOtp,
  resetPassword,
  signup,
  updateProfile,
  verifyEmailOtp,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();
router.post("/signup", signup);
router.post("/verify-email", verifyEmailOtp);
router.post("/resend-verify-otp", resendVerifyOtp);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", authenticate, me);
router.patch("/profile", authenticate, updateProfile);

export default router;
