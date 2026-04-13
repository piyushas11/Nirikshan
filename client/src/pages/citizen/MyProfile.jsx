import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import axiosInstance from "../../lib/axios";
import { motion } from "framer-motion";
import { Zap, BarChart3, Award } from "lucide-react";
import LoadingSpinner from "../../components/ui/LoadingSpinner";

export default function MyProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [profileRes, historyRes] = await Promise.all([
          axiosInstance.get("/citizen/profile"),
          axiosInstance.get("/citizen/segregation-history"),
        ]);
        setProfile(profileRes.data);
        setHistory(historyRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const getScoreColor = (score) => {
    if (score >= 80) return "#22c55e";
    if (score >= 50) return "#eab308";
    return "#f87171"; // softer red
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <LoadingSpinner />
        </motion.div>
        <p className="text-xs mt-4 tracking-[0.3em] text-emerald-400">
          LOADING PROFILE
        </p>
      </div>
    );
  }

  const score = profile?.segregation_score ?? 0;
  const color = getScoreColor(score);

  const memberSince = user?.created_at
    ? new Date(user.created_at).getFullYear()
    : "—";

  return (
    <div className="min-h-screen w-full flex justify-center px-4 py-12 bg-[#020617]">

      <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-12">

        {/* HERO PROFILE */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full flex flex-col items-center text-center rounded-3xl p-10 bg-white/5 border border-white/10 backdrop-blur-xl shadow-xl"
        >

          {/* Avatar */}
          <div className="relative h-32 w-32 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-emerald-500 blur-2xl opacity-30"></div>
            <div className="relative z-10 h-full w-full rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-5xl font-black text-white shadow-xl">
              {user?.user_metadata?.name?.[0] || "C"}
            </div>
          </div>

          <h1 className="mt-6 text-3xl font-extrabold text-white">
            {user?.user_metadata?.name || "Citizen"}
          </h1>

          <p className="text-slate-400 text-sm mt-1">
            {user?.email}
          </p>

          <p className="text-xs text-slate-500 mt-1">
            Member since {memberSince}
          </p>

          <button className="mt-6 px-6 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/30 transition">
            Edit Profile
          </button>
        </motion.div>

        {/* SCORE */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full flex flex-col items-center rounded-3xl p-10 bg-white/5 border border-white/10 backdrop-blur-xl shadow-xl"
        >
          <div className="relative flex items-center justify-center bg-white/5 rounded-full p-6">

            <svg className="w-40 h-40 -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="10"
                fill="none"
              />
              <motion.circle
                cx="80"
                cy="80"
                r="70"
                stroke={color}
                strokeWidth="10"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={440}
                strokeDashoffset={440 - (440 * score) / 100}
                initial={{ strokeDashoffset: 440 }}
                animate={{ strokeDashoffset: 440 - (440 * score) / 100 }}
                transition={{ duration: 1.5 }}
              />
            </svg>

            <div className="absolute text-center">
              <p className="text-3xl font-black" style={{ color }}>
                {score}%
              </p>
              <p className="text-xs text-slate-400">Score</p>
            </div>
          </div>

          <p className="mt-4 font-semibold" style={{ color }}>
            {score >= 80
              ? "Elite Citizen 🌱"
              : score >= 50
              ? "Doing Good 👍"
              : "Needs Improvement ⚠️"}
          </p>
        </motion.div>

        {/* STATS */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { label: "Total Batches", value: profile?.total_batches, icon: Zap },
            { label: "AI Checks", value: profile?.total_checks, icon: BarChart3 },
            { label: "Resolutions", value: profile?.complaints_resolved, icon: Award },
          ].map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05 }}
              className="rounded-2xl p-6 bg-white/5 border border-white/10 backdrop-blur-xl text-center shadow-md hover:shadow-lg transition"
            >
              <div className="flex justify-center mb-3 text-white">
                <item.icon size={22} />
              </div>
              <p className="text-2xl font-bold text-white">
                {item.value || 0}
              </p>
              <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">
                {item.label}
              </p>
            </motion.div>
          ))}
        </div>

        {/* ACTIVITY */}
        <div className="w-full rounded-3xl p-8 bg-white/5 border border-white/10 backdrop-blur-xl shadow-xl">
          <h3 className="text-xl font-bold text-white mb-6">
            Recent Activity
          </h3>

          {history.length === 0 ? (
            <p className="text-slate-400 text-center py-10">
              No activity yet
            </p>
          ) : (
            <div className="space-y-4">
              {history.slice(0, 6).map((item) => (
                <motion.div
                  key={item.id}
                  whileHover={{ scale: 1.02 }}
                  className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
                >
                  <div>
                    <p className="text-white text-sm font-semibold">
                      Segregation Audit
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <p
                    className="font-bold"
                    style={{ color: getScoreColor(item.score) }}
                  >
                    {item.score}%
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}