import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../hooks/useAuth";
import axios from "axios";
 
const STATUSES = ["Arrived", "Collected", "Skipped"];
 
export default function StopDetail() {
  const { stopId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
 
  const [stop, setStop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
 
  const [status, setStatus] = useState("");
  const [kg, setKg] = useState("");
  const [skipReason, setSkipReason] = useState("");
  const [batchId, setBatchId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
 
  useEffect(() => { fetchStop(); }, [stopId]);
 
  async function fetchStop() {
    setLoading(true);
    const { data } = await supabase
      .from("stops")
      .select("*, routes(worker_id, date)")
      .eq("id", stopId)
      .single();
    setStop(data);
    setStatus(data?.status || "Pending");
    setKg(data?.kg_collected?.toString() || "");
    setBatchId(data?.batch_id || null);
    setLoading(false);
  }
 
  async function handleSave() {
    setError(""); setSuccess("");
    if (status === "Skipped" && !skipReason.trim()) {
      setError("Please provide a reason for skipping.");
      return;
    }
    if (status === "Collected" && (!kg || isNaN(Number(kg)))) {
      setError("Please enter kg collected.");
      return;
    }
    setSaving(true);
 
    // Update stop
    const update = { status, updated_at: new Date().toISOString() };
    if (status === "Collected") update.kg_collected = parseFloat(kg);
    if (status === "Skipped") update.skip_reason = skipReason;
 
    const { error: err } = await supabase.from("stops").update(update).eq("id", stopId);
    if (err) { setError(err.message); setSaving(false); return; }
 
    // Auto-generate batch if collected
    if (status === "Collected" && !batchId) {
      const { data: batch } = await supabase
        .from("batches")
        .insert({
          stop_id: stopId,
          worker_id: user.id,
          waste_type: stop.waste_type,
          kg: parseFloat(kg),
          status: "Collected",
          collected_at: new Date().toISOString(),
          location_address: stop.address,
        })
        .select("id")
        .single();
      if (batch) {
        await supabase.from("stops").update({ batch_id: batch.id }).eq("id", stopId);
        setBatchId(batch.id);
      }
    }
 
    setSuccess("Stop updated successfully.");
    setSaving(false);
    fetchStop();
  }
 
  if (loading) return <div style={{ color: "#555", fontFamily: "'DM Mono'", textAlign: "center", padding: 60, letterSpacing: 2 }}>LOADING…</div>;
  if (!stop) return <div style={{ color: "#f87171", fontFamily: "'DM Mono'", textAlign: "center", padding: 60 }}>Stop not found.</div>;
 
  return (
    <div style={{ padding: "24px 20px", maxWidth: 600, margin: "0 auto", fontFamily: "'DM Mono', monospace" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Bebas+Neue&display=swap');`}</style>
 
      {/* Back */}
      <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 12, letterSpacing: 2, marginBottom: 20, padding: 0, fontFamily: "inherit" }}>
        ← BACK
      </button>
 
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "'Bebas Neue'", fontSize: 28, letterSpacing: 3, color: "#e8e8e0" }}>STOP DETAILS</div>
        <div style={{ fontSize: 13, color: "#aaa", marginTop: 4 }}>{stop.address}</div>
        <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#555", marginTop: 6 }}>
          <span>{stop.waste_type || "MIXED"}</span>
          <span>{stop.time_window || "ANYTIME"}</span>
          {stop.citizen_name && <span>{stop.citizen_name}</span>}
        </div>
      </div>
 
      {/* Status selector */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, marginBottom: 10 }}>UPDATE STATUS</div>
        <div style={{ display: "flex", gap: 10 }}>
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              style={{
                flex: 1, padding: "12px 8px", border: "1px solid",
                borderColor: status === s ? (s === "Collected" ? "#4ade80" : s === "Skipped" ? "#f87171" : "#facc15") : "#1f1f1f",
                background: status === s ? (s === "Collected" ? "#111b14" : s === "Skipped" ? "#1f0f0f" : "#1f1a0a") : "#111",
                color: status === s ? (s === "Collected" ? "#4ade80" : s === "Skipped" ? "#f87171" : "#facc15") : "#555",
                cursor: "pointer", fontSize: 11, letterSpacing: 2, fontFamily: "inherit", borderRadius: 3,
                transition: "all 0.15s",
              }}
            >{s.toUpperCase()}</button>
          ))}
        </div>
      </div>
 
      {/* Collected: kg input */}
      {status === "Collected" && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, marginBottom: 8 }}>WASTE COLLECTED (KG)</div>
          <input
            type="number"
            value={kg}
            onChange={e => setKg(e.target.value)}
            placeholder="e.g. 12.5"
            style={{ width: "100%", background: "#111", border: "1px solid #2d4a33", color: "#4ade80", padding: "12px", fontSize: 20, fontFamily: "'Bebas Neue'", letterSpacing: 2, borderRadius: 3, outline: "none" }}
          />
        </div>
      )}
 
      {/* Skipped: reason */}
      {status === "Skipped" && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, marginBottom: 8 }}>REASON FOR SKIPPING *</div>
          <textarea
            value={skipReason}
            onChange={e => setSkipReason(e.target.value)}
            placeholder="e.g. Citizen not present, gate locked..."
            rows={3}
            style={{ width: "100%", background: "#111", border: "1px solid #4a2020", color: "#f87171", padding: "12px", fontSize: 12, fontFamily: "inherit", borderRadius: 3, outline: "none", resize: "none", letterSpacing: 0.5 }}
          />
        </div>
      )}
 
      {error && <div style={{ background: "#1f0f0f", border: "1px solid #4a2020", color: "#f87171", padding: "10px 14px", borderRadius: 3, fontSize: 12, marginBottom: 16 }}>{error}</div>}
      {success && <div style={{ background: "#111b14", border: "1px solid #2d4a33", color: "#4ade80", padding: "10px 14px", borderRadius: 3, fontSize: 12, marginBottom: 16 }}>{success}</div>}
 
      <button
        onClick={handleSave}
        disabled={saving}
        style={{ width: "100%", padding: "14px", background: saving ? "#333" : "#4ade80", color: "#000", fontSize: 13, letterSpacing: 3, fontFamily: "inherit", fontWeight: 500, cursor: saving ? "not-allowed" : "pointer", border: "none", borderRadius: 3, transition: "background 0.15s" }}
      >
        {saving ? "SAVING…" : "SAVE STATUS"}
      </button>
 
      {/* Batch info if collected */}
      {batchId && (
        <div style={{ marginTop: 24, background: "#111b14", border: "1px solid #2d4a33", padding: 16, borderRadius: 4 }}>
          <div style={{ fontSize: 10, color: "#4ade80", letterSpacing: 2, marginBottom: 6 }}>BATCH GENERATED</div>
          <div style={{ fontSize: 13, color: "#aaa", letterSpacing: 1 }}>ID: <span style={{ color: "#e8e8e0" }}>{batchId}</span></div>
          <button
            onClick={() => navigate(`/worker/qr?batchId=${batchId}`)}
            style={{ marginTop: 12, padding: "10px 18px", background: "none", border: "1px solid #4ade80", color: "#4ade80", fontSize: 11, letterSpacing: 2, fontFamily: "inherit", cursor: "pointer", borderRadius: 3 }}
          >
            GENERATE QR →
          </button>
        </div>
      )}
 
      {/* Citizen info */}
      {stop.citizen_name && (
        <div style={{ marginTop: 20, background: "#111", border: "1px solid #1f1f1f", padding: 16, borderRadius: 4 }}>
          <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, marginBottom: 8 }}>CITIZEN INFO</div>
          <div style={{ fontSize: 13, color: "#aaa" }}>{stop.citizen_name}</div>
          {stop.citizen_note && <div style={{ fontSize: 12, color: "#666", marginTop: 4, fontStyle: "italic" }}>"{stop.citizen_note}"</div>}
        </div>
      )}
    </div>
  );
}
 