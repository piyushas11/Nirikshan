// WorkerList.jsx — Supabase-connected worker management
import { useState, useEffect } from "react";
import {
  User, Star, TrendingUp, TrendingDown, AlertTriangle,
  Search, CheckCircle, Clock, Users, MapPin, Activity,
  Shield, ChevronDown, ChevronUp, XCircle, Navigation,
  Package, Building2, BarChart2, Phone
} from "lucide-react";
import { db } from "../../lib/supabase";

const STATUS_CFG = {
  ON_ROUTE:  { color: "#22c55e", bg: "rgba(34,197,94,0.12)",   border: "rgba(34,197,94,0.3)",   label: "On Route"  },
  COMPLETED: { color: "#3b82f6", bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.3)",  label: "Completed" },
  IDLE:      { color: "#6b7280", bg: "rgba(107,114,128,0.1)",  border: "rgba(107,114,128,0.25)",label: "Idle"      },
  ABSENT:    { color: "#ef4444", bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.3)",   label: "Absent"    },
};

const STOP_CFG = {
  COLLECTED:   { color: "#22c55e", label: "Collected",   Icon: CheckCircle },
  IN_PROGRESS: { color: "#3b82f6", label: "In Progress", Icon: Activity    },
  SKIPPED:     { color: "#ef4444", label: "Skipped",     Icon: XCircle     },
  PENDING:     { color: "#6b7280", label: "Pending",     Icon: Clock       },
};

function scoreColor(s) { return s >= 80 ? "#22c55e" : s >= 55 ? "#f59e0b" : "#ef4444"; }

function ScoreRing({ score, size = 52 }) {
  const r = size / 2 - 5, circ = 2 * Math.PI * r, dash = (score / 100) * circ;
  const c = scoreColor(score);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={c} strokeWidth="5"
        strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ*0.25} strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 4px ${c})` }}/>
      <text x={size/2} y={size/2+1} textAnchor="middle" dominantBaseline="middle"
        fill={c} fontSize={size < 52 ? "11" : "13"} fontWeight="800" fontFamily="'Syne',sans-serif">{score}</text>
    </svg>
  );
}

function StarRow({ rating }) {
  return (
    <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={9} fill={i <= Math.round(rating) ? "#f59e0b" : "none"}
          color={i <= Math.round(rating) ? "#f59e0b" : "rgba(255,255,255,0.18)"} />
      ))}
      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginLeft: 3 }}>{Number(rating).toFixed(1)}</span>
    </div>
  );
}

function WorkerDetail({ worker, routeStops }) {
  const [tab, setTab] = useState("overview");
  const sc = scoreColor(worker.score);
  const scoreHistory = worker.score_history ?? [];
  const scoreLabels  = worker.score_labels  ?? [];
  const flags        = worker.flags         ?? [];

  return (
    <tr>
      <td colSpan={9} style={{ padding: 0 }}>
        <div style={{ margin: "0 0 2px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)", borderTop: `2px solid ${sc}`, borderRadius: "0 0 14px 14px", animation: "expandIn 0.28s ease", overflow: "hidden" }}>
          <style>{`@keyframes expandIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "14px 22px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <ScoreRing score={worker.score} size={54}/>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 3 }}>
                <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 15 }}>{worker.name}</span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{worker.worker_code}</span>
                {worker.status === "ABSENT" && <span style={{ fontSize: 9, background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", padding: "2px 8px", borderRadius: 99, fontWeight: 700 }}>ABSENT TODAY</span>}
              </div>
              <div style={{ display: "flex", gap: 12, fontSize: 11, color: "rgba(255,255,255,0.35)", flexWrap: "wrap" }}>
                <span>📦 {worker.total_batches} batches</span>
                <span>♻️ {worker.waste_this_month} this month</span>
                <span>🛑 {worker.avg_stops} stops/day</span>
                <span>📅 {worker.joined_date}</span>
                {worker.phone && <span>📞 {worker.phone}</span>}
              </div>
            </div>
            <div style={{ display: "flex", gap: 7 }}>
              {[
                { icon: Activity, label: "Completion", val: `${worker.completion_rate}%`,  color: worker.completion_rate >= 85 ? "#22c55e" : "#ef4444" },
                { icon: Clock,    label: "Attendance", val: `${worker.attendance_pct}%`,   color: worker.attendance_pct >= 85 ? "#22c55e" : "#f59e0b" },
                { icon: Star,     label: "Rating",     val: Number(worker.citizen_rating).toFixed(1), color: "#f59e0b" },
                { icon: AlertTriangle, label: "Anomalies", val: worker.anomalies_count, color: worker.anomalies_count === 0 ? "rgba(255,255,255,0.3)" : worker.anomalies_count <= 2 ? "#f59e0b" : "#ef4444" },
              ].map(({ icon: Icon, label, val, color }) => (
                <div key={label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "7px 11px", textAlign: "center" }}>
                  <Icon size={12} color={color} style={{ display: "block", margin: "0 auto 3px" }} />
                  <div style={{ fontSize: 13, fontWeight: 800, fontFamily: "'Syne',sans-serif", color }}>{val}</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <button style={{ padding: "6px 13px", borderRadius: 8, border: "1px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.07)", color: "#f59e0b", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Reassign</button>
              <button style={{ padding: "6px 13px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.07)", color: "#ef4444", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Flag Worker</button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 2, padding: "7px 22px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            {[
              { id: "overview", label: "Overview",     Icon: BarChart2   },
              { id: "route",    label: "Today's Route",Icon: Navigation  },
              { id: "trend",    label: "Score Trend",  Icon: TrendingUp  },
              { id: "flags",    label: `Flags ${flags.length > 0 ? `(${flags.length})` : ""}`, Icon: Shield },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 13px", borderRadius: "8px 8px 0 0", border: "none", background: tab === t.id ? "rgba(255,255,255,0.06)" : "transparent", color: tab === t.id ? "#fff" : "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, cursor: "pointer", borderBottom: tab === t.id ? `2px solid ${sc}` : "2px solid transparent" }}>
                <t.Icon size={12}/>{t.label}
              </button>
            ))}
          </div>

          <div style={{ padding: "14px 22px" }}>
            {tab === "overview" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, animation: "expandIn 0.25s ease" }}>
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 11, padding: "13px 15px" }}>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 700, letterSpacing: "0.06em", marginBottom: 10 }}>PERFORMANCE METRICS</p>
                  {[
                    { label: "Completion Rate", val: worker.completion_rate },
                    { label: "Attendance",       val: worker.attendance_pct },
                    { label: "Citizen Rating",   val: Math.round(worker.citizen_rating * 20) },
                    { label: "Anomaly-Free",     val: Math.max(0, 100 - worker.anomalies_count * 10) },
                  ].map(m => (
                    <div key={m.label} style={{ marginBottom: 9 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{m.label}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: scoreColor(m.val) }}>{m.val}%</span>
                      </div>
                      <div style={{ height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 99 }}>
                        <div style={{ width: `${m.val}%`, height: "100%", borderRadius: 99, background: scoreColor(m.val), transition: "width 0.8s ease" }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 11, padding: "13px 15px" }}>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 700, letterSpacing: "0.06em", marginBottom: 10 }}>WORKER INFO</p>
                  {[
                    ["Contractor", worker.contractor_name],
                    ["Zone", worker.zone],
                    ["Route", worker.route],
                    ["Joined", worker.joined_date],
                    ["Phone", worker.phone],
                    ["Avg Stops/Day", worker.avg_stops],
                    ["Batches Lifetime", worker.total_batches],
                    ["Waste This Month", worker.waste_this_month],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{k}</span>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>{v ?? "—"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "route" && (
              <div style={{ animation: "expandIn 0.25s ease" }}>
                {worker.status === "ABSENT" && (
                  <div style={{ padding: "8px 14px", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 12, color: "#ef4444", fontWeight: 600 }}>⚠ Worker absent — route {worker.route} unassigned today</span>
                  </div>
                )}
                {routeStops.length === 0 && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center", padding: "20px 0" }}>No route stops for today.</p>}
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {routeStops.map((stop, i) => {
                    const sc2 = STOP_CFG[stop.status] ?? STOP_CFG.PENDING;
                    return (
                      <div key={stop.id} style={{ display: "flex", gap: 10, padding: "11px 14px", background: "rgba(255,255,255,0.02)", border: `1px solid rgba(255,255,255,0.06)`, borderLeft: `3px solid ${sc2.color}`, borderRadius: "0 9px 9px 0", animation: `expandIn 0.25s ease ${i*35}ms both` }}>
                        <div style={{ width: 24, height: 24, borderRadius: 6, background: `${sc2.color}15`, border: `1px solid ${sc2.color}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 10, color: sc2.color }}>{stop.stop_number}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                            <span style={{ fontSize: 12, fontWeight: 600 }}>{stop.address}</span>
                            <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 99, background: `${sc2.color}12`, color: sc2.color, fontWeight: 600, border: `1px solid ${sc2.color}22` }}>{sc2.label}</span>
                          </div>
                          <div style={{ display: "flex", gap: 10, fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
                            <span>Type: {stop.waste_type}</span>
                            <span>Window: {stop.time_window}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {tab === "trend" && scoreHistory.length > 0 && (
              <div style={{ animation: "expandIn 0.25s ease" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  {worker.trend === "up"
                    ? <><TrendingUp size={15} color="#22c55e"/><span style={{ fontSize: 12, color: "#22c55e", fontWeight: 600 }}>Improving</span></>
                    : <><TrendingDown size={15} color="#ef4444"/><span style={{ fontSize: 12, color: "#ef4444", fontWeight: 600 }}>Declining — action required</span></>}
                </div>
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 11, padding: "14px" }}>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 7, height: 72, marginBottom: 5 }}>
                    {scoreHistory.map((v, i) => {
                      const max = Math.max(...scoreHistory), min = Math.min(...scoreHistory) - 5;
                      const pct = ((v - min) / (max - min)) * 100;
                      return (
                        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                          <div style={{ width: "100%", height: `${pct}%`, minHeight: 4, background: i === scoreHistory.length-1 ? sc : `${sc}55`, borderRadius: "3px 3px 0 0", transition: "height 0.6s ease" }} />
                          <span style={{ fontSize: 8, color: "rgba(255,255,255,0.3)" }}>{scoreLabels[i] ?? ""}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    {scoreHistory.map((v, i) => (
                      <span key={i} style={{ fontSize: 10, fontWeight: i === scoreHistory.length-1 ? 700 : 400, color: i === scoreHistory.length-1 ? sc : "rgba(255,255,255,0.3)" }}>{v}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === "flags" && (
              <div style={{ animation: "expandIn 0.25s ease" }}>
                {flags.length === 0 ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "18px", background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.18)", borderRadius: 11 }}>
                    <CheckCircle size={18} color="#22c55e"/>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.65)" }}>No performance flags — worker is compliant</span>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {flags.map((flag, i) => (
                      <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start", padding: "11px 14px", background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)", borderLeft: "3px solid #ef4444", borderRadius: "0 9px 9px 0", animation: `expandIn 0.25s ease ${i*40}ms both` }}>
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#ef4444", marginTop: 6, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.55 }}>{flag}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}

export default function WorkerList() {
  const [workers,      setWorkers]      = useState([]);
  const [routeMap,     setRouteMap]     = useState({});
  const [search,       setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterContr,  setFilterContr]  = useState("ALL");
  const [sortBy,       setSortBy]       = useState("score");
  const [expandedId,   setExpandedId]   = useState(null);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    db.workers.list().then(data => { setWorkers(data); setLoading(false); });
  }, []);

  // Fetch route stops lazily when a row is expanded
  useEffect(() => {
    if (!expandedId || routeMap[expandedId]) return;
    db.workers.routeStops(expandedId).then(stops => {
      setRouteMap(prev => ({ ...prev, [expandedId]: stops }));
    });
  }, [expandedId]);

  const contractors = ["ALL", ...new Set(workers.map(w => w.contractor_name).filter(Boolean))];

  const filtered = workers
    .filter(w => {
      const ms  = w.name.toLowerCase().includes(search.toLowerCase()) || (w.worker_code ?? "").toLowerCase().includes(search.toLowerCase());
      const ms2 = filterStatus === "ALL" || w.status === filterStatus;
      const ms3 = filterContr  === "ALL" || w.contractor_name === filterContr;
      return ms && ms2 && ms3;
    })
    .sort((a, b) => sortBy === "score" ? b.score - a.score : a.name.localeCompare(b.name));

  const stats = [
    { label: "Total Workers",  val: workers.length,                                                  color: "#3b82f6", Icon: Users         },
    { label: "On Route Today", val: workers.filter(w => w.status === "ON_ROUTE").length,             color: "#22c55e", Icon: Activity      },
    { label: "Absent / Idle",  val: workers.filter(w => ["ABSENT","IDLE"].includes(w.status)).length,color: "#f59e0b", Icon: Clock         },
    { label: "Flagged Workers",val: workers.filter(w => w.anomalies_count > 3).length,               color: "#ef4444", Icon: AlertTriangle  },
  ];

  return (
    <>
      <style>{`
        select option{background:#0d1b2a;color:#fff}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
      <div style={{ padding: "28px 32px", minHeight: "calc(100vh - 60px)" }}>
        <div style={{ marginBottom: 22, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.28)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <User size={16} color="#22c55e"/>
          </div>
          <div>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 21, lineHeight: 1 }}>Waste Worker Management</h1>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>Click any row to expand worker details</p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 13, marginBottom: 22 }}>
          {stats.map(({ label, val, color, Icon }, i) => (
            <div key={label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 13, padding: "15px 17px", display: "flex", alignItems: "center", gap: 13, animation: `fadeUp 0.4s ease ${i*55}ms both` }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}15`, border: `1px solid ${color}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon size={16} color={color}/></div>
              <div>
                <p style={{ fontSize: 21, fontWeight: 800, fontFamily: "'Syne',sans-serif", color }}>{val}</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 9, marginBottom: 16, alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, maxWidth: 260 }}>
            <Search size={12} color="rgba(255,255,255,0.3)" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or ID…"
              style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, padding: "8px 12px 8px 30px", color: "#fff", fontSize: 12, outline: "none" }}/>
          </div>
          {[
            { val: filterStatus, set: setFilterStatus, opts: [["ALL","All Status"],["ON_ROUTE","On Route"],["COMPLETED","Completed"],["IDLE","Idle"],["ABSENT","Absent"]] },
            { val: filterContr,  set: setFilterContr,  opts: contractors.map(c => [c, c === "ALL" ? "All Contractors" : c]) },
            { val: sortBy,       set: setSortBy,       opts: [["score","Sort: Score"],["name","Sort: Name"]] },
          ].map(({ val, set, opts }, i) => (
            <select key={i} value={val} onChange={e => set(e.target.value)}
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, padding: "8px 11px", color: "rgba(255,255,255,0.7)", fontSize: 12, outline: "none", cursor: "pointer" }}>
              {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          ))}
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginLeft: "auto" }}>{filtered.length} of {workers.length}</span>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Loading workers…</div>
        ) : (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 15, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.025)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  {["Score","Worker","Contractor","Zone","Route","Completion","Rating","Anomalies","Status"].map(h => (
                    <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((w, i) => {
                  const st   = STATUS_CFG[w.status] ?? STATUS_CFG.IDLE;
                  const isOpen = expandedId === w.id;
                  const sc   = scoreColor(w.score);
                  return (
                    <>
                      <tr key={w.id} onClick={() => { setExpandedId(isOpen ? null : w.id); }}
                        style={{ cursor: "pointer", background: isOpen ? "rgba(255,255,255,0.04)" : w.status === "ABSENT" ? "rgba(239,68,68,0.02)" : "transparent", borderBottom: isOpen ? "none" : "1px solid rgba(255,255,255,0.05)", animation: `fadeUp 0.35s ease ${i*30}ms both`, transition: "background 0.2s" }}
                        onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                        onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = w.status === "ABSENT" ? "rgba(239,68,68,0.02)" : "transparent"; }}
                      >
                        <td style={{ padding: "11px 14px" }}><ScoreRing score={w.score} size={42}/></td>
                        <td style={{ padding: "11px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><User size={12} color="rgba(255,255,255,0.4)"/></div>
                            <div>
                              <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13 }}>{w.name}</p>
                              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{w.worker_code}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "11px 14px" }}><span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{w.contractor_name}</span></td>
                        <td style={{ padding: "11px 14px" }}><div style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={10} color="rgba(255,255,255,0.3)"/><span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{w.zone}</span></div></td>
                        <td style={{ padding: "11px 14px" }}><span style={{ fontSize: 12, fontFamily: "'Syne',sans-serif", fontWeight: 600, color: "rgba(255,255,255,0.65)" }}>{w.route}</span></td>
                        <td style={{ padding: "11px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: w.completion_rate >= 85 ? "#22c55e" : w.completion_rate >= 65 ? "#f59e0b" : "#ef4444" }}>{w.completion_rate}%</span>
                            {w.trend === "up" ? <TrendingUp size={10} color="#22c55e"/> : <TrendingDown size={10} color="#ef4444"/>}
                          </div>
                          <div style={{ height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 99, width: 65 }}>
                            <div style={{ height: "100%", borderRadius: 99, width: `${w.completion_rate}%`, background: w.completion_rate >= 85 ? "#22c55e" : w.completion_rate >= 65 ? "#f59e0b" : "#ef4444" }} />
                          </div>
                        </td>
                        <td style={{ padding: "11px 14px" }}><StarRow rating={w.citizen_rating}/></td>
                        <td style={{ padding: "11px 14px" }}><span style={{ fontSize: 12, fontWeight: 600, color: w.anomalies_count === 0 ? "rgba(255,255,255,0.22)" : w.anomalies_count <= 2 ? "#f59e0b" : "#ef4444" }}>{w.anomalies_count > 0 ? `⚠ ${w.anomalies_count}` : "—"}</span></td>
                        <td style={{ padding: "11px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                            <div style={{ display: "inline-flex", padding: "3px 9px", borderRadius: 99, background: st.bg, border: `1px solid ${st.border}` }}><span style={{ fontSize: 10, color: st.color, fontWeight: 600 }}>{st.label}</span></div>
                            {isOpen ? <ChevronUp size={13} color={sc}/> : <ChevronDown size={13} color="rgba(255,255,255,0.25)"/>}
                          </div>
                        </td>
                      </tr>
                      {isOpen && <WorkerDetail key={`det-${w.id}`} worker={w} routeStops={routeMap[w.id] ?? []} />}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}