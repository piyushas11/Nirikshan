// BatchMonitor.jsx
import { useState, useEffect } from "react";
import { Package, Search, Clock, MapPin, Truck, AlertTriangle, CheckCircle, RefreshCw, ChevronDown, Circle, Zap } from "lucide-react";

const STATUS_FLOW = ["Collected", "In Transit", "At Facility", "Processing", "Completed"];

const MOCK_BATCHES = [
  { id: "BCH-8821", zone: "Andheri West", contractor: "CleanCity Corp", worker: "Ramesh K.", type: "Mixed Waste", weight: "142 kg", collected: "06:32 AM", lastUpdate: "8 mins ago", status: "In Transit", staleness: 0, disposal: null },
  { id: "BCH-8820", zone: "Bandra East", contractor: "GreenWave Pvt", worker: "Suresh P.", type: "Dry Waste", weight: "87 kg", collected: "07:10 AM", lastUpdate: "22 mins ago", status: "At Facility", staleness: 0, disposal: null },
  { id: "BCH-8819", zone: "Kurla", contractor: "EcoFirst Ltd", worker: "Vijay T.", type: "Wet Waste", weight: "203 kg", collected: "05:55 AM", lastUpdate: "6h 14m ago", status: "In Transit", staleness: 6, disposal: null },
  { id: "BCH-8818", zone: "Dadar", contractor: "CleanCity Corp", worker: "Arjun L.", type: "Recyclable", weight: "56 kg", collected: "06:45 AM", lastUpdate: "13h 2m ago", status: "In Transit", staleness: 13, disposal: null },
  { id: "BCH-8817", zone: "Borivali North", contractor: "WasteKare Inc", worker: "Pradeep R.", type: "Mixed Waste", weight: "178 kg", collected: "07:30 AM", lastUpdate: "2 mins ago", status: "Processing", staleness: 0, disposal: "Composting" },
  { id: "BCH-8816", zone: "Malad West", contractor: "GreenWave Pvt", worker: "Deepak S.", type: "Recyclable", weight: "91 kg", collected: "06:15 AM", lastUpdate: "1h 30m ago", status: "Completed", staleness: 0, disposal: "Recycled" },
  { id: "BCH-8815", zone: "Goregaon", contractor: "EcoFirst Ltd", worker: "Anand K.", type: "Dry Waste", weight: "64 kg", collected: "07:50 AM", lastUpdate: "4 mins ago", status: "Collected", staleness: 0, disposal: null },
  { id: "BCH-8814", zone: "Santacruz", contractor: "CleanCity Corp", worker: "Mohan D.", type: "Wet Waste", weight: "119 kg", collected: "05:20 AM", lastUpdate: "14h 55m ago", status: "In Transit", staleness: 14, disposal: null },
];

const TYPE_COLOR = { "Mixed Waste": "#8b5cf6", "Dry Waste": "#3b82f6", "Wet Waste": "#22c55e", "Recyclable": "#f59e0b" };

function stalenessConfig(h) {
  if (h === 0) return { color: "#22c55e", label: "Live",    alert: null };
  if (h < 6)   return { color: "#22c55e", label: `${h}h`,  alert: null };
  if (h < 12)  return { color: "#f59e0b", label: `${h}h`,  alert: "yellow" };
  return               { color: "#ef4444", label: `${h}h`,  alert: "red" };
}

function StatusBar({ current }) {
  const idx = STATUS_FLOW.indexOf(current);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginTop: 10 }}>
      {STATUS_FLOW.map((s, i) => {
        const done   = i < idx;
        const active = i === idx;
        const color  = done || active ? "#22c55e" : "rgba(255,255,255,0.12)";
        return (
          <div key={s} style={{ display: "flex", alignItems: "center", flex: i < STATUS_FLOW.length - 1 ? 1 : 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: active ? 12 : 9, height: active ? 12 : 9, borderRadius: "50%", background: color, border: active ? "2px solid rgba(34,197,94,0.4)" : "none", boxShadow: active ? "0 0 8px rgba(34,197,94,0.5)" : "none", transition: "all 0.3s" }} />
              <span style={{ fontSize: 9, color: active ? "#22c55e" : done ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)", whiteSpace: "nowrap", fontWeight: active ? 700 : 400 }}>{s}</span>
            </div>
            {i < STATUS_FLOW.length - 1 && (
              <div style={{ flex: 1, height: 1.5, background: done ? "#22c55e" : "rgba(255,255,255,0.08)", margin: "0 6px", marginBottom: 14, transition: "background 0.3s" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function BatchMonitor() {
  const [batches, setBatches]     = useState(MOCK_BATCHES);
  const [search, setSearch]       = useState("");
  const [filterAlert, setFilterAlert] = useState("all");
  const [expanded, setExpanded]   = useState(null);
  const [vis, setVis]             = useState(false);
  const [tick, setTick]           = useState(0);
  useEffect(() => { setTimeout(() => setVis(true), 50); }, []);
  useEffect(() => { const iv = setInterval(() => setTick(t => t + 1), 5000); return () => clearInterval(iv); }, []);

  const alerts = { red: batches.filter(b => b.staleness >= 12).length, yellow: batches.filter(b => b.staleness >= 6 && b.staleness < 12).length };

  const filtered = batches.filter(b => {
    const matchSearch = b.id.includes(search.toUpperCase()) || b.zone.toLowerCase().includes(search.toLowerCase()) || b.contractor.toLowerCase().includes(search.toLowerCase());
    if (filterAlert === "red")    return matchSearch && b.staleness >= 12;
    if (filterAlert === "yellow") return matchSearch && b.staleness >= 6 && b.staleness < 12;
    if (filterAlert === "live")   return matchSearch && b.staleness < 6;
    return matchSearch;
  });

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1400, margin: "0 auto", opacity: vis ? 1 : 0, transition: "opacity 0.4s ease" }}>
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}} @keyframes slideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 26, letterSpacing: "-0.03em" }}>
            Batch <span style={{ background: "linear-gradient(90deg,#8b5cf6,#3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Monitor</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginTop: 4 }}>Real-time batch tracking across all zones</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 99, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#ef4444", animation: "blink 1s infinite" }} />
            <span style={{ fontSize: 12, color: "#ef4444", fontWeight: 700 }}>{alerts.red} Critical</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 99, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)" }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#f59e0b", animation: "blink 1.5s infinite" }} />
            <span style={{ fontSize: 12, color: "#f59e0b", fontWeight: 700 }}>{alerts.yellow} Warning</span>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
        {[
          { label: "Total Batches",  value: batches.length,                                     color: "#3b82f6", sub: "Today" },
          { label: "In Transit",     value: batches.filter(b => b.status==="In Transit").length, color: "#8b5cf6", sub: "Moving now" },
          { label: "Completed",      value: batches.filter(b => b.status==="Completed").length,  color: "#22c55e", sub: "Processed" },
          { label: "Stale Batches",  value: alerts.red + alerts.yellow,                          color: "#ef4444", sub: "Need attention" },
        ].map((s, i) => (
          <div key={s.label} style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${s.color}20`, borderRadius: 14, padding: "16px 18px", animation: `slideUp 0.35s ease ${i*60}ms both`, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${s.color},transparent)` }} />
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>{s.label}</p>
            <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 28, color: "#fff" }}>{s.value}</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 3 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={14} color="rgba(255,255,255,0.3)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search batch ID, zone, contractor…"
            style={{ width: "100%", paddingLeft: 36, padding: "10px 14px 10px 36px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", fontSize: 13, outline: "none" }} />
        </div>
        {[["all","All Batches","rgba(255,255,255,0.4)"],["red","🔴 Critical","#ef4444"],["yellow","🟡 Warning","#f59e0b"],["live","🟢 Live","#22c55e"]].map(([k,l,c]) => (
          <button key={k} onClick={() => setFilterAlert(k)}
            style={{ padding: "9px 16px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", background: filterAlert===k ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)", border: `1px solid ${filterAlert===k ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.07)"}`, color: filterAlert===k ? "#fff" : "rgba(255,255,255,0.4)" }}>
            {l}
          </button>
        ))}
      </div>

      {/* Batch list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((b, i) => {
          const sc = stalenessConfig(b.staleness);
          const isExp = expanded === b.id;
          return (
            <div key={b.id} style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${sc.alert === "red" ? "rgba(239,68,68,0.25)" : sc.alert === "yellow" ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.06)"}`, borderRadius: 14, overflow: "hidden", animation: `slideUp 0.3s ease ${i*40}ms both`, transition: "border-color 0.2s" }}>
              <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }} onClick={() => setExpanded(isExp ? null : b.id)}>
                {/* Type dot */}
                <div style={{ width: 38, height: 38, borderRadius: 10, background: `${TYPE_COLOR[b.type]}15`, border: `1px solid ${TYPE_COLOR[b.type]}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Package size={16} color={TYPE_COLOR[b.type]} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13 }}>{b.id}</span>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: `${TYPE_COLOR[b.type]}15`, color: TYPE_COLOR[b.type], fontWeight: 600 }}>{b.type}</span>
                    {sc.alert && (
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: `${sc.color}15`, color: sc.color, fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}>
                        <AlertTriangle size={9} /> {sc.label} stale
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 14 }}>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: 4 }}><MapPin size={10} />{b.zone}</span>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: 4 }}><Truck size={10} />{b.contractor}</span>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{b.weight}</span>
                  </div>
                </div>

                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: sc.color }}>{b.status}</p>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>Updated {b.lastUpdate}</p>
                </div>
                <ChevronDown size={14} color="rgba(255,255,255,0.2)" style={{ transform: isExp ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }} />
              </div>

              {isExp && (
                <div style={{ padding: "0 18px 18px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <StatusBar current={b.status} />
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 14 }}>
                    {[
                      { l: "Worker",       v: b.worker },
                      { l: "Collected At", v: b.collected },
                      { l: "Disposal",     v: b.disposal || "Pending" },
                    ].map(({ l, v }) => (
                      <div key={l} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 14px" }}>
                        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>{l}</p>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{v}</p>
                      </div>
                    ))}
                  </div>
                  {sc.alert === "red" && (
                    <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", gap: 8 }}>
                      <AlertTriangle size={14} color="#ef4444" />
                      <p style={{ fontSize: 12, color: "#ef4444", fontWeight: 600 }}>Critical: No update for {b.staleness}h — admin notification sent to {b.contractor}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}