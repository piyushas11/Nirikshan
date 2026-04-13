import { useState } from "react";
import {
  ArrowLeft, User, Star, TrendingDown, TrendingUp,
  AlertTriangle, MapPin, Clock, Package, CheckCircle,
  BarChart2, Navigation, Truck, XCircle, Activity,
  ThumbsUp, ThumbsDown, Camera
} from "lucide-react";

// ─── Mock data ────────────────────────────────────────────────────────────────
const WORKER = {
  id: "WK-202", name: "Pradeep Gupta",
  contractor: "Capital Waste Co.", contractorId: "CON-003",
  zone: "West Delhi", route: "DL-R11",
  score: 33, trend: "down",
  completionRate: 44, rating: 2.4, anomalies: 8, attendance: 62,
  status: "ABSENT", joinedDate: "Aug 2023",
  totalBatchesLifetime: 142, wasteCollectedThisMonth: "4.1t",
  avgDailyStops: 4,
  phone: "+91-98110-XXXXX",
  scoreHistory: [61, 55, 49, 44, 39, 35, 33],
  scoreLabels:  ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr"],
};

const TODAY_ROUTE = [
  { stop: 1, address: "14A, Rohini Sector 11",    type: "Dry Waste",  window: "7:00–7:30",  status: "SKIPPED",   batchId: null         },
  { stop: 2, address: "Green Park, Block C",       type: "Mixed",      window: "7:30–8:00",  status: "SKIPPED",   batchId: null         },
  { stop: 3, address: "West Patel Nagar, Lane 4",  type: "Organic",    window: "8:00–8:30",  status: "PENDING",   batchId: null         },
  { stop: 4, address: "Punjabi Bagh, Main Market", type: "Recyclable", window: "8:30–9:00",  status: "PENDING",   batchId: null         },
  { stop: 5, address: "Tilak Nagar Depot",         type: "Mixed",      window: "9:00–9:30",  status: "PENDING",   batchId: null         },
];

const ANOMALIES = [
  { id: "ANO-879", type: "BATCH_STAGNATION",   severity: "HIGH",   date: "Today",            desc: "Worker marked absent; route unassigned for 3hrs" },
  { id: "ANO-864", type: "GHOST_PICKUP",       severity: "HIGH",   date: "2 days ago",       desc: "Batch WB-2011 marked collected, GPS 1.8km away" },
  { id: "ANO-851", type: "CITIZEN_REJECTION",  severity: "HIGH",   date: "4 days ago",       desc: "2 out of 5 clearance photos rejected this week" },
  { id: "ANO-843", type: "TIME_WINDOW_VIOLATION", severity: "MEDIUM", date: "6 days ago",    desc: "Collection logged at 2:15pm — outside 6am-10am window" },
  { id: "ANO-831", type: "ROUTE_DEVIATION",    severity: "MEDIUM", date: "9 days ago",       desc: "Truck deviated 2.1km from DL-R11 assigned path" },
];

const CITIZEN_RATINGS = [
  { id: "RAT-091", citizen: "S. Mehta",    rating: 1, comment: "Waste not collected, marked as done", date: "2 days ago", resolved: false },
  { id: "RAT-088", citizen: "A. Kumar",    rating: 2, comment: "Came late, missed half the bins",     date: "5 days ago", resolved: false },
  { id: "RAT-081", citizen: "R. Sharma",   rating: 4, comment: "Good pickup, no issues",              date: "8 days ago", resolved: true  },
  { id: "RAT-074", citizen: "P. Agarwal",  rating: 1, comment: "Photo submitted shows wrong location",date: "11 days ago",resolved: false },
];

// ─── Small reusables ──────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, val, color, sub }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 14, padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: `${color}18`,
          border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={15} color={color} />
        </div>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{label}</span>
      </div>
      <p style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Syne',sans-serif", color }}>{val}</p>
      {sub && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 3 }}>{sub}</p>}
    </div>
  );
}

function ScoreMeter({ score }) {
  const color = score >= 80 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  const r = 38, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ * 0.25}
          strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
        <text x="50" y="46" textAnchor="middle" dominantBaseline="middle"
          fill={color} fontSize="20" fontWeight="800" fontFamily="'Syne',sans-serif">{score}</text>
        <text x="50" y="62" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="9">/100</text>
      </svg>
      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>Credibility Score</span>
    </div>
  );
}

function MiniBarChart({ data, labels, color }) {
  const max = Math.max(...data);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 60 }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{ width: "100%", height: (v / max) * 48,
            background: i === data.length - 1 ? color : `${color}55`,
            borderRadius: "3px 3px 0 0", minHeight: 4 }} />
          <span style={{ fontSize: 8, color: "rgba(255,255,255,0.3)" }}>{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

const SEV = {
  HIGH:   { color: "#ef4444", bg: "rgba(239,68,68,0.12)"  },
  MEDIUM: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  LOW:    { color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
};

const STOP_STATUS = {
  COLLECTED: { color: "#22c55e", label: "Collected", icon: CheckCircle },
  SKIPPED:   { color: "#ef4444", label: "Skipped",   icon: XCircle     },
  PENDING:   { color: "#6b7280", label: "Pending",   icon: Clock       },
};

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function WorkerDetail({ worker = WORKER, onBack }) {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview",  label: "Overview",   icon: BarChart2    },
    { id: "route",     label: "Today's Route", icon: Navigation },
    { id: "anomalies", label: "Anomalies",  icon: AlertTriangle },
    { id: "ratings",   label: "Citizen Ratings", icon: Star    },
  ];

  const rejectionPct = Math.round(
    (CITIZEN_RATINGS.filter(r => r.rating <= 2).length / CITIZEN_RATINGS.length) * 100
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
      <div style={{
        minHeight: "100vh", background: "linear-gradient(135deg,#0a1a0f 0%,#0d1b2a 50%,#0a1628 100%)",
        fontFamily: "'DM Sans',sans-serif", color: "#fff", padding: "28px 32px",
      }}>

        {/* Back */}
        <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 7,
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8, padding: "7px 14px", color: "rgba(255,255,255,0.6)",
          fontSize: 12, cursor: "pointer", marginBottom: 20 }}>
          <ArrowLeft size={13} /> Back to Workers
        </button>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div style={{ width: 56, height: 56, borderRadius: 14,
              background: worker.status === "ABSENT" ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.1)",
              border: `1.5px solid ${worker.status === "ABSENT" ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.25)"}`,
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <User size={26} color={worker.status === "ABSENT" ? "#ef4444" : "#22c55e"} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 24 }}>{worker.name}</h1>
                {worker.status === "ABSENT" && (
                  <span style={{ fontSize: 10, background: "rgba(239,68,68,0.15)", color: "#ef4444",
                    border: "1px solid rgba(239,68,68,0.3)", padding: "3px 10px", borderRadius: 99,
                    fontWeight: 700, letterSpacing: "0.06em" }}>⚠ ABSENT TODAY</span>
                )}
              </div>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{worker.id}</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                  Under: <span style={{ color: "#3b82f6" }}>{worker.contractor}</span>
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                  <MapPin size={12} /> {worker.zone}
                </div>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Route: <span style={{ fontFamily: "'Syne',sans-serif", color: "#fff", fontWeight: 600 }}>{worker.route}</span></span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={{ padding: "8px 16px", borderRadius: 9, border: "1px solid rgba(245,158,11,0.35)",
              background: "rgba(245,158,11,0.08)", color: "#f59e0b", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              Reassign Route
            </button>
            <button style={{ padding: "8px 16px", borderRadius: 9, border: "1px solid rgba(239,68,68,0.35)",
              background: "rgba(239,68,68,0.08)", color: "#ef4444", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              Flag Worker
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14, marginBottom: 24 }}>
          <StatCard icon={Activity}     label="Completion Rate"      val={`${worker.completionRate}%`} color={worker.completionRate >= 75 ? "#22c55e" : "#ef4444"} sub="SLA: 85%+" />
          <StatCard icon={Clock}        label="Attendance"           val={`${worker.attendance}%`}    color={worker.attendance >= 85 ? "#22c55e" : "#f59e0b"} sub="This month" />
          <StatCard icon={Star}         label="Citizen Rating"       val={worker.rating}              color="#f59e0b" sub={`${rejectionPct}% negative`} />
          <StatCard icon={AlertTriangle} label="Open Anomalies"      val={worker.anomalies}           color="#ef4444" sub="This month" />
          <StatCard icon={Package}      label="Batches Lifetime"     val={worker.totalBatchesLifetime} color="#8b5cf6" sub={worker.wasteCollectedThisMonth + " this month"} />
        </div>

        {/* Score + history */}
        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 16, marginBottom: 24 }}>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 14, padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <ScoreMeter score={worker.score} />
            <div style={{ width: "100%", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12 }}>
              {[
                { label: "Completion",   val: worker.completionRate },
                { label: "Attendance",   val: worker.attendance    },
                { label: "Citizen Score",val: Math.round(worker.rating * 20) },
                { label: "No Anomalies", val: Math.max(0, 100 - worker.anomalies * 10) },
              ].map(m => (
                <div key={m.label} style={{ marginBottom: 9 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{m.label}</span>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>{m.val}%</span>
                  </div>
                  <div style={{ height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 99 }}>
                    <div style={{ height: "100%", borderRadius: 99, width: `${m.val}%`,
                      background: m.val >= 80 ? "#22c55e" : m.val >= 50 ? "#f59e0b" : "#ef4444" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14, padding: "18px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14 }}>Score Trend</h3>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>Last 7 months</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <TrendingDown size={13} color="#ef4444" />
                  <span style={{ fontSize: 12, color: "#ef4444", fontWeight: 600 }}>-28 pts (6 months)</span>
                </div>
                <span style={{ fontSize: 10, background: "rgba(239,68,68,0.12)", color: "#ef4444",
                  border: "1px solid rgba(239,68,68,0.25)", padding: "3px 9px", borderRadius: 99,
                  fontWeight: 700 }}>CRITICAL — REVIEW REQUIRED</span>
              </div>
            </div>
            <MiniBarChart data={worker.scoreHistory} labels={worker.scoreLabels} color="#ef4444" />

            <div style={{ marginTop: 18, padding: "12px 14px", borderRadius: 10,
              background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>
                <span style={{ color: "#ef4444", fontWeight: 600 }}>Auto-action pending:</span> Score has been below 40
                for 2 consecutive months. Supervisor review required before next route assignment.
                Salary deduction: <span style={{ color: "#f59e0b" }}>-12% this cycle</span>.
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20,
          borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ display: "flex", alignItems: "center", gap: 7,
                padding: "10px 16px", borderRadius: "10px 10px 0 0",
                background: activeTab === tab.id ? "rgba(255,255,255,0.05)" : "transparent",
                border: activeTab === tab.id ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
                borderBottom: activeTab === tab.id ? "1px solid transparent" : "none",
                color: activeTab === tab.id ? "#fff" : "rgba(255,255,255,0.45)",
                fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                marginBottom: activeTab === tab.id ? -1 : 0 }}>
              <tab.icon size={13} /> {tab.label}
              {tab.id === "anomalies" && worker.anomalies > 0 && (
                <span style={{ fontSize: 9, background: "#ef4444", color: "#fff",
                  padding: "1px 5px", borderRadius: 99 }}>{worker.anomalies}</span>
              )}
            </button>
          ))}
        </div>

        {/* Route tab */}
        {activeTab === "route" && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <div style={{ padding: "8px 14px", borderRadius: 9,
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <span style={{ fontSize: 12, color: "#ef4444", fontWeight: 600 }}>
                  ⚠ Worker absent — route unassigned. {TODAY_ROUTE.filter(s=>s.status==="SKIPPED").length} stops auto-skipped.
                </span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {TODAY_ROUTE.map((stop, i) => {
                const sc = STOP_STATUS[stop.status];
                return (
                  <div key={i} style={{ display: "flex", gap: 14, padding: "14px 18px",
                    background: "rgba(255,255,255,0.02)", border: `1px solid rgba(255,255,255,${stop.status === "SKIPPED" ? "0.12" : "0.06"})`,
                    borderLeft: `3px solid ${sc.color}`, borderRadius: "0 12px 12px 0",
                    animation: `fadeUp 0.3s ease ${i * 50}ms both` }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8,
                      background: `${sc.color}15`, border: `1px solid ${sc.color}25`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, fontFamily: "'Syne',sans-serif", fontWeight: 800,
                      fontSize: 12, color: sc.color }}>{stop.stop}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{stop.address}</span>
                        <div style={{ display: "inline-flex", padding: "3px 9px", borderRadius: 99,
                          background: `${sc.color}12`, border: `1px solid ${sc.color}25` }}>
                          <span style={{ fontSize: 10, color: sc.color, fontWeight: 600 }}>{sc.label}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 12 }}>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Type: {stop.type}</span>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Window: {stop.window}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Anomalies tab */}
        {activeTab === "anomalies" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, animation: "fadeUp 0.3s ease" }}>
            {ANOMALIES.map((a, i) => {
              const sev = SEV[a.severity];
              return (
                <div key={a.id} style={{ display: "flex", gap: 14, padding: "16px 18px",
                  background: "rgba(255,255,255,0.02)", border: `1px solid ${sev.color}25`,
                  borderLeft: `3px solid ${sev.color}`, borderRadius: "0 12px 12px 0",
                  animation: `fadeUp 0.3s ease ${i * 50}ms both` }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: sev.bg,
                    border: `1px solid ${sev.color}30`, display: "flex", alignItems: "center",
                    justifyContent: "center", flexShrink: 0 }}>
                    <AlertTriangle size={16} color={sev.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13 }}>
                          {a.type.replace(/_/g, " ")}
                        </span>
                        <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 99,
                          background: sev.bg, color: sev.color, fontWeight: 700, letterSpacing: "0.06em" }}>
                          {a.severity}
                        </span>
                      </div>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{a.date}</span>
                    </div>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{a.desc}</p>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 4, display: "block" }}>{a.id}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Ratings tab */}
        {activeTab === "ratings" && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
              <div style={{ padding: "10px 16px", borderRadius: 10,
                background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <span style={{ fontSize: 12, color: "#ef4444", fontWeight: 600 }}>
                  {rejectionPct}% negative ratings this month — anomaly threshold exceeded (30%)
                </span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {CITIZEN_RATINGS.map((r, i) => (
                <div key={r.id} style={{ padding: "14px 18px",
                  background: "rgba(255,255,255,0.02)", border: `1px solid rgba(255,255,255,${r.rating <= 2 ? "0.1" : "0.06"})`,
                  borderRadius: 12, animation: `fadeUp 0.3s ease ${i * 50}ms both` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ display: "flex", gap: 2 }}>
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} size={12}
                            fill={s <= r.rating ? "#f59e0b" : "none"}
                            color={s <= r.rating ? "#f59e0b" : "rgba(255,255,255,0.15)"} />
                        ))}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{r.citizen}</span>
                      {r.rating <= 2 && (
                        <span style={{ fontSize: 9, background: "rgba(239,68,68,0.12)", color: "#ef4444",
                          padding: "2px 7px", borderRadius: 99, fontWeight: 700 }}>NEGATIVE</span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{r.date}</span>
                      {r.resolved
                        ? <CheckCircle size={13} color="#22c55e" />
                        : <XCircle size={13} color="#ef4444" />}
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontStyle: "italic" }}>
                    "{r.comment}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Overview tab */}
        {activeTab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, animation: "fadeUp 0.3s ease" }}>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 14, padding: "18px 20px" }}>
              <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 14 }}>
                Worker Info
              </h3>
              {[
                ["Phone",         worker.phone],
                ["Contractor",    worker.contractor],
                ["Zone",          worker.zone],
                ["Route",         worker.route],
                ["Joined",        worker.joinedDate],
                ["Avg Daily Stops", worker.avgDailyStops],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between",
                  padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{k}</span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 14, padding: "18px 20px" }}>
              <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 14 }}>
                Performance Flags
              </h3>
              {[
                { text: "Score below 40 — route assignment suspended", color: "#ef4444" },
                { text: `${rejectionPct}% clearance rejection rate — exceeds 30% threshold`, color: "#ef4444" },
                { text: "Attendance at 62% — SLA requires 85%+", color: "#f59e0b" },
                { text: "3 ghost pickup flags in last 30 days", color: "#f59e0b" },
              ].map((flag, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start",
                  padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: flag.color,
                    marginTop: 4, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>{flag.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}