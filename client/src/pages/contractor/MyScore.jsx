import { useEffect, useState } from "react";
import { TrendingDown, AlertCircle, CheckCircle, Info } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const MOCK_DATA = {
  completion_rate: 0.84,
  avg_delay_hours: 3.2,
  anomalies_flagged: 2,
  unresolved_48h: 1,
  citizen_rating: 4.1,
};

function calcContractorScore(data) {
  let score = 100;
  score -= data.anomalies_flagged * 10;
  score -= data.avg_delay_hours * 2;
  score -= data.unresolved_48h * 15;
  if (data.completion_rate < 0.7) score -= 20;
  score += (data.citizen_rating / 5) * 10;
  return { score: Math.max(0, Math.min(100, Math.round(score))) };
}

const SCORE_HISTORY = [
  { day: "Mar 1", score: 91, note: null },
  { day: "Mar 4", score: 89, note: null },
  { day: "Mar 7", score: 85, note: "Anomaly flagged" },
  { day: "Mar 10", score: 88, note: null },
  { day: "Mar 13", score: 82, note: null },
  { day: "Mar 16", score: 79, note: "Unresolved 48h" },
  { day: "Mar 19", score: 84, note: null },
  { day: "Mar 22", score: 82, note: null },
];

function ScoreRing({ score, animated }) {
  const size = 180;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const color = score >= 75 ? "#00e676" : score >= 50 ? "#ffaa00" : "#ff4444";
  const pct = animated ? score / 100 : 0;
  const dashOffset = circ * (1 - pct);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#0a1628" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold" style={{ color, fontFamily: "'Syne', sans-serif" }}>{score}</span>
        <span className="text-xs text-slate-400 mt-1">out of 100</span>
      </div>
    </div>
  );
}

const BREAKDOWN = [
  { factor: "Pickup completion rate", value: "84%", impact: "+8 pts", positive: true },
  { factor: "Avg delay hours", value: "3.2 hrs", impact: "-6 pts", positive: false },
  { factor: "Anomalies flagged", value: "2", impact: "-20 pts", positive: false },
  { factor: "Unresolved > 48hrs", value: "1", impact: "-15 pts", positive: false },
  { factor: "Citizen satisfaction", value: "4.1/5", impact: "+8 pts", positive: true },
];

function generateTips(data) {
  const tips = [];
  if (data.anomalies_flagged > 2) tips.push({ icon: "⚠️", msg: `Reduce flagged batches — each costs 10 points (currently ${data.anomalies_flagged} flagged)` });
  if (data.avg_delay_hours > 5) tips.push({ icon: "⏱️", msg: `Improve pickup speed — delay hours costing ${(data.avg_delay_hours * 2).toFixed(0)} points` });
  if (data.completion_rate < 0.8) tips.push({ icon: "📍", msg: `Complete more assigned routes — currently at ${(data.completion_rate * 100).toFixed(0)}% (target 80%+)` });
  if (data.unresolved_48h > 0) tips.push({ icon: "🔴", msg: `Resolve overdue complaints — each unresolved >48hr costs 15 points` });
  if (tips.length === 0) tips.push({ icon: "✅", msg: "Great work! Keep maintaining your current performance." });
  return tips;
}

const CustomDot = (props) => {
  const { cx, cy, payload } = props;
  if (!payload.note) return null;
  return <circle cx={cx} cy={cy} r={5} fill="#ff4444" stroke="#ff444488" strokeWidth={4} />;
};

export default function MyScore() {
  const { score } = calcContractorScore(MOCK_DATA);
  const [animated, setAnimated] = useState(false);
  const tips = generateTips(MOCK_DATA);
  const isFrozen = score < 40;

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>My Credibility Score</h1>
        <p className="text-sm text-slate-400">Your contractor trust score — updated in real-time</p>
      </div>

      {/* Freeze Banner */}
      {isFrozen && (
        <div className="rounded-xl p-5 border" style={{ background: "#ff444420", borderColor: "#ff4444" }}>
          <div className="flex items-start gap-3">
            <AlertCircle size={20} color="#ff4444" className="shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-300 text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>🔴 Zone Assignment Frozen</p>
              <p className="text-xs text-red-400 mt-1">Your score dropped below 40. No new zones can be assigned until Admin review.</p>
              <ul className="mt-2 space-y-1 text-xs text-red-400 list-disc list-inside">
                <li>Anomalies flagged: {MOCK_DATA.anomalies_flagged} (−{MOCK_DATA.anomalies_flagged * 10} pts)</li>
                <li>Unresolved complaints 48hr: {MOCK_DATA.unresolved_48h} (−{MOCK_DATA.unresolved_48h * 15} pts)</li>
              </ul>
              <p className="text-xs text-slate-400 mt-2">Steps to unfreeze: Resolve all overdue complaints → Reduce flagged batches → Contact your supervisor.</p>
            </div>
          </div>
        </div>
      )}

      {/* Score + Breakdown */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Ring */}
        <div className="rounded-xl border border-cyan-900 p-6 flex flex-col items-center" style={{ background: "#0f1f35" }}>
          <ScoreRing score={score} animated={animated} />
          <div className="mt-4 flex gap-4 text-xs">
            {[{ label: "Excellent", color: "#00e676", min: 75 }, { label: "Fair", color: "#ffaa00", min: 50 }, { label: "Low", color: "#ff4444", min: 0 }].map(b => (
              <div key={b.label} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: b.color }} />
                <span style={{ color: b.color }}>{b.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Breakdown Table */}
        <div className="rounded-xl border border-cyan-900 overflow-hidden" style={{ background: "#0f1f35" }}>
          <div className="px-5 py-4 border-b border-cyan-900">
            <h3 className="font-semibold text-white text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>Score Breakdown</h3>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-cyan-900/50">
                <th className="px-5 py-2.5 text-left text-slate-400 font-medium">Factor</th>
                <th className="px-5 py-2.5 text-left text-slate-400 font-medium">Value</th>
                <th className="px-5 py-2.5 text-right text-slate-400 font-medium">Impact</th>
              </tr>
            </thead>
            <tbody>
              {BREAKDOWN.map((row, i) => (
                <tr key={i} className="border-b border-cyan-900/30">
                  <td className="px-5 py-3 text-slate-300">{row.factor}</td>
                  <td className="px-5 py-3 text-slate-400">{row.value}</td>
                  <td className="px-5 py-3 text-right font-semibold" style={{ color: row.positive ? "#00e676" : "#ff4444" }}>
                    {row.impact}
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={2} className="px-5 py-3 font-bold text-white">Final Score</td>
                <td className="px-5 py-3 text-right font-bold text-2xl" style={{ color: score >= 75 ? "#00e676" : score >= 50 ? "#ffaa00" : "#ff4444", fontFamily: "'Syne', sans-serif" }}>
                  {score}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* History Chart */}
      <div className="rounded-xl border border-cyan-900 p-5" style={{ background: "#0f1f35" }}>
        <h3 className="font-semibold text-white text-sm mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>Score History (Last 30 Days)</h3>
        <p className="text-xs text-slate-500 mb-4">Red dots indicate dip events — hover for cause</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={SCORE_HISTORY} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis domain={[60, 100]} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
            <ReferenceLine y={40} stroke="#ff4444" strokeDasharray="4 4" label={{ value: "Freeze", fill: "#ff4444", fontSize: 10 }} />
            <ReferenceLine y={75} stroke="#00e676" strokeDasharray="4 4" label={{ value: "Good", fill: "#00e676", fontSize: 10 }} />
            <Tooltip
              contentStyle={{ background: "#0a1628", border: "1px solid #164e63", borderRadius: 8, color: "#fff", fontSize: 12 }}
              formatter={(value, name, props) => [value, `Score${props.payload.note ? ` (${props.payload.note})` : ""}`]}
            />
            <Line type="monotone" dataKey="score" stroke="#00e5ff" strokeWidth={2} dot={<CustomDot />} activeDot={{ r: 5, fill: "#00e5ff" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Tips */}
      <div className="rounded-xl border border-cyan-900 p-5" style={{ background: "#0f1f35" }}>
        <div className="flex items-center gap-2 mb-4">
          <Info size={16} color="#00e5ff" />
          <h3 className="font-semibold text-white text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>Improvement Tips</h3>
        </div>
        <div className="space-y-3">
          {tips.map((t, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: "#0a1628" }}>
              <span className="text-base">{t.icon}</span>
              <p className="text-sm text-slate-300">{t.msg}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}