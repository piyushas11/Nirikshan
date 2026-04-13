import { useState, useEffect } from "react";
import { AlertTriangle, TrendingUp } from "lucide-react";
import { StatCard, Badge } from "../../components/ui/index.jsx";

const now = Date.now();
const MOCK_COMPLAINTS = [
  { id: "CMP-001", complaint_id: "CMP-001", zone: "Zone A", type: "Missed Pickup", assigned_worker: "Arjun Sharma", contractor_id: "c1", status: "Resolved", citizen_approval: "approved", reported_at: new Date(now - 3 * 86400000), resolved_at: new Date(now - 1 * 86400000) },
  { id: "CMP-002", complaint_id: "CMP-002", zone: "Zone B", type: "Overflowing Bin", assigned_worker: "Meena Devi", contractor_id: "c1", status: "Rejected", citizen_approval: "rejected", reported_at: new Date(now - 2 * 86400000), resolved_at: null },
  { id: "CMP-003", complaint_id: "CMP-003", zone: "Zone A", type: "Illegal Dumping", assigned_worker: "Vikram Patel", contractor_id: "c1", status: "Cleared", citizen_approval: "pending", reported_at: new Date(now - 5 * 86400000), resolved_at: null },
  { id: "CMP-004", complaint_id: "CMP-004", zone: "Zone C", type: "Missed Pickup", assigned_worker: "Meena Devi", contractor_id: "c1", status: "Rejected", citizen_approval: "rejected", reported_at: new Date(now - 1 * 86400000), resolved_at: null },
  { id: "CMP-005", complaint_id: "CMP-005", zone: "Zone B", type: "Bad Odour", assigned_worker: "Sunita Rao", contractor_id: "c1", status: "Resolved", citizen_approval: "approved", reported_at: new Date(now - 4 * 86400000), resolved_at: new Date(now - 2 * 86400000) },
  { id: "CMP-006", complaint_id: "CMP-006", zone: "Zone A", type: "Missed Pickup", assigned_worker: "Meena Devi", contractor_id: "c1", status: "Assigned", citizen_approval: null, reported_at: new Date(now - 0.5 * 86400000), resolved_at: null },
  { id: "CMP-007", complaint_id: "CMP-007", zone: "Zone A", type: "Overflowing Bin", assigned_worker: "Arjun Sharma", contractor_id: "c1", status: "Reported", citizen_approval: null, reported_at: new Date(now - 0.2 * 86400000), resolved_at: null },
  { id: "CMP-008", complaint_id: "CMP-008", zone: "Zone B", type: "Missed Pickup", assigned_worker: "Deepak Nair", contractor_id: "c1", status: "Rejected", citizen_approval: "rejected", reported_at: new Date(now - 1.5 * 86400000), resolved_at: null },
];

const LAST_7_AVG = { "Zone A": 1.5, "Zone B": 1, "Zone C": 0.5, "Zone D": 0.5 };

function detectRejectionAnomaly(complaints, workerName) {
  const workerComplaints = complaints.filter(c => c.assigned_worker === workerName);
  if (workerComplaints.length === 0) return { flag: false };
  const rejected = workerComplaints.filter(c => c.citizen_approval === "rejected");
  const rate = rejected.length / workerComplaints.length;
  if (rate > 0.3) return { flag: true, rate, msg: `${workerName} has ${(rate * 100).toFixed(0)}% citizen rejection rate — possible fake clearance photos` };
  return { flag: false };
}

function detectComplaintSurge(complaints, zone, last7dayAvg) {
  const todayCount = complaints.filter(c =>
    c.zone === zone && new Date(c.reported_at).toDateString() === new Date().toDateString()
  ).length;
  if (todayCount > last7dayAvg * 1.5) return { surge: true, msg: `Complaint surge in ${zone} — ${todayCount} today vs avg ${last7dayAvg}` };
  return { surge: false };
}

function daysOpen(reported_at) {
  return Math.floor((Date.now() - new Date(reported_at)) / 86400000);
}

export default function ComplaintPanel() {
  const [complaints] = useState(MOCK_COMPLAINTS);
  const [rejectionFlags, setRejectionFlags] = useState([]);
  const [surgeAlerts, setSurgeAlerts] = useState([]);

  useEffect(() => {
    // Rejection anomalies
    const workers = [...new Set(complaints.map(c => c.assigned_worker))];
    const flags = workers.map(w => detectRejectionAnomaly(complaints, w)).filter(r => r.flag);
    setRejectionFlags(flags);

    // Surge detection
    const zones = [...new Set(complaints.map(c => c.zone))];
    const surges = zones.map(z => detectComplaintSurge(complaints, z, LAST_7_AVG[z] || 1)).filter(s => s.surge);
    setSurgeAlerts(surges);
  }, [complaints]);

  const total = complaints.length;
  const myWorkerComplaints = complaints.length;
  const resolved = complaints.filter(c => c.status === "Resolved").length;
  const rejected = complaints.filter(c => c.citizen_approval === "rejected").length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>Complaint Panel</h1>
        <p className="text-sm text-slate-400">Track all complaints across your assigned zones</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total in Zone" value={total} icon={null} />
        <StatCard label="Assigned to My Workers" value={myWorkerComplaints} color="#00e5ff" />
        <StatCard label="Resolved" value={resolved} color="#00e676" />
        <StatCard label="Citizen Rejected" value={rejected} color="#ff4444" danger />
      </div>

      {/* Rejection Anomaly Banners */}
      {rejectionFlags.map((f, i) => (
        <div key={i} className="rounded-xl p-4 flex items-start gap-3 border" style={{ background: "#ff444415", borderColor: "#ff4444" }}>
          <AlertTriangle size={18} color="#ff4444" className="shrink-0 mt-0.5" />
          <p className="text-sm font-semibold text-red-300">{f.msg}</p>
        </div>
      ))}

      {/* Surge Alerts */}
      {surgeAlerts.map((s, i) => (
        <div key={i} className="rounded-xl p-4 flex items-start gap-3 border" style={{ background: "#ffaa0015", borderColor: "#ffaa00" }}>
          <TrendingUp size={18} color="#ffaa00" className="shrink-0 mt-0.5" />
          <p className="text-sm font-semibold text-amber-300">{s.msg}</p>
        </div>
      ))}

      {/* Table */}
      <div className="rounded-xl border border-cyan-900 overflow-hidden" style={{ background: "#0f1f35" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-cyan-900/60">
                {["ID", "Location", "Type", "Worker", "Status", "Citizen", "Days Open", "Action"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-slate-400 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {complaints.map(c => {
                const days = daysOpen(c.reported_at);
                const isRejected = c.citizen_approval === "rejected";
                return (
                  <tr
                    key={c.id}
                    className="border-b border-cyan-900/30 transition hover:bg-white/[0.02]"
                    style={{ background: isRejected ? "#ff44440a" : "transparent" }}
                  >
                    <td className="px-4 py-3 font-mono text-slate-300">{c.complaint_id}</td>
                    <td className="px-4 py-3 text-slate-400">{c.zone}</td>
                    <td className="px-4 py-3 text-slate-300">{c.type}</td>
                    <td className="px-4 py-3 text-slate-300">{c.assigned_worker}</td>
                    <td className="px-4 py-3"><Badge label={c.status} /></td>
                    <td className="px-4 py-3">
                      {c.citizen_approval ? (
                        <Badge label={c.citizen_approval === "approved" ? "approved" : c.citizen_approval === "rejected" ? "rejected" : "pending"} />
                      ) : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span style={{ color: days > 5 ? "#ff4444" : days > 2 ? "#ffaa00" : "#94a3b8" }}>{days}d</span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold transition hover:opacity-80"
                        style={{ background: "#00e5ff18", color: "#00e5ff", border: "1px solid #00e5ff44" }}
                      >
                        {c.status === "Reported" ? "Assign" : c.status === "Cleared" ? "Escalate" : "View"}
                      </button>
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