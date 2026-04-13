// ComplaintQueue.jsx
import { useState, useEffect } from "react";
import {
  Bell, Search, Filter, ChevronDown, MapPin, Clock, User,
  AlertTriangle, CheckCircle, XCircle, Eye, Building2,
  ArrowRight, RefreshCw, Zap, Circle
} from "lucide-react";

const MOCK_COMPLAINTS = [
  { id: "CMP-4821", zone: "Andheri West, Mumbai", type: "Overflowing Bin", severity: "high", status: "pending", citizen: "Rahul M.", time: "2h ago", desc: "Large pile of mixed waste near gate no 3, has been there since yesterday.", contractor: null, worker: null },
  { id: "CMP-4820", zone: "Bandra East, Mumbai", type: "Illegal Dumping", severity: "high", status: "assigned", citizen: "Priya S.", time: "3h ago", desc: "Construction debris dumped on footpath overnight.", contractor: "CleanCity Corp", worker: "Ramesh K." },
  { id: "CMP-4819", zone: "Kurla, Mumbai", type: "Missed Pickup", severity: "medium", status: "in_progress", citizen: "Amit D.", time: "5h ago", desc: "Scheduled morning pickup at 7am did not happen.", contractor: "GreenWave Pvt", worker: "Suresh P." },
  { id: "CMP-4818", zone: "Dadar, Mumbai", type: "Segregation Issue", severity: "low", status: "resolved", citizen: "Meena R.", time: "8h ago", desc: "Worker mixing dry and wet waste in one bin during collection.", contractor: "EcoFirst Ltd", worker: "Vijay T." },
  { id: "CMP-4817", zone: "Borivali North, Mumbai", type: "Overflowing Bin", severity: "medium", status: "citizen_review", citizen: "Kiran P.", time: "12h ago", desc: "Community bin at park entrance overflowing since 2 days.", contractor: "CleanCity Corp", worker: "Arjun L." },
  { id: "CMP-4816", zone: "Malad West, Mumbai", type: "Road Littering", severity: "low", status: "resolved", citizen: "Sunita B.", time: "1d ago", desc: "Garbage scattered after truck passed through.", contractor: "GreenWave Pvt", worker: "Deepak S." },
  { id: "CMP-4815", zone: "Goregaon, Mumbai", type: "Illegal Dumping", severity: "high", status: "pending", citizen: "Rohan V.", time: "1d ago", desc: "Hazardous waste (chemicals) found dumped near school.", contractor: null, worker: null },
];

const CONTRACTORS = ["CleanCity Corp", "GreenWave Pvt", "EcoFirst Ltd", "WasteKare Inc"];
const WORKERS = { "CleanCity Corp": ["Ramesh K.", "Arjun L.", "Mohan D."], "GreenWave Pvt": ["Suresh P.", "Deepak S.", "Ravi M."], "EcoFirst Ltd": ["Vijay T.", "Anand K."], "WasteKare Inc": ["Pradeep R.", "Sanjay V."] };

const SEV_COLOR = { high: "#ef4444", medium: "#f59e0b", low: "#22c55e" };
const STATUS_CONFIG = {
  pending:        { label: "Pending",         color: "#ef4444", bg: "rgba(239,68,68,0.1)"   },
  assigned:       { label: "Assigned",        color: "#3b82f6", bg: "rgba(59,130,246,0.1)"  },
  in_progress:    { label: "In Progress",     color: "#f59e0b", bg: "rgba(245,158,11,0.1)"  },
  citizen_review: { label: "Citizen Review",  color: "#8b5cf6", bg: "rgba(139,92,246,0.1)"  },
  resolved:       { label: "Resolved",        color: "#22c55e", bg: "rgba(34,197,94,0.1)"   },
};

function AssignModal({ complaint, onClose, onAssign }) {
  const [contractor, setContractor] = useState(complaint.contractor || "");
  const [worker, setWorker]         = useState(complaint.worker     || "");

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "linear-gradient(145deg,#0d1f14,#0d1a2b)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 28, width: 460, animation: "slideUp 0.25s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18 }}>Assign Complaint</h3>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 3 }}>{complaint.id} · {complaint.zone}</p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 10px", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 14, marginBottom: 18 }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 5 }}>Complaint</p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>{complaint.desc}</p>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", display: "block", marginBottom: 6, letterSpacing: "0.06em", textTransform: "uppercase" }}>Assign Contractor</label>
          <select value={contractor} onChange={e => { setContractor(e.target.value); setWorker(""); }}
            style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 13, outline: "none" }}>
            <option value="">Select contractor…</option>
            {CONTRACTORS.map(c => <option key={c} value={c} style={{ background: "#0d1b2a" }}>{c}</option>)}
          </select>
        </div>

        {contractor && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", display: "block", marginBottom: 6, letterSpacing: "0.06em", textTransform: "uppercase" }}>Assign Worker</label>
            <select value={worker} onChange={e => setWorker(e.target.value)}
              style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 13, outline: "none" }}>
              <option value="">Select worker…</option>
              {(WORKERS[contractor] || []).map(w => <option key={w} value={w} style={{ background: "#0d1b2a" }}>{w}</option>)}
            </select>
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "11px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Cancel</button>
          <button onClick={() => onAssign(complaint.id, contractor, worker)} disabled={!contractor || !worker}
            style={{ flex: 2, padding: "11px", borderRadius: 10, background: contractor && worker ? "linear-gradient(90deg,#22c55e,#16a34a)" : "rgba(255,255,255,0.05)", border: "none", color: contractor && worker ? "#fff" : "rgba(255,255,255,0.3)", cursor: contractor && worker ? "pointer" : "default", fontSize: 13, fontWeight: 700, transition: "all 0.2s" }}>
            Assign & Notify →
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ComplaintQueue() {
  const [complaints, setComplaints] = useState(MOCK_COMPLAINTS);
  const [search, setSearch]         = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSev, setFilterSev]   = useState("all");
  const [assigning, setAssigning]   = useState(null);
  const [selected, setSelected]     = useState(null);
  const [vis, setVis]               = useState(false);
  useEffect(() => { setTimeout(() => setVis(true), 50); }, []);

  const filtered = complaints.filter(c => {
    const matchSearch = c.id.includes(search.toUpperCase()) || c.zone.toLowerCase().includes(search.toLowerCase()) || c.type.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    const matchSev    = filterSev    === "all" || c.severity === filterSev;
    return matchSearch && matchStatus && matchSev;
  });

  const counts = { all: complaints.length, pending: 0, assigned: 0, in_progress: 0, citizen_review: 0, resolved: 0 };
  complaints.forEach(c => counts[c.status] = (counts[c.status] || 0) + 1);

  const handleAssign = (id, contractor, worker) => {
    setComplaints(cs => cs.map(c => c.id === id ? { ...c, contractor, worker, status: "assigned" } : c));
    setAssigning(null);
  };

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1400, margin: "0 auto", opacity: vis ? 1 : 0, transition: "opacity 0.4s ease" }}>
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 26, letterSpacing: "-0.03em" }}>
            Complaint <span style={{ background: "linear-gradient(90deg,#f59e0b,#ef4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Queue</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginTop: 4 }}>Manage and assign citizen-reported issues</p>
        </div>
        <button style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 10, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Status tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {Object.entries({ all: "All", pending: "Pending", assigned: "Assigned", in_progress: "In Progress", citizen_review: "Citizen Review", resolved: "Resolved" }).map(([key, label]) => (
          <button key={key} onClick={() => setFilterStatus(key)}
            style={{ padding: "6px 14px", borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
              background: filterStatus === key ? (STATUS_CONFIG[key]?.bg || "rgba(255,255,255,0.08)") : "rgba(255,255,255,0.03)",
              border: `1px solid ${filterStatus === key ? (STATUS_CONFIG[key]?.color || "rgba(255,255,255,0.2)") + "50" : "rgba(255,255,255,0.07)"}`,
              color: filterStatus === key ? (STATUS_CONFIG[key]?.color || "#fff") : "rgba(255,255,255,0.45)" }}>
            {label} <span style={{ opacity: 0.6, marginLeft: 4 }}>{counts[key] || 0}</span>
          </button>
        ))}
      </div>

      {/* Search + filter row */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={14} color="rgba(255,255,255,0.3)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by ID, zone, or type…"
            style={{ width: "100%", paddingLeft: 36, padding: "10px 14px 10px 36px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", fontSize: 13, outline: "none" }} />
        </div>
        {["high","medium","low"].map(s => (
          <button key={s} onClick={() => setFilterSev(filterSev === s ? "all" : s)}
            style={{ padding: "9px 16px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
              background: filterSev === s ? `${SEV_COLOR[s]}18` : "rgba(255,255,255,0.03)",
              border: `1px solid ${filterSev === s ? SEV_COLOR[s] + "40" : "rgba(255,255,255,0.07)"}`,
              color: filterSev === s ? SEV_COLOR[s] : "rgba(255,255,255,0.4)" }}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Complaints list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((c, i) => {
          const sc = STATUS_CONFIG[c.status];
          return (
            <div key={c.id} style={{ background: "rgba(255,255,255,0.025)", border: `1px solid rgba(255,255,255,${selected === c.id ? "0.12" : "0.06"})`, borderRadius: 14, overflow: "hidden", transition: "all 0.2s", animation: `slideUp 0.3s ease ${i * 40}ms both` }}>
              <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}
                onClick={() => setSelected(selected === c.id ? null : c.id)}>
                {/* Severity bar */}
                <div style={{ width: 3, height: 40, borderRadius: 99, background: SEV_COLOR[c.severity], flexShrink: 0 }} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, color: "#fff" }}>{c.id}</span>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: sc.bg, color: sc.color, fontWeight: 600 }}>{sc.label}</span>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: `${SEV_COLOR[c.severity]}12`, color: SEV_COLOR[c.severity], fontWeight: 600 }}>{c.severity}</span>
                  </div>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>{c.type}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 3 }}>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", display: "flex", alignItems: "center", gap: 4 }}><MapPin size={10} />{c.zone}</span>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", display: "flex", alignItems: "center", gap: 4 }}><Clock size={10} />{c.time}</span>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", display: "flex", alignItems: "center", gap: 4 }}><User size={10} />{c.citizen}</span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {c.contractor ? (
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{c.contractor}</p>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{c.worker}</p>
                    </div>
                  ) : (
                    c.status === "pending" && (
                      <button onClick={e => { e.stopPropagation(); setAssigning(c); }}
                        style={{ padding: "7px 14px", borderRadius: 8, background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b", cursor: "pointer", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
                        <Zap size={11} /> Assign
                      </button>
                    )
                  )}
                  <ChevronDown size={14} color="rgba(255,255,255,0.2)" style={{ transform: selected === c.id ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                </div>
              </div>

              {/* Expanded detail */}
              {selected === c.id && (
                <div style={{ padding: "0 18px 16px 35px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 14 }}>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", marginBottom: 12 }}>{c.desc}</p>
                  <div style={{ display: "flex", gap: 8 }}>
                    {c.status === "pending" && (
                      <button onClick={() => setAssigning(c)} style={{ padding: "8px 18px", borderRadius: 9, background: "linear-gradient(90deg,#f59e0b,#d97706)", border: "none", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                        Assign Now →
                      </button>
                    )}
                    {c.status === "resolved" && (
                      <span style={{ fontSize: 12, color: "#22c55e", display: "flex", alignItems: "center", gap: 5 }}><CheckCircle size={13} /> Closed — citizen approved</span>
                    )}
                    {c.status === "citizen_review" && (
                      <span style={{ fontSize: 12, color: "#8b5cf6", display: "flex", alignItems: "center", gap: 5 }}><Eye size={13} /> Awaiting citizen approval</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {assigning && <AssignModal complaint={assigning} onClose={() => setAssigning(null)} onAssign={handleAssign} />}
    </div>
  );
}