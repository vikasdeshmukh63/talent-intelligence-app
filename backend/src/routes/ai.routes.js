import { Router } from "express";
import { invokeAi, sendEmail } from "../controllers/ai.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();
router.post("/invoke", invokeAi);
router.post("/email", authenticate, sendEmail);

export default router;
