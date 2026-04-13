import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
 
const NAV = [
  { to: "/worker", label: "Home", icon: "⬛" },
  { to: "/worker/route", label: "My Route", icon: "🗺" },
  { to: "/worker/complaints", label: "Complaints", icon: "📋" },
  { to: "/worker/qr", label: "Generate QR", icon: "⬜" },
  { to: "/worker/score", label: "My Score", icon: "★" },
];
 
export default function WorkerLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
 
  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };
 
  return (
    <div style={{ fontFamily: "'DM Mono', monospace", background: "#0d0d0d", minHeight: "100vh", color: "#e8e8e0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Bebas+Neue&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #111; } ::-webkit-scrollbar-thumb { background: #4ade80; }
        .nav-link { display: flex; align-items: center; gap: 10px; padding: 12px 16px; color: #888; text-decoration: none; font-size: 13px; letter-spacing: 0.08em; border-left: 3px solid transparent; transition: all 0.15s; }
        .nav-link:hover { color: #e8e8e0; background: #1a1a1a; }
        .nav-link.active { color: #4ade80; border-left-color: #4ade80; background: #111b14; }
        .menu-btn { background: none; border: 1px solid #333; color: #888; padding: 6px 10px; cursor: pointer; font-family: inherit; font-size: 18px; border-radius: 4px; }
      `}</style>
 
      {/* Top bar (mobile) */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #1f1f1f", background: "#0d0d0d", position: "sticky", top: 0, zIndex: 100 }}>
        <div>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: "#4ade80", letterSpacing: 3 }}>WASTETRACK</span>
          <span style={{ fontSize: 10, color: "#555", marginLeft: 8, letterSpacing: 2 }}>WORKER</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#555" }}>{user?.email?.split("@")[0] || "worker"}</span>
          <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
        </div>
      </div>
 
      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ background: "#111", borderBottom: "1px solid #1f1f1f", padding: "8px 0" }}>
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.to === "/worker"} className={({ isActive }) => "nav-link" + (isActive ? " active" : "")} onClick={() => setMenuOpen(false)}>
              <span>{n.icon}</span>{n.label}
            </NavLink>
          ))}
          <button onClick={handleSignOut} style={{ display: "block", width: "100%", textAlign: "left", padding: "12px 16px", background: "none", border: "none", color: "#888", fontSize: 13, cursor: "pointer", letterSpacing: "0.08em", fontFamily: "inherit" }}>
            ⏻  Sign Out
          </button>
        </div>
      )}
 
      <div style={{ display: "flex" }}>
        {/* Desktop sidebar */}
        <aside style={{ width: 220, minHeight: "calc(100vh - 52px)", borderRight: "1px solid #1f1f1f", background: "#0a0a0a", flexShrink: 0, display: "none" }} className="desktop-sidebar">
          <style>{`.desktop-sidebar { display: block !important; } @media(max-width:768px){ .desktop-sidebar { display: none !important; } }`}</style>
          <div style={{ padding: "20px 16px 12px", borderBottom: "1px solid #1a1a1a" }}>
            <div style={{ fontSize: 10, color: "#555", letterSpacing: 3, marginBottom: 6 }}>LOGGED IN AS</div>
            <div style={{ fontSize: 13, color: "#ccc" }}>{user?.email || "—"}</div>
          </div>
          <nav style={{ paddingTop: 8 }}>
            {NAV.map(n => (
              <NavLink key={n.to} to={n.to} end={n.to === "/worker"} className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
                <span>{n.icon}</span>{n.label}
              </NavLink>
            ))}
          </nav>
          <div style={{ position: "absolute", bottom: 24, left: 0, width: 220 }}>
            <button onClick={handleSignOut} style={{ display: "block", width: "100%", textAlign: "left", padding: "12px 16px", background: "none", border: "none", color: "#555", fontSize: 13, cursor: "pointer", letterSpacing: "0.08em", fontFamily: "inherit" }}>
              ⏻  Sign Out
            </button>
          </div>
        </aside>
 
        <main style={{ flex: 1, padding: "0", overflowX: "hidden" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}