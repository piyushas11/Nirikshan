// server/routes/batch.routes.js
import { Router } from "express";
import multer from "multer";
import  auth  from "../middleware/auth.js";
import  roleGuard from "../middleware/roleGuard.js";
import {
  citizenCreateBatch,
  getCitizenBatches,
  getBatchTimeline,
  updateBatchStatus,
} from "../controllers/batch.controller.js";

const router = Router();

// Multer: store in memory, 10 MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

// ── Citizen routes ────────────────────────────────────────────────────────────
// Create a new waste batch
router.post("/citizen-create", upload.single("photo"), citizenCreateBatch);

// List all batches for the logged-in citizen
router.get("/citizen", auth, getCitizenBatches);

// ── Public route ──────────────────────────────────────────────────────────────
// Get full lifecycle timeline for any batch (used by QR scan landing page)
router.get("/:batch_id/timeline", getBatchTimeline);

// ── Worker / Admin routes ─────────────────────────────────────────────────────
// Update a batch's status (e.g. PICKED_UP, PROCESSED)
router.patch(
  "/:batch_id/status",
  auth,
  roleGuard(["worker", "admin"]),
  updateBatchStatus
);

export default router;