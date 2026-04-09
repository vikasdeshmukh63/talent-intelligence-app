import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { createJob, deleteJob, getOpenJobById, listOpenJobs } from "../controllers/job.controller.js";
import { upload } from "../middlewares/upload.middleware.js";
import { extractJdFromPdf } from "../controllers/jd-extract.controller.js";

const router = Router();

router.get("/", listOpenJobs);
router.get("/:id", getOpenJobById);
router.post("/", authenticate, requireRole("recruiter", "admin"), createJob);
router.post(
  "/extract",
  authenticate,
  requireRole("recruiter", "admin"),
  upload.single("file"),
  extractJdFromPdf
);
router.delete("/:id", authenticate, requireRole("recruiter", "admin"), deleteJob);

export default router;
