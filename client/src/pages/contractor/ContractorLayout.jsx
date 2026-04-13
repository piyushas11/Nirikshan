import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import {
  Home, Users, Package, MessageSquare, BarChart2, Star,
  Bell, Menu, X, ChevronRight, Zap
} from "lucide-react";

const NAV_LINKS = [
  { to: "/contractor", label: "Home", icon: Home, end: true },
  { to: "/contractor/workers", label: "Workers", icon: Users },
  { to: "/contractor/batches", label: "Batches", icon: Package },
  { to: "/contractor/complaints", label: "Complaints", icon: MessageSquare },
  { to: "/contractor/performance", label: "Performance", icon: BarChart2 },
  { to: "/contractor/score", label: "My Score", icon: Star },
];

export default function ContractorLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#050d1a]" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-30 flex flex-col
          transition-all duration-300
          ${sidebarOpen ? "w-60" : "w-16"}
          lg:w-60 lg:static
          border-r border-cyan-900
        `}
        style={{ background: "#0a1628" }}
      >

        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-cyan-900">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #00e5ff22, #00e5ff44)",
              border: "1px solid #00e5ff55"
            }}>
            <Zap size={16} color="#00e5ff" />
          </div>

          <span className={`font-bold text-lg text-white transition-all duration-300 ${sidebarOpen ? "opacity-100" : "opacity-0 lg:opacity-100"}`}>
            Loavbel
          </span>

          <button
            className="ml-auto lg:hidden text-cyan-400"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* NAV WRAPPER (IMPORTANT CHANGE) */}
        <div className="flex flex-col h-full justify-start px-2 py-4">

          {/* Nav Links */}
          <div className="flex flex-col gap-2">
            {NAV_LINKS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive
                    ? "text-cyan-400 bg-gradient-to-r from-cyan-900/40 to-transparent border-l-2 border-cyan-400"
                    : "text-slate-400 hover:text-white hover:bg-white/5 hover:shadow-[0_0_10px_rgba(0,229,255,0.1)]"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={18} />

                    <span className={`transition-all ${sidebarOpen ? "opacity-100" : "opacity-0 lg:opacity-100"}`}>
                      {label}
                    </span>

                    {isActive && (
                      <ChevronRight
                        size={14}
                        className={`ml-auto text-cyan-400 ${sidebarOpen ? "opacity-100" : "opacity-0 lg:opacity-100"}`}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* FILL SPACE NICELY */}
          <div className="flex-1" />

          {/* Footer (now positioned properly) */}
          <div className="px-3 pb-4 text-xs text-slate-500">
            v1.0.0 · Contractor
          </div>

        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">

        {/* Topbar */}
        <header className="flex items-center gap-4 px-4 py-3 border-b border-cyan-900 bg-[#050d1a] sticky top-0 z-10">

          <button
            className="lg:hidden text-cyan-400"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>

          <div className="flex-1" />

          {/* Notifications */}
          <div className="relative">
            <button
              className="relative p-2 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-950/40"
              onClick={() => setNotifOpen(!notifOpen)}
            >
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-12 w-72 rounded-xl border border-cyan-900 shadow-xl overflow-hidden bg-[#0f1f35]">

                <div className="px-4 py-3 border-b border-cyan-900 text-sm font-semibold text-white">
                  Notifications
                </div>

                {[
                  "Batch BT-009 stagnant",
                  "Worker absent",
                  "Complaint surge"
                ].map((msg, i) => (
                  <div key={i} className="px-4 py-3 border-b border-cyan-900/40 hover:bg-white/5">
                    <p className="text-sm text-slate-200">{msg}</p>
                    <p className="text-xs text-slate-500">Just now</p>
                  </div>
                ))}

              </div>
            )}
          </div>

          {/* User */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-white">Raj Kumar</p>
              <p className="text-xs text-cyan-400">Zone Contractor</p>
            </div>

            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold"
              style={{
                background: "linear-gradient(135deg, #00e5ff33, #00e5ff66)"
              }}>
              RK
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}