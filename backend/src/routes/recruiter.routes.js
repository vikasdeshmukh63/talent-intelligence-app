import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import {
  getMyJob,
  listJobApplications,
  listMyJobs,
  updateApplicationStatus,
} from "../controllers/recruiter.controller.js";

const router = Router();

router.get("/jobs", authenticate, requireRole("recruiter", "admin"), listMyJobs);
router.get("/jobs/:jobId", authenticate, requireRole("recruiter", "admin"), getMyJob);
router.get(
  "/jobs/:jobId/applications",
  authenticate,
  requireRole("recruiter", "admin"),
  listJobApplications
);
router.patch(
  "/applications/:id",
  authenticate,
  requireRole("recruiter", "admin"),
  updateApplicationStatus
);

export default router;

