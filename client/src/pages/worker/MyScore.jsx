import { useEffect, useState } from "react";

const METRIC_INFO = {
  route_completion: { label: "Route Completion", max: 100, unit: "%",  good: 85, warn: 65 },
  citizen_rating:   { label: "Citizen Rating",   max: 5,   unit: "/5", good: 4.0, warn: 3.0 },
  rejection_rate:   { label: "Rejection Rate",   max: 100, unit: "%",  good: 15, warn: 30, inverse: true },
  attendance:       { label: "Attendance",       max: 100, unit: "%",  good: 85, warn: 70 },
};

function scoreColor(pct, inverse = false) {
  const v = inverse ? 100 - pct : pct;
  if (v >= 70) return "#4ade80";
  if (v >= 40) return "#facc15";
  return "#f87171";
}

function metricColor(key, value) {
  const info = METRIC_INFO[key];
  if (!info) return "#4ade80";
  const pct = (value / info.max) * 100;
  if (info.inverse) {
    if (pct <= info.good) return "#4ade80";
    if (pct <= info.warn) return "#facc15";
    return "#f87171";
  }
  if (pct >= (info.good / info.max) * 100) return "#4ade80";
  if (pct >= (info.warn / info.max) * 100) return "#facc15";
  return "#f87171";
}

function Counter({ target, decimals = 0, delay = 0 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      let start = 0;
      const dur = 900;
      const step = 16;
      const inc = target / (dur / step);
      const interval = setInterval(() => {
        start = Math.min(start + inc, target);
        setVal(parseFloat(start.toFixed(decimals)));
        if (start >= target) clearInterval(interval);
      }, step);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(t);
  }, [target, delay]);
  return <>{val.toFixed(decimals)}</>;
}

function RingGauge({ score, animating }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const [dash, setDash] = useState(0);
  const color = scoreColor(score);

  useEffect(() => {
    const t = setTimeout(() => setDash((score / 100) * circ), 200);
    return () => clearTimeout(t);
  }, [score]);

  const grade = score >= 80 ? "A" : score >= 60 ? "B" : score >= 40 ? "C" : "D";

  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      {/* Outer glow ring */}
      <div style={{ position: "absolute", width: 148, height: 148, borderRadius: "50%",
        background: `radial-gradient(circle, ${color}0a 0%, transparent 70%)`,
        animation: "glowPulse 2.5s ease-in-out infinite" }} />
      <svg width={140} height={140}>
        {/* Track */}
        <circle cx={70} cy={70} r={r} fill="none" stroke="#141414" strokeWidth={9} />
        {/* Tick marks */}
        {Array.from({ length: 20 }).map((_, i) => {
          const angle = (i / 20) * 360 - 90;
          const rad = (angle * Math.PI) / 180;
          const x1 = 70 + (r - 2) * Math.cos(rad);
          const y1 = 70 + (r - 2) * Math.sin(rad);
          const x2 = 70 + (r + 4) * Math.cos(rad);
          const y2 = 70 + (r + 4) * Math.sin(rad);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1a1a1a" strokeWidth={1} />;
        })}
        {/* Progress */}
        <circle cx={70} cy={70} r={r} fill="none" stroke={color} strokeWidth={9}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="butt"
          transform="rotate(-90 70 70)"
          style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1), stroke 0.5s ease",
            filter: `drop-shadow(0 0 6px ${color}88)` }} />
        {/* Score number */}
        <text x={70} y={62} textAnchor="middle" fill={color} fontSize={30} fontWeight="bold"
          fontFamily="'Bebas Neue', monospace" letterSpacing={2}>{score}</text>
        <text x={70} y={78} textAnchor="middle" fill="#2a2a2a" fontSize={10}
          fontFamily="'DM Mono', monospace" letterSpacing={2}>/ 100</text>
        <text x={70} y={92} textAnchor="middle" fill={color} fontSize={11}
          fontFamily="'Bebas Neue'" letterSpacing={3}>{grade} GRADE</text>
      </svg>
    </div>
  );
}

export default function MyScore() {
  const [loaded, setLoaded] = useState(false);
  const [worker, setWorker] = useState(null);
  const [history, setHistory] = useState([]);
  const [hoveredBar, setHoveredBar] = useState(null);

  useEffect(() => {
    setTimeout(() => {
      setWorker({
        credibility_score: 72,
        projected_payout: 18500,
        route_completion_pct: 82,
        avg_citizen_rating: 4.2,
        clearance_rejection_pct: 12,
        attendance_score: 90,
        anomaly_count: 1,
        name: "Ravi Kumar",
        rank: 4,
        rank_total: 18,
      });
      setHistory(Array.from({ length: 30 }, (_, i) => ({
        score: Math.max(30, Math.min(98, 55 + Math.sin(i / 4) * 18 + (i > 20 ? 10 : 0) + Math.random() * 8)),
        date: new Date(Date.now() - (29 - i) * 86400000).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      })));
      setLoaded(false);
      setTimeout(() => setLoaded(true), 50);
    }, 500);
  }, []);

  if (!worker) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
      height: "60vh", fontFamily: "'DM Mono', monospace" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Bebas+Neue&display=swap');
        @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
      <div style={{ width: 20, height: 20, border: "2px solid #1f1f1f",
        borderTopColor: "#4ade80", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  const score = worker.credibility_score;
  const color = scoreColor(score);
  const maxH = Math.max(...history.map(h => h.score));
  const minH = Math.min(...history.map(h => h.score));

  const metrics = [
    { key: "route_completion", value: worker.route_completion_pct },
    { key: "citizen_rating",   value: worker.avg_citizen_rating   },
    { key: "rejection_rate",   value: worker.clearance_rejection_pct },
    { key: "attendance",       value: worker.attendance_score     },
  ];

  return (
    <div style={{ padding: "28px 20px", maxWidth: 680, margin: "0 auto",
      fontFamily: "'DM Mono', monospace", color: "#e8e8e0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Bebas+Neue&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glowPulse { 0%,100%{opacity:0.4;transform:scale(1)} 50%{opacity:0.8;transform:scale(1.05)} }
        @keyframes barGrow { from{height:0} to{height:var(--target-h)} }
        @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        .metric-card { transition: all 0.2s; }
        .metric-card:hover { border-color: #2a2a2a !important; transform: translateY(-2px); }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 28, animation: "fadeUp 0.4s ease" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{ width: 3, height: 28, background: color, borderRadius: 2 }} />
          <div style={{ fontFamily: "'Bebas Neue'", fontSize: 34, letterSpacing: 4, color: "#e8e8e0" }}>
            MY PERFORMANCE
          </div>
        </div>
        <div style={{ fontSize: 10, color: "#333", letterSpacing: 2.5, marginLeft: 13 }}>
          CREDIBILITY & EARNINGS DASHBOARD
        </div>
      </div>

      {/* Score + earnings */}
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 20,
        background: "#0a0a0a", border: "1px solid #1a1a1a", borderLeft: `3px solid ${color}`,
        padding: "24px", borderRadius: "0 8px 8px 0", marginBottom: 20,
        animation: "fadeUp 0.4s ease 0.05s both" }}>
        <RingGauge score={score} />

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 16 }}>
          {/* Rank */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ background: "#111", border: "1px solid #1a1a1a",
              padding: "6px 14px", borderRadius: 4 }}>
              <div style={{ fontSize: 8, color: "#444", letterSpacing: 2 }}>TEAM RANK</div>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 22, color: color, letterSpacing: 2 }}>
                #{worker.rank} <span style={{ fontSize: 13, color: "#333" }}>/ {worker.rank_total}</span>
              </div>
            </div>
            <div style={{ background: "#111", border: "1px solid #1a1a1a",
              padding: "6px 14px", borderRadius: 4 }}>
              <div style={{ fontSize: 8, color: "#444", letterSpacing: 2 }}>ANOMALIES</div>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 22,
                color: worker.anomaly_count > 0 ? "#f87171" : "#4ade80", letterSpacing: 2 }}>
                {worker.anomaly_count}
              </div>
            </div>
          </div>

          {/* Earnings */}
          <div style={{ background: "rgba(96,165,250,0.05)", border: "1px solid rgba(96,165,250,0.15)",
            padding: "12px 16px", borderRadius: 6 }}>
            <div style={{ fontSize: 8, color: "#555", letterSpacing: 2, marginBottom: 4 }}>
              PROJECTED EARNINGS THIS CYCLE
            </div>
            <div style={{ fontFamily: "'Bebas Neue'", fontSize: 32, color: "#60a5fa", letterSpacing: 2 }}>
              ₹<Counter target={worker.projected_payout} delay={400} />
            </div>
            <div style={{ fontSize: 9, color: "#1e3a5f", marginTop: 4, letterSpacing: 1 }}>
              BASE + PERFORMANCE BONUS · SCORE-LINKED
            </div>
          </div>

          {/* Score trend pill */}
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ fontSize: 9, background: score >= 70 ? "rgba(74,222,128,0.08)" : "rgba(250,204,21,0.08)",
              border: `1px solid ${color}30`, color, padding: "4px 12px", borderRadius: 20,
              letterSpacing: 1.5 }}>
              ↑ +4 pts from last month
            </div>
          </div>
        </div>
      </div>

      {/* Metrics grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10,
        marginBottom: 20, animation: "fadeUp 0.4s ease 0.1s both" }}>
        {metrics.map(({ key, value }, i) => {
          const info = METRIC_INFO[key];
          const pct  = (value / info.max) * 100;
          const mc   = metricColor(key, value);
          const barW = info.inverse ? (100 - pct) : pct;
          const status = info.inverse
            ? (pct <= info.good ? "GOOD" : pct <= info.warn ? "WATCH" : "FLAG")
            : (pct >= (info.good / info.max * 100) ? "GOOD" : pct >= (info.warn / info.max * 100) ? "WATCH" : "FLAG");

          return (
            <div key={key} className="metric-card" style={{
              background: "#0a0a0a", border: "1px solid #141414",
              padding: "16px", borderRadius: 6,
              animation: `fadeUp 0.4s ease ${0.1 + i * 0.05}s both`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 9, color: "#444", letterSpacing: 2 }}>{info.label.toUpperCase()}</span>
                <span style={{ fontSize: 8, color: mc, background: `${mc}14`,
                  border: `1px solid ${mc}25`, padding: "2px 7px", borderRadius: 20,
                  letterSpacing: 1.5 }}>{status}</span>
              </div>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 30, color: mc,
                letterSpacing: 2, lineHeight: 0.9, marginBottom: 10 }}>
                <Counter target={value} decimals={key === "citizen_rating" ? 1 : 0} delay={200 + i * 50} />
                <span style={{ fontSize: 14, color: "#333", letterSpacing: 1 }}>{info.unit}</span>
              </div>
              <div style={{ height: 4, background: "#111", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ width: `${barW}%`, height: "100%", borderRadius: 99,
                  background: mc, transition: "width 1s cubic-bezier(0.4,0,0.2,1)",
                  boxShadow: `0 0 6px ${mc}44` }} />
              </div>
              {info.good && (
                <div style={{ fontSize: 8, color: "#2a2a2a", marginTop: 6, letterSpacing: 1 }}>
                  TARGET: {info.good}{info.unit}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 30-day history */}
      <div style={{ background: "#0a0a0a", border: "1px solid #141414", padding: "20px",
        borderRadius: 8, marginBottom: 16, animation: "fadeUp 0.4s ease 0.2s both" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 9, color: "#444", letterSpacing: 3 }}>SCORE HISTORY</div>
            <div style={{ fontSize: 10, color: "#2a2a2a", marginTop: 2 }}>LAST 30 DAYS</div>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 8, color: "#333", letterSpacing: 1.5 }}>PEAK</div>
              <div style={{ fontSize: 13, color: "#4ade80", fontFamily: "'Bebas Neue'" }}>
                {Math.round(maxH)}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 8, color: "#333", letterSpacing: 1.5 }}>LOW</div>
              <div style={{ fontSize: 13, color: "#f87171", fontFamily: "'Bebas Neue'" }}>
                {Math.round(minH)}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 88,
          position: "relative" }}>
          {/* Reference lines */}
          {[70, 50].map(threshold => {
            const y = 88 - ((threshold - minH) / (maxH - minH)) * 88;
            return (
              <div key={threshold} style={{
                position: "absolute", left: 0, right: 0, top: y,
                height: 1, background: "#141414", pointerEvents: "none",
              }}>
                <span style={{ position: "absolute", right: 0, top: -8, fontSize: 8,
                  color: "#222", letterSpacing: 1 }}>{threshold}</span>
              </div>
            );
          })}

          {history.map((h, i) => {
            const pct = (h.score - minH) / (maxH - minH);
            const barH = Math.max(4, pct * 80);
            const c = scoreColor(h.score);
            const isHovered = hoveredBar === i;

            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "flex-end", height: "100%",
                cursor: "pointer" }}
                onMouseEnter={() => setHoveredBar(i)}
                onMouseLeave={() => setHoveredBar(null)}>
                {isHovered && (
                  <div style={{ position: "absolute", bottom: 96, background: "#111",
                    border: "1px solid #2a2a2a", padding: "4px 8px", borderRadius: 4,
                    fontSize: 9, color: "#e8e8e0", whiteSpace: "nowrap", zIndex: 10,
                    pointerEvents: "none" }}>
                    {Math.round(h.score)} · {h.date}
                  </div>
                )}
                <div style={{
                  width: "100%", height: barH,
                  background: isHovered ? c : i === history.length - 1 ? c : `${c}66`,
                  borderRadius: "2px 2px 0 0",
                  transition: "height 0.6s cubic-bezier(0.4,0,0.2,1), background 0.15s",
                  transitionDelay: `${i * 15}ms`,
                  boxShadow: isHovered ? `0 0 8px ${c}66` : "none",
                }} />
              </div>
            );
          })}
        </div>

        {/* X axis labels */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          {[0, 10, 20, 29].map(i => (
            <span key={i} style={{ fontSize: 8, color: "#2a2a2a" }}>
              {history[i]?.date}
            </span>
          ))}
        </div>
      </div>

      {/* Warning banner */}
      {worker.anomaly_count > 0 && (
        <div style={{ background: "#150a0a", border: "1px solid #3a1515",
          borderLeft: "3px solid #ef4444", padding: "14px 16px", borderRadius: "0 6px 6px 0",
          display: "flex", gap: 12, alignItems: "flex-start",
          animation: "fadeUp 0.4s ease 0.25s both" }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#ef4444",
            marginTop: 3, flexShrink: 0, animation: "dotPulse 1s infinite" }} />
          <div>
            <div style={{ fontSize: 11, color: "#f87171", fontWeight: 600, marginBottom: 3 }}>
              {worker.anomaly_count} OPEN ISSUE{worker.anomaly_count > 1 ? "S" : ""}
            </div>
            <div style={{ fontSize: 10, color: "#7f1d1d", lineHeight: 1.6 }}>
              Unresolved anomalies are reducing your score. Resolve them to recover points and improve your projected earnings.
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes dotPulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  );
}