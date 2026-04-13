import { Link, useLocation } from "react-router-dom";
import { Activity, Bell, User } from "lucide-react";

export default function Header() {
  const { pathname } = useLocation();

  const nav = [
    { name: "Dashboard", path: "/admin" },
    { name: "Anomalies", path: "/anomaly-center" },
    { name: "Workers", path: "/worker-list" },
    { name: "Contractors", path: "/contractor-list" },
    { name: "Map", path: "/map-view" },
  ];

  return (
    <div className="h-16 sticky top-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6">

      {/* 🔹 Left: Logo */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center shadow-lg">
          <Activity size={18} className="text-white" />
        </div>
        <span className="text-white font-semibold text-lg tracking-tight">
          WasteTrack
        </span>
      </div>

      {/* 🔹 Center: Navigation */}
      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-1">
        {nav.map((item) => {
          const active = pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative px-4 py-1.5 text-sm rounded-lg transition-all duration-200 ${
                active
                  ? "text-white bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-white/10"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              {item.name}

              {/* Active underline glow */}
              {active && (
                <span className="absolute inset-x-2 -bottom-[2px] h-[2px] bg-gradient-to-r from-green-400 to-blue-500 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>

      {/* 🔹 Right: Actions */}
      <div className="flex items-center gap-4">
        {/* Live indicator */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-green-400 font-medium">Live</span>
        </div>

        {/* Notifications */}
        <button className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition">
          <Bell size={16} className="text-white/70" />
        </button>

        {/* Profile */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center cursor-pointer">
          <User size={14} className="text-white" />
        </div>
      </div>
    </div>
  );
}