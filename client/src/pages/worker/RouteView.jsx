import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const STATUS_META = {
  Collected:   { color: "#4ade80", bg: "rgba(74,222,128,0.08)",   border: "rgba(74,222,128,0.2)",  dot: "#4ade80",  label: "COLLECTED"  },
  Skipped:     { color: "#f87171", bg: "rgba(248,113,113,0.08)",  border: "rgba(248,113,113,0.2)", dot: "#f87171",  label: "SKIPPED"    },
  Arrived:     { color: "#facc15", bg: "rgba(250,204,21,0.08)",   border: "rgba(250,204,21,0.2)",  dot: "#facc15",  label: "ARRIVED"    },
  In_Progress: { color: "#60a5fa", bg: "rgba(96,165,250,0.08)",   border: "rgba(96,165,250,0.2)",  dot: "#60a5fa",  label: "IN PROGRESS" },
  Pending:     { color: "#555",    bg: "transparent",              border: "#1e1e1e",               dot: "#333",     label: "PENDING"    },
};

const WASTE_ICONS = {
  "Dry Waste": "♻", "Wet Waste": "🌿", "Mixed": "⚗", "Recyclable": "♻", "Hazardous": "⚠",
};

export default function RouteView() {
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [expandedStop, setExpandedStop] = useState(null);

  useEffect(() => { fetchRoute(); }, [date]);

  async function fetchRoute() {
    setLoading(true);
    await new Promise(res => setTimeout(res, 600));
    const fakeStops = [
      { id: "1", stop_order: 1, address: "Andheri West", locality: "Oshiwara Market Zone", waste_type: "Dry Waste",  time_window: "9:00–10:00 AM",  status: "Collected",   kg_collected: 12, batch_id: "BATCH-2025-041" },
      { id: "2", stop_order: 2, address: "Bandra East",  locality: "Station Road Block C", waste_type: "Wet Waste",  time_window: "10:30–11:30 AM", status: "Collected",   kg_collected: 8,  batch_id: "BATCH-2025-042" },
      { id: "3", stop_order: 3, address: "Juhu Beach Road", locality: "Juhu Tara Lane 4",  waste_type: "Mixed",      time_window: "12:00–1:00 PM",  status: "In_Progress", kg_collected: 0,  batch_id: null },
      { id: "4", stop_order: 4, address: "Powai Lake Area", locality: "SEEPZ Complex Gate 2", waste_type: "Dry Waste", time_window: "2:00–3:00 PM", status: "Pending",     kg_collected: 0,  batch_id: null },
      { id: "5", stop_order: 5, address: "Kurla Station Road", locality: "LBS Marg Junction", waste_type: "Recyclable", time_window: "3:30–4:30 PM", status: "Pending",    kg_collected: 0,  batch_id: null },
      { id: "6", stop_order: 6, address: "Ghatkopar East", locality: "Tilak Nagar West",   waste_type: "Wet Waste",  time_window: "4:30–5:30 PM",  status: "Skipped",     kg_collected: 0,  skip_reason: "House locked" },
    ];
    setStops(fakeStops.sort((a, b) => a.stop_order - b.stop_order));
    setLoading(false);
  }

  const collected   = stops.filter(s => s.status === "Collected").length;
  const skipped     = stops.filter(s => s.status === "Skipped").length;
  const pending     = stops.filter(s => s.status === "Pending").length;
  const inProgress  = stops.filter(s => s.status === "In_Progress").length;
  const kgToday     = stops.reduce((sum, s) => sum + (s.kg_collected || 0), 0);
  const pct         = stops.length ? Math.round((collected / stops.length) * 100) : 0;
  const activeStop  = stops.find(s => s.status === "In_Progress") || stops.find(s => s.status === "Pending");

  const dateLabel = new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long",
  });

  return (
    <div style={{ padding: "0", maxWidth: 700, margin: "0 auto",
      fontFamily: "'DM Mono', monospace", color: "#e8e8e0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Bebas+Neue&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.5)} }
        @keyframes glint { 0%{left:-60%} 100%{left:120%} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes slideDown { from{opacity:0;height:0;transform:translateY(-8px)} to{opacity:1;height:auto;transform:translateY(0)} }
        a { text-decoration: none; color: inherit; }
        .stop-card { transition: all 0.2s cubic-bezier(0.4,0,0.2,1); }
        .stop-card:hover { transform: translateX(3px); }
        .stat-pill { transition: all 0.2s; }
        .stat-pill:hover { transform: translateY(-2px); }
      `}</style>

      {/* ── Top strip ── */}
      <div style={{ padding: "20px 20px 0", animation: "fadeUp 0.4s ease" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue'", fontSize: 36, letterSpacing: 4,
              color: "#ffffff", lineHeight: 1 }}>MY ROUTE</div>
            <div style={{ fontSize: 10, color: "#888", letterSpacing: 1.5, marginTop: 4 }}>
              {dateLabel.toUpperCase()}
            </div>
          </div>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{
              background: "#111", border: "1px solid #2a2a2a",
              color: "#e8e8e0", padding: "8px 12px", borderRadius: 6,
              fontFamily: "inherit", fontSize: 11, outline: "none",
            }}
          />
        </div>

        {/* ── Progress bar ── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 9, color: "#666", letterSpacing: 3 }}>ROUTE PROGRESS</span>
            <span style={{ fontSize: 10, fontWeight: 700,
              color: pct >= 80 ? "#4ade80" : pct >= 50 ? "#facc15" : "#f87171",
              letterSpacing: 1 }}>{pct}%  ·  {collected} of {stops.length} stops</span>
          </div>
          <div style={{ height: 8, background: "#111", borderRadius: 99, overflow: "hidden",
            border: "1px solid #1e1e1e" }}>
            <div style={{
              height: "100%", borderRadius: 99, position: "relative", overflow: "hidden",
              background: pct >= 80 ? "linear-gradient(90deg,#16a34a,#4ade80)" :
                pct >= 50 ? "linear-gradient(90deg,#a16207,#facc15)" : "linear-gradient(90deg,#dc2626,#f87171)",
              width: `${pct}%`, transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)",
              boxShadow: `0 0 12px ${pct >= 80 ? "rgba(74,222,128,0.4)" : "rgba(250,204,21,0.3)"}`,
            }}>
              <div style={{ position: "absolute", top: 0, bottom: 0, width: "40%",
                background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)",
                animation: "glint 2.5s ease-in-out infinite" }} />
            </div>
          </div>

          {/* Stop dots row */}
          <div style={{ display: "flex", gap: 4, marginTop: 8, alignItems: "center" }}>
            {stops.map((s, i) => {
              const meta = STATUS_META[s.status] || STATUS_META.Pending;
              return (
                <div key={i} style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: meta.dot, flexShrink: 0,
                  boxShadow: s.status === "In_Progress" ? `0 0 8px ${meta.dot}` : "none",
                  animation: s.status === "In_Progress" ? "pulse 1.2s ease infinite" : "none",
                  transition: "all 0.3s",
                }} title={`${s.address} — ${s.status}`} />
              );
            })}
            <span style={{ fontSize: 9, color: "#444", marginLeft: 6, letterSpacing: 1 }}>STOPS</span>
          </div>
        </div>

        {/* ── Stat pills ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 20 }}>
          {[
            { label: "DONE",    value: collected, color: "#4ade80",  sub: `${kgToday} kg` },
            { label: "ACTIVE",  value: inProgress, color: "#60a5fa",  sub: "in progress" },
            { label: "PENDING", value: pending,   color: "#facc15",  sub: "upcoming" },
            { label: "SKIPPED", value: skipped,   color: "#f87171",  sub: "missed" },
          ].map((s, i) => (
            <div key={s.label} className="stat-pill" style={{
              background: "#0a0a0a", border: "1px solid #1e1e1e",
              padding: "14px 12px", borderRadius: 8,
              borderTop: `2px solid ${s.color}`,
              animation: `fadeUp 0.4s ease ${i * 0.06}s both`,
            }}>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 32, color: s.color,
                lineHeight: 1, letterSpacing: 1 }}>{s.value}</div>
              <div style={{ fontSize: 8, color: "#888", letterSpacing: 2, marginTop: 4 }}>{s.label}</div>
              <div style={{ fontSize: 9, color: "#444", marginTop: 2 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Active stop highlight ── */}
      {activeStop && !loading && (
        <div style={{ padding: "0 20px 16px", animation: "fadeUp 0.4s ease 0.2s both" }}>
          <div style={{ fontSize: 9, color: "#666", letterSpacing: 3, marginBottom: 8 }}>
            {activeStop.status === "In_Progress" ? "▶ ACTIVE STOP" : "NEXT UP"}
          </div>
          <Link to={`/worker/route/${activeStop.id}`}>
            <div style={{
              background: "#0a1810",
              border: "1px solid rgba(74,222,128,0.25)",
              borderLeft: "3px solid #4ade80",
              padding: "16px 18px", borderRadius: "0 8px 8px 0",
              display: "flex", alignItems: "center", gap: 14,
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#0d2016"; e.currentTarget.style.transform = "translateX(4px)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#0a1810"; e.currentTarget.style.transform = "translateX(0)"; }}>
              <div style={{ width: 40, height: 40, borderRadius: 10,
                background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, flexShrink: 0 }}>
                {WASTE_ICONS[activeStop.waste_type] || "♻"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  {activeStop.status === "In_Progress" && (
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80",
                      animation: "pulse 1.2s ease infinite", flexShrink: 0 }} />
                  )}
                  <span style={{ fontSize: 14, color: "#ffffff", fontWeight: 600,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {activeStop.address}
                  </span>
                </div>
                <div style={{ fontSize: 10, color: "#888", marginBottom: 6 }}>
                  {activeStop.locality}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={{ fontSize: 9, color: "#4ade80", background: "rgba(74,222,128,0.1)",
                    border: "1px solid rgba(74,222,128,0.2)", padding: "3px 10px", borderRadius: 20 }}>
                    {activeStop.waste_type}
                  </span>
                  <span style={{ fontSize: 9, color: "#888", background: "#111",
                    border: "1px solid #1e1e1e", padding: "3px 10px", borderRadius: 20 }}>
                    ⏱ {activeStop.time_window}
                  </span>
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#4ade80", letterSpacing: 2, flexShrink: 0 }}>GO →</div>
            </div>
          </Link>
        </div>
      )}

      {/* ── Stop list ── */}
      <div style={{ padding: "0 20px 28px" }}>
        <div style={{ fontSize: 9, color: "#666", letterSpacing: 3, marginBottom: 10 }}>ALL STOPS</div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{
                height: 72, background: "#0a0a0a", borderRadius: 8,
                border: "1px solid #1a1a1a",
                animation: `fadeUp 0.3s ease ${i * 0.08}s both`,
                opacity: 0.4,
              }} />
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {stops.map((stop, idx) => {
              const meta = STATUS_META[stop.status] || STATUS_META.Pending;
              const isExpanded = expandedStop === stop.id;
              const isActive = stop.status === "In_Progress";

              return (
                <div key={stop.id}>
                  <div
                    className="stop-card"
                    onClick={() => setExpandedStop(isExpanded ? null : stop.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      background: isActive ? "#0a1810" : "#0a0a0a",
                      border: `1px solid ${isActive ? "rgba(74,222,128,0.2)" : "#1a1a1a"}`,
                      borderLeft: `3px solid ${meta.dot}`,
                      padding: "14px 16px", borderRadius: "0 8px 8px 0",
                      cursor: "pointer",
                      opacity: stop.status === "Pending" ? 0.75 : 1,
                    }}>
                    {/* Order number */}
                    <div style={{ fontFamily: "'Bebas Neue'", fontSize: 20, color: "#333",
                      minWidth: 22, textAlign: "center", flexShrink: 0 }}>{idx + 1}</div>

                    {/* Status dot */}
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%", background: meta.dot,
                      flexShrink: 0,
                      animation: isActive ? "pulse 1.2s ease infinite" : "none",
                      boxShadow: isActive ? `0 0 8px ${meta.dot}` : "none",
                    }} />

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: stop.status === "Pending" ? "#aaa" : "#ffffff",
                        marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        fontWeight: 500 }}>
                        {stop.address}
                      </div>
                      <div style={{ fontSize: 9, color: "#666", letterSpacing: 0.5 }}>
                        {stop.waste_type} · {stop.time_window}
                      </div>
                    </div>

                    {/* Right side */}
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      {stop.kg_collected > 0 && (
                        <div style={{ fontSize: 13, color: meta.color, fontWeight: 700, marginBottom: 2 }}>
                          {stop.kg_collected} kg
                        </div>
                      )}
                      <div style={{ fontSize: 8, color: meta.color, letterSpacing: 1.5,
                        background: meta.bg, border: `1px solid ${meta.border}`,
                        padding: "3px 8px", borderRadius: 20 }}>
                        {meta.label}
                      </div>
                    </div>

                    {/* Expand chevron */}
                    <div style={{ fontSize: 10, color: "#444", marginLeft: 4, transition: "transform 0.2s",
                      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>▼</div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div style={{
                      background: "#060606", border: "1px solid #1a1a1a",
                      borderTop: "none", borderRadius: "0 0 8px 0",
                      padding: "14px 16px", marginLeft: 3,
                      animation: "fadeUp 0.2s ease",
                    }}>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                        <div style={{ background: "#0f0f0f", border: "1px solid #1e1e1e",
                          padding: "8px 12px", borderRadius: 6, flex: 1, minWidth: 140 }}>
                          <div style={{ fontSize: 8, color: "#555", letterSpacing: 2, marginBottom: 3 }}>LOCALITY</div>
                          <div style={{ fontSize: 11, color: "#ccc" }}>{stop.locality || "—"}</div>
                        </div>
                        <div style={{ background: "#0f0f0f", border: "1px solid #1e1e1e",
                          padding: "8px 12px", borderRadius: 6, flex: 1, minWidth: 120 }}>
                          <div style={{ fontSize: 8, color: "#555", letterSpacing: 2, marginBottom: 3 }}>WASTE TYPE</div>
                          <div style={{ fontSize: 11, color: "#ccc" }}>{stop.waste_type}</div>
                        </div>
                        {stop.batch_id && (
                          <div style={{ background: "#0f0f0f", border: "1px solid #1e1e1e",
                            padding: "8px 12px", borderRadius: 6, flex: 1, minWidth: 160 }}>
                            <div style={{ fontSize: 8, color: "#555", letterSpacing: 2, marginBottom: 3 }}>BATCH ID</div>
                            <div style={{ fontSize: 11, color: "#4ade80" }}>{stop.batch_id}</div>
                          </div>
                        )}
                      </div>

                      {stop.skip_reason && (
                        <div style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.2)",
                          padding: "8px 12px", borderRadius: 6, marginBottom: 12 }}>
                          <div style={{ fontSize: 8, color: "#f87171", letterSpacing: 2, marginBottom: 3 }}>SKIP REASON</div>
                          <div style={{ fontSize: 11, color: "#f87171" }}>{stop.skip_reason}</div>
                        </div>
                      )}

                      <Link to={`/worker/route/${stop.id}`}>
                        <button style={{
                          background: stop.status === "Pending" || stop.status === "In_Progress"
                            ? "#4ade80" : "#111",
                          color: stop.status === "Pending" || stop.status === "In_Progress"
                            ? "#000" : "#888",
                          border: "none", padding: "10px 20px", borderRadius: 4,
                          fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 2,
                          cursor: "pointer", fontWeight: 700,
                          transition: "all 0.15s",
                        }}>
                          {stop.status === "Collected" ? "VIEW DETAILS" :
                           stop.status === "Skipped" ? "REATTEMPT" :
                           stop.status === "In_Progress" ? "CONTINUE →" : "START STOP →"}
                        </button>
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}