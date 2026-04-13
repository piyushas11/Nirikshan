// src/lib/supabase.js
// ─────────────────────────────────────────────────────────────
// Replace the placeholders below with your actual Supabase project values.
// You can find them in: Supabase Dashboard → Settings → API
// ─────────────────────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL  = "https://bhdzpncpyhxmgjqqrfhx.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoZHpwbmNweWh4bWdqcXFyZmh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNzI1ODcsImV4cCI6MjA4OTc0ODU4N30.BG93_sDgsi2Cw2qFW9GsVXAN-aU9L3SJ7GvonBrXSl8";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// ── Generic helpers ──────────────────────────────────────────

export async function fetchAll(table, options = {}) {
  let q = supabase.from(table).select(options.select || "*");
  if (options.eq)     Object.entries(options.eq).forEach(([k,v]) => { q = q.eq(k, v); });
  if (options.neq)    Object.entries(options.neq).forEach(([k,v])=> { q = q.neq(k, v); });
  if (options.order)  q = q.order(options.order, { ascending: options.asc ?? false });
  if (options.limit)  q = q.limit(options.limit);
  const { data, error } = await q;
  if (error) { console.error(`[supabase] ${table}:`, error.message); return []; }
  return data ?? [];
}

export async function updateRow(table, id, updates) {
  const { data, error } = await supabase.from(table).update(updates).eq("id", id).select().single();
  if (error) { console.error(`[supabase] update ${table}:`, error.message); return null; }
  return data;
}

export async function insertRow(table, row) {
  const { data, error } = await supabase.from(table).insert(row).select().single();
  if (error) { console.error(`[supabase] insert ${table}:`, error.message); return null; }
  return data;
}

// ── Domain-specific fetchers ──────────────────────────────────

export const db = {
  // Contractors
  contractors: {
    list:   (filters = {}) => fetchAll("contractors", { order: "score", ...filters }),
    get:    (id)           => supabase.from("contractors").select("*").eq("id", id).single().then(r => r.data),
    update: (id, data)     => updateRow("contractors", id, data),
  },

  // Workers
  workers: {
    list:         (filters = {}) => fetchAll("workers", { order: "score", ...filters }),
    get:          (id)           => supabase.from("workers").select("*").eq("id", id).single().then(r => r.data),
    update:       (id, data)     => updateRow("workers", id, data),
    routeStops:   (workerId)     => fetchAll("worker_route_stops", {
                                      eq: { worker_id: workerId, route_date: new Date().toISOString().slice(0,10) },
                                      order: "stop_number", asc: true
                                    }),
  },

  // Anomalies
  anomalies: {
    list:    (filters = {}) => fetchAll("anomalies", { order: "created_at", ...filters }),
    get:     (id)           => supabase.from("anomalies").select("*").eq("id", id).single().then(r => r.data),
    resolve: (id)           => updateRow("anomalies", id, { status: "RESOLVED", resolved_at: new Date().toISOString() }),
    update:  (id, data)     => updateRow("anomalies", id, data),
  },

  // Complaints
  complaints: {
    list:    (filters = {}) => fetchAll("complaints", { order: "created_at", ...filters }),
    get:     (id)           => supabase.from("complaints").select("*").eq("id", id).single().then(r => r.data),
    assign:  (id, workerId, workerName, contractorId) =>
               updateRow("complaints", id, {
                 status: "ASSIGNED",
                 assigned_worker_id: workerId,
                 assigned_worker_name: workerName,
                 assigned_contractor_id: contractorId,
               }),
    resolve: (id, note) => updateRow("complaints", id, {
                 status: "CLEARED",
                 resolution_note: note,
                 resolved_at: new Date().toISOString(),
               }),
    update:  (id, data) => updateRow("complaints", id, data),
  },

  // Batches
  batches: {
    list:   (filters = {}) => fetchAll("batches", { order: "created_at", ...filters }),
    get:    (id)           => supabase.from("batches").select("*").eq("id", id).single().then(r => r.data),
    update: (id, data)     => updateRow("batches", id, data),
    events: (batchId)      => fetchAll("batch_events", { eq: { batch_id: batchId }, order: "timestamp", asc: true }),
  },

  // Zones
  zones: {
    list:   ()             => fetchAll("zones", { order: "name", asc: true }),
    get:    (id)           => supabase.from("zones").select("*").eq("id", id).single().then(r => r.data),
    insert: (row)          => insertRow("zones", row),
    update: (id, data)     => updateRow("zones", id, data),
  },

  // Reports
  reports: {
    list:   ()   => fetchAll("weekly_reports", { order: "generated_at" }),
    latest: ()   => fetchAll("weekly_reports", { order: "generated_at", limit: 1 }).then(r => r[0] ?? null),
    insert: (row)=> insertRow("weekly_reports", row),
  },

  // Dashboard stats (aggregated)
  dashboardStats: async () => {
    const [contractors, workers, anomalies, complaints, batches] = await Promise.all([
      fetchAll("contractors"),
      fetchAll("workers"),
      fetchAll("anomalies", { eq: { status: "OPEN" } }),
      fetchAll("complaints", { eq: { status: "PENDING" } }),
      fetchAll("batches"),
    ]);
    return {
      activeTrucks:    contractors.reduce((s, c) => s + (c.trucks_count || 0), 0),
      batchesToday:    batches.length,
      openAnomalies:   anomalies.length,
      highAnomalies:   anomalies.filter(a => a.severity === "HIGH").length,
      pendingComplaints: complaints.length,
      activeWorkers:   workers.filter(w => w.status === "ON_ROUTE").length,
      avgCredibility:  contractors.length
        ? (contractors.reduce((s, c) => s + c.score, 0) / contractors.length).toFixed(1)
        : 0,
      flaggedContractors: contractors.filter(c => c.status === "FLAGGED").length,
    };
  },
};

export default supabase;