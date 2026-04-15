// server/routes/complaint.routes.js
import { Router } from "express";
import multer from "multer";
import auth from "../middleware/auth.js";
import roleGuard from "../middleware/roleGuard.js";
import {
  createComplaint,
  getCitizenComplaints,
  getComplaintDetail,
  approveComplaintResolution,
  getAllComplaints,
  assignComplaint,
  resolveComplaint,
} from "../controllers/complaint.controller.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

// ── Citizen ───────────────────────────────────────────────────────────────────
router.post("/create", auth, upload.single("photo"), createComplaint);
router.get("/citizen", auth, getCitizenComplaints);
router.get("/:complaint_id/detail", auth, getComplaintDetail);
router.post("/:complaint_id/approve", auth, roleGuard(["citizen"]), approveComplaintResolution);

// ── Admin ─────────────────────────────────────────────────────────────────────
router.get("/all", auth, roleGuard(["admin"]), getAllComplaints);
router.patch("/:complaint_id/assign", auth, roleGuard(["admin"]), assignComplaint);

// ── Worker ────────────────────────────────────────────────────────────────────
router.patch("/:complaint_id/resolve", auth, roleGuard(["worker", "admin"]), resolveComplaint);

export default router;