// ZoneManager.jsx
import { useState, useEffect } from "react";
import { MapPin, Building2, Users, Package, AlertTriangle, Plus, Edit2, ChevronRight, TrendingUp, TrendingDown, Search, CheckCircle, Shield } from "lucide-react";

const MOCK_ZONES = [
  { id: "ZN-01", name: "Andheri West",   district: "Mumbai",  state: "Maharashtra", contractor: "CleanCity Corp",  workers: 8,  routes: 5,  batches: 42, complaints: 3,  performance: 87, status: "active"   },
  { id: "ZN-02", name: "Bandra East",    district: "Mumbai",  state: "Maharashtra", contractor: "GreenWave Pvt",   workers: 6,  routes: 4,  batches: 31, complaints: 1,  performance: 94, status: "active"   },
  { id: "ZN-03", name: "Kurla",          district: "Mumbai",  state: "Maharashtra", contractor: "EcoFirst Ltd",    workers: 10, routes: 7,  batches: 58, complaints: 9,  performance: 61, status: "flagged"  },
  { id: "ZN-04", name: "Dadar",          district: "Mumbai",  state: "Maharashtra", contractor: "CleanCity Corp",  workers: 7,  routes: 5,  batches: 44, complaints: 2,  performance: 91, status: "active"   },
  { id: "ZN-05", name: "Borivali North", district: "Mumbai",  state: "Maharashtra", contractor: "WasteKare Inc",   workers: 5,  routes: 3,  batches: 27, complaints: 7,  performance: 53, status: "flagged"  },
  { id: "ZN-06", name: "Malad West",     district: "Mumbai",  state: "Maharashtra", contractor: "GreenWave Pvt",   workers: 9,  routes: 6,  batches: 50, complaints: 0,  performance: 98, status: "active"   },
  { id: "ZN-07", name: "Goregaon",       district: "Mumbai",  state: "Maharashtra", contractor: null,              workers: 0,  routes: 0,  batches: 0,  complaints: 5,  performance: 0,  status: "unassigned"},
  { id: "ZN-08", name: "Santacruz",      district: "Mumbai",  state: "Maharashtra", contractor: "EcoFirst Ltd",    workers: 4,  routes: 3,  batches: 22, complaints: 4,  performance: 72, status: "active"   },
];

const CONTRACTORS = ["CleanCity Corp", "GreenWave Pvt", "EcoFirst Ltd", "WasteKare Inc"];

const PERF_COLOR = p => p >= 85 ? "#22c55e" : p >= 60 ? "#f59e0b" : "#ef4444";
const STATUS_CONFIG = {
  active:     { color: "#22c55e", bg: "rgba(34,197,94,0.1)",   label: "Active"      },
  flagged:    { color: "#ef4444", bg: "rgba(239,68,68,0.1)",   label: "Flagged"     },
  unassigned: { color: "#6b7280", bg: "rgba(107,114,128,0.1)", label: "Unassigned"  },
};

function AssignModal({ zone, onClose, onAssign }) {
  const [contractor, setContractor] = useState(zone.contractor || "");
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "linear-gradient(145deg,#0d1f14,#0d1a2b)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 28, width: 440, animation: "slideUp 0.25s ease" }}>
        <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, marginBottom: 6 }}>
          {zone.contractor ? "Reassign Zone" : "Assign Contractor"}
        </h3>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginBottom: 20 }}>{zone.name} · {zone.district}</p>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Select Contractor</label>
          <select value={contractor} onChange={e => setContractor(e.target.value)}
            style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 13, outline: "none" }}>
            <option value="">Select…</option>
            {CONTRACTORS.map(c => <option key={c} value={c} style={{ background: "#0d1b2a" }}>{c}</option>)}
          </select>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 11, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Cancel</button>
          <button onClick={() => onAssign(zone.id, contractor)} disabled={!contractor}
            style={{ flex: 2, padding: 11, borderRadius: 10, background: contractor ? "linear-gradient(90deg,#3b82f6,#1d4ed8)" : "rgba(255,255,255,0.05)", border: "none", color: contractor ? "#fff" : "rgba(255,255,255,0.3)", cursor: contractor ? "pointer" : "default", fontSize: 13, fontWeight: 700 }}>
            Confirm Assignment →
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ZoneManager() {
  const [zones, setZones]     = useState(MOCK_ZONES);
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("all");
  const [assigning, setAssigning] = useState(null);
  const [vis, setVis]         = useState(false);
  useEffect(() => { setTimeout(() => setVis(true), 50); }, []);

  const filtered = zones.filter(z => {
    const matchSearch = z.name.toLowerCase().includes(search.toLowerCase()) || (z.contractor || "").toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || z.status === filter;
    return matchSearch && matchFilter;
  });

  const handleAssign = (zoneId, contractor) => {
    setZones(zs => zs.map(z => z.id === zoneId ? { ...z, contractor, status: "active" } : z));
    setAssigning(null);
  };

  const summary = {
    total:      zones.length,
    active:     zones.filter(z => z.status === "active").length,
    flagged:    zones.filter(z => z.status === "flagged").length,
    unassigned: zones.filter(z => z.status === "unassigned").length,
  };

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1400, margin: "0 auto", opacity: vis ? 1 : 0, transition: "opacity 0.4s ease" }}>
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 26, letterSpacing: "-0.03em" }}>
            Zone <span style={{ background: "linear-gradient(90deg,#3b82f6,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Manager</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginTop: 4 }}>Assign contractors to zones and monitor performance</p>
        </div>
        <button style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 10, background: "linear-gradient(90deg,#3b82f6,#1d4ed8)", border: "none", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
          <Plus size={13} /> Add Zone
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
        {[
          { l: "Total Zones",  v: summary.total,      c: "#3b82f6" },
          { l: "Active",       v: summary.active,     c: "#22c55e" },
          { l: "Flagged",      v: summary.flagged,    c: "#ef4444" },
          { l: "Unassigned",   v: summary.unassigned, c: "#6b7280" },
        ].map((s, i) => (
          <div key={s.l} style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${s.c}20`, borderRadius: 14, padding: "16px 18px", animation: `slideUp 0.35s ease ${i*60}ms both`, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${s.c},transparent)` }} />
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{s.l}</p>
            <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 28, color: "#fff" }}>{s.v}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={14} color="rgba(255,255,255,0.3)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search zone or contractor…"
            style={{ width: "100%", paddingLeft: 36, padding: "10px 14px 10px 36px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", fontSize: 13, outline: "none" }} />
        </div>
        {[["all","All"],["active","Active"],["flagged","Flagged"],["unassigned","Unassigned"]].map(([k,l]) => (
          <button key={k} onClick={() => setFilter(k)}
            style={{ padding: "9px 16px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
              background: filter===k ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${filter===k ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.07)"}`,
              color: filter===k ? "#3b82f6" : "rgba(255,255,255,0.4)" }}>
            {l}
          </button>
        ))}
      </div>

      {/* Zone cards grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
        {filtered.map((z, i) => {
          const sc = STATUS_CONFIG[z.status];
          const pc = PERF_COLOR(z.performance);
          return (
            <div key={z.id} style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${z.status === "flagged" ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.07)"}`, borderRadius: 16, padding: 20, animation: `slideUp 0.35s ease ${i*50}ms both`, transition: "border-color 0.2s" }}>
              {/* Zone header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15 }}>{z.name}</h3>
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: sc.bg, color: sc.color, fontWeight: 700 }}>{sc.label}</span>
                  </div>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{z.id} · {z.district}, {z.state}</p>
                </div>
                {/* Performance ring */}
                {z.performance > 0 && (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ width: 42, height: 42, borderRadius: "50%", background: `conic-gradient(${pc} ${z.performance * 3.6}deg, rgba(255,255,255,0.06) 0deg)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#0d1b2a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 9, fontWeight: 800, color: pc }}>{z.performance}</span>
                      </div>
                    </div>
                    <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 3 }}>Score</p>
                  </div>
                )}
              </div>

              {/* Contractor */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, padding: "10px 12px", borderRadius: 10, background: z.contractor ? "rgba(255,255,255,0.03)" : "rgba(107,114,128,0.08)", border: `1px solid ${z.contractor ? "rgba(255,255,255,0.07)" : "rgba(107,114,128,0.2)"}` }}>
                <Building2 size={14} color={z.contractor ? "#3b82f6" : "#6b7280"} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: z.contractor ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.3)" }}>
                    {z.contractor || "No contractor assigned"}
                  </p>
                </div>
                <button onClick={() => setAssigning(z)}
                  style={{ padding: "4px 10px", borderRadius: 7, background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)", color: "#3b82f6", cursor: "pointer", fontSize: 10, fontWeight: 700 }}>
                  {z.contractor ? "Reassign" : "Assign"}
                </button>
              </div>

              {/* Stats row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
                {[
                  { l: "Workers",    v: z.workers,    icon: Users,         c: "#22c55e" },
                  { l: "Routes",     v: z.routes,     icon: MapPin,        c: "#3b82f6" },
                  { l: "Batches",    v: z.batches,    icon: Package,       c: "#8b5cf6" },
                  { l: "Complaints", v: z.complaints, icon: AlertTriangle, c: z.complaints > 5 ? "#ef4444" : "#f59e0b" },
                ].map(({ l, v, icon: Icon, c }) => (
                  <div key={l} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                    <Icon size={11} color={c} style={{ margin: "0 auto 4px" }} />
                    <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, color: "#fff" }}>{v}</p>
                    <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{l}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {assigning && <AssignModal zone={assigning} onClose={() => setAssigning(null)} onAssign={handleAssign} />}
    </div>
  );
}