// server/controllers/ai.controller.js
import { uploadPhoto } from "../services/storage.service.js";
import { runSegregationCheck, generateWeeklyReportOllama } from "../services/ollama.service.js";
import { supabase } from "../config/supabase.js";

// POST /ai/segregation-check
// Expects: multipart/form-data with field "photo"
export async function segregationCheck(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Photo is required for segregation check" });
    }

    const citizen_id = req.user.id;

    // Upload to storage so Ollama can reference it (or pass raw buffer)
    const photo_url = await uploadPhoto(req.file, `segregation/${citizen_id}`);

    // Call Ollama vision model
    const result = await runSegregationCheck(req.file.buffer, req.file.mimetype);

    // Persist the score to citizen profile
    if (result.score !== undefined) {
      // Upsert into a segregation_checks table (optional — falls back gracefully if table absent)
      await supabase.from("segregation_checks").insert({
        citizen_id,
        photo_url,
        score: result.score,
        wrong_items: result.wrong_items || [],
        improvement_steps: result.improvement_steps || [],
        checked_at: new Date().toISOString(),
      }).then(() => {}).catch(() => {}); // non-blocking

      // Update citizen's running average score
      await supabase.rpc("update_citizen_avg_score", {
        p_citizen_id: citizen_id,
        p_new_score: result.score,
      }).then(() => {}).catch(() => {});
    }

    return res.json({
      success: true,
      photo_url,
      score: result.score ?? null,
      wrong_items: result.wrong_items ?? [],
      improvement_steps: result.improvement_steps ?? [],
      raw_analysis: result.raw_analysis ?? null,
    });
  } catch (err) {
    console.error("segregationCheck error:", err);
    return res.status(500).json({ error: err.message || "AI analysis failed" });
  }
}

// POST /ai/weekly-report  — admin only
export async function generateWeeklyReport(req, res) {
  try {
    const { zone_id, week_start } = req.body;

    // Fetch summary data for the week
    const startDate = week_start || getLastMonday();
    const endDate = new Date(new Date(startDate).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    let batchQuery = supabase
      .from("batches")
      .select("id, waste_type, status, created_at")
      .gte("created_at", startDate)
      .lt("created_at", endDate);

    if (zone_id) {
      // Assumes batches have a zone_id field in a real deployment
      batchQuery = batchQuery.eq("zone_id", zone_id);
    }

    const { data: batches } = await batchQuery;

    const { data: complaints } = await supabase
      .from("complaints")
      .select("id, status, created_at")
      .gte("created_at", startDate)
      .lt("created_at", endDate);

    const summaryData = {
      total_batches: batches?.length ?? 0,
      processed: batches?.filter((b) => b.status === "PROCESSED").length ?? 0,
      complaints: complaints?.length ?? 0,
      resolved_complaints: complaints?.filter((c) => c.status === "RESOLVED").length ?? 0,
      waste_breakdown: groupBy(batches ?? [], "waste_type"),
    };

    const report = await generateWeeklyReportOllama(summaryData, startDate);

    return res.json({ success: true, week_start: startDate, report, summary: summaryData });
  } catch (err) {
    console.error("generateWeeklyReport error:", err);
    return res.status(500).json({ error: err.message });
  }
}

// Helpers
function getLastMonday() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const k = item[key] ?? "unknown";
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
}