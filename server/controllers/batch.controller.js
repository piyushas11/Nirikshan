// server/controllers/batch.controller.js
import { supabase } from "../config/supabase.js";
import { generateQRBase64, createTrackingUrl } from "./qr.controller.js";
import { uploadPhoto } from "../services/storage.service.js";
import { updateCitizenScore } from "../services/score.service.js";
import { notifyBatchUpdate } from "../services/notification.service.js";

// POST /batch/citizen-create
export async function citizenCreateBatch(req, res) {
  try {
    const citizen_id = req.user.id;
    const { waste_type, notes, gps_lat, gps_lng } = req.body;

    if (!waste_type) {
      return res.status(400).json({ error: "waste_type is required" });
    }

    // Upload photo if provided
    let photo_url = null;
    if (req.file) {
      photo_url = await uploadPhoto(req.file, `batches/${citizen_id}`);
    }

    // Insert batch record
    const { data: batch, error: batchError } = await supabase
      .from("batches")
      .insert({
        citizen_id,
        waste_type,
        gps_lat: gps_lat ? parseFloat(gps_lat) : null,
        gps_lng: gps_lng ? parseFloat(gps_lng) : null,
        photo_url,
        status: "CREATED",
        notes: notes || null,
      })
      .select()
      .single();

    if (batchError) throw batchError;

    // Insert initial batch_event
    const { error: eventError } = await supabase.from("batch_events").insert({
      batch_id: batch.id,
      event_type: "CREATED",
      metadata: { waste_type, notes, gps_lat, gps_lng, citizen_id },
      timestamp: new Date().toISOString(),
    });

    if (eventError) throw eventError;

    // Generate QR code
    const qrPayload = `${batch.id}|${citizen_id}|${batch.created_at}`;
    const qr_code_image = await generateQRBase64(qrPayload);
    const tracking_url = createTrackingUrl(batch.id);

    // Update citizen score async (don't block response)
    updateCitizenScore(citizen_id).catch(console.error);

    return res.status(201).json({
      success: true,
      batch_id: batch.id,
      batch,
      qr_code_image,
      tracking_url,
    });
  } catch (err) {
    console.error("citizenCreateBatch error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}

// GET /batch/citizen  — list all batches for the logged-in citizen
export async function getCitizenBatches(req, res) {
  try {
    const citizen_id = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const from = (page - 1) * limit;
    const to = from + Number(limit) - 1;

    const { data, error, count } = await supabase
      .from("batches")
      .select("*", { count: "exact" })
      .eq("citizen_id", citizen_id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    return res.json({ batches: data, total: count, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error("getCitizenBatches error:", err);
    return res.status(500).json({ error: err.message });
  }
}

// GET /batch/:batch_id/timeline  — public, no auth required
export async function getBatchTimeline(req, res) {
  try {
    const { batch_id } = req.params;

    const { data: batch, error: batchError } = await supabase
      .from("batches")
      .select("id, waste_type, status, gps_lat, gps_lng, photo_url, created_at, updated_at")
      .eq("id", batch_id)
      .single();

    if (batchError || !batch) {
      return res.status(404).json({ error: "Batch not found" });
    }

    const { data: events, error: eventsError } = await supabase
      .from("batch_events")
      .select("*")
      .eq("batch_id", batch_id)
      .order("timestamp", { ascending: true });

    if (eventsError) throw eventsError;

    // Normalise into timeline steps with labels/icons
    const STAGE_META = {
      CREATED:    { label: "Batch Created",         icon: "📦", color: "blue" },
      PICKED_UP:  { label: "Picked Up by Worker",   icon: "🚛", color: "yellow" },
      CENTER:     { label: "At Processing Center",  icon: "🏭", color: "purple" },
      SEGREGATED: { label: "Waste Segregated",       icon: "♻️", color: "orange" },
      PROCESSED:  { label: "Processing Complete",   icon: "✅", color: "green" },
    };

    const timeline = events.map((ev) => ({
      ...ev,
      ...(STAGE_META[ev.event_type] || { label: ev.event_type, icon: "🔵", color: "gray" }),
    }));

    return res.json({ batch, timeline });
  } catch (err) {
    console.error("getBatchTimeline error:", err);
    return res.status(500).json({ error: err.message });
  }
}

// PATCH /batch/:batch_id/status  — worker/admin only
export async function updateBatchStatus(req, res) {
  try {
    const { batch_id } = req.params;
    const { status, metadata = {} } = req.body;
    const updater_id = req.user.id;

    const VALID_STATUSES = ["PICKED_UP", "CENTER", "SEGREGATED", "PROCESSED"];
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` });
    }

    const { data: batch, error: fetchError } = await supabase
      .from("batches")
      .select("id, citizen_id, status")
      .eq("id", batch_id)
      .single();

    if (fetchError || !batch) {
      return res.status(404).json({ error: "Batch not found" });
    }

    // Update batch
    const updateFields = { status, updated_at: new Date().toISOString() };
    if (req.user.role === "worker") updateFields.worker_id = updater_id;

    const { error: updateError } = await supabase
      .from("batches")
      .update(updateFields)
      .eq("id", batch_id);

    if (updateError) throw updateError;

    // Insert event
    const { error: eventError } = await supabase.from("batch_events").insert({
      batch_id,
      event_type: status,
      metadata: { ...metadata, updated_by: updater_id },
      timestamp: new Date().toISOString(),
    });

    if (eventError) throw eventError;

    // Notify citizen via realtime
    await notifyBatchUpdate(batch.citizen_id, batch_id, status);

    return res.json({ success: true, batch_id, new_status: status });
  } catch (err) {
    console.error("updateBatchStatus error:", err);
    return res.status(500).json({ error: err.message });
  }
}