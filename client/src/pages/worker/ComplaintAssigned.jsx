import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const STATUS_META = {
  Assigned:   { color: "#facc15", bg: "rgba(250,204,21,0.08)",   border: "rgba(250,204,21,0.2)",  dot: "#facc15",  step: 1 },
  "En Route": { color: "#60a5fa", bg: "rgba(96,165,250,0.08)",   border: "rgba(96,165,250,0.2)",  dot: "#60a5fa",  step: 2 },
  Reached:    { color: "#c084fc", bg: "rgba(192,132,252,0.08)",  border: "rgba(192,132,252,0.2)", dot: "#c084fc",  step: 3 },
  Cleared:    { color: "#4ade80", bg: "rgba(74,222,128,0.08)",   border: "rgba(74,222,128,0.2)",  dot: "#4ade80",  step: 4 },
  Rejected:   { color: "#f87171", bg: "rgba(248,113,113,0.08)",  border: "rgba(248,113,113,0.2)", dot: "#f87171",  step: 0 },
};

const SEVERITY = {
  low:    { color: "#4ade80", bg: "rgba(74,222,128,0.08)",  border: "rgba(74,222,128,0.2)",  label: "LOW" },
  medium: { color: "#facc15", bg: "rgba(250,204,21,0.08)",  border: "rgba(250,204,21,0.2)",  label: "MED" },
  high:   { color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)", label: "HIGH" },
};

const MOCK_COMPLAINTS = [
  { id: "cmp001", description: "Garbage not collected since 2 days", address: "Andheri West, Mumbai",    status: "Assigned",   severity: "high",   reported_at: "2h ago", category: "Missed Collection" },
  { id: "cmp002", description: "Overflowing dustbin near main road", address: "Bandra East, Mumbai",    status: "En Route",   severity: "medium", reported_at: "4h ago", category: "Overflow" },
  { id: "cmp003", description: "Illegal dumping spotted near park",  address: "Juhu Beach Road",        status: "Reached",    severity: "high",   reported_at: "5h ago", category: "Illegal Dumping" },
  { id: "cmp004", description: "Garbage cleared, area clean",        address: "Powai Lake Area",        status: "Cleared",    severity: "low",    reported_at: "1d ago", category: "Missed Collection" },
  { id: "cmp005", description: "Wrong complaint — area was clean",   address: "Ghatkopar West",         status: "Rejected",   severity: "low",    reported_at: "2d ago", category: "Other", rejection_reason: "Invalid issue reported" },
  { id: "cmp006", description: "Bin damaged and needs replacement",  address: "Kurla Station Road",     status: "Assigned",   severity: "medium", reported_at: "30m ago", category: "Infrastructure" },
];

const FILTER_TABS = [
  { key: "active",   label: "Active",   count_keys: ["Assigned", "En Route", "Reached"] },
  { key: "cleared",  label: "Cleared",  count_keys: ["Cleared"] },
  { key: "rejected", label: "Rejected", count_keys: ["Rejected"] },
  { key: "all",      label: "All",      count_keys: null },
];

function ProgressSteps({ status }) {
  const steps = ["Assigned", "En Route", "Reached", "Cleared"];
  const currentStep = STATUS_META[status]?.step || 0;
  const isRejected = status === "Rejected";

  if (isRejected) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#f87171" }} />
        <span style={{ fontSize: 9, color: "#f87171", letterSpacing: 1 }}>REJECTED</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      {steps.map((step, i) => {
        const done = i < currentStep;
        const current = i === currentStep - 1;
        const meta = STATUS_META[step];
        return (
          <div key={step} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: done || current ? meta.dot : "#2a2a2a",
              boxShadow: current ? `0 0 6px ${meta.dot}` : "none",
              transition: "all 0.3s",
            }} title={step} />
            {i < steps.length - 1 && (
              <div style={{ width: 12, height: 1, background: done ? "#4ade80" : "#1e1e1e",
                transition: "background 0.3s" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ComplaintAssigned() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("active");
  const [expanded, setExpanded] = useState(null);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => { fetchComplaints(); }, [filter]);

  async function fetchComplaints() {
    setLoading(true);
    setAnimateIn(false);
    await new Promise(res => setTimeout(res, 400));

    let data = MOCK_COMPLAINTS;
    if (filter === "active")   data = MOCK_COMPLAINTS.filter(c => ["Assigned","En Route","Reached"].includes(c.status));
    if (filter === "cleared")  data = MOCK_COMPLAINTS.filter(c => c.status === "Cleared");
    if (filter === "rejected") data = MOCK_COMPLAINTS.filter(c => c.status === "Rejected");

    setComplaints(data);
    setLoading(false);
    setTimeout(() => setAnimateIn(true), 30);
  }

  const counts = {
    active:   MOCK_COMPLAINTS.filter(c => ["Assigned","En Route","Reached"].includes(c.status)).length,
    cleared:  MOCK_COMPLAINTS.filter(c => c.status === "Cleared").length,
    rejected: MOCK_COMPLAINTS.filter(c => c.status === "Rejected").length,
    all:      MOCK_COMPLAINTS.length,
  };

  const highPriority = MOCK_COMPLAINTS.filter(c =>
    c.severity === "high" && ["Assigned","En Route","Reached"].includes(c.status)
  ).length;

  return (
    <div style={{ padding: "0", maxWidth: 700, margin: "0 auto",
      fontFamily: "'DM Mono', monospace", color: "#e8e8e0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Bebas+Neue&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        a { text-decoration: none; color: inherit; }
        .cmp-card { transition: all 0.2s cubic-bezier(0.4,0,0.2,1); }
        .cmp-card:hover { transform: translateX(3px); }
      `}</style>

      {/* ── Header ── */}
      <div style={{ padding: "20px 20px 0", animation: "fadeUp 0.4s ease" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue'", fontSize: 36, letterSpacing: 4,
              color: "#ffffff", lineHeight: 1 }}>MY COMPLAINTS</div>
            <div style={{ fontSize: 10, color: "#888", letterSpacing: 1.5, marginTop: 4 }}>
              ASSIGNED CASES &amp; RESOLUTIONS
            </div>
          </div>
          {highPriority > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6,
              background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)",
              padding: "8px 14px", borderRadius: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#f87171",
                animation: "pulse 1s infinite" }} />
              <span style={{ fontSize: 10, color: "#f87171", letterSpacing: 1.5, fontWeight: 600 }}>
                {highPriority} HIGH PRIORITY
              </span>
            </div>
          )}
        </div>

        {/* ── Summary row ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 20 }}>
          {[
            { label: "ACTIVE",   value: counts.active,   color: "#facc15" },
            { label: "CLEARED",  value: counts.cleared,  color: "#4ade80" },
            { label: "REJECTED", value: counts.rejected, color: "#f87171" },
            { label: "TOTAL",    value: counts.all,      color: "#888"    },
          ].map((s, i) => (
            <div key={s.label} style={{
              background: "#0a0a0a", border: "1px solid #1e1e1e",
              padding: "12px 14px", borderRadius: 8,
              borderTop: `2px solid ${s.color}`,
              animation: `fadeUp 0.4s ease ${i * 0.05}s both`,
            }}>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 28, color: s.color, lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: 8, color: "#666", letterSpacing: 2, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Filter tabs ── */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#0a0a0a",
          padding: 5, borderRadius: 8, border: "1px solid #1e1e1e" }}>
          {FILTER_TABS.map(f => {
            const active = filter === f.key;
            return (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{
                flex: 1, padding: "9px 4px", borderRadius: 6,
                border: "none",
                background: active ? "#1e1e1e" : "transparent",
                color: active ? "#ffffff" : "#666",
                cursor: "pointer", fontSize: 10,
                letterSpacing: 1.5, fontFamily: "inherit",
                fontWeight: active ? 600 : 400,
                transition: "all 0.15s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}>
                {f.label}
                <span style={{
                  fontSize: 9, background: active ? "#2a2a2a" : "transparent",
                  color: active ? "#aaa" : "#444",
                  padding: "2px 6px", borderRadius: 20,
                  minWidth: 18, textAlign: "center",
                }}>
                  {counts[f.key]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── List ── */}
      <div style={{ padding: "0 20px 28px" }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{
                height: 88, background: "#0a0a0a", borderRadius: 8,
                border: "1px solid #1a1a1a", opacity: 0.35 + i * 0.1,
                animation: `fadeUp 0.3s ease ${i * 0.07}s both`,
              }} />
            ))}
          </div>
        ) : complaints.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
            <div style={{ fontSize: 12, color: "#555", letterSpacing: 2 }}>NO COMPLAINTS IN THIS CATEGORY</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {complaints.map((c, idx) => {
              const sMeta = STATUS_META[c.status] || STATUS_META.Assigned;
              const sevMeta = SEVERITY[c.severity] || SEVERITY.low;
              const isExpanded = expanded === c.id;
              const isHigh = c.severity === "high" && c.status !== "Cleared" && c.status !== "Rejected";

              return (
                <div key={c.id} style={{ animation: animateIn ? `fadeUp 0.35s ease ${idx * 0.06}s both` : "none" }}>
                  <div
                    className="cmp-card"
                    onClick={() => setExpanded(isExpanded ? null : c.id)}
                    style={{
                      background: isHigh ? "rgba(248,113,113,0.03)" : "#0a0a0a",
                      border: `1px solid ${isHigh ? "rgba(248,113,113,0.15)" : "#1a1a1a"}`,
                      borderLeft: `3px solid ${sMeta.dot}`,
                      borderRadius: "0 8px 8px 0",
                      padding: "14px 16px", cursor: "pointer",
                    }}>
                    {/* Top row */}
                    <div style={{ display: "flex", alignItems: "flex-start",
                      justifyContent: "space-between", marginBottom: 8, gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: "#ffffff", fontWeight: 500,
                          marginBottom: 4, lineHeight: 1.4 }}>
                          {c.description}
                        </div>
                        <div style={{ fontSize: 10, color: "#888" }}>
                          📍 {c.address}
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end",
                        gap: 6, flexShrink: 0 }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <span style={{ fontSize: 8, color: sevMeta.color, background: sevMeta.bg,
                            border: `1px solid ${sevMeta.border}`, padding: "3px 8px",
                            borderRadius: 20, letterSpacing: 1.5, fontWeight: 700 }}>
                            {sevMeta.label}
                          </span>
                          <span style={{ fontSize: 8, color: sMeta.color, background: sMeta.bg,
                            border: `1px solid ${sMeta.border}`, padding: "3px 8px",
                            borderRadius: 20, letterSpacing: 1 }}>
                            {c.status.toUpperCase()}
                          </span>
                        </div>
                        <span style={{ fontSize: 9, color: "#555" }}>{c.reported_at}</span>
                      </div>
                    </div>

                    {/* Bottom row — id + progress + expand */}
                    <div style={{ display: "flex", alignItems: "center",
                      justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 9, color: "#444", letterSpacing: 1 }}>
                          #{c.id.toUpperCase()}
                        </span>
                        <span style={{ fontSize: 9, color: "#333",
                          background: "#111", border: "1px solid #1e1e1e",
                          padding: "2px 8px", borderRadius: 20 }}>
                          {c.category}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <ProgressSteps status={c.status} />
                        <div style={{ fontSize: 10, color: "#444", transition: "transform 0.2s",
                          transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>▼</div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div style={{
                      background: "#060606", border: "1px solid #1a1a1a",
                      borderTop: "none", borderRadius: "0 0 8px 0",
                      padding: "16px", marginLeft: 3,
                      animation: "fadeUp 0.2s ease",
                    }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                        <div style={{ background: "#0f0f0f", border: "1px solid #1e1e1e",
                          padding: "10px 12px", borderRadius: 6 }}>
                          <div style={{ fontSize: 8, color: "#555", letterSpacing: 2, marginBottom: 3 }}>CATEGORY</div>
                          <div style={{ fontSize: 11, color: "#ccc" }}>{c.category}</div>
                        </div>
                        <div style={{ background: "#0f0f0f", border: "1px solid #1e1e1e",
                          padding: "10px 12px", borderRadius: 6 }}>
                          <div style={{ fontSize: 8, color: "#555", letterSpacing: 2, marginBottom: 3 }}>REPORTED</div>
                          <div style={{ fontSize: 11, color: "#ccc" }}>{c.reported_at}</div>
                        </div>
                      </div>

                      {/* Full progress bar */}
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 8, color: "#555", letterSpacing: 2, marginBottom: 10 }}>STATUS TRAIL</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                          {["Assigned","En Route","Reached","Cleared"].map((step, i) => {
                            const stepMeta = STATUS_META[step];
                            const stepNum = STATUS_META[c.status]?.step || 0;
                            const done = i < stepNum;
                            const current = i === stepNum - 1;
                            const rejected = c.status === "Rejected";
                            return (
                              <div key={step} style={{ display: "flex", alignItems: "center", flex: i < 3 ? 1 : "none" }}>
                                <div style={{ textAlign: "center" }}>
                                  <div style={{
                                    width: 28, height: 28, borderRadius: "50%",
                                    background: rejected ? "#1a0f0f" :
                                      done || current ? `${stepMeta.dot}20` : "#111",
                                    border: `2px solid ${rejected ? "#3a1515" :
                                      done || current ? stepMeta.dot : "#222"}`,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 10,
                                    boxShadow: current && !rejected ? `0 0 10px ${stepMeta.dot}55` : "none",
                                  }}>
                                    {done && !rejected ? "✓" : current && !rejected ? "●" : "○"}
                                  </div>
                                  <div style={{ fontSize: 7, color: done || current ? stepMeta.color : "#333",
                                    marginTop: 4, letterSpacing: 0.5, textAlign: "center", whiteSpace: "nowrap" }}>
                                    {step.toUpperCase()}
                                  </div>
                                </div>
                                {i < 3 && (
                                  <div style={{ flex: 1, height: 2, background: done && !rejected ? "#4ade80" : "#1e1e1e",
                                    margin: "0 4px", marginBottom: 16, transition: "background 0.3s" }} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {c.rejection_reason && (
                        <div style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.2)",
                          padding: "10px 12px", borderRadius: 6, marginBottom: 14 }}>
                          <div style={{ fontSize: 8, color: "#f87171", letterSpacing: 2, marginBottom: 3 }}>REJECTION REASON</div>
                          <div style={{ fontSize: 11, color: "#f87171" }}>{c.rejection_reason}</div>
                        </div>
                      )}

                      {["Assigned","En Route","Reached"].includes(c.status) && (
                        <div style={{ display: "flex", gap: 8 }}>
                          <button style={{
                            flex: 1, background: "#4ade80", color: "#000",
                            border: "none", padding: "10px", borderRadius: 4,
                            fontFamily: "inherit", fontSize: 10, letterSpacing: 2,
                            cursor: "pointer", fontWeight: 700,
                          }}>
                            {c.status === "Assigned" ? "START RESOLUTION" :
                             c.status === "En Route" ? "MARK REACHED" : "MARK CLEARED →"}
                          </button>
                          <button style={{
                            padding: "10px 16px", background: "none",
                            border: "1px solid #2a2a2a", color: "#888",
                            borderRadius: 4, fontFamily: "inherit", fontSize: 10,
                            letterSpacing: 2, cursor: "pointer",
                          }}>
                            REJECT
                          </button>
                        </div>
                      )}
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