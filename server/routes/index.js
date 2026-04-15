import { Router } from "express";
import batchRoutes from "./batch.routes.js";
import aiRoutes from "./ai.routes.js";
import qrRoutes from "./qr.routes.js";
import complaintRoutes from "./complaint.routes.js";

const router = Router();

router.use("/batch", batchRoutes);
router.use("/ai", aiRoutes);
router.use("/qr", qrRoutes);
router.use("/complaint", complaintRoutes);

export default router;