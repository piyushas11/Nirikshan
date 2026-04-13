import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const STATUS_COLOR = {
  Collected:   "#4ade80",
  Skipped:     "#f87171",
  Arrived:     "#facc15",
  In_Progress: "#60a5fa",
  Pending:     "#333",
};

const STOPS = [
  { id: "1", address: "Andheri West, Mumbai",  locality: "Oshiwara Market Zone", waste_type: "Dry Waste",  time_window: "9:00–10:00 AM",  status: "Collected",   kg_collected: 12, batch_id: "BATCH-2025-041" },
  { id: "2", address: "Bandra East, Mumbai",   locality: "Station Road Block C",  waste_type: "Wet Waste",  time_window: "10:30–11:30 AM", status: "Collected",   kg_collected: 8,  batch_id: "BATCH-2025-042" },
  { id: "3", address: "Juhu Beach Road",       locality: "Juhu Tara Lane 4",      waste_type: "Mixed",      time_window: "12:00–1:00 PM",  status: "In_Progress", kg_collected: 0,  batch_id: null },
  { id: "4", address: "Powai Lake Area",       locality: "SEEPZ Complex Gate 2",  waste_type: "Dry Waste",  time_window: "2:00–3:00 PM",   status: "Pending",     kg_collected: 0,  batch_id: null },
  { id: "5", address: "Kurla Station Road",    locality: "LBS Marg Junction",     waste_type: "Recyclable", time_window: "3:30–4:30 PM",   status: "Pending",     kg_collected: 0,  batch_id: null },
];

function Counter({ target, duration = 800 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const t = setInterval(() => {
      start = Math.min(start + step, target);
      setVal(start);
      if (start >= target) clearInterval(t);
    }, 16);
    return () => clearInterval(t);
  }, [target]);
  return <>{val}</>;
}

function MiniStopDot({ status }) {
  const c = STATUS_COLOR[status] || "#333";
  return (
    <div style={{ width: 10, height: 10, borderRadius: "50%", background: c, flexShrink: 0,
      boxShadow: status === "In_Progress" ? `0 0 8px ${c}` : "none",
      animation: status === "In_Progress" ? "dotPulse 1.2s ease infinite" : "none" }} />
  );
}

export default function WorkerHome() {
  const [loaded, setLoaded] = useState(false);
  const [score, setScore] = useState(null);
  const [complaints, setComplaints] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    setTimeout(() => { setLoaded(true); setScore(76); setComplaints(2); }, 700);
    const t = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const collected = STOPS.filter(s => s.status === "Collected").length;
  const skipped   = STOPS.filter(s => s.status === "Skipped").length;
  const pending   = STOPS.filter(s => s.status === "Pending" || s.status === "In_Progress").length;
  const kgToday   = STOPS.reduce((sum, s) => sum + (s.kg_collected || 0), 0);
  const pct       = Math.round((collected / STOPS.length) * 100);
  const nextStop  = STOPS.find(s => s.status === "In_Progress") || STOPS.find(s => s.status === "Pending");

  const dateStr = currentTime.toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long",
  }).toUpperCase();

  const timeStr = currentTime.toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  }).toUpperCase();

  if (!loaded) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", height: "60vh", gap: 16,
      fontFamily: "'DM Mono', monospace" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Bebas+Neue&display=swap');
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
      <div style={{ width: 24, height: 24, border: "2px solid #1f1f1f",
        borderTopColor: "#4ade80", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <div style={{ fontSize: 10, color: "#333", letterSpacing: 3 }}>LOADING SHIFT DATA…</div>
    </div>
  );

  return (
    <div style={{ padding: "24px 20px", maxWidth: 680, margin: "0 auto",
      fontFamily: "'DM Mono', monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Bebas+Neue&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes dotPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.4)} }
        @keyframes progressFill { from{width:0} to{width:${pct}%} }
        @keyframes glint { 0%{left:-100%} 100%{left:200%} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .stat-card { transition: all 0.2s cubic-bezier(0.4,0,0.2,1); cursor: default; }
        .stat-card:hover { transform: translateY(-2px); border-color: #2a2a2a !important; }
        .stop-row { transition: all 0.2s; }
        .stop-row:hover { background: #0f0f0f !important; }
        a { text-decoration: none; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 28, animation: "fadeUp 0.5s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue'", fontSize: 38, letterSpacing: 4,
              color: "#e8e8e0", lineHeight: 0.95 }}>TODAY'S SHIFT</div>
            <div style={{ fontSize: 10, color: "#444", letterSpacing: 2, marginTop: 6 }}>{dateStr}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "'Bebas Neue'", fontSize: 28, color: "#4ade80",
              letterSpacing: 3, lineHeight: 1 }}>{timeStr}</div>
            <div style={{ fontSize: 9, color: "#333", letterSpacing: 2, marginTop: 4 }}>SHIFT ACTIVE</div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 28, animation: "fadeUp 0.5s ease 0.05s both" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 9, color: "#555", letterSpacing: 3 }}>ROUTE PROGRESS</span>
          <span style={{ fontSize: 9, color: pct >= 80 ? "#4ade80" : pct >= 50 ? "#facc15" : "#f87171",
            letterSpacing: 2, fontWeight: 600 }}>{pct}% · {collected}/{STOPS.length} STOPS</span>
        </div>
        <div style={{ height: 8, background: "#111", borderRadius: 99, overflow: "hidden",
          border: "1px solid #1a1a1a" }}>
          <div style={{
            height: "100%", borderRadius: 99, position: "relative", overflow: "hidden",
            background: pct >= 80 ? "linear-gradient(90deg,#22c55e,#4ade80)" :
              pct >= 50 ? "linear-gradient(90deg,#ca8a04,#facc15)" : "linear-gradient(90deg,#dc2626,#f87171)",
            width: `${pct}%`, transition: "width 1s cubic-bezier(0.4,0,0.2,1)",
            boxShadow: `0 0 12px ${pct >= 80 ? "rgba(74,222,128,0.4)" : "rgba(250,204,21,0.3)"}`,
          }}>
            <div style={{ position: "absolute", top: 0, bottom: 0, width: "40%",
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
              animation: "glint 2.5s ease-in-out infinite" }} />
          </div>
        </div>

        {/* Stop dots */}
        <div style={{ display: "flex", gap: 4, marginTop: 8, alignItems: "center" }}>
          {STOPS.map((s, i) => <MiniStopDot key={i} status={s.status} />)}
          <span style={{ fontSize: 9, color: "#333", marginLeft: 6, letterSpacing: 1.5 }}>
            STOP PROGRESS
          </span>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10,
        marginBottom: 24, animation: "fadeUp 0.5s ease 0.1s both" }}>
        {[
          { label: "DONE",    value: collected, color: "#4ade80", sub: "stops" },
          { label: "PENDING", value: pending,   color: "#facc15", sub: "stops" },
          { label: "SKIPPED", value: skipped,   color: "#f87171", sub: "stops" },
          { label: "COLLECTED", value: kgToday, color: "#60a5fa", sub: "kg",  suffix: "" },
        ].map((s, i) => (
          <div key={s.label} className="stat-card" style={{
            background: "#0a0a0a", border: "1px solid #181818",
            padding: "16px 14px", borderRadius: 6,
            animation: `fadeUp 0.5s ease ${0.1 + i * 0.05}s both`,
          }}>
            <div style={{ fontSize: 8, color: "#444", letterSpacing: 2.5, marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontFamily: "'Bebas Neue'", fontSize: 36, color: s.color,
              lineHeight: 0.9, letterSpacing: 1 }}>
              <Counter target={s.value} />
            </div>
            <div style={{ fontSize: 9, color: "#2a2a2a", marginTop: 4, letterSpacing: 1 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Next stop */}
      {nextStop && (
        <div style={{ marginBottom: 20, animation: "fadeUp 0.5s ease 0.2s both" }}>
          <div style={{ fontSize: 9, color: "#333", letterSpacing: 3, marginBottom: 10 }}>NEXT STOP</div>
          <Link to={`/worker/route/${nextStop.id}`} style={{ display: "block" }}>
            <div style={{
              background: nextStop.status === "In_Progress" ? "#0a1a10" : "#0a0a0a",
              border: `1px solid ${nextStop.status === "In_Progress" ? "#2d4a33" : "#1a1a1a"}`,
              borderLeft: `3px solid ${nextStop.status === "In_Progress" ? "#4ade80" : "#222"}`,
              padding: "18px 20px", borderRadius: "0 6px 6px 0",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = nextStop.status === "In_Progress" ? "#0d201a" : "#0f0f0f";
              e.currentTarget.style.transform = "translateX(3px)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = nextStop.status === "In_Progress" ? "#0a1a10" : "#0a0a0a";
              e.currentTarget.style.transform = "translateX(0)";
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    {nextStop.status === "In_Progress" && (
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80",
                        animation: "dotPulse 1.2s ease infinite", flexShrink: 0 }} />
                    )}
                    <span style={{ fontSize: 14, color: "#e8e8e0", fontWeight: 500 }}>{nextStop.address}</span>
                  </div>
                  <div style={{ fontSize: 10, color: "#555", marginBottom: 10 }}>{nextStop.locality}</div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <span style={{ fontSize: 9, color: "#444", background: "#111",
                      border: "1px solid #1a1a1a", padding: "3px 10px", borderRadius: 20 }}>
                      {nextStop.waste_type}
                    </span>
                    <span style={{ fontSize: 9, color: "#444", background: "#111",
                      border: "1px solid #1a1a1a", padding: "3px 10px", borderRadius: 20 }}>
                      ⏱ {nextStop.time_window}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                  <span style={{ fontSize: 9, color: "#4ade80", letterSpacing: 2 }}>
                    {nextStop.status === "In_Progress" ? "IN PROGRESS" : "UPCOMING"}
                  </span>
                  <span style={{ fontSize: 11, color: "#4ade80", letterSpacing: 1 }}>GO →</span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Stop list */}
      <div style={{ marginBottom: 20, animation: "fadeUp 0.5s ease 0.25s both" }}>
        <div style={{ fontSize: 9, color: "#333", letterSpacing: 3, marginBottom: 10 }}>ALL STOPS TODAY</div>
        <div style={{ background: "#0a0a0a", border: "1px solid #141414", borderRadius: 6, overflow: "hidden" }}>
          {STOPS.map((s, i) => {
            const c = STATUS_COLOR[s.status] || "#333";
            return (
              <Link key={s.id} to={`/worker/route/${s.id}`} style={{ display: "block" }}>
                <div className="stop-row" style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "13px 16px",
                  borderBottom: i < STOPS.length - 1 ? "1px solid #0f0f0f" : "none",
                  background: "transparent",
                }}>
                  <div style={{ fontFamily: "'Bebas Neue'", fontSize: 16, color: "#2a2a2a",
                    minWidth: 18, textAlign: "center" }}>{i + 1}</div>
                  <div style={{ width: 4, height: 36, borderRadius: 2, background: c,
                    flexShrink: 0, opacity: s.status === "Pending" ? 0.25 : 1 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: s.status === "Pending" ? "#444" : "#ccc",
                      marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis",
                      whiteSpace: "nowrap" }}>{s.address}</div>
                    <div style={{ fontSize: 9, color: "#333", letterSpacing: 0.5 }}>
                      {s.waste_type} · {s.time_window}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    {s.kg_collected > 0 && (
                      <div style={{ fontSize: 12, color: c, fontWeight: 600, marginBottom: 2 }}>
                        {s.kg_collected} kg
                      </div>
                    )}
                    <div style={{ fontSize: 8, color: c, letterSpacing: 1.5,
                      opacity: s.status === "Pending" ? 0.4 : 1 }}>
                      {s.status.replace("_", " ").toUpperCase()}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom cards — complaints + score */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
        animation: "fadeUp 0.5s ease 0.3s both" }}>
        {/* Complaints */}
        <Link to="/worker/complaints" style={{ display: "block" }}>
          <div style={{
            background: complaints > 0 ? "rgba(239,68,68,0.04)" : "#0a0a0a",
            border: `1px solid ${complaints > 0 ? "#3a1515" : "#141414"}`,
            padding: "16px 18px", borderRadius: 6, transition: "all 0.2s", cursor: "pointer",
          }}
          onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
          onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
            <div style={{ fontSize: 8, color: "#444", letterSpacing: 2.5, marginBottom: 8 }}>COMPLAINTS</div>
            <div style={{ fontFamily: "'Bebas Neue'", fontSize: 36, lineHeight: 0.9,
              color: complaints > 0 ? "#f87171" : "#333" }}>{complaints}</div>
            <div style={{ fontSize: 9, color: complaints > 0 ? "#7f1d1d" : "#2a2a2a",
              marginTop: 6, letterSpacing: 1 }}>
              {complaints > 0 ? "PENDING RESOLUTION" : "ALL CLEAR"}
            </div>
          </div>
        </Link>

        {/* Score */}
        <Link to="/worker/score" style={{ display: "block" }}>
          <div style={{ background: "#0a0a0a", border: "1px solid #141414",
            padding: "16px 18px", borderRadius: 6, transition: "all 0.2s", cursor: "pointer" }}
          onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
          onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
            <div style={{ fontSize: 8, color: "#444", letterSpacing: 2.5, marginBottom: 8 }}>MY SCORE</div>
            {score !== null ? (
              <>
                <div style={{ fontFamily: "'Bebas Neue'", fontSize: 36, lineHeight: 0.9,
                  color: score >= 70 ? "#4ade80" : score >= 40 ? "#facc15" : "#f87171" }}>
                  {score}
                </div>
                <div style={{ height: 3, background: "#111", borderRadius: 99, marginTop: 8 }}>
                  <div style={{ width: `${score}%`, height: "100%", borderRadius: 99,
                    background: score >= 70 ? "#4ade80" : score >= 40 ? "#facc15" : "#f87171",
                    transition: "width 1s ease" }} />
                </div>
                <div style={{ fontSize: 9, color: "#333", marginTop: 4, letterSpacing: 1 }}>
                  /100 CREDIBILITY
                </div>
              </>
            ) : (
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 36, color: "#222" }}>—</div>
            )}
          </div>
        </Link>
      </div>
    </div>
  );
}