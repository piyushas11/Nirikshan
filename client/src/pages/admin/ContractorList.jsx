// ContractorList.jsx — Supabase-connected, expandable inline (like WorkerList)
import { useState, useEffect } from "react";
import {
  Building2, Star, MapPin, TrendingUp, TrendingDown,
  AlertTriangle, ChevronRight, Search, Shield,
  Users, Truck, CheckCircle, Clock, Plus, ChevronDown, ChevronUp,
  Activity, BarChart2, Package
} from "lucide-react";
import { db } from "../../lib/supabase";

const STATUS_CONFIG = {
  ACTIVE:     { color: "#22c55e", bg: "rgba(34,197,94,0.12)",   border: "rgba(34,197,94,0.3)",   label: "Active"       },
  REVIEW:     { color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.3)",  label: "Under Review" },
  FLAGGED:    { color: "#ef4444", bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.3)",   label: "Flagged"      },
  SUSPENDED:  { color: "#6b7280", bg: "rgba(107,114,128,0.1)",  border: "rgba(107,114,128,0.25)",label: "Suspended"    },
};

function scoreColor(s) { return s >= 80 ? "#22c55e" : s >= 50 ? "#f59e0b" : "#ef4444"; }

function ScoreBadge({ score }) {
  const color = scoreColor(score);
  const bg    = score >= 80 ? "rgba(34,197,94,0.1)" : score >= 50 ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)";
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 46, height: 46, borderRadius: 11, background: bg, border: `1.5px solid ${color}33`, flexDirection: "column", flexShrink: 0 }}>
      <span style={{ fontSize: 15, fontWeight: 800, color, fontFamily: "'Syne',sans-serif", lineHeight: 1 }}>{score}</span>
      <span style={{ fontSize: 7, color: `${color}99`, letterSpacing: "0.05em", marginTop: 1 }}>SCORE</span>
    </div>
  );
}

function StarRow({ rating }) {
  return (
    <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={9} fill={i <= Math.round(rating) ? "#f59e0b" : "none"} color={i <= Math.round(rating) ? "#f59e0b" : "rgba(255,255,255,0.2)"} />
      ))}
      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginLeft: 2 }}>{Number(rating).toFixed(1)}</span>
    </div>
  );
}

function ScoreMeter({ score, size = 90 }) {
  const r = size/2-6, circ = 2*Math.PI*r, dash = (score/100)*circ;
  const color = scoreColor(score);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="7"
        strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ*0.25} strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 5px ${color})` }}/>
      <text x={size/2} y={size/2-3} textAnchor="middle" dominantBaseline="middle" fill={color} fontSize="18" fontWeight="800" fontFamily="'Syne',sans-serif">{score}</text>
      <text x={size/2} y={size/2+14} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8">/100</text>
    </svg>
  );
}

function ContractorDetail({ contractor, workers }) {
  const [tab, setTab] = useState("overview");
  const sc = scoreColor(contractor.score);
  const scoreHistory = contractor.score_history ?? [];
  const scoreLabels  = contractor.score_labels  ?? [];
  const districts    = contractor.districts     ?? [];

  const myWorkers = workers.filter(w => w.contractor_id === contractor.id);

  return (
    <tr>
      <td colSpan={9} style={{ padding: 0 }}>
        <div style={{ margin: "0 0 2px", background: "rgba(255,255,255,0.025)", border: `1px solid ${sc}20`, borderTop: `2px solid ${sc}`, borderRadius: "0 0 15px 15px", animation: "expandIn 0.28s ease", overflow: "hidden" }}>
          <style>{`@keyframes expandIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>

          {/* Header row */}
          <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <ScoreMeter score={contractor.score} size={88}/>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 17 }}>{contractor.name}</span>
                {contractor.status === "FLAGGED" && <span style={{ fontSize: 9, background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", padding: "2px 8px", borderRadius: 99, fontWeight: 700 }}>⚠ FLAGGED</span>}
              </div>
              <div style={{ display: "flex", gap: 16, fontSize: 11, color: "rgba(255,255,255,0.4)", flexWrap: "wrap" }}>
                <span><MapPin size={11} style={{ display: "inline" }}/> {contractor.zone} · {districts.length} districts</span>
                <span>👷 {contractor.workers_count} workers · 🚛 {contractor.trucks_count} trucks</span>
                <span>📅 Since {contractor.joined_date}</span>
                {contractor.contract_value && <span style={{ color: "#22c55e" }}>{contractor.contract_value}</span>}
              </div>
            </div>
            {/* Sub-stats */}
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { label: "Completion", val: `${contractor.completion_rate}%`,    color: contractor.completion_rate >= 85 ? "#22c55e" : "#ef4444", icon: Activity },
                { label: "Avg Clear",  val: contractor.avg_clear_time,           color: "#f59e0b",  icon: Clock     },
                { label: "Rating",     val: Number(contractor.citizen_rating).toFixed(1), color: "#f59e0b", icon: Star },
                { label: "Anomalies",  val: contractor.anomalies_count,          color: contractor.anomalies_count === 0 ? "rgba(255,255,255,0.3)" : contractor.anomalies_count <= 3 ? "#f59e0b" : "#ef4444", icon: AlertTriangle },
              ].map(({ label, val, color, icon: Icon }) => (
                <div key={label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "8px 12px", textAlign: "center" }}>
                  <Icon size={12} color={color} style={{ display: "block", margin: "0 auto 3px" }}/>
                  <div style={{ fontSize: 14, fontWeight: 800, fontFamily: "'Syne',sans-serif", color }}>{val}</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <button style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.07)", color: "#f59e0b", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Reassign Zone</button>
              <button style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.07)", color: "#ef4444", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Suspend</button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 2, padding: "7px 24px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            {[
              { id: "overview",  label: "Overview",    Icon: BarChart2     },
              { id: "districts", label: "Districts",   Icon: MapPin        },
              { id: "workers",   label: `Workers (${myWorkers.length})`, Icon: Users },
              { id: "trend",     label: "Score Trend", Icon: TrendingUp    },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: "8px 8px 0 0", border: "none", background: tab === t.id ? "rgba(255,255,255,0.06)" : "transparent", color: tab === t.id ? "#fff" : "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, cursor: "pointer", borderBottom: tab === t.id ? `2px solid ${sc}` : "2px solid transparent" }}>
                <t.Icon size={12}/>{t.label}
              </button>
            ))}
          </div>

          <div style={{ padding: "14px 24px" }}>
            {tab === "overview" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, animation: "expandIn 0.25s ease" }}>
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 16px" }}>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 700, letterSpacing: "0.06em", marginBottom: 11 }}>SCORE BREAKDOWN</p>
                  {[
                    { label: "Completion Rate", val: contractor.completion_rate },
                    { label: "Citizen Rating",  val: Math.round(contractor.citizen_rating * 20) },
                    { label: "No Anomalies",    val: Math.max(0, 100 - contractor.anomalies_count * 8) },
                  ].map(m => (
                    <div key={m.label} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}><span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{m.label}</span><span style={{ fontSize: 11, fontWeight: 600, color: scoreColor(m.val) }}>{m.val}%</span></div>
                      <div style={{ height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 99 }}><div style={{ height: "100%", borderRadius: 99, width: `${m.val}%`, background: scoreColor(m.val) }}/></div>
                    </div>
                  ))}
                </div>
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 16px" }}>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 700, letterSpacing: "0.06em", marginBottom: 11 }}>CONTRACT INFO</p>
                  {[
                    ["Contact",         contractor.contact_email   ?? "—"],
                    ["Contract Value",  contractor.contract_value  ?? "—"],
                    ["Active Contracts",contractor.active_contracts ?? "—"],
                    ["Member Since",    contractor.joined_date      ?? "—"],
                    ["Unresolved",      `${contractor.unresolved_count ?? 0} issues`],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{k}</span>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "districts" && (
              <div style={{ animation: "expandIn 0.25s ease" }}>
                {districts.length === 0 ? <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>No districts assigned.</p> : districts.map((d, i) => (
                  <div key={d} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: ["#ef4444","#f59e0b","#22c55e","#3b82f6"][i % 4] }} />
                      <span style={{ fontSize: 13 }}>{d}</span>
                    </div>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>District {i+1}</span>
                  </div>
                ))}
              </div>
            )}

            {tab === "workers" && (
              <div style={{ animation: "expandIn 0.25s ease" }}>
                {myWorkers.length === 0 ? <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>No workers found for this contractor.</p> : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {myWorkers.map((w, i) => {
                      const sc2 = { "ON_ROUTE":"#22c55e","COMPLETED":"#3b82f6","IDLE":"#6b7280","ABSENT":"#ef4444" }[w.status] ?? "#6b7280";
                      return (
                        <div key={w.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, animation: `expandIn 0.25s ease ${i*35}ms both` }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: scoreColor(w.score), fontFamily: "'Syne',sans-serif", width: 28 }}>{w.score}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{w.name} <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>({w.worker_code})</span></span>
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{w.route}</span>
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{w.completion_rate}%</span>
                          <span style={{ fontSize: 10, color: sc2, fontWeight: 600, padding: "2px 9px", borderRadius: 99, background: `${sc2}14`, border: `1px solid ${sc2}28` }}>{w.status.replace("_"," ")}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {tab === "trend" && scoreHistory.length > 0 && (
              <div style={{ animation: "expandIn 0.25s ease" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  {contractor.trend === "up"
                    ? <><TrendingUp size={15} color="#22c55e"/><span style={{ fontSize: 12, color: "#22c55e", fontWeight: 600 }}>Improving</span></>
                    : <><TrendingDown size={15} color="#ef4444"/><span style={{ fontSize: 12, color: "#ef4444", fontWeight: 600 }}>Declining</span></>}
                </div>
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px" }}>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 72, marginBottom: 5 }}>
                    {scoreHistory.map((v, i) => {
                      const max = Math.max(...scoreHistory), min = Math.min(...scoreHistory) - 5;
                      const pct = ((v - min) / (max - min)) * 100;
                      return (
                        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                          <div style={{ width: "100%", height: `${pct}%`, minHeight: 4, background: i === scoreHistory.length-1 ? sc : `${sc}55`, borderRadius: "3px 3px 0 0" }}/>
                          <span style={{ fontSize: 8, color: "rgba(255,255,255,0.3)" }}>{scoreLabels[i] ?? ""}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    {scoreHistory.map((v, i) => (
                      <span key={i} style={{ fontSize: 10, fontWeight: i === scoreHistory.length-1 ? 700 : 400, color: i === scoreHistory.length-1 ? sc : "rgba(255,255,255,0.3)" }}>{v}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}

export default function ContractorList() {
  const [contractors, setContractors] = useState([]);
  const [workers,     setWorkers]     = useState([]);
  const [search,      setSearch]      = useState("");
  const [filterStatus,setFilterStatus]= useState("ALL");
  const [filterZone,  setFilterZone]  = useState("ALL");
  const [sortBy,      setSortBy]      = useState("score");
  const [expandedId,  setExpandedId]  = useState(null);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([db.contractors.list(), db.workers.list()]).then(([c, w]) => {
      setContractors(c); setWorkers(w); setLoading(false);
    });
  }, []);

  const zones = ["ALL", ...new Set(contractors.map(c => c.zone).filter(Boolean))];

  const filtered = contractors
    .filter(c => {
      const ms  = c.name.toLowerCase().includes(search.toLowerCase()) || (c.id ?? "").toLowerCase().includes(search.toLowerCase());
      const ms2 = filterStatus === "ALL" || c.status === filterStatus;
      const ms3 = filterZone   === "ALL" || c.zone   === filterZone;
      return ms && ms2 && ms3;
    })
    .sort((a, b) => sortBy === "score" ? b.score - a.score : a.name.localeCompare(b.name));

  const stats = [
    { label: "Total",      val: contractors.length,                                      color: "#3b82f6", Icon: Building2    },
    { label: "Active",     val: contractors.filter(c => c.status === "ACTIVE").length,   color: "#22c55e", Icon: CheckCircle  },
    { label: "Flagged",    val: contractors.filter(c => c.status !== "ACTIVE").length,   color: "#ef4444", Icon: AlertTriangle },
    { label: "Avg Score",  val: contractors.length ? Math.round(contractors.reduce((a, c) => a + c.score, 0) / contractors.length) : "—", color: "#f59e0b", Icon: Star },
  ];

  return (
    <>
      <style>{`select option{background:#0d1b2a;color:#fff}@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ padding: "28px 32px", minHeight: "calc(100vh - 60px)" }}>
        <div style={{ marginBottom: 22, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.28)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Building2 size={16} color="#3b82f6"/>
          </div>
          <div>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 21, lineHeight: 1 }}>Contractor Management</h1>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>Click any row to expand details and manage contractor</p>
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
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name…"
              style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, padding: "8px 12px 8px 30px", color: "#fff", fontSize: 12, outline: "none" }}/>
          </div>
          {[
            { val: filterStatus, set: setFilterStatus, opts: [["ALL","All Status"],["ACTIVE","Active"],["REVIEW","Under Review"],["FLAGGED","Flagged"],["SUSPENDED","Suspended"]] },
            { val: filterZone,   set: setFilterZone,   opts: zones.map(z => [z, z === "ALL" ? "All Zones" : z]) },
            { val: sortBy,       set: setSortBy,       opts: [["score","Sort: Score"],["name","Sort: Name"]] },
          ].map(({ val, set, opts }, i) => (
            <select key={i} value={val} onChange={e => set(e.target.value)}
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, padding: "8px 11px", color: "rgba(255,255,255,0.7)", fontSize: 12, outline: "none", cursor: "pointer" }}>
              {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          ))}
          <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9, border: "1px solid rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.07)", color: "#22c55e", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
            <Plus size={12}/> Assign New
          </button>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginLeft: "auto" }}>{filtered.length} of {contractors.length}</span>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Loading contractors…</div>
        ) : (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 15, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.025)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  {["Score","Contractor","Zone","Workers","Trucks","Completion","Anomalies","Status",""].map(h => (
                    <th key={h} style={{ padding: "9px 16px", textAlign: "left", fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => {
                  const st = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.ACTIVE;
                  const isOpen = expandedId === c.id;
                  return (
                    <>
                      <tr key={c.id} onClick={() => setExpandedId(isOpen ? null : c.id)}
                        style={{ cursor: "pointer", background: isOpen ? "rgba(255,255,255,0.04)" : "transparent", borderBottom: isOpen ? "none" : "1px solid rgba(255,255,255,0.05)", animation: `fadeUp 0.35s ease ${i*35}ms both`, transition: "background 0.2s" }}
                        onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                        onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = "transparent"; }}
                      >
                        <td style={{ padding: "13px 16px" }}><ScoreBadge score={c.score}/></td>
                        <td style={{ padding: "13px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14 }}>{c.name}</span>
                            {c.status === "FLAGGED" && <AlertTriangle size={12} color="#ef4444"/>}
                          </div>
                          <StarRow rating={c.citizen_rating}/>
                        </td>
                        <td style={{ padding: "13px 16px" }}>
                          <p style={{ fontSize: 12, fontWeight: 500 }}>{c.zone}</p>
                          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{(c.districts ?? []).length} districts</p>
                        </td>
                        <td style={{ padding: "13px 16px" }}><div style={{ display: "flex", alignItems: "center", gap: 5 }}><Users size={12} color="rgba(255,255,255,0.35)"/><span style={{ fontSize: 13, fontWeight: 600 }}>{c.workers_count}</span></div></td>
                        <td style={{ padding: "13px 16px" }}><div style={{ display: "flex", alignItems: "center", gap: 5 }}><Truck size={12} color="rgba(255,255,255,0.35)"/><span style={{ fontSize: 13, fontWeight: 600 }}>{c.trucks_count}</span></div></td>
                        <td style={{ padding: "13px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: c.completion_rate >= 90 ? "#22c55e" : c.completion_rate >= 70 ? "#f59e0b" : "#ef4444" }}>{c.completion_rate}%</span>
                            {c.trend === "up" ? <TrendingUp size={11} color="#22c55e"/> : <TrendingDown size={11} color="#ef4444"/>}
                          </div>
                          <div style={{ height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 99, width: 65 }}>
                            <div style={{ height: "100%", borderRadius: 99, width: `${c.completion_rate}%`, background: c.completion_rate >= 90 ? "#22c55e" : c.completion_rate >= 70 ? "#f59e0b" : "#ef4444" }}/>
                          </div>
                        </td>
                        <td style={{ padding: "13px 16px" }}><span style={{ fontSize: 13, fontWeight: 600, color: c.anomalies_count <= 2 ? "rgba(255,255,255,0.5)" : c.anomalies_count <= 5 ? "#f59e0b" : "#ef4444" }}>{c.anomalies_count > 0 ? `⚠ ${c.anomalies_count}` : "—"}</span></td>
                        <td style={{ padding: "13px 16px" }}><div style={{ display: "inline-flex", padding: "4px 10px", borderRadius: 99, background: st.bg, border: `1px solid ${st.border}` }}><span style={{ fontSize: 10, color: st.color, fontWeight: 600 }}>{st.label}</span></div></td>
                        <td style={{ padding: "13px 16px" }}><div style={{ display: "flex", alignItems: "center", gap: 5 }}>{isOpen ? <ChevronUp size={14} color={scoreColor(c.score)}/> : <><span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Details</span><ChevronRight size={13} color="rgba(255,255,255,0.3)"/></>}</div></td>
                      </tr>
                      {isOpen && <ContractorDetail key={`det-${c.id}`} contractor={c} workers={workers}/>}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 10 }}>Showing {filtered.length} of {contractors.length} contractors</p>
      </div>
    </>
  );
}