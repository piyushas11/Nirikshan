import { useState } from "react";
import {
  ArrowLeft, Building2, Star, MapPin, TrendingUp, TrendingDown,
  AlertTriangle, Users, Truck, CheckCircle, Clock, Shield,
  BarChart2, Package, XCircle, ChevronRight, MoreHorizontal,
  Zap, Award, Activity
} from "lucide-react";

// ─── Mock data ────────────────────────────────────────────────────────────────
const CONTRACTOR = {
  id: "CON-004", name: "BangaloreGreen", zone: "Karnataka",
  districts: ["Bangalore", "Belgaum", "Mysore"], score: 38,
  workers: 18, trucks: 6, activeContracts: 2,
  completionRate: 62, avgClearTime: "9.4h", citizenRating: 2.9,
  anomalies: 9, status: "FLAGGED", trend: "down",
  unresolved: 7, joinedDate: "Jun 2023", contact: "ops@bangaloregreen.in",
  contractValue: "₹48L/yr",
  scoreHistory: [74, 70, 65, 58, 52, 45, 38],
  scoreLabels:  ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr"],
};

const WORKERS = [
  { id: "WK-201", name: "Venkat Reddy",   route: "KA-R07", score: 44, status: "ON_ROUTE",    completionRate: 61, anomalies: 3 },
  { id: "WK-202", name: "Sanjay Nayak",   route: "KA-R15", score: 58, status: "ON_ROUTE",    completionRate: 72, anomalies: 1 },
  { id: "WK-203", name: "Ramesh Gowda",   route: "KA-R09", score: 32, status: "ABSENT",      completionRate: 45, anomalies: 5 },
  { id: "WK-204", name: "Priya Hegde",    route: "KA-R03", score: 71, status: "COMPLETED",   completionRate: 88, anomalies: 0 },
  { id: "WK-205", name: "Arun Bharadwaj", route: "KA-R21", score: 49, status: "IDLE",        completionRate: 67, anomalies: 2 },
];

const ANOMALIES = [
  { id: "ANO-881", type: "GHOST_PICKUP",           severity: "HIGH",   timestamp: "Today, 09:14",    worker: "Venkat Reddy",   desc: "Batch marked collected but GPS shows truck 2.3km away" },
  { id: "ANO-879", type: "BATCH_STAGNATION",       severity: "HIGH",   timestamp: "Today, 07:45",    worker: "Ramesh Gowda",   desc: "Batch WB-2041 in transit for 16hrs without status update" },
  { id: "ANO-874", type: "ROUTE_DEVIATION",        severity: "MEDIUM", timestamp: "Yesterday, 14:22", worker: "Sanjay Nayak",   desc: "Truck KA-R15 deviated 4km from assigned route" },
  { id: "ANO-869", type: "CITIZEN_REJECTION",      severity: "HIGH",   timestamp: "Yesterday, 11:30", worker: "Venkat Reddy",   desc: "Clearance photo rejected — 38% rejection rate this month" },
  { id: "ANO-861", type: "TIME_WINDOW_VIOLATION",  severity: "LOW",    timestamp: "3 days ago",       worker: "Arun Bharadwaj", desc: "Collection logged at 3:47pm, outside 6am–10am window" },
];

const BATCHES = [
  { id: "WB-2041", zone: "Bangalore", status: "STAGNANT", type: "Mixed",      updated: "16h ago", flag: true },
  { id: "WB-2039", zone: "Belgaum",   status: "IN_TRANSIT", type: "Recyclable", updated: "2h ago",  flag: false },
  { id: "WB-2037", zone: "Mysore",    status: "AT_FACILITY", type: "Organic",    updated: "45m ago", flag: false },
  { id: "WB-2035", zone: "Bangalore", status: "COMPLETED", type: "Dry Waste",  updated: "3h ago",  flag: false },
];

// ─── Small reusables ──────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, val, color, sub }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 14, padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9,
          background: `${color}18`, border: `1px solid ${color}30`,
          display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={15} color={color} />
        </div>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{label}</span>
      </div>
      <p style={{ fontSize: 24, fontWeight: 800, fontFamily: "'Syne',sans-serif", color }}>{val}</p>
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
            borderRadius: "3px 3px 0 0", transition: "height 0.6s ease", minHeight: 4 }} />
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

const WORKER_STATUS = {
  ON_ROUTE:  { color: "#22c55e", label: "On Route"  },
  ABSENT:    { color: "#ef4444", label: "Absent"    },
  COMPLETED: { color: "#3b82f6", label: "Completed" },
  IDLE:      { color: "#6b7280", label: "Idle"      },
};

const BATCH_STATUS = {
  STAGNANT:    { color: "#ef4444", label: "Stagnant"    },
  IN_TRANSIT:  { color: "#3b82f6", label: "In Transit"  },
  AT_FACILITY: { color: "#8b5cf6", label: "At Facility" },
  COMPLETED:   { color: "#22c55e", label: "Completed"   },
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ContractorDetail({ contractor = CONTRACTOR, onBack }) {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview",  label: "Overview",  icon: BarChart2  },
    { id: "workers",   label: "Workers",   icon: Users      },
    { id: "anomalies", label: "Anomalies", icon: AlertTriangle },
    { id: "batches",   label: "Batches",   icon: Package    },
  ];

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

        {/* Back + Header */}
        <div style={{ marginBottom: 24 }}>
          <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 7,
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8, padding: "7px 14px", color: "rgba(255,255,255,0.6)",
            fontSize: 12, cursor: "pointer", marginBottom: 20 }}>
            <ArrowLeft size={13} /> Back to Contractors
          </button>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ width: 56, height: 56, borderRadius: 14,
                background: contractor.status === "FLAGGED" ? "rgba(239,68,68,0.12)" : "rgba(59,130,246,0.12)",
                border: `1.5px solid ${contractor.status === "FLAGGED" ? "rgba(239,68,68,0.3)" : "rgba(59,130,246,0.3)"}`,
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Building2 size={26} color={contractor.status === "FLAGGED" ? "#ef4444" : "#3b82f6"} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 24 }}>
                    {contractor.name}
                  </h1>
                  {contractor.status === "FLAGGED" && (
                    <span style={{ fontSize: 10, background: "rgba(239,68,68,0.15)", color: "#ef4444",
                      border: "1px solid rgba(239,68,68,0.3)", padding: "3px 10px", borderRadius: 99,
                      fontWeight: 700, letterSpacing: "0.06em" }}>⚠ FLAGGED</span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{contractor.id}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5,
                    fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                    <MapPin size={12} /> {contractor.zone} · {contractor.districts.length} districts
                  </span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                    Since {contractor.joinedDate}
                  </span>
                  <span style={{ fontSize: 12, color: "#22c55e" }}>{contractor.contractValue}</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 10 }}>
              <button style={{ padding: "8px 16px", borderRadius: 9, border: "1px solid rgba(245,158,11,0.35)",
                background: "rgba(245,158,11,0.08)", color: "#f59e0b",
                fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                Reassign Zone
              </button>
              <button style={{ padding: "8px 16px", borderRadius: 9, border: "1px solid rgba(239,68,68,0.35)",
                background: "rgba(239,68,68,0.08)", color: "#ef4444",
                fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                Suspend
              </button>
            </div>
          </div>
        </div>

        {/* Top stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14, marginBottom: 24 }}>
          <StatCard icon={Users}       label="Active Workers"   val={contractor.workers}        color="#3b82f6" />
          <StatCard icon={Truck}       label="Trucks"           val={contractor.trucks}         color="#8b5cf6" />
          <StatCard icon={Activity}    label="Completion Rate"  val={`${contractor.completionRate}%`} color={contractor.completionRate >= 80 ? "#22c55e" : "#ef4444"} sub="↓ vs 74% last month" />
          <StatCard icon={Clock}       label="Avg Clear Time"   val={contractor.avgClearTime}   color="#f59e0b" sub="SLA: 6h" />
          <StatCard icon={AlertTriangle} label="Open Anomalies" val={contractor.anomalies}      color="#ef4444" sub={`${contractor.unresolved} unresolved`} />
        </div>

        {/* Score + chart row */}
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 1fr", gap: 16, marginBottom: 24 }}>
          {/* Score meter */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 14, padding: "20px", display: "flex", flexDirection: "column",
            alignItems: "center", gap: 16 }}>
            <ScoreMeter score={contractor.score} />
            <div style={{ width: "100%", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 14 }}>
              {[
                { label: "Completion Rate", val: contractor.completionRate, max: 100 },
                { label: "Citizen Rating",  val: contractor.citizenRating * 20, max: 100 },
                { label: "No Anomalies",    val: Math.max(0, 100 - contractor.anomalies * 8), max: 100 },
              ].map(m => (
                <div key={m.label} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{m.label}</span>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>{Math.round(m.val)}%</span>
                  </div>
                  <div style={{ height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 99 }}>
                    <div style={{ height: "100%", borderRadius: 99, width: `${m.val}%`,
                      background: m.val >= 80 ? "#22c55e" : m.val >= 50 ? "#f59e0b" : "#ef4444" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Score history */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14, padding: "18px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14 }}>Score History</h3>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>Last 7 months</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <TrendingDown size={14} color="#ef4444" />
                <span style={{ fontSize: 12, color: "#ef4444", fontWeight: 600 }}>-36 pts</span>
              </div>
            </div>
            <MiniBarChart data={contractor.scoreHistory} labels={contractor.scoreLabels} color="#ef4444" />
          </div>

          {/* District breakdown */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14, padding: "18px 20px" }}>
            <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 14 }}>
              District Coverage
            </h3>
            {contractor.districts.map((d, i) => (
              <div key={d} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%",
                    background: i === 0 ? "#ef4444" : i === 1 ? "#f59e0b" : "#22c55e" }} />
                  <span style={{ fontSize: 13 }}>{d}</span>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ height: 4, borderRadius: 99, width: 80, background: "rgba(255,255,255,0.07)" }}>
                    <div style={{ height: "100%", borderRadius: 99,
                      width: `${[62, 71, 85][i]}%`,
                      background: [62,71,85][i] >= 80 ? "#22c55e" : [62,71,85][i] >= 70 ? "#f59e0b" : "#ef4444" }} />
                  </div>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", width: 30 }}>{[62,71,85][i]}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20,
          borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: 0 }}>
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
              {tab.id === "anomalies" && contractor.anomalies > 0 && (
                <span style={{ fontSize: 9, background: "#ef4444", color: "#fff",
                  padding: "1px 5px", borderRadius: 99 }}>{contractor.anomalies}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "workers" && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 120px 100px 90px 80px",
                padding: "10px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(255,255,255,0.02)" }}>
                {["Worker","Route","Completion","Score","Anomalies","Status"].map(h => (
                  <span key={h} style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase" }}>{h}</span>
                ))}
              </div>
              {WORKERS.map((w, i) => {
                const ws = WORKER_STATUS[w.status];
                const sc = w.score >= 80 ? "#22c55e" : w.score >= 50 ? "#f59e0b" : "#ef4444";
                return (
                  <div key={w.id} style={{ display: "grid", gridTemplateColumns: "1fr 90px 120px 100px 90px 80px",
                    padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.04)",
                    alignItems: "center", cursor: "pointer", transition: "background 0.2s",
                    animation: `fadeUp 0.3s ease ${i * 50}ms both` }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600 }}>{w.name}</p>
                      <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{w.id}</p>
                    </div>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{w.route}</span>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: w.completionRate >= 75 ? "#22c55e" : "#ef4444" }}>{w.completionRate}%</span>
                      </div>
                      <div style={{ height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 99, width: 70 }}>
                        <div style={{ height: "100%", borderRadius: 99, width: `${w.completionRate}%`,
                          background: w.completionRate >= 75 ? "#22c55e" : "#ef4444" }} />
                      </div>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: sc }}>{w.score}</span>
                    <span style={{ fontSize: 13, color: w.anomalies > 2 ? "#ef4444" : w.anomalies > 0 ? "#f59e0b" : "rgba(255,255,255,0.4)" }}>
                      {w.anomalies > 0 ? `⚠ ${w.anomalies}` : "—"}
                    </span>
                    <div style={{ display: "inline-flex", padding: "4px 10px", borderRadius: 99,
                      background: `${ws.color}15`, border: `1px solid ${ws.color}30` }}>
                      <span style={{ fontSize: 10, color: ws.color, fontWeight: 600 }}>{ws.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "anomalies" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, animation: "fadeUp 0.3s ease" }}>
            {ANOMALIES.map((a, i) => {
              const sev = SEV[a.severity];
              return (
                <div key={a.id} style={{ display: "flex", gap: 14, padding: "16px 18px",
                  background: "rgba(255,255,255,0.02)", border: `1px solid ${sev.color}25`,
                  borderLeft: `3px solid ${sev.color}`, borderRadius: "0 12px 12px 0",
                  animation: `fadeUp 0.3s ease ${i * 50}ms both` }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10,
                    background: sev.bg, border: `1px solid ${sev.color}30`,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <AlertTriangle size={16} color={sev.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13 }}>
                          {a.type.replace(/_/g, " ")}
                        </span>
                        <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 99,
                          background: sev.bg, color: sev.color, fontWeight: 700, letterSpacing: "0.06em" }}>
                          {a.severity}
                        </span>
                      </div>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{a.timestamp}</span>
                    </div>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginBottom: 6 }}>{a.desc}</p>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
                        Worker: <span style={{ color: "rgba(255,255,255,0.6)" }}>{a.worker}</span>
                      </span>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{a.id}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button style={{ padding: "6px 12px", borderRadius: 8,
                      border: "1px solid rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.07)",
                      color: "#22c55e", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Resolve</button>
                    <button style={{ padding: "6px 12px", borderRadius: 8,
                      border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)",
                      color: "rgba(255,255,255,0.5)", fontSize: 11, cursor: "pointer" }}>Dismiss</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "batches" && (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14, overflow: "hidden", animation: "fadeUp 0.3s ease" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 130px 130px 120px",
              padding: "10px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.02)" }}>
              {["Batch ID","Zone","Waste Type","Last Update","Status"].map(h => (
                <span key={h} style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 600,
                  letterSpacing: "0.07em", textTransform: "uppercase" }}>{h}</span>
              ))}
            </div>
            {BATCHES.map((b, i) => {
              const bs = BATCH_STATUS[b.status];
              return (
                <div key={b.id} style={{ display: "grid", gridTemplateColumns: "1fr 120px 130px 130px 120px",
                  padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.04)",
                  alignItems: "center", animation: `fadeUp 0.3s ease ${i * 50}ms both`,
                  background: b.flag ? "rgba(239,68,68,0.03)" : "transparent" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Package size={14} color={b.flag ? "#ef4444" : "rgba(255,255,255,0.35)"} />
                    <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "'Syne',sans-serif" }}>{b.id}</span>
                    {b.flag && <span style={{ fontSize: 9, background: "rgba(239,68,68,0.15)", color: "#ef4444",
                      padding: "1px 6px", borderRadius: 99, fontWeight: 700 }}>FLAG</span>}
                  </div>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.65)" }}>{b.zone}</span>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.65)" }}>{b.type}</span>
                  <span style={{ fontSize: 13, color: b.flag ? "#ef4444" : "rgba(255,255,255,0.45)" }}>{b.updated}</span>
                  <div style={{ display: "inline-flex", padding: "4px 10px", borderRadius: 99,
                    background: `${bs.color}15`, border: `1px solid ${bs.color}30` }}>
                    <span style={{ fontSize: 10, color: bs.color, fontWeight: 600 }}>{bs.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, animation: "fadeUp 0.3s ease" }}>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 14, padding: "18px 20px" }}>
              <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 14 }}>
                Contract Info
              </h3>
              {[
                ["Contact Email", contractor.contact],
                ["Contract Value", contractor.contractValue],
                ["Active Contracts", contractor.activeContracts],
                ["Member Since", contractor.joinedDate],
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
                { text: "Score dropped below 40 — zone assignment frozen", color: "#ef4444" },
                { text: "Avg clear time 9.4h exceeds 6h SLA by 57%", color: "#ef4444" },
                { text: "7 citizen complaints rejected as unresolved", color: "#f59e0b" },
                { text: "1 worker absent without reassignment logged", color: "#f59e0b" },
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