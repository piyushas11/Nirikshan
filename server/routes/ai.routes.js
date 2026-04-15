// server/routes/ai.routes.js
import { Router } from "express";
import multer from "multer";
import auth from "../middleware/auth.js";
import roleGuard from "../middleware/roleGuard.js";
import { segregationCheck, generateWeeklyReport } from "../controllers/ai.controller.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

// POST /ai/segregation-check  — citizen uploads photo for AI segregation analysis
router.post("/segregation-check", auth, upload.single("photo"), segregationCheck);

// POST /ai/weekly-report  — admin-only weekly report generation via Ollama
router.post("/weekly-report", auth, roleGuard(["admin"]), generateWeeklyReport);

export default router;