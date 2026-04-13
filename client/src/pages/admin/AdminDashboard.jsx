// AdminDashboard.jsx — Main shell with internal page state (no sub-route conflicts)
import { useState, useEffect } from "react";
import {
  Trash2, TruckIcon, AlertTriangle, Users, CheckCircle,
  Activity, Bell, MapPin, Shield, BarChart2, FileText,
  Settings, Building2, Package, ChevronRight, TrendingUp,
  TrendingDown, Zap, X, Menu
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { db } from "../../lib/supabase";

// Sub-pages
import AnomalyCentre  from "./AnomalyCentre";
import WorkerList     from "./WorkerList";
import ContractorList from "./ContractorList";
import ComplaintQueue from "./ComplaintQueue";
import BatchMonitor   from "./BatchMonitor";
import ZoneManager    from "./ZoneManager";
import WeeklyReport   from "./WeeklyReport";
import SettingsPage   from "./Settings"; 
import Landing from "../Landing";
import { useNavigate } from "react-router-dom";
const NAV = [
  { id: "home",        label: "Command Center", icon: Activity,      group: "overview"    },
  { id: "anomalies",   label: "Anomaly Center", icon: AlertTriangle, group: "operations", badge: "anomalies"  },
  { id: "workers",     label: "Workers",        icon: Users,         group: "operations"  },
  { id: "contractors", label: "Contractors",    icon: Building2,     group: "operations"  },
  { id: "complaints",  label: "Complaints",     icon: Bell,          group: "operations", badge: "complaints" },
  { id: "batches",     label: "Batch Monitor",  icon: Package,       group: "operations"  },
  { id: "zones",       label: "Zone Manager",   icon: MapPin,        group: "admin"       },
  { id: "reports",     label: "Weekly Report",  icon: FileText,      group: "admin"       },
  { id: "settings",    label: "Settings",       icon: Settings,      group: "admin"       },
  {id: "logout",       label: "Logout",         icon: X,             group: "admin"       }
];

const NAV_GROUPS = [
  { id: "overview",   label: "Overview"   },
  { id: "operations", label: "Operations" },
  { id: "admin",      label: "Admin"      },
];

const TREND_DATA = [
  { day: "Mon", v: 420 }, { day: "Tue", v: 480 }, { day: "Wed", v: 310 },
  { day: "Thu", v: 560 }, { day: "Fri", v: 490 }, { day: "Sat", v: 380 }, { day: "Sun", v: 290 },
];

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, trend, color = "#22c55e", delay = 0, onClick }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, [delay]);

  return (
    <div
      onClick={onClick}
      style={{
        opacity: vis ? 1 : 0,
        transform: vis ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${color}18`,
        borderRadius: 14,
        padding: "18px 20px",
        cursor: onClick ? "pointer" : "default",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={e => {
        if (!onClick) return;
        e.currentTarget.style.background   = `${color}0a`;
        e.currentTarget.style.borderColor  = `${color}35`;
        e.currentTarget.style.transform    = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        if (!onClick) return;
        e.currentTarget.style.background  = "rgba(255,255,255,0.03)";
        e.currentTarget.style.borderColor = `${color}18`;
        e.currentTarget.style.transform   = "translateY(0)";
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}, transparent)` }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>{label}</p>
          <p style={{ color: "#fff", fontSize: 26, fontFamily: "'Syne', sans-serif", fontWeight: 800, lineHeight: 1 }}>{value}</p>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 5 }}>{sub}</p>
        </div>
        <div style={{ background: `${color}18`, border: `1px solid ${color}28`, borderRadius: 10, padding: 9 }}>
          <Icon size={18} color={color} />
        </div>
      </div>
      {trend !== undefined && (
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 5 }}>
          {trend > 0
            ? <TrendingUp  size={12} color="#22c55e" />
            : <TrendingDown size={12} color="#ef4444" />}
          <span style={{ fontSize: 11, color: trend > 0 ? "#22c55e" : "#ef4444" }}>
            {Math.abs(trend)}% vs yesterday
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Home Content ─────────────────────────────────────────────────────────────
function HomeContent({ stats, onNavigate }) {
  const [liveCount, setLiveCount] = useState(14203);
  useEffect(() => {
    const iv = setInterval(() => setLiveCount(c => c + Math.floor(Math.random() * 3)), 2000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 28, letterSpacing: "-0.03em" }}>
          Command{" "}
          <span style={{ background: "linear-gradient(90deg,#22c55e,#3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Center
          </span>
        </h1>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginTop: 4 }}>
          {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} · All states monitored
        </p>
      </div>

      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 16px", borderRadius: 99, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", marginBottom: 24 }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", animation: "pulse 1.5s infinite" }} />
        <span style={{ fontSize: 12, color: "#22c55e", fontWeight: 600 }}>{liveCount.toLocaleString()} batches tracked live</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 14 }}>
        <StatCard icon={TruckIcon}     label="Active Trucks"      value={stats.activeTrucks      ?? "—"} sub="Across 28 states"                              trend={4.2}   color="#3b82f6" delay={0}   onClick={() => onNavigate("batches")}     />
        <StatCard icon={Package}       label="Batches Today"      value={stats.batchesToday      ?? "—"} sub="Updated live"                                  trend={2.1}   color="#8b5cf6" delay={60}  onClick={() => onNavigate("batches")}     />
        <StatCard icon={AlertTriangle} label="Open Anomalies"     value={stats.openAnomalies     ?? "—"} sub={`${stats.highAnomalies ?? 0} high severity`}   trend={-8}    color="#ef4444" delay={120} onClick={() => onNavigate("anomalies")}   />
        <StatCard icon={CheckCircle}   label="Resolved Today"     value="412"                           sub="Avg 47 min resolution"                          trend={11.3}  color="#22c55e" delay={180}                                           />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
        <StatCard icon={Users}         label="Active Workers"     value={stats.activeWorkers     ?? "—"} sub="On route now"                                  trend={-1.2}  color="#22c55e" delay={240} onClick={() => onNavigate("workers")}     />
        <StatCard icon={Bell}          label="Pending Complaints" value={stats.pendingComplaints ?? "—"} sub="Awaiting assignment"                            trend={-5.4}  color="#f59e0b" delay={300} onClick={() => onNavigate("complaints")}  />
        <StatCard icon={Shield}        label="Avg Credibility"    value={stats.avgCredibility    ?? "—"} sub={`${stats.flaggedContractors ?? 0} flagged`}     trend={1.1}   color="#3b82f6" delay={360} onClick={() => onNavigate("contractors")} />
        <StatCard icon={Activity}      label="Waste Collected"    value="412t"                          sub="82.4% of daily target"                          trend={3.6}   color="#22c55e" delay={420}                                           />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18 }}>
        {/* Trend chart */}
        <div style={{ gridColumn: "span 2", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 22 }}>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Waste Collection Volume</h3>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginBottom: 16 }}>This week vs target</p>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={TREND_DATA}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis                tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#0d1b2a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 12 }} />
              <Area type="monotone" dataKey="v" stroke="#22c55e" fill="url(#g1)" strokeWidth={2} dot={{ fill: "#22c55e", r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Quick navigation */}
        <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 22 }}>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Quick Access</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { id: "anomalies",   label: "Anomaly Center",  icon: AlertTriangle, color: "#ef4444", sub: `${stats.openAnomalies      ?? 0} open`     },
              { id: "workers",     label: "Worker List",     icon: Users,         color: "#3b82f6", sub: `${stats.activeWorkers       ?? 0} on route` },
              { id: "contractors", label: "Contractors",     icon: Building2,     color: "#8b5cf6", sub: `${stats.flaggedContractors  ?? 0} flagged`  },
              { id: "complaints",  label: "Complaint Queue", icon: Bell,          color: "#f59e0b", sub: `${stats.pendingComplaints   ?? 0} pending`  },
              { id: "batches",     label: "Batch Monitor",   icon: Package,       color: "#22c55e", sub: "Live tracking"                              },
              { id: "reports",     label: "Weekly Report",   icon: FileText,      color: "#6b7280", sub: "AI generated"                               },
            ].map(item => (
              <div
                key={item.id}
                onClick={() => onNavigate(item.id)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, cursor: "pointer", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.background = `${item.color}0d`; e.currentTarget.style.borderColor = `${item.color}25`; e.currentTarget.style.transform = "translateX(3px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"; e.currentTarget.style.transform = "translateX(0)"; }}
              >
                <div style={{ width: 28, height: 28, borderRadius: 8, background: `${item.color}15`, border: `1px solid ${item.color}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <item.icon size={13} color={item.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>{item.label}</p>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>{item.sub}</p>
                </div>
                <ChevronRight size={13} color="rgba(255,255,255,0.25)" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Root Dashboard ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  // ✅ FIX: declare `page` state — was missing, caused "page is not defined" errors
  const [page, setPage]           = useState("home");
  const [stats, setStats]         = useState({});
  const [badges, setBadges]       = useState({ anomalies: 0, complaints: 0 });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading]     = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    db.dashboardStats().then(s => {
      setStats(s);
      setBadges({ anomalies: s.openAnomalies ?? 0, complaints: s.pendingComplaints ?? 0 });
      setLoading(false);
    });
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 99px; }
        @keyframes pulse       { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes pulseRing   { 0%{box-shadow:0 0 0 0 rgba(239,68,68,0.4)} 70%{box-shadow:0 0 0 8px rgba(239,68,68,0)} 100%{box-shadow:0 0 0 0 rgba(239,68,68,0)} }
        @keyframes pulseRingAmber { 0%{box-shadow:0 0 0 0 rgba(245,158,11,0.4)} 70%{box-shadow:0 0 0 8px rgba(245,158,11,0)} 100%{box-shadow:0 0 0 0 rgba(245,158,11,0)} }
      `}</style>

      <div style={{
        height: "100vh", display: "flex", overflow: "hidden",
        background: "linear-gradient(135deg, #07120a 0%, #091424 55%, #07101e 100%)",
        fontFamily: "'DM Sans', sans-serif", color: "#fff",
      }}>

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <div style={{
          width: sidebarOpen ? 220 : 60, flexShrink: 0,
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(20px)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          display: "flex", flexDirection: "column",
          transition: "width 0.3s cubic-bezier(0.4,0,0.2,1)",
          overflow: "hidden", zIndex: 100,
        }}>
          {/* Logo */}
          <div style={{ padding: "16px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10, height: 60, flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#22c55e,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Trash2 size={15} color="#fff" />
            </div>
            {sidebarOpen && (
              <div>
                <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 14, letterSpacing: "-0.02em" }}>WasteTrack</span>
                <span style={{ display: "block", fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: "0.06em" }}>ADMIN</span>
              </div>
            )}
          </div>

          {/* Nav groups */}
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
            {NAV_GROUPS.map(g => (
              <div key={g.id} style={{ marginBottom: 4 }}>
                {sidebarOpen && (
                  <p style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", fontWeight: 700, letterSpacing: "0.1em", padding: "8px 16px 4px", textTransform: "uppercase" }}>{g.label}</p>
                )}
                {NAV.filter(n => n.group === g.id).map(item => {
                  const active = page === item.id;
                  const badge  = badges[item.badge] ?? 0;
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
  if (item.id === "logout") {
    navigate("/");
  } else {
    setPage(item.id);
  }
}}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: sidebarOpen ? "9px 14px" : "9px 0",
                        justifyContent: sidebarOpen ? "flex-start" : "center",
                        margin: "1px 8px", borderRadius: 10,
                        background: active ? "rgba(34,197,94,0.12)" : "transparent",
                        border:     active ? "1px solid rgba(34,197,94,0.22)" : "1px solid transparent",
                        cursor: "pointer", transition: "all 0.18s",
                        position: "relative",
                      }}
                      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; } }}
                      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent";           e.currentTarget.style.borderColor = "transparent";             } }}
                    >
                      <item.icon size={16} color={active ? "#22c55e" : "rgba(255,255,255,0.45)"} style={{ flexShrink: 0 }} />
                      {sidebarOpen && (
                        <span style={{ fontSize: 12, fontWeight: active ? 600 : 400, color: active ? "#22c55e" : "rgba(255,255,255,0.6)", flex: 1 }}>{item.label}</span>
                      )}
                      {/* Badge (text when open, dot when collapsed) */}
                      {badge > 0 && sidebarOpen && (
                        <span style={{ fontSize: 9, background: "#ef4444", color: "#fff", padding: "1px 6px", borderRadius: 99, fontWeight: 700 }}>{badge}</span>
                      )}
                      {badge > 0 && !sidebarOpen && (
                        <div style={{ position: "absolute", top: 4, right: 4, width: 8, height: 8, borderRadius: "50%", background: "#ef4444", animation: "pulseRing 1.5s infinite" }} />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Collapse toggle */}
          <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div
              onClick={() => setSidebarOpen(o => !o)}
              style={{ display: "flex", alignItems: "center", justifyContent: sidebarOpen ? "flex-start" : "center", gap: 8, padding: "8px 12px", borderRadius: 10, cursor: "pointer", color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
            >
              <Menu size={14} />
              {sidebarOpen && <span style={{ fontSize: 11 }}>Collapse</span>}
            </div>
          </div>
        </div>

        {/* ── Main area ────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* ── Top bar (Header — shown on every page) ── */}
          <div style={{
            height: 60, display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 24px",
            background: "rgba(0,0,0,0.35)", backdropFilter: "blur(16px)",
            borderBottom: "1px solid rgba(255,255,255,0.055)", flexShrink: 0,
          }}>
            {/* Breadcrumb */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>WasteTrack</span>
              <ChevronRight size={12} color="rgba(255,255,255,0.2)" />
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>
                {NAV.find(n => n.id === page)?.label ?? "Dashboard"}
              </span>
            </div>

            {/* Right actions */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {/* Live pill */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 99, background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", animation: "pulse 1.5s infinite" }} />
                <span style={{ fontSize: 10, color: "#22c55e", fontWeight: 600 }}>LIVE</span>
              </div>

              {/* Anomaly bell — ✅ FIX: uses setPage, not navigate() */}
              <div
                onClick={() => setPage("anomalies")}
                style={{ position: "relative", cursor: "pointer", padding: 6, borderRadius: 9, background: badges.anomalies > 0 ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.04)", border: `1px solid ${badges.anomalies > 0 ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.07)"}`, transition: "all 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background = badges.anomalies > 0 ? "rgba(239,68,68,0.14)" : "rgba(255,255,255,0.08)"}
                onMouseLeave={e => e.currentTarget.style.background = badges.anomalies > 0 ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.04)"}
                title="Anomaly Center"
              >
                <AlertTriangle size={17} color={badges.anomalies > 0 ? "#ef4444" : "rgba(255,255,255,0.4)"} />
                {badges.anomalies > 0 && (
                  <div style={{ position: "absolute", top: -5, right: -5, minWidth: 16, height: 16, background: "#ef4444", borderRadius: 99, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 800, padding: "0 3px", animation: "pulseRing 1.5s infinite" }}>
                    {badges.anomalies}
                  </div>
                )}
              </div>

              {/* Complaint bell — ✅ FIX: uses setPage("complaints"), not navigate("complaints") */}
              <div
                onClick={() => setPage("complaints")}
                style={{ position: "relative", cursor: "pointer", padding: 6, borderRadius: 9, background: badges.complaints > 0 ? "rgba(245,158,11,0.08)" : "rgba(255,255,255,0.04)", border: `1px solid ${badges.complaints > 0 ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.07)"}`, transition: "all 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background = badges.complaints > 0 ? "rgba(245,158,11,0.14)" : "rgba(255,255,255,0.08)"}
                onMouseLeave={e => e.currentTarget.style.background = badges.complaints > 0 ? "rgba(245,158,11,0.08)" : "rgba(255,255,255,0.04)"}
                title="Complaints"
              >
                <Bell size={17} color={badges.complaints > 0 ? "#f59e0b" : "rgba(255,255,255,0.4)"} />
                {badges.complaints > 0 && (
                  <div style={{ position: "absolute", top: -5, right: -5, minWidth: 16, height: 16, background: "#f59e0b", borderRadius: 99, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 800, padding: "0 3px", animation: "pulseRingAmber 1.5s infinite" }}>
                    {badges.complaints}
                  </div>
                )}
              </div>
              

              {/* Avatar */}
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#22c55e,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                onClick={() => setPage("settings")}
                title="Settings"
              >
                A
              </div>
            </div>
          </div>

          {/* ── Page content ── */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", gap: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", animation: "pulse 1s ease-in-out 0s infinite" }} />
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#3b82f6", animation: "pulse 1s ease-in-out 0.2s infinite" }} />
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#8b5cf6", animation: "pulse 1s ease-in-out 0.4s infinite" }} />
              </div>
            ) : (
              <>
                {page === "home"        && <HomeContent stats={stats} onNavigate={setPage} />}
                {page === "anomalies"   && <AnomalyCentre />}
                {page === "workers"     && <WorkerList />}
                {page === "contractors" && <ContractorList />}
                
                 {page === "complaints"  && <ComplaintQueue />} 
                 {page === "batches"     && <BatchMonitor />} 
                 {page === "zones"       && <ZoneManager />} 
                {page === "reports"     && <WeeklyReport />}
                {page === "settings"    && <SettingsPage />} 
               
               
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}