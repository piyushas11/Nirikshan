import { useState, useEffect } from "react";
import { Filter, CheckCircle } from "lucide-react";
import Badge from "../../components/ui/Badge";

const now = Date.now();
const MOCK_BATCHES = [
  { id: "BT-001", zone: "Zone A", collected_type: "recyclable", disposal_method: "recycling", status: "Processed", last_updated: new Date(now - 2 * 3600000), collected_at: new Date(now - 10 * 3600000), in_transit_at: new Date(now - 8 * 3600000), processed_at: new Date(now - 2 * 3600000), delay_hours: 1.2 },
  { id: "BT-002", zone: "Zone B", collected_type: "organic", disposal_method: "composting", status: "In Transit", last_updated: new Date(now - 8 * 3600000), collected_at: new Date(now - 12 * 3600000), in_transit_at: new Date(now - 8 * 3600000), delay_hours: 4.1 },
  { id: "BT-003", zone: "Zone A", collected_type: "recyclable", disposal_method: "landfill", status: "At Facility", last_updated: new Date(now - 3 * 3600000), collected_at: new Date(now - 7 * 3600000), in_transit_at: new Date(now - 5 * 3600000), delay_hours: 2.8 },
  { id: "BT-004", zone: "Zone C", collected_type: "mixed", disposal_method: "landfill", status: "Collected", last_updated: new Date(now - 14 * 3600000), collected_at: new Date(now - 14 * 3600000), in_transit_at: null, delay_hours: 14 },
  { id: "BT-005", zone: "Zone D", collected_type: "hazardous", disposal_method: "special", status: "Processed", last_updated: new Date(now - 1 * 3600000), collected_at: null, in_transit_at: null, processed_at: new Date(now - 1 * 3600000), delay_hours: 0.5 },
  { id: "BT-006", zone: "Zone B", collected_type: "organic", disposal_method: "composting", status: "In Transit", last_updated: new Date(now - 9 * 3600000), collected_at: new Date(now - 9 * 3600000), in_transit_at: null, delay_hours: 9 },
  { id: "BT-007", zone: "Zone C", collected_type: "mixed", disposal_method: "landfill", status: "Collected", last_updated: new Date(now - 0.5 * 3600000), collected_at: new Date(now - 4 * 3600000), in_transit_at: null, delay_hours: 0.5 },
  { id: "BT-008", zone: "Zone A", collected_type: "recyclable", disposal_method: "recycling", status: "At Facility", last_updated: new Date(now - 4 * 3600000), collected_at: new Date(now - 6 * 3600000), in_transit_at: new Date(now - 5 * 3600000), delay_hours: 2.1 },
];

function batchAnomalyCheck(batch) {
  const flags = [];
  const hours = (Date.now() - new Date(batch.last_updated)) / 3600000;
  if (hours > 12 && batch.status !== "Processed") flags.push({ level: "CRITICAL", msg: `Stuck ${hours.toFixed(0)}hrs — admin notified` });
  else if (hours > 6 && batch.status !== "Processed") flags.push({ level: "HIGH", msg: `Stagnant ${hours.toFixed(0)}hrs — follow up` });
  if (batch.status === "Processed" && !batch.in_transit_at) flags.push({ level: "CRITICAL", msg: "In Transit stage was skipped" });
  if (batch.status === "In Transit" && !batch.collected_at) flags.push({ level: "CRITICAL", msg: "Collected stage was skipped" });
  if (batch.collected_type === "recyclable" && batch.disposal_method === "landfill") flags.push({ level: "CRITICAL", msg: "Recyclable waste sent to landfill" });
  if (batch.collected_at) {
    const collectedHour = new Date(batch.collected_at).getHours();
    if (collectedHour < 6 || collectedHour > 10) flags.push({ level: "MEDIUM", msg: `Collected at ${collectedHour}:00 — outside 6am-10am window` });
  }
  return flags;
}

const FLAG_STYLE = {
  CRITICAL: { border: "1px solid #ff4444", shadow: "0 0 0 1px #ff444433", row: "#ff44440a" },
  HIGH: { border: "1px solid #ffaa00", shadow: "none", row: "#ffaa000a" },
  MEDIUM: { border: "none", borderLeft: "3px solid #ff8800", row: "#ff88000a" },
};

function FlagBadge({ level }) {
  const c = { CRITICAL: "#ff4444", HIGH: "#ffaa00", MEDIUM: "#ff8800" }[level];
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded"
      style={{ color: c, background: `${c}18`, border: `1px solid ${c}44` }}>
      {level === "CRITICAL" && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: c }} />}
      {level}
    </span>
  );
}

export default function BatchOverview() {
  const [batches, setBatches] = useState(MOCK_BATCHES.map(b => ({ ...b, acknowledged: false })));
  const [statusFilter, setStatusFilter] = useState("All");
  const [zoneFilter, setZoneFilter] = useState("All");
  const [flagFilter, setFlagFilter] = useState("All");

  const allStatuses = ["All", "Collected", "In Transit", "At Facility", "Processed"];
  const allZones = ["All", ...new Set(MOCK_BATCHES.map(b => b.zone))];
  const allFlags = ["All", "CRITICAL", "HIGH", "MEDIUM", "None"];

  const acknowledge = (id) => {
    setBatches(prev => prev.map(b => b.id === id ? { ...b, acknowledged: true } : b));
  };

  const filtered = batches.filter(b => {
    const flags = batchAnomalyCheck(b);
    const topFlag = flags[0]?.level;
    const matchStatus = statusFilter === "All" || b.status === statusFilter;
    const matchZone = zoneFilter === "All" || b.zone === zoneFilter;
    const matchFlag = flagFilter === "All" || (flagFilter === "None" ? flags.length === 0 : topFlag === flagFilter);
    return matchStatus && matchZone && matchFlag;
  });

  const hoursAgo = (ts) => ((Date.now() - new Date(ts)) / 3600000).toFixed(1);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>Batch Overview</h1>
        <p className="text-sm text-slate-400">Track and audit all waste batches in your zones</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: "Status", value: statusFilter, opts: allStatuses, set: setStatusFilter },
          { label: "Zone", value: zoneFilter, opts: allZones, set: setZoneFilter },
          { label: "Flag", value: flagFilter, opts: allFlags, set: setFlagFilter },
        ].map(f => (
          <div key={f.label} className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{f.label}</span>
            <select
              value={f.value}
              onChange={e => f.set(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs text-white outline-none border border-cyan-900 focus:border-cyan-500"
              style={{ background: "#0f1f35" }}
            >
              {f.opts.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-cyan-900 overflow-hidden" style={{ background: "#0f1f35" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-cyan-900/60">
                {["Batch ID", "Zone", "Type", "Disposal", "Status", "Last Updated", "Hrs Since Update", "Flags", "Action"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-slate-400 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(batch => {
                const flags = batchAnomalyCheck(batch);
                const topFlag = flags[0]?.level;
                const style = topFlag ? FLAG_STYLE[topFlag] : {};
                const hrs = hoursAgo(batch.last_updated);

                return (
                  <tr
                    key={batch.id}
                    className={`border-b border-cyan-900/30 transition ${topFlag === "CRITICAL" ? "animate-pulse-subtle" : ""}`}
                    style={{
                      background: style.row || "transparent",
                      outline: style.border || "none",
                      borderLeft: style.borderLeft || undefined,
                    }}
                  >
                    <td className="px-4 py-3 font-mono font-semibold text-slate-200">{batch.id}</td>
                    <td className="px-4 py-3 text-slate-400">{batch.zone}</td>
                    <td className="px-4 py-3 text-slate-300 capitalize">{batch.collected_type}</td>
                    <td className="px-4 py-3 text-slate-400 capitalize">{batch.disposal_method}</td>
                    <td className="px-4 py-3"><Badge label={batch.status} /></td>
                    <td className="px-4 py-3 text-slate-400">{new Date(batch.last_updated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="px-4 py-3">
                      <span style={{ color: parseFloat(hrs) > 12 ? "#ff4444" : parseFloat(hrs) > 6 ? "#ffaa00" : "#94a3b8" }}>
                        {hrs}h
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        {flags.length === 0 ? (
                          <span className="text-xs text-emerald-400">✓ Clear</span>
                        ) : flags.map((f, i) => (
                          <div key={i}>
                            <FlagBadge level={f.level} />
                            <p className="text-slate-500 mt-0.5 text-xs leading-tight">{f.msg}</p>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {flags.length > 0 && !batch.acknowledged && (
                        <button
                          onClick={() => acknowledge(batch.id)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold transition hover:opacity-80 whitespace-nowrap"
                          style={{ background: "#00e5ff18", color: "#00e5ff", border: "1px solid #00e5ff44" }}
                        >
                          Resolve
                        </button>
                      )}
                      {batch.acknowledged && (
                        <div className="flex items-center gap-1 text-xs text-emerald-400">
                          <CheckCircle size={12} /> Acknowledged
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}