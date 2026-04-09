import { Router } from "express";
import { invokeAi, sendEmail } from "../controllers/ai.controller.js";

const router = Router();
router.post("/invoke", invokeAi);
router.post("/email", sendEmail);

export default router;
