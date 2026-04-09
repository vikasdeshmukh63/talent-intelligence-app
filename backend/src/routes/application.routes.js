import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { applyToJob, listMyApplications } from "../controllers/application.controller.js";

const router = Router();

router.get("/", authenticate, requireRole("candidate"), listMyApplications);
router.post("/", authenticate, requireRole("candidate"), applyToJob);

export default router;

