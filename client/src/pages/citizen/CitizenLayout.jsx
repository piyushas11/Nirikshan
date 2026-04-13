import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useState, useEffect } from "react";
import NotificationBell from "../../components/shared/NotificationBell";

const navItems = [
  { to: "/citizen",                    label: "Home",       icon: "🏠", end: true },
  { to: "/citizen/report",             label: "Report",     icon: "📦" },
  { to: "/citizen/segregation",  label: "Seg Check",  icon: "♻️" },
  { to: "/citizen/complaints",         label: "Complaints", icon: "📋" },
  { to: "/citizen/profile",            label: "Profile",    icon: "👤" },
  {to:"/", label:"Back to Landing", icon:"🏁"}
];

export default function CitizenLayout() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 99px; }
        @keyframes glow { 0%,100%{box-shadow:0 0 8px rgba(34,197,94,0.35)}50%{box-shadow:0 0 18px rgba(34,197,94,0.65)} }
        @keyframes fadeDown { from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)} }
        @keyframes navPulse { 0%,100%{opacity:0.6}50%{opacity:1} }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg,#060e09 0%,#08101a 55%,#060c18 100%)",
        fontFamily: "'DM Sans',sans-serif",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        opacity: mounted ? 1 : 0,
        transition: "opacity 0.4s ease",
      }}>

        {/* ── Atmosphere ── */}
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
          <div style={{ position: "absolute", top: "-10%", left: "-5%", width: 500, height: 500, background: "radial-gradient(circle,rgba(34,197,94,0.04) 0%,transparent 65%)", borderRadius: "50%" }} />
          <div style={{ position: "absolute", bottom: "0", right: "-8%", width: 480, height: 480, background: "radial-gradient(circle,rgba(59,130,246,0.04) 0%,transparent 65%)", borderRadius: "50%" }} />
          <div style={{ position: "absolute", inset: 0, opacity: 0.011, backgroundImage: "linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
        </div>

        {/* ── Top Navbar ── */}
        <header style={{
          position: "sticky", top: 0, zIndex: 50,
          background: scrolled
            ? "rgba(6,14,9,0.92)"
            : "rgba(6,14,9,0.75)",
          backdropFilter: "blur(20px)",
          borderBottom: `1px solid ${scrolled ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)"}`,
          transition: "all 0.3s ease",
          animation: "fadeDown 0.4s ease both",
        }}>
          {/* Top accent line */}
          <div style={{ height: 2, background: "linear-gradient(90deg,#22c55e,#3b82f6,transparent)", opacity: 0.7 }} />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: 58 }}>

            {/* Brand */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", animation: "glow 2.5s ease-in-out infinite" }} />
              <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 17, letterSpacing: "-0.02em", background: "linear-gradient(90deg,#fff,rgba(255,255,255,0.6))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Nebulon
              </span>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(34,197,94,0.8)", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", padding: "2px 8px", borderRadius: 99, fontFamily: "'DM Mono',monospace" }}>
                CITIZEN
              </span>
            </div>

            {/* Nav links */}
            <nav style={{ display: "flex", alignItems: "center", gap: 2 }}>
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  style={({ isActive }) => ({
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "7px 13px", borderRadius: 10,
                    fontSize: 12, fontWeight: isActive ? 700 : 500,
                    textDecoration: "none",
                    color: isActive ? "#fff" : "rgba(255,255,255,0.4)",
                    background: isActive ? "rgba(255,255,255,0.06)" : "transparent",
                    border: isActive ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
                    transition: "all 0.2s ease",
                    fontFamily: "'DM Sans',sans-serif",
                  })}
                  onMouseEnter={e => { if (!e.currentTarget.style.background.includes("0.06")) { e.currentTarget.style.color = "rgba(255,255,255,0.75)"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; } }}
                  onMouseLeave={e => { if (!e.currentTarget.style.background.includes("0.06")) { e.currentTarget.style.color = "rgba(255,255,255,0.4)"; e.currentTarget.style.background = "transparent"; } }}
                >
                  <span style={{ fontSize: 14 }}>{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            {/* Right side */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <NotificationBell />
              <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)" }} />
              <button
                onClick={handleSignOut}
                style={{
                  padding: "7px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                  background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                  color: "rgba(239,68,68,0.7)", cursor: "pointer",
                  fontFamily: "'DM Sans',sans-serif", transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; e.currentTarget.style.color = "#ef4444"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; e.currentTarget.style.color = "rgba(239,68,68,0.7)"; }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        {/* ── Page content ── */}
        <main style={{ flex: 1, position: "relative", zIndex: 1 }}>
          <Outlet />
        </main>
      </div>
    </>
  );
}