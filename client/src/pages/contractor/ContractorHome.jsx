import { useState } from "react";
import {
  MapPin,
  Users,
  Route,
  MessageSquare,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";

import {
  StatCard,
  AnomalyAlert,
  CredibilityBadge,
  Badge,
} from "../../components/ui";

const MOCK_WORKERS = [
  { id: 1, name: "Arjun Sharma", route: "Route A-1", stopsDone: 12, totalStops: 14, status: "Active", score: 82 },
  { id: 2, name: "Meena Devi", route: "Route B-2", stopsDone: 0, totalStops: 11, status: "Absent", score: 67, routeReassigned: false },
  { id: 3, name: "Vikram Patel", route: "Route C-3", stopsDone: 6, totalStops: 10, status: "En Route", score: 74 },
  { id: 4, name: "Sunita Rao", route: "Route D-4", stopsDone: 9, totalStops: 9, status: "Active", score: 91 },
  { id: 5, name: "Deepak Nair", route: "Route E-5", stopsDone: 0, totalStops: 13, status: "Absent", score: 38, routeReassigned: true },
];

const MOCK_ANOMALIES = [
  { severity: "CRITICAL", type: "STAGE SKIPPED", msg: "Batch BT-007 processed without In Transit stage", timeAgo: "4m ago" },
  { severity: "HIGH", type: "UNASSIGNED ROUTE", msg: "Meena Devi absent — Route B-2 has no worker", timeAgo: "22m ago" },
  { severity: "CRITICAL", type: "STAGNATION", msg: "Batch BT-009 stuck for 14hrs — admin notified", timeAgo: "1hr ago" },
  { severity: "MEDIUM", type: "LOW CREDIBILITY ACTIVE", msg: "Deepak Nair score 38 — review before assigning", timeAgo: "2hr ago" },
  { severity: "HIGH", type: "DISPOSAL MISMATCH", msg: "Recyclable waste sent to landfill in Zone C", timeAgo: "3hr ago" },
];

export default function ContractorHome() {
  const [workers, setWorkers] = useState(MOCK_WORKERS);
  const score = 82;

  const handleReassign = (id) => {
    setWorkers((w) =>
      w.map((wk) =>
        wk.id === id ? { ...wk, routeReassigned: true } : wk
      )
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f1c] via-[#0f1f35] to-[#020617] p-6 space-y-6">

      {/* Warning Banner */}
      {score < 40 && (
        <div className="rounded-2xl p-4 flex items-start gap-3 bg-red-500/10 border border-red-500/30 backdrop-blur-md">
          <span className="text-xl">⛔</span>
          <p className="text-sm font-semibold text-red-300">
            Your credibility score is too low. Assignments are frozen until review.
          </p>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white tracking-wide">
          Zone Overview
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Real-time status across your assigned districts
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="Districts Assigned" value="4" sub="Zone A, B, C, D" icon={MapPin} />
        <StatCard label="Active Workers" value="4" sub="2 absent" icon={Users} />
        <StatCard label="Routes Done" value="8/12" sub="67%" icon={Route} />
        <StatCard label="Complaints" value="6" sub="2 rejected" icon={MessageSquare} />
      </div>

      {/* Main Section */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Worker Table */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-lg shadow-xl overflow-hidden">

          <div className="px-5 py-4 border-b border-white/10">
            <h2 className="font-semibold text-white text-sm">
              Worker Summary
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">

              <thead>
                <tr className="border-b border-white/10">
                  {["Name", "Route", "Stops", "Status", "Score"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-slate-400 font-semibold tracking-wide">
                      {h}
                    </th>
                  ))}
                  <th />
                </tr>
              </thead>

              <tbody>
                {workers.map((w) => {
                  const needsReassign = w.status === "Absent" && !w.routeReassigned;

                  return (
                    <tr
                      key={w.id}
                      className="border-b border-white/5 hover:bg-white/5 transition-all duration-200"
                    >
                      <td className="px-4 py-3 text-slate-200 font-medium">
                        {needsReassign && "⚠️ "} {w.name}
                      </td>

                      <td className="px-4 py-3 text-slate-400">{w.route}</td>

                      <td className="px-4 py-3 text-slate-300">
                        {w.stopsDone}/{w.totalStops}
                      </td>

                      <td className="px-4 py-3">
                        <Badge text={w.status} />
                      </td>

                      <td className="px-4 py-3">
                        <CredibilityBadge score={w.score} />
                      </td>

                      <td className="px-4 py-3">
                        {needsReassign && (
                          <button
                            onClick={() => handleReassign(w.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 border border-red-400/30 hover:bg-red-500/20 transition-all"
                          >
                            Reassign
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {workers.filter((w) => w.status === "Absent" && !w.routeReassigned).length > 0 && (
              <div className="px-4 py-2 flex items-center gap-2 text-xs bg-red-500/10">
                <AlertTriangle size={12} className="text-red-400" />
                <span className="text-red-400 font-medium">
                  Reassign Needed — route coverage gap
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Anomaly Feed */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-lg shadow-xl overflow-hidden">

          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="font-semibold text-white text-sm">
              Live Anomaly Feed
            </h2>

            <button className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition">
              View All <ExternalLink size={12} />
            </button>
          </div>

          <div className="p-4 space-y-3">
            {MOCK_ANOMALIES.map((a, i) => (
              <AnomalyAlert key={i} {...a} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}