// server/controllers/qr.controller.js
import QRCode from "qrcode";
import { supabase } from "../config/supabase.js";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

/**
 * Generate a base64-encoded QR code image string
 * @param {string} payload - data to encode
 * @returns {Promise<string>} base64 data URL (image/png)
 */
export async function generateQRBase64(payload) {
  const base64 = await QRCode.toDataURL(payload, {
    width: 300,
    margin: 2,
    color: { dark: "#111827", light: "#FFFFFF" },
  });
  return base64; // "data:image/png;base64,..."
}

/**
 * Build the public tracking URL for a batch
 */
export function createTrackingUrl(batch_id) {
  return `${FRONTEND_URL}/track/batch/${batch_id}`;
}

// GET /qr/batch/:batch_id  — generate/return QR for a batch the citizen owns
export async function getBatchQR(req, res) {
  try {
    const { batch_id } = req.params;
    const citizen_id = req.user.id;

    // Verify ownership (citizens can only get QR for their own batches;
    // admins/workers may bypass the citizen_id filter)
    let query = supabase
      .from("batches")
      .select("id, citizen_id, created_at")
      .eq("id", batch_id);

    if (req.user.role === "citizen") {
      query = query.eq("citizen_id", citizen_id);
    }

    const { data: batch, error } = await query.single();

    if (error || !batch) {
      return res.status(404).json({ error: "Batch not found or access denied" });
    }

    const qrPayload = `${batch.id}|${batch.citizen_id}|${batch.created_at}`;
    const qr_code_image = await generateQRBase64(qrPayload);
    const tracking_url = createTrackingUrl(batch.id);

    return res.json({ batch_id, qr_code_image, tracking_url });
  } catch (err) {
    console.error("getBatchQR error:", err);
    return res.status(500).json({ error: err.message });
  }
}

// POST /qr/decode  — decode a QR payload string and return batch info
export async function decodeQR(req, res) {
  try {
    const { payload } = req.body;
    if (!payload) return res.status(400).json({ error: "payload is required" });

    // Payload format: "BATCH_ID|CITIZEN_ID|TIMESTAMP"
    const parts = payload.split("|");
    if (parts.length < 3) {
      return res.status(400).json({ error: "Invalid QR payload format" });
    }

    const [batch_id, citizen_id, timestamp] = parts;

    const { data: batch, error } = await supabase
      .from("batches")
      .select("id, waste_type, status, created_at, citizen_id")
      .eq("id", batch_id)
      .single();

    if (error || !batch) {
      return res.status(404).json({ error: "Batch not found" });
    }

    // Verify citizen_id matches
    if (batch.citizen_id !== citizen_id) {
      return res.status(403).json({ error: "QR payload citizen mismatch" });
    }

    const tracking_url = createTrackingUrl(batch_id);

    return res.json({ valid: true, batch_id, citizen_id, timestamp, batch, tracking_url });
  } catch (err) {
    console.error("decodeQR error:", err);
    return res.status(500).json({ error: err.message });
  }
}