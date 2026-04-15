// server/routes/qr.routes.js
import { Router } from "express";
import auth from "../middleware/auth.js";
import { getBatchQR, decodeQR } from "../controllers/qr.controller.js";

const router = Router();

// GET /qr/batch/:batch_id  — returns base64 QR image + tracking URL for a batch
router.get("/batch/:batch_id", auth, getBatchQR);

// POST /qr/decode  — decode a raw QR payload string → batch info
router.post("/decode", auth, decodeQR);

export default router;