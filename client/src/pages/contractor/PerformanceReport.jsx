import { TrendingUp, TrendingDown, Minus, Star } from "lucide-react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";

// ---------- Linear Regression ----------
function linearRegression(xArr, yArr) {
  const n = xArr.length;
  const sumX = xArr.reduce((a, b) => a + b, 0);
  const sumY = yArr.reduce((a, b) => a + b, 0);
  const sumXY = xArr.reduce((a, b, i) => a + b * yArr[i], 0);
  const sumX2 = xArr.reduce((a, b) => a + b * b, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX ** 2);
  const intercept = (sumY - slope * sumX) / n;

  return {
    slope,
    predict: (x) => slope * x + intercept,
  };
}

function predictDelayTrend(history) {
  const x = history.map((_, i) => i + 1);
  const y = history.map(b => b.delay_hours);
  const model = linearRegression(x, y);

  return {
    trend:
      model.slope > 0.5 ? "WORSENING" :
      model.slope < -0.5 ? "IMPROVING" : "STABLE",
    nextPredicted: Math.max(0, model.predict(x.length + 1)).toFixed(1),
  };
}

// ---------- MOCK DATA ----------
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const MOCK_ZONES = [
  {
    id: 1, name: "Zone A", district: "Andheri",
    complaints: { total: 18, resolved: 14 },
    batches: { total: 22, processed: 19, flagged: 2 },
    avgResolution: 1.8, citizenRating: 4.3,
    trend: [3, 2, 4, 2, 1, 3, 2],
  },
  {
    id: 2, name: "Zone B", district: "Bandra",
    complaints: { total: 12, resolved: 7 },
    batches: { total: 15, processed: 11, flagged: 4 },
    avgResolution: 3.2, citizenRating: 3.6,
    trend: [1, 3, 2, 4, 5, 3, 4],
  },
];

const DELAY_HISTORY = [
  { delay_hours: 2.1 }, { delay_hours: 3.4 }, { delay_hours: 2.8 },
  { delay_hours: 4.1 }, { delay_hours: 3.9 }, { delay_hours: 5.2 },
];

// ---------- COMPONENT ----------
export default function PerformanceReport() {
  const prediction = predictDelayTrend(DELAY_HISTORY);

  const lineData = DELAY_HISTORY.map((b, i) => ({
    day: `Day ${i + 1}`,
    value: b.delay_hours,
  }));

  return (
    <div className="space-y-6 text-white">

      <h1 className="text-2xl font-bold">Performance Report</h1>

      {/* ZONE CARDS */}
      <div className="grid grid-cols-2 gap-4">
        {MOCK_ZONES.map(zone => (
          <div key={zone.id} className="p-4 bg-gray-900 rounded-xl">

            <h2 className="font-bold">{zone.name}</h2>
            <p className="text-xs text-gray-400">{zone.district}</p>

            <p className="text-xs mt-2">
              Complaints: {zone.complaints.resolved}/{zone.complaints.total}
            </p>

            {/* ✅ FIXED CHART */}
            <ResponsiveContainer width="100%" height={100}>
              <LineChart
                data={zone.trend.map((v, i) => ({
                  name: DAYS[i],
                  value: v
                }))}
              >
                <Line type="monotone" dataKey="value" stroke="#00e5ff" />
                <XAxis dataKey="name" hide />
                <YAxis hide />
                <Tooltip />
              </LineChart>
            </ResponsiveContainer>

          </div>
        ))}
      </div>

      {/* DELAY TREND */}
      <div className="p-4 bg-gray-900 rounded-xl">
        <h2 className="font-bold mb-2">Delay Prediction</h2>

        <p>
          Trend:
          <span className="ml-2">
            {prediction.trend === "WORSENING" && <TrendingUp color="red" />}
            {prediction.trend === "IMPROVING" && <TrendingDown color="green" />}
            {prediction.trend === "STABLE" && <Minus />}
          </span>
        </p>

        <p className="text-sm mt-1">
          Next delay: {prediction.nextPredicted} hrs
        </p>
      </div>

      {/* LINE CHART */}
      <div className="p-4 bg-gray-900 rounded-xl">
        <h2 className="font-bold mb-2">Delay Trend</h2>

        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={lineData}>
            <Line type="monotone" dataKey="value" stroke="#00e5ff" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}