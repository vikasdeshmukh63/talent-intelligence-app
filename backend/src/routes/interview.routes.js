import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import {
  addMyBusy,
  createInterviewBooking,
  getAvailability,
  getMySchedule,
  listInterviewHosts,
  removeMyBusy,
} from "../controllers/interview.controller.js";

const router = Router();

router.get("/hosts", authenticate, requireRole("recruiter", "admin"), listInterviewHosts);
router.get("/availability/:userId", authenticate, requireRole("recruiter", "admin"), getAvailability);
router.post("/bookings", authenticate, requireRole("recruiter", "admin"), createInterviewBooking);

router.get("/my-schedule", authenticate, requireRole("recruiter", "interviewer"), getMySchedule);
router.post("/my-busy", authenticate, requireRole("recruiter", "interviewer"), addMyBusy);
router.delete("/my-busy", authenticate, requireRole("recruiter", "interviewer"), removeMyBusy);

export default router;
