// WeeklyReport.jsx
import { useState, useEffect } from "react";
import { FileText, Zap, Download, RefreshCw, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Users, Package, Building2, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

const WEEKLY_DATA = [
  { day: "Mon", collected: 420, complaints: 12, resolved: 10 },
  { day: "Tue", collected: 480, complaints: 8,  resolved: 8  },
  { day: "Wed", collected: 310, complaints: 18, resolved: 14 },
  { day: "Thu", collected: 560, complaints: 6,  resolved: 6  },
  { day: "Fri", collected: 490, complaints: 9,  resolved: 7  },
  { day: "Sat", collected: 380, complaints: 15, resolved: 11 },
  { day: "Sun", collected: 290, complaints: 4,  resolved: 4  },
];

const CONTRACTOR_PERF = [
  { name: "GreenWave Pvt",  score: 94, batches: 81,  complaints: 1,  color: "#22c55e" },
  { name: "CleanCity Corp", score: 87, batches: 86,  complaints: 5,  color: "#3b82f6" },
  { name: "EcoFirst Ltd",   score: 61, batches: 80,  complaints: 13, color: "#f59e0b" },
  { name: "WasteKare Inc",  score: 53, batches: 27,  complaints: 7,  color: "#ef4444" },
];

const WASTE_MIX = [
  { name: "Mixed Waste",  value: 38, color: "#8b5cf6" },
  { name: "Dry Waste",    value: 28, color: "#3b82f6" },
  { name: "Wet Waste",    value: 22, color: "#22c55e" },
  { name: "Recyclable",   value: 12, color: "#f59e0b" },
];

const AI_REPORT = `This week, WasteTrack managed 2,930 tonnes of waste across 8 zones in Mumbai, achieving 86.4% of the weekly target — a 3.2% improvement over last week.

GreenWave Pvt continues to lead with a credibility score of 94, maintaining zero complaint escalations across Bandra East and Malad West. CleanCity Corp performed steadily at 87.

EcoFirst Ltd remains a concern — their Kurla zone registered 9 complaints this week, with 2 Ghost Pickup anomalies and 1 Disposal Mismatch flag. Recommend a contractor review meeting before renewing their Q4 contract.

WasteKare Inc dropped below the 60-point threshold. Their Borivali North zone saw 7 unresolved complaints and 13 hours of batch stagnation on Thursday. Admin action recommended: temporary zone freeze pending performance review.

Wednesday showed the lowest collection volume (310t) due to a 4-hour GPS outage affecting route tracking. IT team resolved the issue by 2 PM. No data loss was reported.

Citizen satisfaction improved: 412 complaints were resolved with an average response time of 47 minutes, down from 68 minutes the prior week. The segregation checker flagged 23 citizen bins in Kurla — a targeted awareness campaign is recommended for that zone.`;

function TypingText({ text, speed = 12 }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone]           = useState(false);
  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const iv = setInterval(() => {
      if (i >= text.length) { clearInterval(iv); setDone(true); return; }
      setDisplayed(text.slice(0, ++i));
    }, speed);
    return () => clearInterval(iv);
  }, [text]);
  return (
    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.72)", lineHeight: 1.75, whiteSpace: "pre-line" }}>
      {displayed}
      {!done && <span style={{ animation: "blink 0.7s infinite", color: "#22c55e" }}>█</span>}
    </p>
  );
}

export default function WeeklyReport() {
  const [generating, setGenerating] = useState(false);
  const [generated,  setGenerated]  = useState(false);
  const [vis,        setVis]        = useState(false);
  useEffect(() => { setTimeout(() => setVis(true), 50); }, []);

  const handleGenerate = () => {
    setGenerating(true);
    setGenerated(false);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 2000);
  };

  const week = new Date();
  const weekStart = new Date(week.setDate(week.getDate() - week.getDay())).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1400, margin: "0 auto", opacity: vis ? 1 : 0, transition: "opacity 0.4s ease" }}>
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes slideUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 26, letterSpacing: "-0.03em" }}>
            Weekly <span style={{ background: "linear-gradient(90deg,#22c55e,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Report</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginTop: 4 }}>
            <Calendar size={12} style={{ display: "inline", marginRight: 5, verticalAlign: "middle" }} />
            Week of {weekStart} · All zones · Mumbai
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
            <Download size={13} /> Export PDF
          </button>
          <button onClick={handleGenerate} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 10, background: "linear-gradient(90deg,#22c55e,#16a34a)", border: "none", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
            <Zap size={13} style={{ animation: generating ? "spin 1s linear infinite" : "none" }} />
            {generating ? "Generating…" : "Generate AI Report"}
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { l: "Total Collected",   v: "2,930t",  sub: "+3.2% vs last week",  trend: 1,  c: "#22c55e" },
          { l: "Complaints Raised", v: "72",      sub: "60 resolved (83%)",   trend: -1, c: "#f59e0b" },
          { l: "Avg Resolution",    v: "47 min",  sub: "↓ 21 min improvement",trend: 1,  c: "#3b82f6" },
          { l: "Anomalies Flagged", v: "11",      sub: "3 critical",          trend: -1, c: "#ef4444" },
        ].map((s, i) => (
          <div key={s.l} style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${s.c}20`, borderRadius: 14, padding: "16px 18px", animation: `slideUp 0.35s ease ${i*60}ms both`, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${s.c},transparent)` }} />
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{s.l}</p>
            <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 26, color: "#fff" }}>{s.v}</p>
            <p style={{ fontSize: 11, color: s.trend > 0 ? "#22c55e" : "#ef4444", marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>
              {s.trend > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />} {s.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 18, marginBottom: 24 }}>
        {/* Collection chart */}
        <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 22 }}>
          <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Collection & Complaints</h3>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 16 }}>Tonnes collected vs complaints raised daily</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={WEEKLY_DATA} barSize={16} barGap={4}>
              <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#0d1b2a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 12 }} />
              <Bar dataKey="collected" fill="#22c55e" opacity={0.8} radius={[4,4,0,0]} />
              <Bar dataKey="complaints" fill="#ef4444" opacity={0.6} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: "#22c55e", display: "inline-block" }} />Collected (tonnes)</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: "#ef4444", display: "inline-block" }} />Complaints</span>
          </div>
        </div>

        {/* Waste mix pie */}
        <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 22 }}>
          <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Waste Mix</h3>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 14 }}>By category this week</p>
          <ResponsiveContainer width="100%" height={120}>
            <PieChart>
              <Pie data={WASTE_MIX} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" strokeWidth={0}>
                {WASTE_MIX.map((entry, i) => <Cell key={i} fill={entry.color} opacity={0.85} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#0d1b2a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 8 }}>
            {WASTE_MIX.map(w => (
              <div key={w.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: w.color, display: "inline-block" }} />{w.name}
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, color: w.color }}>{w.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contractor table */}
      <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 22, marginBottom: 24 }}>
        <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Contractor Performance</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {CONTRACTOR_PERF.map((c, i) => (
            <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 14px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", animation: `slideUp 0.35s ease ${i*50}ms both` }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: `${c.color}15`, border: `1px solid ${c.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Building2 size={16} color={c.color} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 2 }}>{c.name}</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{c.batches} batches · {c.complaints} complaints</p>
              </div>
              {/* Score bar */}
              <div style={{ width: 160 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>Credibility</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: c.color }}>{c.score}</span>
                </div>
                <div style={{ height: 4, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${c.score}%`, borderRadius: 99, background: `linear-gradient(90deg,${c.color},${c.color}aa)`, transition: "width 1s ease" }} />
                </div>
              </div>
              {c.score < 60 && (
                <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 99, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444", fontWeight: 700 }}>Review</span>
              )}
              {c.score >= 85 && (
                <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 99, background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", color: "#22c55e", fontWeight: 700 }}>Top</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* AI Report panel */}
      <div style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: 16, padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={16} color="#22c55e" />
            </div>
            <div>
              <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14 }}>AI Summary Report</h3>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Generated by Llama 3.1 · Plain English</p>
            </div>
          </div>
          {generating && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 99, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", animation: "blink 0.6s infinite" }} />
              <span style={{ fontSize: 11, color: "#22c55e", fontWeight: 600 }}>Analyzing data…</span>
            </div>
          )}
        </div>

        {!generated && !generating && (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <FileText size={32} color="rgba(255,255,255,0.15)" style={{ margin: "0 auto 12px", display: "block" }} />
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginBottom: 16 }}>Click "Generate AI Report" to create a plain-English weekly summary</p>
            <button onClick={handleGenerate} style={{ padding: "10px 24px", borderRadius: 10, background: "linear-gradient(90deg,#22c55e,#16a34a)", border: "none", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
              Generate Now →
            </button>
          </div>
        )}

        {generating && (
          <div style={{ padding: "16px 0" }}>
            {["Fetching zone performance data…", "Aggregating batch statistics…", "Analysing contractor scores…", "Composing summary…"].map((step, i) => (
              <div key={step} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", animation: `slideUp 0.3s ease ${i*300}ms both`, opacity: 0 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", animation: "blink 1s infinite" }} />
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{step}</span>
              </div>
            ))}
          </div>
        )}

        {generated && !generating && (
          <div style={{ animation: "slideUp 0.3s ease" }}>
            <TypingText text={AI_REPORT} speed={8} />
          </div>
        )}
      </div>
    </div>
  );
}