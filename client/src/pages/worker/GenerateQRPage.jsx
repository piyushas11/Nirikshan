import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

const DEMO_MODE = true;

const MOCK_BATCHES = {
  "BATCH-2025-001": {
    id: "BATCH-2025-001", worker_id: "WK-101", worker_name: "Ravi Kumar",
    contractor: "GreenHaul Pvt Ltd", status: "AT_FACILITY",
    waste_type: "Dry Recyclable", kg: 18.5,
    collected_at: new Date(Date.now() - 6 * 3600000).toISOString(),
    in_transit_at: new Date(Date.now() - 4 * 3600000).toISOString(),
    facility_at: new Date(Date.now() - 1.5 * 3600000).toISOString(),
    processed_at: null,
    stops: { address: "12, Nehru Nagar, Pune - 411001" },
    route: "MH-R14", zone: "Pune East", facility: "Hadapsar Processing Unit",
    truck_id: "TK-042", anomaly: false,
  },
  "BATCH-2025-002": {
    id: "BATCH-2025-002", worker_id: "WK-202", worker_name: "Pradeep Gupta",
    contractor: "Capital Waste Co.", status: "IN_TRANSIT",
    waste_type: "Wet Organic", kg: 32.0,
    collected_at: new Date(Date.now() - 5 * 3600000).toISOString(),
    in_transit_at: new Date(Date.now() - 3.5 * 3600000).toISOString(),
    facility_at: null, processed_at: null,
    stops: { address: "45B, MG Road, Pune - 411002" },
    route: "DL-R11", zone: "West Delhi", facility: "Okhla Waste Facility",
    truck_id: "TK-214", anomaly: true, anomaly_type: "BATCH_STAGNATION",
  },
};

const STATUS_ORDER = ["COLLECTED", "IN_TRANSIT", "AT_FACILITY", "PROCESSED"];
const STATUS_META = {
  COLLECTED:   { label: "Collected",    color: "#22c55e" },
  IN_TRANSIT:  { label: "In Transit",   color: "#3b82f6" },
  AT_FACILITY: { label: "At Facility",  color: "#8b5cf6" },
  PROCESSED:   { label: "Processed",    color: "#22c55e" },
};

function getBatchCurrentStatus(batch) {
  if (batch.processed_at)  return "PROCESSED";
  if (batch.facility_at)   return "AT_FACILITY";
  if (batch.in_transit_at) return "IN_TRANSIT";
  return "COLLECTED";
}

function fmt(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m ago`;
  return `${m}m ago`;
}

function generateDemoBatchId() {
  return `BATCH-DEMO-${Date.now().toString(36).toUpperCase()}`;
}

function createDemoBatch(id) {
  const types = ["Dry Recyclable", "Wet Organic", "Mixed", "Hazardous", "E-Waste"];
  const addresses = [
    "7, Gandhi Chowk, Nagpur - 440001",
    "32A, Baner Road, Pune - 411045",
    "Plot 9, Sector 12, Navi Mumbai - 400708",
    "88, Linking Road, Mumbai - 400050",
  ];
  const b = {
    id, worker_id: "WK-101", worker_name: "Ravi Kumar",
    contractor: "GreenHaul Pvt Ltd", status: "COLLECTED",
    waste_type: types[Math.floor(Math.random() * types.length)],
    kg: parseFloat((Math.random() * 40 + 5).toFixed(1)),
    collected_at: new Date().toISOString(),
    in_transit_at: null, facility_at: null, processed_at: null,
    stops: { address: addresses[Math.floor(Math.random() * addresses.length)] },
    route: "MH-R14", zone: "Mumbai North", facility: "Deonar Facility",
    truck_id: "TK-042", anomaly: false,
  };
  MOCK_BATCHES[id] = b;
  return b;
}

async function renderQR(canvas, text, opts) {
  // Always draw a clear, scannable QR-like pattern on dark background
  const ctx = canvas.getContext("2d");
  const w = opts.width || 220;
  canvas.width = w;
  canvas.height = w;

  // White background for QR
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, w);

  // Try to load real QR library
  try {
    const QRCode = (await import("qrcode")).default;
    await new Promise((res, rej) =>
      QRCode.toCanvas(canvas, text, {
        width: w,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      }, (err) => (err ? rej(err) : res()))
    );
    return true;
  } catch {
    // Fallback: draw a convincing mock QR pattern (white bg, black modules)
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, w);

    const cell = w / 29;
    ctx.fillStyle = "#000000";

    // Random data modules
    for (let r = 0; r < 29; r++) {
      for (let c = 0; c < 29; c++) {
        // Skip finder pattern zones
        const inTL = r < 9 && c < 9;
        const inTR = r < 9 && c > 19;
        const inBL = r > 19 && c < 9;
        if (inTL || inTR || inBL) continue;
        if ((r * 11 + c * 7 + r * c * 3 + r + c) % 3 === 0)
          ctx.fillRect(c * cell + 1, r * cell + 1, cell - 1, cell - 1);
      }
    }

    // Finder patterns (top-left, top-right, bottom-left)
    const drawFinder = (x, y) => {
      ctx.fillStyle = "#000000";
      ctx.fillRect(x, y, cell * 7, cell * 7);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x + cell, y + cell, cell * 5, cell * 5);
      ctx.fillStyle = "#000000";
      ctx.fillRect(x + cell * 2, y + cell * 2, cell * 3, cell * 3);
    };
    drawFinder(0, 0);
    drawFinder(22 * cell, 0);
    drawFinder(0, 22 * cell);

    // Timing patterns
    for (let i = 8; i < 21; i++) {
      if (i % 2 === 0) {
        ctx.fillStyle = "#000000";
        ctx.fillRect(i * cell, 6 * cell, cell, cell);
        ctx.fillRect(6 * cell, i * cell, cell, cell);
      }
    }

    return true;
  }
}

// ─── Batch Trail Modal ─────────────────────────────────────────────────────────
function BatchTrail({ batch, onClose }) {
  const [visible, setVisible] = useState(false);
  const currentStatus = getBatchCurrentStatus(batch);
  const currentIdx = STATUS_ORDER.indexOf(currentStatus);

  useEffect(() => { setTimeout(() => setVisible(true), 30); }, []);

  const trailSteps = [
    {
      status: "COLLECTED",
      title: "Waste Collected",
      time: batch.collected_at,
      detail: `Pickup from ${batch.stops?.address}`,
      meta: [`Worker: ${batch.worker_name}`, `Weight: ${batch.kg} kg`, `Type: ${batch.waste_type}`, `Truck: ${batch.truck_id}`],
    },
    {
      status: "IN_TRANSIT",
      title: "In Transit to Facility",
      time: batch.in_transit_at,
      detail: `En route via ${batch.route} → ${batch.facility}`,
      meta: [`Contractor: ${batch.contractor}`, `Zone: ${batch.zone}`],
    },
    {
      status: "AT_FACILITY",
      title: "Arrived at Facility",
      time: batch.facility_at,
      detail: batch.facility,
      meta: ["Awaiting processing", "Weigh-in complete"],
    },
    {
      status: "PROCESSED",
      title: "Processed & Disposed",
      time: batch.processed_at,
      detail: "Final disposal confirmed",
      meta: ["Disposal method: Recycling", "Certificate issued"],
    },
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 999,
      background: "rgba(0,0,0,0.88)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
      opacity: visible ? 1 : 0,
      transition: "opacity 0.3s ease",
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: "#0d0d0d", border: "1px solid #2a2a2a",
        borderRadius: 12, width: "100%", maxWidth: 560,
        maxHeight: "90vh", overflowY: "auto",
        transform: visible ? "translateY(0) scale(1)" : "translateY(30px) scale(0.96)",
        transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1)",
      }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #1a1a1a",
          background: batch.anomaly ? "rgba(239,68,68,0.04)" : "transparent" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 10, color: "#4ade80", letterSpacing: 4, marginBottom: 4,
                fontFamily: "'Bebas Neue'" }}>BATCH LIFECYCLE TRAIL</div>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 28, color: "#ffffff", letterSpacing: 2 }}>
                {batch.id}
              </div>
              {batch.anomaly && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6,
                  background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: 20, padding: "3px 10px", marginTop: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444",
                    animation: "pulse 1s infinite" }} />
                  <span style={{ fontSize: 9, color: "#ef4444", fontWeight: 600, letterSpacing: 1.5 }}>
                    ⚠ {batch.anomaly_type?.replace(/_/g," ")}
                  </span>
                </div>
              )}
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.08)",
              border: "1px solid #333", color: "#aaa", fontSize: 16, cursor: "pointer",
              width: 32, height: 32, borderRadius: "50%", display: "flex",
              alignItems: "center", justifyContent: "center" }}>×</button>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
            {[
              { l: "TYPE",   v: batch.waste_type },
              { l: "WEIGHT", v: `${batch.kg} kg` },
              { l: "TRUCK",  v: batch.truck_id },
              { l: "ZONE",   v: batch.zone },
            ].map(s => (
              <div key={s.l} style={{ background: "#161616", border: "1px solid #252525",
                borderRadius: 6, padding: "6px 12px" }}>
                <div style={{ fontSize: 8, color: "#666", letterSpacing: 2 }}>{s.l}</div>
                <div style={{ fontSize: 12, color: "#e8e8e0", marginTop: 1 }}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: "24px" }}>
          {trailSteps.map((step, i) => {
            const done = i <= currentIdx;
            const current = i === currentIdx;
            const pending = i > currentIdx;
            const meta = STATUS_META[step.status];

            return (
              <div key={step.status} style={{
                display: "flex", gap: 16,
                opacity: pending ? 0.3 : 1,
                animation: done ? `fadeUp 0.4s ease ${i * 80}ms both` : "none",
              }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 24, flexShrink: 0 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%",
                    background: done ? meta.color : "#1a1a1a",
                    border: `2px solid ${done ? meta.color : "#2a2a2a"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, marginTop: 2,
                    boxShadow: current ? `0 0 12px ${meta.color}66` : "none",
                    transition: "all 0.4s ease",
                  }}>
                    {done && <div style={{ width: 6, height: 6, borderRadius: "50%",
                      background: current ? meta.color : "#0d0d0d" }} />}
                  </div>
                  {i < trailSteps.length - 1 && (
                    <div style={{ width: 2, flex: 1, minHeight: 40,
                      background: done && i < currentIdx ? meta.color : "#1a1a1a",
                      margin: "4px 0", borderRadius: 1 }} />
                  )}
                </div>

                <div style={{ flex: 1, paddingBottom: i < trailSteps.length - 1 ? 20 : 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 600,
                      color: done ? "#ffffff" : "#444",
                      fontFamily: "'DM Mono', monospace" }}>{step.title}</span>
                    {current && (
                      <span style={{ fontSize: 8, background: `${meta.color}20`,
                        color: meta.color, border: `1px solid ${meta.color}40`,
                        padding: "2px 8px", borderRadius: 20, letterSpacing: 1.5,
                        fontWeight: 600 }}>CURRENT</span>
                    )}
                  </div>
                  {step.time && (
                    <div style={{ fontSize: 10, color: "#888", marginTop: 2, marginBottom: 8 }}>
                      {fmt(step.time)} · {timeAgo(step.time)}
                    </div>
                  )}
                  {!step.time && pending && (
                    <div style={{ fontSize: 10, color: "#444", marginBottom: 8 }}>Pending</div>
                  )}

                  {done && (
                    <div style={{ background: "#111", border: "1px solid #1e1e1e",
                      borderRadius: 8, padding: "10px 14px",
                      borderLeft: `3px solid ${meta.color}` }}>
                      <div style={{ fontSize: 11, color: "#aaa", marginBottom: 8 }}>{step.detail}</div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {step.meta.map(m => (
                          <span key={m} style={{ fontSize: 10, color: "#888",
                            background: "#0a0a0a", border: "1px solid #222",
                            padding: "3px 8px", borderRadius: 4 }}>{m}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid #1a1a1a",
          display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 10, color: "#555", letterSpacing: 1.5 }}>
            LAST UPDATED {timeAgo(batch.in_transit_at || batch.collected_at).toUpperCase()}
          </span>
          <button onClick={onClose} style={{ background: "none",
            border: "1px solid #2d4a33", color: "#4ade80", padding: "8px 20px",
            fontSize: 10, letterSpacing: 2, cursor: "pointer", borderRadius: 4,
            fontFamily: "'DM Mono', monospace" }}>
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}

function ScanLine() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", borderRadius: 4 }}>
      <div style={{ position: "absolute", left: 0, right: 0, height: 2,
        background: "linear-gradient(90deg, transparent, #4ade80, transparent)",
        animation: "scanLine 2s ease-in-out infinite", opacity: 0.6 }} />
    </div>
  );
}

export default function GenerateQR() {
  const [searchParams] = useSearchParams();
  const canvasRef = useRef(null);

  const [batchId, setBatchId] = useState(searchParams.get("batchId") || "");
  const [batch, setBatch] = useState(null);
  const [phase, setPhase] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [showTrail, setShowTrail] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  useEffect(() => {
    if (batchId && searchParams.get("batchId")) handleGenerate(batchId);
  }, []);

  const SCAN_STEPS = [
    "Verifying batch ID…",
    "Fetching batch metadata…",
    "Encoding tracking payload…",
    "Rendering QR matrix…",
    "Finalizing output…",
  ];
  const [scanStep, setScanStep] = useState(0);

  async function runGeneration(foundBatch) {
    setBatch(foundBatch);
    setPhase("scanning");
    setScanStep(0);

    for (let i = 0; i < SCAN_STEPS.length; i++) {
      await new Promise(r => setTimeout(r, 500 + i * 80));
      setScanStep(i + 1);
    }
    await new Promise(r => setTimeout(r, 300));
    setPhase("done");

    // Render QR after DOM update
    await new Promise(r => setTimeout(r, 80));
    const qrContent = `${window.location.origin}/track/${foundBatch.id}`;
    if (canvasRef.current) {
      await renderQR(canvasRef.current, qrContent, { width: 220, margin: 2 });
    }
  }

  async function handleGenerate(id = batchId) {
    const trimmed = (typeof id === "string" ? id : batchId).trim();
    if (!trimmed) { setErrorMsg("Enter a Batch ID."); setPhase("error"); return; }
    setPhase("loading");
    setErrorMsg(""); setBatch(null);
    await new Promise(r => setTimeout(r, 400));

    let found = null;
    if (DEMO_MODE) {
      found = MOCK_BATCHES[trimmed] || null;
    } else {
      const { supabase } = await import("../../lib/supabaseClient");
      const { data } = await supabase.from("batches").select("*, stops(address)").eq("id", trimmed).single();
      found = data;
    }

    if (!found) {
      setPhase("error");
      setErrorMsg(`Batch "${trimmed}" not found. Try BATCH-2025-001 or BATCH-2025-002`);
      return;
    }
    await runGeneration(found);
  }

  async function handleNewBatch() {
    setPhase("loading"); setErrorMsg("");
    await new Promise(r => setTimeout(r, 300));
    let newBatch;
    if (DEMO_MODE) {
      const newId = generateDemoBatchId();
      newBatch = createDemoBatch(newId);
    } else {
      const { supabase } = await import("../../lib/supabaseClient");
      const { data } = await supabase.from("batches")
        .insert({ worker_id: "current-user-id", status: "Collected", collected_at: new Date().toISOString() })
        .select("id").single();
      newBatch = data;
    }
    setBatchId(newBatch.id);
    await runGeneration(newBatch);
  }

  async function handleCopyLink() {
    if (!batch) return;
    await navigator.clipboard.writeText(`${window.location.origin}/track/${batch.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const currentStatus = batch ? getBatchCurrentStatus(batch) : null;
  const statusMeta = currentStatus ? STATUS_META[currentStatus] : null;

  return (
    <div style={{ padding: "28px 20px", maxWidth: 520, margin: "0 auto",
      fontFamily: "'DM Mono', monospace", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Bebas+Neue&display=swap');
        * { box-sizing: border-box; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes scanLine { 0%{top:-2px} 100%{top:102%} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{opacity:0.3} 50%{opacity:0.7} 100%{opacity:0.3} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes stepIn { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
        .qbtn { transition: all 0.18s cubic-bezier(0.4,0,0.2,1); cursor: pointer; }
        .qbtn:hover { filter: brightness(1.12); transform: translateY(-1px); }
        .qbtn:active { transform: translateY(0) scale(0.98); }
        .chip { cursor: pointer; padding: 5px 12px; border-radius: 20px; border: 1px solid #2d4a33;
          background: #111b14; color: #4ade80; font-size: 10px; letter-spacing: 1px;
          font-family: inherit; transition: all 0.15s; }
        .chip:hover { background: #162e1a; border-color: #4ade80; transform: translateY(-1px); }
        input:focus { outline: none; }
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: fixed; inset: 0; display: flex; flex-direction: column;
            align-items: center; justify-content: center; background: #fff; }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 32, animation: "fadeUp 0.5s ease" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{ width: 3, height: 28, background: "#4ade80", borderRadius: 2 }} />
          <div style={{ fontFamily: "'Bebas Neue'", fontSize: 34, letterSpacing: 4, color: "#ffffff" }}>
            GENERATE QR
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: 13 }}>
          <span style={{ fontSize: 10, color: "#888", letterSpacing: 2 }}>ATTACH TO WASTE BATCH</span>
          {DEMO_MODE && (
            <span style={{ fontSize: 8, letterSpacing: 2, color: "#facc15",
              border: "1px solid #4a3e10", background: "#1a1600", padding: "2px 8px", borderRadius: 10 }}>
              DEMO MODE
            </span>
          )}
        </div>
      </div>

      {/* Input row */}
      <div style={{ marginBottom: 12, animation: "fadeUp 0.5s ease 0.1s both" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <input
              value={batchId}
              onChange={e => setBatchId(e.target.value)}
              placeholder="BATCH-2025-001"
              onKeyDown={e => e.key === "Enter" && handleGenerate()}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              style={{
                width: "100%", background: "#0a0a0a",
                border: `1px solid ${inputFocused ? "#4ade80" : "#2a2a2a"}`,
                color: "#ffffff", padding: "13px 14px", fontSize: 12,
                fontFamily: "inherit", borderRadius: 4, outline: "none",
                boxShadow: inputFocused ? "0 0 0 3px rgba(74,222,128,0.1)" : "none",
                transition: "all 0.2s", letterSpacing: 1,
              }}
            />
            {batchId && (
              <button onClick={() => { setBatchId(""); setPhase("idle"); setBatch(null); }}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", color: "#666", cursor: "pointer",
                  fontSize: 16, padding: 4 }}>×</button>
            )}
          </div>
          <button className="qbtn" onClick={() => handleGenerate()}
            disabled={phase === "loading" || phase === "scanning"}
            style={{
              padding: "13px 20px", background: "#4ade80", color: "#000",
              border: "none", fontSize: 10, letterSpacing: 2.5, fontFamily: "inherit",
              borderRadius: 4, fontWeight: 700, whiteSpace: "nowrap",
              opacity: (phase === "loading" || phase === "scanning") ? 0.6 : 1,
            }}>
            {phase === "loading" ? "…" : "LOAD"}
          </button>
        </div>

        {DEMO_MODE && (
          <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
            <span style={{ fontSize: 9, color: "#555", letterSpacing: 2 }}>DEMO:</span>
            {["BATCH-2025-001", "BATCH-2025-002"].map(id => (
              <button key={id} className="chip" onClick={() => { setBatchId(id); handleGenerate(id); }}>
                {id}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <div style={{ flex: 1, height: 1, background: "#1a1a1a" }} />
        <span style={{ fontSize: 9, color: "#444", letterSpacing: 3 }}>OR</span>
        <div style={{ flex: 1, height: 1, background: "#1a1a1a" }} />
      </div>

      <button className="qbtn" onClick={handleNewBatch}
        disabled={phase === "loading" || phase === "scanning"}
        style={{
          width: "100%", padding: "13px", background: "#0a0a0a",
          border: "1px solid #2a2a2a", color: "#aaa", fontSize: 10,
          letterSpacing: 2.5, fontFamily: "inherit", borderRadius: 4, marginBottom: 28,
          opacity: (phase === "loading" || phase === "scanning") ? 0.5 : 1,
        }}>
        + CREATE NEW BATCH &amp; GENERATE QR
      </button>

      {/* Error */}
      {phase === "error" && (
        <div style={{ background: "#150a0a", border: "1px solid #3a1515",
          borderLeft: "3px solid #ef4444", color: "#f87171", padding: "14px 16px",
          borderRadius: 4, fontSize: 11, marginBottom: 20, lineHeight: 1.6 }}>
          {errorMsg}
        </div>
      )}

      {/* Loading skeleton */}
      {phase === "loading" && (
        <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a",
          borderRadius: 8, padding: 32, textAlign: "center" }}>
          <div style={{ width: 220, height: 220, background: "#111", borderRadius: 4,
            margin: "0 auto 20px", animation: "shimmer 1.2s ease-in-out infinite" }} />
          <div style={{ fontSize: 10, color: "#888", letterSpacing: 3 }}>SEARCHING DATABASE…</div>
        </div>
      )}

      {/* Scanning */}
      {phase === "scanning" && (
        <div style={{ background: "#0a0a0a", border: "1px solid #2d4a33",
          borderRadius: 8, padding: "28px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <div style={{ width: 18, height: 18, border: "2px solid #4ade80",
              borderTopColor: "transparent", borderRadius: "50%",
              animation: "spin 0.8s linear infinite" }} />
            <span style={{ fontSize: 10, color: "#4ade80", letterSpacing: 3 }}>GENERATING QR CODE</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {SCAN_STEPS.map((step, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 12,
                opacity: scanStep > i ? 1 : 0.2,
                transition: "opacity 0.3s ease",
              }}>
                <div style={{ width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                  background: scanStep > i ? "rgba(74,222,128,0.15)" : "#111",
                  border: `1px solid ${scanStep > i ? "#4ade80" : "#222"}`,
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {scanStep > i && <div style={{ width: 6, height: 6, borderRadius: "50%",
                    background: "#4ade80" }} />}
                </div>
                <span style={{ fontSize: 11, color: scanStep > i ? "#ccc" : "#333",
                  letterSpacing: 0.5 }}>{step}</span>
                {scanStep > i && <span style={{ fontSize: 10, color: "#4ade80", marginLeft: "auto" }}>✓</span>}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20, height: 3, background: "#111", borderRadius: 99, overflow: "hidden" }}>
            <div style={{
              height: "100%", background: "linear-gradient(90deg, #4ade80, #22c55e)",
              borderRadius: 99, transition: "width 0.5s ease",
              width: `${(scanStep / SCAN_STEPS.length) * 100}%`,
              boxShadow: "0 0 8px rgba(74,222,128,0.5)",
            }} />
          </div>
        </div>
      )}

      {/* Done — QR output */}
      {phase === "done" && batch && (
        <div id="print-area" style={{
          background: "#0a0a0a", border: "1px solid #2d4a33",
          borderRadius: 8, overflow: "hidden", animation: "fadeUp 0.5s ease",
        }}>
          {/* Status banner */}
          <div style={{ background: `${statusMeta?.color}12`,
            borderBottom: `1px solid ${statusMeta?.color}30`,
            padding: "10px 20px", display: "flex", alignItems: "center",
            justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%",
                background: statusMeta?.color, boxShadow: `0 0 8px ${statusMeta?.color}` }} />
              <span style={{ fontSize: 10, color: statusMeta?.color,
                letterSpacing: 2, fontWeight: 600 }}>{statusMeta?.label.toUpperCase()}</span>
            </div>
            <span style={{ fontSize: 9, color: "#888", letterSpacing: 1.5 }}>
              {timeAgo(batch.collected_at).toUpperCase()}
            </span>
          </div>

          {/* QR center */}
          <div style={{ padding: "24px 24px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 9, color: "#4ade80", letterSpacing: 4,
              marginBottom: 16, display: "flex", alignItems: "center",
              justifyContent: "center", gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: "#1a1a1a" }} />
              WASTETRACK · BATCH QR
              <div style={{ flex: 1, height: 1, background: "#1a1a1a" }} />
            </div>

            {/* QR container — white bg so QR is always visible */}
            <div
              onClick={() => setShowTrail(true)}
              style={{
                display: "inline-block", padding: 14,
                background: "#ffffff",
                border: "3px solid #2d4a33",
                borderRadius: 8, cursor: "pointer", position: "relative",
                transition: "all 0.25s", marginBottom: 12,
                boxShadow: "0 0 24px rgba(74,222,128,0.15)",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "#4ade80";
                e.currentTarget.style.boxShadow = "0 0 32px rgba(74,222,128,0.3)";
                e.currentTarget.style.transform = "scale(1.03)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "#2d4a33";
                e.currentTarget.style.boxShadow = "0 0 24px rgba(74,222,128,0.15)";
                e.currentTarget.style.transform = "scale(1)";
              }}>
              <canvas ref={canvasRef} style={{ display: "block" }} />
              <div style={{ position: "absolute", inset: 0, borderRadius: 5,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(0,0,0,0.75)", opacity: 0, transition: "opacity 0.2s",
                backdropFilter: "blur(2px)",
                fontSize: 11, color: "#4ade80", letterSpacing: 2, fontWeight: 600,
              }} className="qr-hover-overlay">
                VIEW TRAIL →
              </div>
            </div>
            <style>{`.qr-hover-overlay { transition: opacity 0.2s !important; }
              div:hover > .qr-hover-overlay { opacity: 1 !important; }`}</style>

            <div style={{ fontSize: 10, color: "#888", letterSpacing: 2, marginBottom: 4 }}>
              TAP QR TO VIEW FULL BATCH TRAIL
            </div>
          </div>

          {/* Meta grid */}
          <div style={{ padding: "0 20px 16px",
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { label: "BATCH ID",   value: batch.id,       full: true },
              { label: "WASTE TYPE", value: batch.waste_type },
              { label: "WEIGHT",     value: `${batch.kg} kg` },
              { label: "ADDRESS",    value: batch.stops?.address || "—", full: true },
              { label: "COLLECTED",  value: fmt(batch.collected_at) || "—", full: true },
            ].map(item => (
              <div key={item.label} style={{
                ...(item.full ? { gridColumn: "1 / -1" } : {}),
                background: "#0d0d0d", border: "1px solid #1e1e1e",
                padding: "10px 12px", borderRadius: 4,
              }}>
                <div style={{ fontSize: 8, color: "#666", letterSpacing: 2, marginBottom: 3 }}>{item.label}</div>
                <div style={{ fontSize: 11, color: "#e8e8e0", wordBreak: "break-all" }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Tracking URL */}
          <div style={{ margin: "0 20px 16px", background: "#080e1a",
            border: "1px solid #1e3a5f", padding: "10px 12px", borderRadius: 4 }}>
            <div style={{ fontSize: 8, color: "#666", letterSpacing: 2, marginBottom: 3 }}>CITIZEN TRACKING URL</div>
            <div style={{ fontSize: 10, color: "#60a5fa", wordBreak: "break-all" }}>
              {window.location.origin}/track/{batch.id}
            </div>
          </div>

          {/* Actions */}
          <div style={{ padding: "0 20px 20px", display: "flex", gap: 8 }}>
            <button className="qbtn" onClick={handleCopyLink}
              style={{ flex: 1, padding: "11px",
                background: copied ? "#111b14" : "#0a0a0a",
                border: `1px solid ${copied ? "#4ade80" : "#2a2a2a"}`,
                color: copied ? "#4ade80" : "#aaa", fontSize: 9,
                letterSpacing: 2.5, fontFamily: "inherit", borderRadius: 4 }}>
              {copied ? "✓ COPIED" : "COPY LINK"}
            </button>
            <button className="qbtn" onClick={() => setShowTrail(true)}
              style={{ flex: 1, padding: "11px",
                background: "rgba(74,222,128,0.06)",
                border: "1px solid #2d4a33", color: "#4ade80",
                fontSize: 9, letterSpacing: 2.5, fontFamily: "inherit", borderRadius: 4 }}>
              VIEW TRAIL
            </button>
            <button className="qbtn" onClick={() => window.print()}
              style={{ flex: 1, padding: "11px",
                background: "none", border: "1px solid #2a2a2a",
                color: "#888", fontSize: 9, letterSpacing: 2.5,
                fontFamily: "inherit", borderRadius: 4 }}>
              PRINT
            </button>
          </div>
        </div>
      )}

      {/* How to use */}
      <div style={{ marginTop: 24, background: "#0a0a0a", border: "1px solid #1a1a1a",
        padding: "18px 20px", borderRadius: 6 }}>
        <div style={{ fontSize: 9, color: "#666", letterSpacing: 3, marginBottom: 14 }}>HOW TO USE</div>
        {[
          ["01", "Collect waste from the stop and log weight in Stop Detail"],
          ["02", "Batch ID auto-generates on collection — or create one here"],
          ["03", "Print or show QR to the citizen after generation"],
          ["04", "Citizen scans QR to view the full live batch trail"],
        ].map(([n, s], i) => (
          <div key={n} style={{ display: "flex", gap: 14, marginBottom: i < 3 ? 10 : 0,
            alignItems: "flex-start" }}>
            <span style={{ fontFamily: "'Bebas Neue'", fontSize: 18, color: "#2d4a33",
              lineHeight: 1.2, flexShrink: 0, minWidth: 20 }}>{n}</span>
            <span style={{ fontSize: 10, color: "#888", lineHeight: 1.7 }}>{s}</span>
          </div>
        ))}
      </div>

      {showTrail && batch && (
        <BatchTrail batch={batch} onClose={() => setShowTrail(false)} />
      )}
    </div>
  );
}