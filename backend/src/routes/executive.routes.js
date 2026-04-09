import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { getExecutiveOverview } from "../controllers/executive.controller.js";

const router = Router();

router.get("/overview", authenticate, requireRole("ceo_chro", "admin"), getExecutiveOverview);

export default router;

