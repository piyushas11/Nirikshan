import { useState, useEffect } from "react";
import { Search, X, AlertTriangle, Clock } from "lucide-react";
import { Badge, CredibilityBadge, AnomalyAlert } from "../../components/ui";
const MOCK_WORKERS = [
  { id: 1, name: "Arjun Sharma", route: "Route A-1", stopsDone: 12, totalStops: 14, status: "active", credibility_score: 82, lastActive: "2025-03-24T08:30:00Z" },
  { id: 2, name: "Meena Devi", route: "Route B-2", stopsDone: 0, totalStops: 11, status: "absent", credibility_score: 67, lastActive: "2025-03-23T18:00:00Z", routeReassigned: false },
  { id: 3, name: "Vikram Patel", route: "Route C-3", stopsDone: 6, totalStops: 10, status: "en route", credibility_score: 74, lastActive: "2025-03-24T09:10:00Z" },
  { id: 4, name: "Sunita Rao", route: "Route D-4", stopsDone: 9, totalStops: 9, status: "active", credibility_score: 91, lastActive: "2025-03-24T09:00:00Z" },
  { id: 5, name: "Deepak Nair", route: "Route E-5", stopsDone: 0, totalStops: 13, status: "absent", credibility_score: 38, lastActive: "2025-03-23T17:00:00Z", routeReassigned: true },
  { id: 6, name: "Priya Singh", route: "Route F-6", stopsDone: 4, totalStops: 8, status: "en route", credibility_score: 55, lastActive: "2025-03-24T08:50:00Z" },
];

const MOCK_ROUTES = [
  { id: 1, name: "Route A-1", worker_id: 1, reassigned: false },
  { id: 2, name: "Route B-2", worker_id: 2, reassigned: false },
  { id: 3, name: "Route G-7", worker_id: null, reassigned: false },
  { id: 4, name: "Route H-8", worker_id: null, reassigned: false },
];

const AVAILABLE_ROUTES = ["Route G-7", "Route H-8", "Route I-9"];

function detectWorkerAnomalies(workers, routes) {
  const flags = [];
  workers.forEach(worker => {
    if (worker.status === "absent") {
      const route = routes.find(r => r.worker_id === worker.id);
      if (route && !route.reassigned) {
        flags.push({ type: "UNASSIGNED ROUTE", severity: "HIGH", msg: `${worker.name} is absent — Route ${route.name} has no worker`, workerId: worker.id });
      }
    }
    if (worker.credibility_score < 40 && worker.status === "active") {
      flags.push({ type: "LOW CREDIBILITY ACTIVE", severity: "MEDIUM", msg: `${worker.name} has score ${worker.credibility_score} — review before assigning`, workerId: worker.id });
    }
  });
  return flags;
}

function timeAgo(ts) {
  const diff = (Date.now() - new Date(ts)) / 60000;
  if (diff < 60) return `${Math.round(diff)}m ago`;
  if (diff < 1440) return `${Math.round(diff / 60)}hr ago`;
  return `${Math.round(diff / 1440)}d ago`;
}

function initials(name) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase();
}

export default function WorkerManage() {
  const [workers, setWorkers] = useState(MOCK_WORKERS);
  const [routes] = useState(MOCK_ROUTES);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [modal, setModal] = useState(null); // { workerId, workerName }
  const [selectedRoute, setSelectedRoute] = useState(AVAILABLE_ROUTES[0]);
  const [anomalies, setAnomalies] = useState([]);

  useEffect(() => {
    setAnomalies(detectWorkerAnomalies(workers, routes));
  }, [workers, routes]);

  const currentHour = new Date().getHours();
  const absentUnassigned = workers.filter(w => w.status === "absent" && !w.routeReassigned);
  const showBanner = absentUnassigned.length > 0 && currentHour < 10;

  const filtered = workers.filter(w => {
    const matchSearch = w.name.toLowerCase().includes(search.toLowerCase()) || w.route.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "All" || w.status.toLowerCase() === filter.toLowerCase();
    return matchSearch && matchFilter;
  });

  const flaggedIds = new Set(anomalies.map(a => a.workerId));

  const handleReassign = () => {
    setWorkers(w => w.map(wk => wk.id === modal.workerId ? { ...wk, route: selectedRoute, routeReassigned: true } : wk));
    setModal(null);
  };

  return (
    <div className="space-y-5">
      {/* Absence Banner */}
      {showBanner && (
        <div className="rounded-xl p-4 flex items-center gap-3 border" style={{ background: "#ffaa0018", borderColor: "#ffaa00" }}>
          <AlertTriangle size={18} color="#ffaa00" />
          <p className="text-sm font-semibold text-amber-300">
            ⚠️ {absentUnassigned.length} worker{absentUnassigned.length > 1 ? "s are" : " is"} absent with unassigned routes.
            Time window closes in {9 - currentHour}hr{9 - currentHour !== 1 ? "s" : ""}.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>Worker Management</h1>
          <p className="text-sm text-slate-400">{workers.length} workers assigned to your zones</p>
        </div>
      </div>

      {/* Anomaly Panel */}
      {anomalies.length > 0 && (
        <div className="rounded-xl border border-cyan-900 p-4 space-y-2" style={{ background: "#0f1f35" }}>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Active Anomalies</p>
          {anomalies.map((a, i) => <AnomalyAlert key={i} {...a} />)}
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search workers or routes…"
            className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm text-white placeholder-slate-500 outline-none border border-cyan-900 focus:border-cyan-500 transition"
            style={{ background: "#0f1f35" }}
          />
        </div>
        <div className="flex gap-2">
          {["All", "Active", "Absent", "En Route"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-2 rounded-lg text-xs font-medium transition"
              style={{
                background: filter === f ? "#00e5ff22" : "#0f1f35",
                color: filter === f ? "#00e5ff" : "#94a3b8",
                border: `1px solid ${filter === f ? "#00e5ff55" : "#164e63"}`
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Worker Cards */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(w => {
          const isFlagged = flaggedIds.has(w.id);
          return (
            <div
              key={w.id}
              className="rounded-xl p-5 border transition-all duration-200"
              style={{
                background: "#0f1f35",
                borderColor: isFlagged ? "#ff444488" : "#164e63",
                boxShadow: isFlagged ? "0 0 0 1px #ff444444" : "none"
              }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0"
                  style={{ background: "linear-gradient(135deg, #00e5ff33, #00e5ff55)", border: "1px solid #00e5ff44" }}
                >
                  {initials(w.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm truncate" style={{ fontFamily: "'Syne', sans-serif" }}>{w.name}</p>
                  <p className="text-xs text-slate-400 truncate">{w.route}</p>
                </div>
                <Badge label={w.status === "en route" ? "En Route" : w.status.charAt(0).toUpperCase() + w.status.slice(1)} />
              </div>

              {/* Progress */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Stops</span>
                  <span className="text-white font-medium">{w.stopsDone}/{w.totalStops}</span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: "#0a1628" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(w.stopsDone / w.totalStops) * 100}%`,
                      background: w.stopsDone === w.totalStops ? "#00e676" : "#00e5ff"
                    }}
                  />
                </div>
              </div>

              {/* Meta */}
              <div className="flex items-center justify-between mb-4">
                <CredibilityBadge score={w.credibility_score} />
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock size={11} />
                  <span>{timeAgo(w.lastActive)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => setModal({ workerId: w.id, workerName: w.name })}
                  className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition hover:opacity-80"
                  style={{ background: "#00e5ff18", color: "#00e5ff", border: "1px solid #00e5ff44" }}
                >
                  Reassign Route
                </button>
                <button
                  className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition hover:opacity-80"
                  style={{ background: "#ffffff0a", color: "#94a3b8", border: "1px solid #ffffff18" }}
                >
                  View Details
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reassign Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="rounded-2xl border border-cyan-900 p-6 w-full max-w-sm" style={{ background: "#0f1f35" }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>Reassign Route</h3>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-slate-400 mb-4">Select a new route for <span className="text-white font-medium">{modal.workerName}</span></p>
            <select
              value={selectedRoute}
              onChange={e => setSelectedRoute(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none border border-cyan-900 focus:border-cyan-500 mb-4"
              style={{ background: "#0a1628" }}
            >
              {AVAILABLE_ROUTES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <div className="flex gap-3">
              <button
                onClick={() => setModal(null)}
                className="flex-1 py-2 rounded-lg text-sm font-medium text-slate-400 border border-cyan-900 hover:border-cyan-700 transition"
                style={{ background: "#0a1628" }}
              >
                Cancel
              </button>
              <button
                onClick={handleReassign}
                className="flex-1 py-2 rounded-lg text-sm font-semibold text-black transition hover:opacity-90"
                style={{ background: "#00e5ff" }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}