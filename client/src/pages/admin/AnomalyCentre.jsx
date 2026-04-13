// AnomalyCentre.jsx — fixed API paths to match FastAPI router
// Changes from broken version:
//   /ai-suggestion  →  /ai/suggestion
//   /ml/health      →  /ml/health      (unchanged, was correct)
//   /ml/score       →  /ml/score       (unchanged, was correct)

import { useState, useEffect, useRef, useCallback } from "react";
import {
  AlertTriangle, Shield, TruckIcon, MapPin, Clock,
  CheckCircle, X, Filter, Activity, Zap, User,
  Building2, RotateCcw, ExternalLink, Brain,
  ChevronRight, Wifi, WifiOff, Cpu, Eye,
  TrendingUp, ArrowUpRight, Layers, Terminal
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, AreaChart, Area
} from "recharts";

// ─── Config ───────────────────────────────────────────────────────────────────
const API_BASE = "http://localhost:8000";

// ─── API helpers ──────────────────────────────────────────────────────────────

// FIXED: was "/ai-suggestion", now "/ai/suggestion"
const fetchAISuggestion = async (message) => {
  try {
    const res = await fetch(`${API_BASE}/ai/suggestion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
      signal: AbortSignal.timeout(90000),
    });
    if (!res.ok) throw new Error(`http_${res.status}`);
    const data = await res.json();
    return data.suggestion || "No suggestion returned.";
  } catch (err) {
    if (err.name === "AbortError" || err.name === "TimeoutError")
      return "⚠️ Ollama timed out — model may still be loading. Click another anomaly to retry.";
    if (err instanceof TypeError)
      return "⚠️ Cannot reach backend. Is uvicorn running? → uvicorn main:app --reload --port 8000";
    if (err.message?.startsWith("http_"))
      return `⚠️ Backend returned error ${err.message.replace("http_", "")}.`;
    return `⚠️ ${err.message}`;
  }
};

// /ml/score — correct as-is
const fetchMLScore = async (anomaly) => {
  const featureMap = {
    GHOST_PICKUP:      { gps_deviation_m: 1247, transit_hours: 4.2, credibility_score: 70 },
    COMPLAINT_SURGE:   { complaint_surge_pct: 67, credibility_score: 55 },
    BATCH_STAGNATION:  { transit_hours: 8.3, credibility_score: 65 },
    DISPOSAL_MISMATCH: { rejection_rate: 0.05, credibility_score: 58 },
    CREDIBILITY_CLIFF: { credibility_score: 38, rejection_rate: 0.41, complaint_surge_pct: 40 },
    ROUTE_DEVIATION:   { route_adherence: 0.40, gps_deviation_m: 150 },
    CITIZEN_REJECTION: { rejection_rate: 0.38, credibility_score: 55 },
    WORKER_ABSENCE:    { hours_absent: 5, credibility_score: 65 },
  };
  try {
    const res = await fetch(`${API_BASE}/ml/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: anomaly.type, features: featureMap[anomaly.type] || {} }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return null;
  }
};

// ─── Static data ──────────────────────────────────────────────────────────────
const INITIAL_ANOMALIES = [
  {
    id: "ANM-001", type: "GHOST_PICKUP", severity: "HIGH", confidence: 94.2, status: "OPEN",
    message: "Truck TK-042 marked batch WB-1893 as 'Collected' while 1.2km from pickup location",
    detail: "Worker GPS coordinates (19.0821, 72.8891) do not match pickup address (19.0698, 72.8772). Distance: 1,247m. Threshold: 500m.",
    truck: "TK-042", worker: "Ravi Kumar", contractor: "GreenHaul Pvt Ltd",
    zone: "Andheri East, Mumbai", time: "2 min ago", model: "Isolation Forest — Batch Model",
    features: [{ label: "GPS Deviation", val: "1,247m", flag: true }, { label: "Time to Collect", val: "4.2 min", flag: false }, { label: "Updates", val: "3", flag: false }],
  },
  {
    id: "ANM-002", type: "COMPLAINT_SURGE", severity: "HIGH", confidence: 88.7, status: "REVIEWING",
    message: "Dharavi zone complaints spiked 67% above 7-day moving average",
    detail: "Today: 28 complaints. 7-day avg: 16.7. Threshold: 50% above avg. Unique reporters: 21.",
    truck: null, worker: null, contractor: "CityClean Co.",
    zone: "Dharavi, Mumbai", time: "31 min ago", model: "Zone Surge Detection — Rule Engine",
    features: [{ label: "Today's Count", val: "28", flag: true }, { label: "7-day Avg", val: "16.7", flag: false }, { label: "Surge", val: "+67%", flag: true }],
  },
  {
    id: "ANM-003", type: "BATCH_STAGNATION", severity: "MEDIUM", confidence: 91.5, status: "OPEN",
    message: "Batch WB-1892 stuck In-Transit for 8.3 hours without status update",
    detail: "Last updated 06:14 AM. Current time 2:30 PM. Expected transit: 2.5h. Auto-notification sent at hour 6 — no response.",
    truck: "TK-214", worker: "Pradeep Gupta", contractor: "Capital Waste Co.",
    zone: "West Delhi", time: "14 min ago", model: "Isolation Forest — Batch Model",
    features: [{ label: "Hours Stagnant", val: "8.3h", flag: true }, { label: "Expected", val: "2.5h", flag: false }, { label: "Notifications", val: "2", flag: false }],
  },
  {
    id: "ANM-004", type: "DISPOSAL_MISMATCH", severity: "HIGH", confidence: 97.1, status: "OPEN",
    message: "Batch WB-1744 collected as Recyclable but logged as General Landfill",
    detail: "Batch WB-1744 from Bandra collected as RECYCLABLE. Disposal logged at Deonar as GENERAL_LANDFILL. Environmental violation.",
    truck: "TK-091", worker: "Deepak Rane", contractor: "GreenHaul Pvt Ltd",
    zone: "Bandra West, Mumbai", time: "1 hr ago", model: "Disposal Pattern Analyzer",
    features: [{ label: "Collected Type", val: "Recyclable", flag: false }, { label: "Disposed As", val: "Landfill", flag: true }, { label: "Discrepancy", val: "YES", flag: true }],
  },
  {
    id: "ANM-005", type: "CREDIBILITY_CLIFF", severity: "HIGH", confidence: 100, status: "AUTO_RESOLVED",
    message: "Contractor CityClean Co. credibility score dropped to 38 — auto-frozen",
    detail: "Score: 38 (was 54 last week). Triggers: 4 unresolved anomalies, rejection rate 41%, stagnation rate 28%. New assignments blocked.",
    truck: null, worker: null, contractor: "CityClean Co.",
    zone: "Dharavi, Mumbai", time: "2 hr ago", model: "Credibility Score Engine",
    features: [{ label: "Current Score", val: "38/100", flag: true }, { label: "Rejection Rate", val: "41%", flag: true }, { label: "Assignments", val: "Blocked", flag: true }],
  },
  {
    id: "ANM-006", type: "ROUTE_DEVIATION", severity: "MEDIUM", confidence: 79.4, status: "REVIEWING",
    message: "Worker WK-119 visited stops out of assigned sequence — 3 stops skipped",
    detail: "Assigned: Stop 1→2→3→4→5. Actual: 1→3→5→2→4. Stops 2 and 4 visited late. Route adherence: 40%.",
    truck: "TK-118", worker: "Kiran More", contractor: "CityClean Co.",
    zone: "Nashik, Maharashtra", time: "45 min ago", model: "Isolation Forest — Worker Behaviour",
    features: [{ label: "Stops Skipped", val: "3", flag: true }, { label: "Sequence Errors", val: "4", flag: true }, { label: "Route Adherence", val: "40%", flag: true }],
  },
  {
    id: "ANM-007", type: "CITIZEN_REJECTION", severity: "MEDIUM", confidence: 85.0, status: "OPEN",
    message: "Worker WK-078 clearance photos rejected by citizens 38% of the time",
    detail: "30 days: 18 complaints, 7 rejections. Reasons: wrong angle (3), waste still present (4). Suggests fake clearance photos.",
    truck: null, worker: "Amit Pawar", contractor: "EcoTrack Ltd",
    zone: "Kurla, Mumbai", time: "3 hr ago", model: "Rejection Pattern Analyzer",
    features: [{ label: "Rejection Rate", val: "38%", flag: true }, { label: "Threshold", val: "30%", flag: false }, { label: "Total Assigned", val: "18", flag: false }],
  },
  {
    id: "ANM-008", type: "WORKER_ABSENCE", severity: "LOW", confidence: 100, status: "RESOLVED",
    message: "Worker WK-202 absent — route GJ-R16 auto-reassigned to WK-219",
    detail: "WK-202 (Dinesh Shah) did not begin route GJ-R16 within 60 min of shift start. No absence logged. Route auto-reassigned.",
    truck: "TK-518", worker: "Dinesh Shah", contractor: "Gujarat Green",
    zone: "Surat, Gujarat", time: "5 hr ago", model: "Absence Detection — Cron Engine",
    features: [{ label: "Shift Start", val: "6:00 AM", flag: false }, { label: "First Update", val: "None", flag: true }, { label: "Route", val: "Reassigned", flag: false }],
  },
];

const TYPE_META = {
  GHOST_PICKUP:      { icon: TruckIcon,  color: "#ef4444", label: "Ghost Pickup" },
  COMPLAINT_SURGE:   { icon: TrendingUp, color: "#f59e0b", label: "Complaint Surge" },
  BATCH_STAGNATION:  { icon: Clock,      color: "#3b82f6", label: "Batch Stagnation" },
  DISPOSAL_MISMATCH: { icon: Activity,   color: "#8b5cf6", label: "Disposal Mismatch" },
  CREDIBILITY_CLIFF: { icon: Shield,     color: "#ef4444", label: "Credibility Cliff" },
  ROUTE_DEVIATION:   { icon: MapPin,     color: "#f59e0b", label: "Route Deviation" },
  CITIZEN_REJECTION: { icon: User,       color: "#fb923c", label: "Citizen Rejection" },
  WORKER_ABSENCE:    { icon: User,       color: "#6b7280", label: "Worker Absence" },
};

const SEV_COLOR   = { HIGH: "#ef4444", MEDIUM: "#f59e0b", LOW: "#22c55e" };
const STATUS_CFG  = {
  OPEN:          { c: "#ef4444", bg: "rgba(239,68,68,0.12)",   label: "Open" },
  REVIEWING:     { c: "#f59e0b", bg: "rgba(245,158,11,0.12)",  label: "Reviewing" },
  AUTO_RESOLVED: { c: "#8b5cf6", bg: "rgba(139,92,246,0.12)",  label: "Auto Resolved" },
  RESOLVED:      { c: "#22c55e", bg: "rgba(34,197,94,0.12)",   label: "Resolved" },
};

const CHART_DATA = [
  { type: "Ghost",      count: 3, color: "#ef4444" },
  { type: "Surge",      count: 5, color: "#f59e0b" },
  { type: "Stagnation", count: 7, color: "#3b82f6" },
  { type: "Mismatch",   count: 2, color: "#8b5cf6" },
  { type: "Deviation",  count: 4, color: "#f59e0b" },
  { type: "Rejection",  count: 2, color: "#fb923c" },
];

const TREND_DATA = [
  { t: "Mon", v: 4 }, { t: "Tue", v: 7 }, { t: "Wed", v: 5 },
  { t: "Thu", v: 9 }, { t: "Fri", v: 6 }, { t: "Sat", v: 11 }, { t: "Sun", v: 8 },
];

// ─── Hooks ─────────────────────────────────────────────────────────────────────
function useTypewriter(text, speed = 18) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed("");
    if (!text) return;
    let i = 0;
    const id = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text]);
  return displayed;
}

// ─── Components ───────────────────────────────────────────────────────────────
function StatCard({ label, value, color, icon: Icon, trend }) {
  const [show, setShow] = useState(false);
  useEffect(() => { setTimeout(() => setShow(true), 200); }, []);
  return (
    <div style={{ flex: 1, padding: "16px 20px", borderRadius: 14, background: "rgba(255,255,255,0.025)", border: `1px solid ${color}22`, opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(8px)", transition: "all 0.5s ease", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${color},transparent)` }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: "0.08em", marginBottom: 8 }}>{label}</div>
          <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: "'Syne',sans-serif", lineHeight: 1 }}>{value}</div>
        </div>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}15`, border: `1px solid ${color}25`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={16} color={color} />
        </div>
      </div>
      {trend && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 10 }}>
          <ArrowUpRight size={11} color={color} />
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{trend}</span>
        </div>
      )}
    </div>
  );
}

function ScanLine() {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", borderRadius: "inherit" }}>
      <div style={{ position: "absolute", left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,rgba(34,197,94,0.3),transparent)", animation: "scanline 3s linear infinite" }} />
      <style>{`@keyframes scanline{0%{top:0}100%{top:100%}}`}</style>
    </div>
  );
}

function ConfidenceMeter({ value, animate = false }) {
  const [w, setW] = useState(0);
  useEffect(() => { setTimeout(() => setW(value), animate ? 300 : 0); }, [value, animate]);
  const color = value > 90 ? "#ef4444" : value > 75 ? "#f59e0b" : "#22c55e";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ width: `${w}%`, height: "100%", borderRadius: 99, background: `linear-gradient(90deg,#3b82f6,${color})`, transition: "width 1.4s cubic-bezier(0.4,0,0.2,1)", boxShadow: `0 0 10px ${color}60` }} />
      </div>
      <span style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Syne',sans-serif", color, minWidth: 48, textAlign: "right" }}>{value}%</span>
    </div>
  );
}

function TypewriterText({ text, loading }) {
  const displayed = useTypewriter(loading ? "" : (text || ""), 14);
  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ display: "flex", gap: 4 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", animation: `dotPulse 1.2s ease-in-out ${i*0.2}s infinite` }} />
        ))}
      </div>
      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>llama3.1 thinking…</span>
      <style>{`@keyframes dotPulse{0%,80%,100%{opacity:.2;transform:scale(.8)}40%{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
  return (
    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.72)", lineHeight: 1.75, fontFamily: "'DM Mono',monospace", whiteSpace: "pre-wrap" }}>
      {displayed}
      {text && displayed.length < text.length && (
        <span style={{ borderRight: "2px solid #22c55e", animation: "blink 0.7s step-end infinite" }}>
          <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
        </span>
      )}
    </p>
  );
}

function AnomalyRow({ item, idx, isSelected, onClick }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), idx * 55 + 100); }, [idx]);
  const meta = TYPE_META[item.type] || { icon: AlertTriangle, color: "#6b7280", label: item.type };
  const Icon = meta.icon;
  const sc = STATUS_CFG[item.status];

  return (
    <div onClick={onClick}
      style={{ opacity: visible ? 1 : 0, transform: visible ? "translateX(0)" : "translateX(-16px)", transition: "opacity 0.45s ease, transform 0.45s ease", display: "grid", gridTemplateColumns: "8px 40px 1fr auto auto auto", alignItems: "center", gap: 14, padding: "13px 16px", borderRadius: 12, marginBottom: 5, cursor: "pointer", background: isSelected ? `${meta.color}09` : "rgba(255,255,255,0.018)", border: isSelected ? `1px solid ${meta.color}40` : "1px solid rgba(255,255,255,0.055)", position: "relative", overflow: "hidden" }}
      onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.background = "rgba(255,255,255,0.035)"; e.currentTarget.style.borderColor = `${meta.color}30`; e.currentTarget.style.transform = "translateX(2px)"; } }}
      onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.background = "rgba(255,255,255,0.018)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.055)"; e.currentTarget.style.transform = "translateX(0)"; } }}>
      <div style={{ width: 3, height: 28, borderRadius: 99, background: SEV_COLOR[item.severity], boxShadow: `0 0 8px ${SEV_COLOR[item.severity]}80` }} />
      <div style={{ width: 36, height: 36, borderRadius: 9, background: `${meta.color}12`, border: `1px solid ${meta.color}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={15} color={meta.color} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
          <span style={{ fontSize: 10, color: meta.color, fontWeight: 700, letterSpacing: "0.06em" }}>{meta.label}</span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.22)", fontFamily: "'DM Mono',monospace" }}>{item.id}</span>
          {item.loadingAI && <span style={{ fontSize: 9, color: "#22c55e", animation: "pulse 1.5s infinite" }}>◉ AI</span>}
        </div>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.68)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "48ch" }}>{item.message}</p>
        <div style={{ display: "flex", gap: 10, marginTop: 3 }}>
          {item.zone && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>📍 {item.zone}</span>}
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.22)" }}>{item.time}</span>
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: 17, fontWeight: 800, fontFamily: "'Syne',sans-serif", color: item.confidence > 90 ? "#ef4444" : item.confidence > 75 ? "#f59e0b" : "#22c55e" }}>{item.confidence}%</div>
        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.28)" }}>ML score</div>
      </div>
      <div style={{ padding: "3px 10px", borderRadius: 99, fontSize: 10, fontWeight: 600, background: sc.bg, color: sc.c, border: `1px solid ${sc.c}30`, flexShrink: 0 }}>{sc.label}</div>
      <div style={{ padding: "3px 10px", borderRadius: 99, fontSize: 10, fontWeight: 700, background: `${SEV_COLOR[item.severity]}12`, color: SEV_COLOR[item.severity], border: `1px solid ${SEV_COLOR[item.severity]}28`, flexShrink: 0, letterSpacing: "0.04em" }}>{item.severity}</div>
    </div>
  );
}

function DetailPanel({ item, onClose, onStatusUpdate }) {
  const meta = TYPE_META[item.type] || { icon: AlertTriangle, color: "#6b7280" };
  const Icon = meta.icon;
  const sc = STATUS_CFG[item.status];
  const [resolving, setResolving] = useState(false);
  const [resolved,  setResolved]  = useState(item.status === "RESOLVED");

  const handleResolve = () => {
    setResolving(true);
    setTimeout(() => { setResolving(false); setResolved(true); onStatusUpdate?.(item.id, "RESOLVED"); }, 1600);
  };

  return (
    <div style={{ width: 380, background: "#060e09", borderLeft: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", animation: "slideIn 0.3s cubic-bezier(0.4,0,0.2,1)" }}>
      <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}} @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: `${meta.color}07`, flexShrink: 0, position: "relative" }}>
        <ScanLine />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${meta.color}16`, border: `1px solid ${meta.color}28`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={17} color={meta.color} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: meta.color, fontWeight: 700, letterSpacing: "0.07em" }}>{meta.label || item.type.replace(/_/g, " ")}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "'DM Mono',monospace" }}>{item.id}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", padding: 7, borderRadius: 8, color: "rgba(255,255,255,0.45)", display: "flex" }}>
            <X size={13} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
        {/* Status badges */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <span style={{ padding: "4px 12px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: `${SEV_COLOR[item.severity]}14`, color: SEV_COLOR[item.severity], border: `1px solid ${SEV_COLOR[item.severity]}28` }}>{item.severity}</span>
          <span style={{ padding: "4px 12px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.c, border: `1px solid ${sc.c}28` }}>{sc.label}</span>
        </div>

        {/* ML score */}
        <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
            <Cpu size={13} color="#3b82f6" />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>Isolation Forest Score</span>
          </div>
          <ConfidenceMeter value={item.confidence} animate />
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", marginTop: 8, fontFamily: "'DM Mono',monospace" }}>{item.model}</div>
        </div>

        {/* Features */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 8 }}>DETECTION FEATURES</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
            {item.features.map(f => (
              <div key={f.label} style={{ padding: "10px 12px", borderRadius: 10, background: f.flag ? "rgba(239,68,68,0.07)" : "rgba(255,255,255,0.025)", border: f.flag ? "1px solid rgba(239,68,68,0.18)" : "1px solid rgba(255,255,255,0.055)" }}>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", marginBottom: 3 }}>{f.label}</div>
                <div style={{ fontSize: 14, fontWeight: 800, fontFamily: "'Syne',sans-serif", color: f.flag ? "#ef4444" : "#e8e8e8" }}>{f.val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Technical detail */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 8 }}>TECHNICAL DETAIL</div>
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.055)", borderRadius: 10, padding: "11px 13px" }}>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}>{item.detail}</p>
          </div>
        </div>

        {/* Entities */}
        {(item.truck || item.worker || item.contractor) && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 8 }}>ENTITIES</div>
            {[
              item.truck      && { icon: TruckIcon,  label: "Truck",      val: item.truck      },
              item.worker     && { icon: User,        label: "Worker",     val: item.worker     },
              item.contractor && { icon: Building2,   label: "Contractor", val: item.contractor },
            ].filter(Boolean).map(e => (
              <div key={e.label} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 11px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, marginBottom: 5 }}>
                <e.icon size={12} color="rgba(255,255,255,0.35)" />
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{e.label}</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", fontWeight: 600, marginLeft: "auto" }}>{e.val}</span>
              </div>
            ))}
          </div>
        )}

        {/* AI suggestion */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <Terminal size={11} color="#22c55e" />
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 700, letterSpacing: "0.08em" }}>LLAMA 3.1 ANALYSIS</span>
            {item.loadingAI && (
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", animation: "pulse 1s infinite" }} />
                <span style={{ fontSize: 9, color: "#22c55e" }}>live</span>
              </div>
            )}
          </div>
          <div style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.18)", borderRadius: 10, padding: "12px 14px", minHeight: 72 }}>
            <TypewriterText text={item.suggestedAction} loading={item.loadingAI} />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button onClick={handleResolve} disabled={resolving || resolved}
            style={{ padding: "11px 0", borderRadius: 10, border: "none", background: resolved ? "rgba(34,197,94,0.18)" : "linear-gradient(135deg,#22c55e,#16a34a)", color: resolved ? "#22c55e" : "#fff", fontSize: 12, fontWeight: 700, cursor: resolved ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: resolving ? 0.7 : 1, transition: "all 0.25s", boxShadow: resolved ? "none" : "0 4px 20px rgba(34,197,94,0.25)" }}>
            {resolving ? <><RotateCcw size={13} style={{ animation: "spin 0.8s linear infinite" }} /> Processing…</>
              : resolved ? <><CheckCircle size={13} /> Marked as Resolved</>
              : <><CheckCircle size={13} /> Mark as Resolved</>}
          </button>
          <button style={{ padding: "10px 0", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <ExternalLink size={12} /> View on Map
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function AnomalyCenter() {
  const [mounted,       setMounted]       = useState(false);
  const [anomalies,     setAnomalies]     = useState([]);
  const [selected,      setSelected]      = useState(null);
  const [sevFilter,     setSevFilter]     = useState("ALL");
  const [statusFilter,  setStatusFilter]  = useState("ALL");
  const [backendOk,     setBackendOk]     = useState(null);

  useEffect(() => { setTimeout(() => setMounted(true), 80); }, []);

  // Health check against /ml/health
  useEffect(() => {
    const check = (attempt = 0) => {
      fetch(`${API_BASE}/ml/health`, { signal: AbortSignal.timeout(4000) })
        .then(r => { setBackendOk(r.status < 500); })
        .catch(() => {
          if (attempt === 0) setTimeout(() => check(1), 2000);
          else setBackendOk(false);
        });
    };
    check();
  }, []);

  useEffect(() => {
    const base = INITIAL_ANOMALIES.map(a => ({ ...a, suggestedAction: null, loadingAI: true }));
    setAnomalies(base);

    // ML scores — parallel (fast)
    base.forEach(async (a) => {
      const result = await fetchMLScore(a);
      if (result?.confidence_pct) {
        setAnomalies(prev => prev.map(x => x.id === a.id ? { ...x, confidence: result.confidence_pct } : x));
      }
    });

    // AI suggestions — sequential (Ollama can't handle parallel LLM calls well)
    (async () => {
      for (const a of base) {
        const suggestion = await fetchAISuggestion(a.message);
        setAnomalies(prev => prev.map(x => x.id === a.id ? { ...x, suggestedAction: suggestion, loadingAI: false } : x));
        setSelected(s => s?.id === a.id ? { ...s, suggestedAction: suggestion, loadingAI: false } : s);
      }
    })();
  }, []);

  const handleStatusUpdate = useCallback((id, newStatus) => {
    setAnomalies(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    setSelected(s => s?.id === id ? { ...s, status: newStatus } : s);
  }, []);

  const handleSelect = useCallback((item) => {
    setSelected(s => s?.id === item.id ? null : item);
  }, []);

  const filtered    = anomalies.filter(a => (sevFilter === "ALL" || a.severity === sevFilter) && (statusFilter === "ALL" || a.status === statusFilter));
  const openCount   = anomalies.filter(a => a.status === "OPEN").length;
  const highCount   = anomalies.filter(a => a.severity === "HIGH").length;
  const avgConf     = anomalies.length ? (anomalies.reduce((s, a) => s + a.confidence, 0) / anomalies.length).toFixed(1) : "—";
  const aiReady     = anomalies.filter(a => !a.loadingAI).length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:3px; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.07); border-radius:99px; }
        @keyframes pulse   { 0%,100%{opacity:1}50%{opacity:0.25} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)} }
        @keyframes glow    { 0%,100%{box-shadow:0 0 12px rgba(239,68,68,0.4)}50%{box-shadow:0 0 24px rgba(239,68,68,0.7)} }
      `}</style>

      <div style={{ height: "100vh", overflow: "hidden", background: "linear-gradient(135deg,#060e09 0%,#08101a 55%,#060c18 100%)", fontFamily: "'DM Sans',sans-serif", color: "#fff", opacity: mounted ? 1 : 0, transition: "opacity 0.5s ease", display: "flex", flexDirection: "column", position: "relative" }}>
        {/* Atmosphere */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
          <div style={{ position: "absolute", top: "-10%", left: "-5%", width: 600, height: 600, background: "radial-gradient(circle,rgba(239,68,68,0.04) 0%,transparent 60%)", borderRadius: "50%" }} />
          <div style={{ position: "absolute", bottom: "0%", right: "10%", width: 700, height: 700, background: "radial-gradient(circle,rgba(59,130,246,0.04) 0%,transparent 60%)", borderRadius: "50%" }} />
          <div style={{ position: "absolute", inset: 0, opacity: 0.015, backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
        </div>

        <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Top bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", height: 60, flexShrink: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.055)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", animation: "glow 2s ease-in-out infinite" }} />
              <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, letterSpacing: "-0.025em" }}>
                Anomaly <span style={{ background: "linear-gradient(90deg,#ef4444,#f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Center</span>
              </h1>
              <div style={{ padding: "3px 10px", borderRadius: 6, fontSize: 10, fontWeight: 600, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", fontFamily: "'DM Mono',monospace" }}>
                LIVE · {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 99, background: backendOk === true ? "rgba(34,197,94,0.08)" : backendOk === false ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.05)", border: `1px solid ${backendOk === true ? "rgba(34,197,94,0.2)" : backendOk === false ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.08)"}` }}>
                {backendOk === true ? <Wifi size={11} color="#22c55e" /> : backendOk === false ? <WifiOff size={11} color="#ef4444" /> : <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b", animation: "pulse 1s infinite" }} />}
                <span style={{ fontSize: 10, fontWeight: 600, color: backendOk === true ? "#22c55e" : backendOk === false ? "#ef4444" : "#f59e0b" }}>
                  {backendOk === true ? "Backend Online" : backendOk === false ? "Backend Offline" : "Checking…"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 99, background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.18)" }}>
                <Brain size={11} color="#22c55e" />
                <span style={{ fontSize: 10, color: "#22c55e", fontWeight: 600 }}>llama3.1 · {aiReady}/{anomalies.length}</span>
              </div>
            </div>
          </div>

          {/* Body */}
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            {/* Left column */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
              {/* Stat cards */}
              <div style={{ display: "flex", gap: 12, padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
                <StatCard label="OPEN ANOMALIES"   value={openCount}          color="#ef4444" icon={AlertTriangle} trend="↑2 from yesterday" />
                <StatCard label="HIGH SEVERITY"     value={highCount}          color="#f59e0b" icon={Zap}          trend="Needs attention"   />
                <StatCard label="AVG ML CONFIDENCE" value={`${avgConf}%`}      color="#3b82f6" icon={Cpu}          trend="Isolation Forest"  />
                <StatCard label="AI ANALYSED"       value={`${aiReady}/${anomalies.length}`} color="#22c55e" icon={Brain} trend="llama3.1 running" />
                <div style={{ width: 200, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "12px 14px" }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 600, marginBottom: 8 }}>7-DAY TREND</div>
                  <ResponsiveContainer width="100%" height={60}>
                    <AreaChart data={TREND_DATA}>
                      <defs>
                        <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="v" stroke="#ef4444" fill="url(#tg)" strokeWidth={1.5} dot={false} />
                      <XAxis dataKey="t" hide />
                      <Tooltip contentStyle={{ background: "#0a1628", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "#fff", fontSize: 10 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Filters */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", padding: "10px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", flexShrink: 0 }}>
                <Filter size={12} color="rgba(255,255,255,0.35)" />
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 700, letterSpacing: "0.07em", marginRight: 4 }}>SEVERITY</span>
                {["ALL","HIGH","MEDIUM","LOW"].map(s => {
                  const active = sevFilter === s;
                  const c = s==="HIGH" ? "#ef4444" : s==="MEDIUM" ? "#f59e0b" : s==="LOW" ? "#22c55e" : "#fff";
                  return <button key={s} onClick={() => setSevFilter(s)} style={{ padding: "4px 12px", borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: "pointer", border: active ? `1px solid ${c}45` : "1px solid rgba(255,255,255,0.07)", background: active ? `${c}15` : "rgba(255,255,255,0.03)", color: active ? c : "rgba(255,255,255,0.4)", transition: "all 0.18s" }}>{s}</button>;
                })}
                <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.08)", margin: "0 4px" }} />
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 700, letterSpacing: "0.07em", marginRight: 4 }}>STATUS</span>
                {["ALL","OPEN","REVIEWING","RESOLVED"].map(s => {
                  const active = statusFilter === s;
                  return <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: "4px 12px", borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: "pointer", border: active ? "1px solid rgba(59,130,246,0.4)" : "1px solid rgba(255,255,255,0.07)", background: active ? "rgba(59,130,246,0.14)" : "rgba(255,255,255,0.03)", color: active ? "#3b82f6" : "rgba(255,255,255,0.4)", transition: "all 0.18s" }}>{s}</button>;
                })}
                <span style={{ marginLeft: "auto", fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "'DM Mono',monospace" }}>{filtered.length}/{anomalies.length}</span>
              </div>

              {/* List */}
              <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
                {filtered.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.25)", fontSize: 13 }}>
                    <CheckCircle size={36} color="rgba(34,197,94,0.25)" style={{ margin: "0 auto 10px", display: "block" }} />
                    No anomalies match these filters
                  </div>
                ) : (
                  filtered.map((item, i) => (
                    <AnomalyRow key={item.id} item={item} idx={i} isSelected={selected?.id === item.id} onClick={() => handleSelect(item)} />
                  ))
                )}
              </div>
            </div>

            {/* Right: detail panel or chart sidebar */}
            {selected ? (
              <DetailPanel item={selected} onClose={() => setSelected(null)} onStatusUpdate={handleStatusUpdate} />
            ) : (
              <div style={{ width: 260, padding: "20px 16px", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 16px" }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: "0.07em", marginBottom: 12 }}>ANOMALIES BY TYPE</div>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={CHART_DATA} barSize={14} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="type" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} width={70} />
                      <Tooltip contentStyle={{ background: "#08101a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11 }} />
                      <Bar dataKey="count" radius={[0,4,4,0]}>
                        {CHART_DATA.map((e, i) => <Cell key={i} fill={e.color} fillOpacity={0.8} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 16px" }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: "0.07em", marginBottom: 12 }}>STATUS BREAKDOWN</div>
                  {["OPEN","REVIEWING","AUTO_RESOLVED","RESOLVED"].map(s => {
                    const c = STATUS_CFG[s].c;
                    const cnt = anomalies.filter(a => a.status === s).length;
                    const pct = anomalies.length ? (cnt/anomalies.length)*100 : 0;
                    return (
                      <div key={s} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)" }}>{STATUS_CFG[s].label}</span>
                          <span style={{ fontSize: 10, color: c, fontWeight: 700 }}>{cnt}</span>
                        </div>
                        <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 99 }}>
                          <div style={{ width: `${pct}%`, height: "100%", borderRadius: 99, background: c, transition: "width 1s ease" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 16px" }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: "0.07em", marginBottom: 10 }}>ML MODELS ACTIVE</div>
                  {[
                    { name: "Isolation Forest", color: "#3b82f6", count: "3 types" },
                    { name: "Rule Engine",       color: "#f59e0b", count: "2 types" },
                    { name: "Cron Engine",       color: "#6b7280", count: "1 type"  },
                    { name: "llama3.1 (Ollama)", color: "#22c55e", count: "all"     },
                  ].map(m => (
                    <div key={m.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: m.color, boxShadow: `0 0 5px ${m.color}` }} />
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", flex: 1 }}>{m.name}</span>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{m.count}</span>
                    </div>
                  ))}
                </div>

                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", textAlign: "center", lineHeight: 1.6, marginTop: "auto" }}>
                  Click any anomaly<br />to see details + AI analysis
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}