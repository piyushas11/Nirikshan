const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const roleGuard = require("../middleware/roleGuard");
const { supabaseAdmin } = require("../config/supabase");

// ─── GET /citizen/profile ──────────────────────────────────────────────────
router.get("/profile", auth, roleGuard(["citizen"]), async (req, res, next) => {
  try {
    const citizen_id = req.user.id;

    // Try citizen_profiles table first
    const { data: profile } = await supabaseAdmin
      .from("citizen_profiles")
      .select("*")
      .eq("citizen_id", citizen_id)
      .single();

    // Count totals live if profile row doesn't exist yet
    const [{ count: totalBatches }, { count: resolvedComplaints }] =
      await Promise.all([
        supabaseAdmin
          .from("batches")
          .select("*", { count: "exact", head: true })
          .eq("citizen_id", citizen_id),
        supabaseAdmin
          .from("complaints")
          .select("*", { count: "exact", head: true })
          .eq("citizen_id", citizen_id)
          .eq("status", "RESOLVED"),
      ]);

    return res.json({
      segregation_score: profile?.segregation_score ?? 0,
      total_batches: totalBatches ?? 0,
      total_checks: profile?.total_checks ?? 0,
      complaints_resolved: resolvedComplaints ?? 0,
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /citizen/activity ─────────────────────────────────────────────────
// Returns merged recent activity: batch events + complaint events
router.get("/activity", auth, roleGuard(["citizen"]), async (req, res, next) => {
  try {
    const citizen_id = req.user.id;

    // Get citizen's batch IDs
    const { data: batches } = await supabaseAdmin
      .from("batches")
      .select("id")
      .eq("citizen_id", citizen_id);

    const batchIds = (batches || []).map((b) => b.id);

    // Get citizen's complaint IDs
    const { data: complaints } = await supabaseAdmin
      .from("complaints")
      .select("id")
      .eq("citizen_id", citizen_id);

    const complaintIds = (complaints || []).map((c) => c.id);

    const [batchEvents, complaintEvents] = await Promise.all([
      batchIds.length > 0
        ? supabaseAdmin
            .from("batch_events")
            .select("*")
            .in("batch_id", batchIds)
            .order("timestamp", { ascending: false })
            .limit(10)
        : { data: [] },
      complaintIds.length > 0
        ? supabaseAdmin
            .from("complaint_events")
            .select("*")
            .in("complaint_id", complaintIds)
            .order("timestamp", { ascending: false })
            .limit(10)
        : { data: [] },
    ]);

    // Merge and sort
    const allEvents = [
      ...(batchEvents.data || []).map((e) => ({
        label: `Batch ${e.event_type.replace(/_/g, " ")}`,
        icon: "📦",
        timestamp: e.timestamp,
        description: e.metadata?.note || "",
        completed: true,
      })),
      ...(complaintEvents.data || []).map((e) => ({
        label: `Complaint ${e.event_type.replace(/_/g, " ")}`,
        icon: "📋",
        timestamp: e.timestamp,
        description: e.metadata?.note || "",
        completed: true,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 15);

    return res.json(allEvents);
  } catch (err) {
    next(err);
  }
});

// ─── GET /citizen/segregation-history ─────────────────────────────────────
router.get(
  "/segregation-history",
  auth,
  roleGuard(["citizen"]),
  async (req, res, next) => {
    try {
      const citizen_id = req.user.id;

      const { data, error } = await supabaseAdmin
        .from("segregation_checks")
        .select("id, score, wrong_items_count, created_at")
        .eq("citizen_id", citizen_id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      return res.json(data || []);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;