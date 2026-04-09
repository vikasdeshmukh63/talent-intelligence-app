import { Router } from "express";
import { deleteFile, downloadFile, uploadFile } from "../controllers/upload.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = Router();
router.post("/", upload.single("file"), uploadFile);
router.get("/download", authenticate, requireRole("recruiter", "admin"), downloadFile);
router.delete("/", deleteFile);

export default router;
