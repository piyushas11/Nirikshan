import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../hooks/useAuth";
 
const STATUS_FLOW = ["Assigned", "En Route", "Reached", "Cleared"];
 
export default function ClearComplaint() {
  const { complaintId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);
 
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
 
  const [newStatus, setNewStatus] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [notes, setNotes] = useState("");
 
  useEffect(() => { fetchComplaint(); }, [complaintId]);
 
  async function fetchComplaint() {
    setLoading(true);
    const { data } = await supabase
      .from("complaints")
      .select("*")
      .eq("id", complaintId)
      .single();
    setComplaint(data);
    setNewStatus(data?.status || "Assigned");
    setLoading(false);
  }
 
  function handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }
 
  async function handleUpdate() {
    setError(""); setSuccess("");
    if (newStatus === "Cleared" && !photoFile) {
      setError("A clearance photo is required to mark as Cleared.");
      return;
    }
    setSaving(true);
 
    let photoUrl = complaint.clearance_photo_url;
 
    if (photoFile) {
      const ext = photoFile.name.split(".").pop();
      const path = `clearance/${complaintId}_${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("complaint-photos")
        .upload(path, photoFile, { upsert: true });
      if (uploadErr) { setError("Photo upload failed: " + uploadErr.message); setSaving(false); return; }
 
      const { data: urlData } = supabase.storage.from("complaint-photos").getPublicUrl(path);
      photoUrl = urlData.publicUrl;
    }
 
    const update = {
      status: newStatus,
      clearance_photo_url: photoUrl,
      worker_notes: notes || null,
      updated_at: new Date().toISOString(),
    };
    if (newStatus === "Cleared") update.cleared_at = new Date().toISOString();
 
    const { error: err } = await supabase.from("complaints").update(update).eq("id", complaintId);
    if (err) { setError(err.message); setSaving(false); return; }
 
    setSuccess("Complaint updated successfully.");
    setSaving(false);
    fetchComplaint();
  }
 
  const currentIdx = STATUS_FLOW.indexOf(complaint?.status);
  const availableStatuses = STATUS_FLOW.slice(currentIdx >= 0 ? currentIdx : 0);
 
  if (loading) return <div style={{ color: "#555", fontFamily: "'DM Mono'", textAlign: "center", padding: 60, letterSpacing: 2 }}>LOADING…</div>;
  if (!complaint) return <div style={{ color: "#f87171", fontFamily: "'DM Mono'", textAlign: "center", padding: 60 }}>Complaint not found.</div>;
 
  return (
    <div style={{ padding: "24px 20px", maxWidth: 600, margin: "0 auto", fontFamily: "'DM Mono', monospace" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Bebas+Neue&display=swap');`}</style>
 
      <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 12, letterSpacing: 2, marginBottom: 20, padding: 0, fontFamily: "inherit" }}>
        ← BACK
      </button>
 
      <div style={{ fontFamily: "'Bebas Neue'", fontSize: 28, letterSpacing: 3, color: "#e8e8e0", marginBottom: 4 }}>CLEAR COMPLAINT</div>
      <div style={{ fontSize: 11, color: "#555", letterSpacing: 1, marginBottom: 24 }}>#{complaintId.slice(-8).toUpperCase()}</div>
 
      {/* Original complaint */}
      <div style={{ background: "#111", border: "1px solid #1f1f1f", borderRadius: 4, padding: 16, marginBottom: 24 }}>
        <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, marginBottom: 8 }}>COMPLAINT DETAILS</div>
        <div style={{ fontSize: 13, color: "#ccc", marginBottom: 6 }}>{complaint.description}</div>
        <div style={{ fontSize: 11, color: "#666", marginBottom: 6 }}>{complaint.address}</div>
        {complaint.waste_type && <div style={{ display: "inline-block", fontSize: 10, color: "#888", border: "1px solid #333", padding: "2px 8px", borderRadius: 10, marginBottom: 8 }}>{complaint.waste_type}</div>}
        {complaint.photo_url && (
          <img src={complaint.photo_url} alt="Complaint" style={{ width: "100%", borderRadius: 4, marginTop: 8, maxHeight: 220, objectFit: "cover" }} />
        )}
      </div>
 
      {/* Status flow visualization */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, marginBottom: 10 }}>STATUS FLOW</div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {STATUS_FLOW.map((s, i) => {
            const done = i < currentIdx;
            const current = s === complaint.status;
            return (
              <div key={s} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", margin: "0 auto 4px",
                    background: done ? "#4ade80" : current ? "#facc15" : "#1f1f1f",
                    border: `2px solid ${done ? "#4ade80" : current ? "#facc15" : "#333"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, color: done ? "#000" : current ? "#000" : "#555",
                    fontWeight: 600,
                  }}>
                    {done ? "✓" : i + 1}
                  </div>
                  <div style={{ fontSize: 8, color: current ? "#facc15" : done ? "#4ade80" : "#444", letterSpacing: 1, textAlign: "center" }}>{s.toUpperCase()}</div>
                </div>
                {i < STATUS_FLOW.length - 1 && (
                  <div style={{ width: 20, height: 2, background: done ? "#4ade80" : "#1f1f1f", flexShrink: 0 }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
 
      {/* Update status */}
      {complaint.status !== "Cleared" && complaint.status !== "Rejected" && (
        <>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, marginBottom: 10 }}>UPDATE STATUS TO</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {availableStatuses.map(s => (
                <button
                  key={s}
                  onClick={() => setNewStatus(s)}
                  style={{
                    padding: "12px 16px", textAlign: "left",
                    background: newStatus === s ? "#1f1a0a" : "#111",
                    border: `1px solid ${newStatus === s ? "#4a3e10" : "#1f1f1f"}`,
                    color: newStatus === s ? "#facc15" : "#555",
                    fontSize: 12, letterSpacing: 2, fontFamily: "inherit",
                    cursor: "pointer", borderRadius: 3,
                  }}
                >
                  {s === "Cleared" ? "✓ " : ""}{s.toUpperCase()}
                  {s === "Cleared" && <span style={{ fontSize: 10, color: "#888", marginLeft: 8 }}>(photo required)</span>}
                </button>
              ))}
            </div>
          </div>
 
          {/* Photo upload */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, marginBottom: 10 }}>
              CLEARANCE PHOTO {newStatus === "Cleared" ? <span style={{ color: "#f87171" }}>*REQUIRED</span> : "(OPTIONAL)"}
            </div>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} style={{ display: "none" }} />
            <button
              onClick={() => fileRef.current.click()}
              style={{ width: "100%", padding: "14px", background: "#111", border: `1px solid ${newStatus === "Cleared" ? "#4a3e10" : "#1f1f1f"}`, color: "#888", fontSize: 11, letterSpacing: 2, fontFamily: "inherit", cursor: "pointer", borderRadius: 3 }}
            >
              📷 {photoFile ? photoFile.name : "TAP TO TAKE / UPLOAD PHOTO"}
            </button>
            {photoPreview && (
              <img src={photoPreview} alt="Preview" style={{ width: "100%", borderRadius: 4, marginTop: 10, maxHeight: 260, objectFit: "cover" }} />
            )}
          </div>
 
          {/* Notes */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, marginBottom: 8 }}>NOTES (OPTIONAL)</div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Additional notes for admin or citizen…"
              rows={3}
              style={{ width: "100%", background: "#111", border: "1px solid #1f1f1f", color: "#ccc", padding: "12px", fontSize: 12, fontFamily: "inherit", borderRadius: 3, outline: "none", resize: "none" }}
            />
          </div>
 
          {error && <div style={{ background: "#1f0f0f", border: "1px solid #4a2020", color: "#f87171", padding: "10px 14px", borderRadius: 3, fontSize: 12, marginBottom: 16 }}>{error}</div>}
          {success && <div style={{ background: "#111b14", border: "1px solid #2d4a33", color: "#4ade80", padding: "10px 14px", borderRadius: 3, fontSize: 12, marginBottom: 16 }}>{success}</div>}
 
          <button
            onClick={handleUpdate}
            disabled={saving}
            style={{ width: "100%", padding: "14px", background: saving ? "#333" : newStatus === "Cleared" ? "#4ade80" : "#facc15", color: "#000", fontSize: 13, letterSpacing: 3, fontFamily: "inherit", fontWeight: 500, cursor: saving ? "not-allowed" : "pointer", border: "none", borderRadius: 3 }}
          >
            {saving ? "UPDATING…" : `MARK AS ${newStatus.toUpperCase()}`}
          </button>
        </>
      )}
 
      {/* Already cleared */}
      {complaint.status === "Cleared" && (
        <div style={{ background: "#111b14", border: "1px solid #2d4a33", padding: 20, borderRadius: 4, textAlign: "center" }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>✓</div>
          <div style={{ fontSize: 13, color: "#4ade80", letterSpacing: 2 }}>COMPLAINT CLEARED</div>
          <div style={{ fontSize: 11, color: "#555", marginTop: 6 }}>Awaiting citizen approval</div>
          {complaint.clearance_photo_url && (
            <img src={complaint.clearance_photo_url} alt="Clearance" style={{ width: "100%", borderRadius: 4, marginTop: 14, maxHeight: 220, objectFit: "cover" }} />
          )}
        </div>
      )}
 
      {complaint.status === "Rejected" && (
        <div style={{ background: "#1f0f0f", border: "1px solid #4a2020", padding: 20, borderRadius: 4 }}>
          <div style={{ fontSize: 10, color: "#f87171", letterSpacing: 2, marginBottom: 8 }}>REJECTED BY CITIZEN</div>
          <div style={{ fontSize: 13, color: "#ccc" }}>{complaint.rejection_reason || "No reason provided."}</div>
          <div style={{ fontSize: 11, color: "#555", marginTop: 8 }}>Contact your supervisor or re-attend the site.</div>
        </div>
      )}
    </div>
  );
}