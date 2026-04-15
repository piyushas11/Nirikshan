// server/services/score.service.js
import { supabase } from "../config/supabase.js";

/**
 * Recalculate and persist the credibility score for a citizen.
 * Score is a weighted composite of:
 *   - Avg segregation quality (40%)
 *   - Batch reporting frequency (30%)
 *   - Complaint validity ratio (30%)
 */
export async function updateCitizenScore(citizen_id) {
  try {
    // 1. Segregation score — average of last 30 checks
    const { data: checks } = await supabase
      .from("segregation_checks")
      .select("score")
      .eq("citizen_id", citizen_id)
      .order("checked_at", { ascending: false })
      .limit(30);

    const avgSegregation =
      checks && checks.length > 0
        ? checks.reduce((sum, c) => sum + (c.score || 0), 0) / checks.length
        : 50; // default neutral score

    // 2. Batch reporting — # batches in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { count: batchCount } = await supabase
      .from("batches")
      .select("id", { count: "exact", head: true })
      .eq("citizen_id", citizen_id)
      .gte("created_at", thirtyDaysAgo);

    // Map batch count to 0-100 (cap at 20 batches = 100)
    const batchScore = Math.min(100, ((batchCount || 0) / 20) * 100);

    // 3. Complaint validity — ratio of CLOSED (valid) to total complaints
    const { data: complaints } = await supabase
      .from("complaints")
      .select("status")
      .eq("citizen_id", citizen_id);

    let validityScore = 70; // default
    if (complaints && complaints.length > 0) {
      const closed = complaints.filter((c) => c.status === "CLOSED").length;
      validityScore = (closed / complaints.length) * 100;
    }

    // Weighted composite
    const credibilityScore = Math.round(
      avgSegregation * 0.4 + batchScore * 0.3 + validityScore * 0.3
    );

    // Persist
    const { error } = await supabase
      .from("citizen_profiles")
      .upsert(
        { citizen_id, credibility_score: credibilityScore, updated_at: new Date().toISOString() },
        { onConflict: "citizen_id" }
      );

    if (error) throw error;

    return credibilityScore;
  } catch (err) {
    console.error("updateCitizenScore error:", err.message);
    return null;
  }
}

/**
 * Get the credibility tier label from a numeric score.
 */
export function getCredibilityTier(score) {
  if (score >= 85) return { tier: "Excellent", color: "green" };
  if (score >= 65) return { tier: "Good", color: "blue" };
  if (score >= 40) return { tier: "Fair", color: "yellow" };
  return { tier: "Poor", color: "red" };
}