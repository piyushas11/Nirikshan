// server/controllers/complaint.controller.js
import { supabase } from "../config/supabase.js";
import { uploadPhoto } from "../services/storage.service.js";
import { notifyComplaintUpdate } from "../services/notification.service.js";

// POST /complaint/create
export async function createComplaint(req, res) {
  try {
    const citizen_id = req.user.id;
    const { batch_id, description, gps_lat, gps_lng } = req.body;

    if (!description) {
      return res.status(400).json({ error: "description is required" });
    }

    let photo_url = null;
    if (req.file) {
      photo_url = await uploadPhoto(req.file, `complaints/${citizen_id}`);
    }

    const { data: complaint, error } = await supabase
      .from("complaints")
      .insert({
        citizen_id,
        batch_id: batch_id || null,
        description,
        gps_lat: gps_lat ? parseFloat(gps_lat) : null,
        gps_lng: gps_lng ? parseFloat(gps_lng) : null,
        photo_url,
        status: "OPEN",
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({ success: true, complaint });
  } catch (err) {
    console.error("createComplaint error:", err);
    return res.status(500).json({ error: err.message });
  }
}

// GET /complaint/citizen  — all complaints for the logged-in citizen
export async function getCitizenComplaints(req, res) {
  try {
    const citizen_id = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const from = (page - 1) * limit;
    const to = from + Number(limit) - 1;

    const { data, error, count } = await supabase
      .from("complaints")
      .select("*", { count: "exact" })
      .eq("citizen_id", citizen_id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    return res.json({ complaints: data, total: count, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error("getCitizenComplaints error:", err);
    return res.status(500).json({ error: err.message });
  }
}

// GET /complaint/:complaint_id/detail
export async function getComplaintDetail(req, res) {
  try {
    const { complaint_id } = req.params;
    const citizen_id = req.user.id;

    const { data: complaint, error } = await supabase
      .from("complaints")
      .select("*")
      .eq("id", complaint_id)
      .single();

    if (error || !complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    // Citizens can only view their own complaints; admins/workers can see all
    if (req.user.role === "citizen" && complaint.citizen_id !== citizen_id) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Build timeline from status history (stored in complaint_events if available)
    const { data: events } = await supabase
      .from("complaint_events")
      .select("*")
      .eq("complaint_id", complaint_id)
      .order("created_at", { ascending: true })
      .then((r) => r)
      .catch(() => ({ data: [] }));

    return res.json({ complaint, timeline: events || [] });
  } catch (err) {
    console.error("getComplaintDetail error:", err);
    return res.status(500).json({ error: err.message });
  }
}

// POST /complaint/:complaint_id/approve  — citizen approves/rejects resolution
export async function approveComplaintResolution(req, res) {
  try {
    const { complaint_id } = req.params;
    const citizen_id = req.user.id;
    const { approved, feedback } = req.body; // approved: boolean

    const { data: complaint, error: fetchErr } = await supabase
      .from("complaints")
      .select("id, citizen_id, status")
      .eq("id", complaint_id)
      .single();

    if (fetchErr || !complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    if (complaint.citizen_id !== citizen_id) {
      return res.status(403).json({ error: "Only the complaint owner can approve resolution" });
    }

    if (complaint.status !== "RESOLVED") {
      return res.status(400).json({ error: "Complaint is not yet in RESOLVED state" });
    }

    const newStatus = approved ? "CLOSED" : "REOPEN";
    const { error: updateErr } = await supabase
      .from("complaints")
      .update({ status: newStatus, citizen_feedback: feedback || null })
      .eq("id", complaint_id);

    if (updateErr) throw updateErr;

    // Log event
    await supabase.from("complaint_events").insert({
      complaint_id,
      event_type: approved ? "CITIZEN_APPROVED" : "CITIZEN_REJECTED",
      metadata: { citizen_id, feedback },
      created_at: new Date().toISOString(),
    }).then(() => {}).catch(() => {});

    await notifyComplaintUpdate(complaint_id, newStatus);

    return res.json({ success: true, complaint_id, new_status: newStatus });
  } catch (err) {
    console.error("approveComplaintResolution error:", err);
    return res.status(500).json({ error: err.message });
  }
}

// ─── Admin helpers ────────────────────────────────────────────────────────────

// GET /complaint/all  — admin only
export async function getAllComplaints(req, res) {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const from = (page - 1) * limit;
    const to = from + Number(limit) - 1;

    let query = supabase.from("complaints").select("*", { count: "exact" }).order("created_at", { ascending: false }).range(from, to);
    if (status) query = query.eq("status", status);

    const { data, error, count } = await query;
    if (error) throw error;

    return res.json({ complaints: data, total: count, page: Number(page), limit: Number(limit) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// PATCH /complaint/:complaint_id/assign  — admin assigns to worker
export async function assignComplaint(req, res) {
  try {
    const { complaint_id } = req.params;
    const { worker_id } = req.body;

    const { error } = await supabase
      .from("complaints")
      .update({ assigned_worker_id: worker_id, status: "ASSIGNED" })
      .eq("id", complaint_id);

    if (error) throw error;

    return res.json({ success: true, complaint_id, assigned_to: worker_id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// PATCH /complaint/:complaint_id/resolve  — worker marks as resolved
export async function resolveComplaint(req, res) {
  try {
    const { complaint_id } = req.params;
    const { clearance_photo_url, notes } = req.body;

    const { error } = await supabase
      .from("complaints")
      .update({ status: "RESOLVED", clearance_photo_url, resolution_notes: notes })
      .eq("id", complaint_id);

    if (error) throw error;

    const { data: complaint } = await supabase.from("complaints").select("citizen_id").eq("id", complaint_id).single();
    if (complaint) await notifyComplaintUpdate(complaint_id, "RESOLVED");

    return res.json({ success: true, complaint_id, new_status: "RESOLVED" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}