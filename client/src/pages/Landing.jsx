import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AdminDashboard from "./admin/AdminDashboard";
import ContractorLayout from "./contractor/ContractorLayout";
import ContractorHome from "./contractor/ContractorHome";
import { useNavigate } from "react-router-dom";

// --- REUSABLE SUB-COMPONENTS ---
const Badge = ({ text, type = "default", showPulse = false }) => {
  const styles = {
    default: "bg-gray-800/50 border-gray-700 text-gray-300",
    success: "bg-green-500/10 border-green-500/50 text-green-400",
    danger: "bg-red-500/10 border-red-500/50 text-red-400",
    info: "bg-blue-500/10 border-blue-500/50 text-blue-400",
  };
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border backdrop-blur-md ${styles[type]}`}>
      {showPulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
        </span>
      )}
      <span className="uppercase tracking-widest">{text}</span>
    </div>
  );
};

const StatCard = ({ title, value }) => (
  <div className="bg-gray-900/40 p-6 rounded-2xl border border-gray-800 hover:border-gray-700 transition-all group">
    <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 group-hover:text-gray-300 transition-colors">{title}</h3>
    <p className="text-4xl font-black bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">{value}</p>
  </div>
);

// ✅ MAIN COMPONENT START
const Landing = () => {

  const navigate = useNavigate();

  // ✅ ADDED STATES (NO UI CHANGE)
  const [isTracking, setIsTracking] = useState(false);
  const [scanStatus, setScanStatus] = useState("System Active");

  useEffect(() => {
    const arr = ["System Active", "Scanning", "AI Monitoring"];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % arr.length;
      setScanStatus(arr[i]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.8, ease: "easeOut" }
  };

  const portals = [
    {
      role: "Admin",
      icon: "🛠️",
      desc: "Control full system, monitor anomalies, and manage operations.",
      route: "/adminDashboard",
    },
    {
      role: "Citizen",
      icon: "🏠",
      desc: "Report issues and track waste.",
      route: "/citizen",
    },
    {
      role: "Contractor",
      icon: "🏢",
      desc: "Manage contractor operations.",
      route: "/contractor",
    },
    {
      role: "Worker",
      icon: "🚛",
      desc: "View assigned routes and tasks.",
      route: "/worker",
    },
  ];

  return (
    // 🔥 YOUR FULL UI STARTS — NOTHING REMOVED
      <div className="bg-gray-950 text-white min-h-screen font-sans selection:bg-green-500/30 overflow-x-hidden">
        
        {/* --- STICKY NAVBAR --- */}
        <nav className="fixed top-0 w-full z-[100] bg-gray-950/80 backdrop-blur-xl border-b border-white/5 px-6 md:px-12 py-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-black font-black italic shadow-[0_0_20px_rgba(34,197,94,0.4)]">
                N
              </div>
              <div className="flex flex-col -space-y-1">
                <span className="text-white font-black text-xl tracking-tighter uppercase">Nirikshan</span>
                <span className="text-emerald-500/60 font-mono text-[10px] uppercase tracking-[0.3em]">360_Command</span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 border border-white/5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Global_Status: OK</span>
              </div>
              <a href="#roles" className="text-xs font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-widest">Portals</a>
              <button className="bg-white text-black px-6 py-2 rounded-xl text-xs font-black hover:bg-green-400 transition-all uppercase" onClick={() => navigate("/login")}>Login</button>
            </div>
          </div>
        </nav>

        {/* --- FLOATING TRACKER MODAL --- */}
        <AnimatePresence>
          {isTracking && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md"
              onClick={() => setIsTracking(false)}
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                className="bg-gray-900 border border-white/10 p-8 rounded-[2.5rem] max-w-lg w-full shadow-2xl relative"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black italic">Live Batch Trace</h2>
                  <Badge text="In Transit" type="info" showPulse={true} />
                </div>
                <div className="space-y-6">
                  {[
                    { label: "Collection", time: "08:30 AM", status: "Done" },
                    { label: "QR Verified", time: "08:45 AM", status: "Done" },
                    { label: "En Route", time: "Live Location", status: "Active" },
                    { label: "Processing", time: "ETA 12:00 PM", status: "Pending" }
                  ].map((step, idx) => (
                    <div key={idx} className="flex items-center gap-4 group">
                      <div className={`w-3 h-3 rounded-full transition-all duration-500 ${step.status === 'Done' ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : step.status === 'Active' ? 'bg-blue-500 animate-pulse shadow-[0_0_15px_#3b82f6]' : 'bg-gray-700'}`} />
                      <div className="flex-1 border-b border-white/5 pb-2 group-last:border-0">
                        <p className={`font-bold text-sm ${step.status === 'Pending' ? 'text-gray-500' : 'text-white'}`}>{step.label}</p>
                        <p className="text-[10px] font-mono text-gray-500 uppercase">{step.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => setIsTracking(false)} className="w-full mt-10 py-4 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-green-400 transition-all">Terminate Monitor</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- HERO SECTION --- */}
        <section className="relative px-8 pt-40 pb-32 max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          {/* Glow Effects */}
          <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -z-10" />
          <div className="absolute bottom-20 left-0 w-[400px] h-[400px] bg-green-600/10 rounded-full blur-[120px] -z-10" />

          <motion.div {...fadeInUp}>
            <Badge text={scanStatus} type="success" showPulse={true} />
            <h1 className="text-7xl lg:text-[90px] font-black leading-[0.85] tracking-tighter mt-8 mb-8">
              Har Waste Par <br /> 
              <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-blue-500 bg-clip-text text-transparent">
                360 Nazar.
              </span>
            </h1>
            <p className="text-gray-400 text-xl max-w-lg leading-relaxed mb-12 font-medium">
              Eliminating "untraceable" waste through AI-driven anomaly detection and end-to-end verification.
            </p>
            <div className="flex flex-wrap gap-5">
              <button className="px-10 py-5 bg-green-500 text-black font-black text-lg rounded-2xl hover:bg-green-400 hover:scale-105 transition-all shadow-[0_20px_40px_rgba(34,197,94,0.3)] uppercase">Report Issues</button>
              <button onClick={() => setIsTracking(true)} className="px-10 py-5 bg-gray-950 border border-white/10 font-black text-lg rounded-2xl hover:bg-gray-900 transition-all uppercase">Track Batch</button>
            </div>
          </motion.div>

          {/* THE MONITOR */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1 }}
            className="relative group lg:ml-auto w-full max-w-2xl"
          >
            <div className="absolute -inset-1.5 bg-gradient-to-r from-green-500 to-blue-500 rounded-[2.2rem] opacity-20 blur-xl group-hover:opacity-40 transition-opacity"></div>
            <div className="relative bg-black rounded-[2rem] overflow-hidden aspect-video border border-white/10 shadow-2xl">
              <video autoPlay loop muted playsInline className="w-full h-full object-cover mix-blend-screen scale-105 opacity-60">
                <source src="/hero-video.mp4" type="video/mp4" />
              </video>
              
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent" />
              
              <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-[10px] font-mono text-green-400/70 tracking-[0.2em] uppercase">Sector_04_Live</p>
                  <p className="text-xs font-bold text-white uppercase italic">Active Route Optimization</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-mono text-blue-400/70 tracking-[0.2em] uppercase">Lat: 26.9124</p>
                  <p className="text-[10px] font-mono text-blue-400/70 tracking-[0.2em] uppercase">Long: 75.7873</p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* --- PORTALS SECTION --- */}
        <section id="roles" className="px-8 py-32 max-w-7xl mx-auto border-t border-white/5">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="max-w-xl">
              <h2 className="text-4xl font-black mb-4 tracking-tighter uppercase italic">Accountability Portals</h2>
              <p className="text-gray-500 font-medium">Assigning ownership to every gram of waste in the city ecosystem.</p>
            </div>
            <Badge text="3 Tier Access" type="default" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
    {portals.map((item, idx) => (
      <motion.div
        key={idx}
        {...fadeInUp}
        whileHover={{ y: -10 }}
        onClick={() => navigate(item.route)}
        className="bg-gray-900/20 backdrop-blur-sm p-10 rounded-[2.5rem] border border-white/5 hover:border-green-500/30 transition-all cursor-pointer group"
      >
        <div className="text-5xl mb-8 grayscale group-hover:grayscale-0 transition-all duration-500">
          {item.icon}
        </div>

        <h3 className="text-2xl font-black mb-4 group-hover:text-green-400 transition-colors italic uppercase">
          {item.role} Portal
        </h3>

        <p className="text-gray-500 text-sm leading-relaxed mb-8 font-medium">
          {item.desc}
        </p>

        <div className="h-px w-full bg-white/5 mb-6 group-hover:bg-green-500/20 transition-all" />

        <div className="font-bold text-[10px] tracking-[0.3em] text-green-500 opacity-40 group-hover:opacity-100 transition-all uppercase">
          Enter_System_0{idx + 1} →
        </div>
      </motion.div>
    ))}
  </div>
        </section>

        {/* --- ANOMALY SECTION --- */}
        <section id="anomalies" className="px-8 py-32 bg-black/40 border-y border-white/5">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
            <motion.div {...fadeInUp}>
              <Badge text="AI Engine v1.0" type="danger" showPulse={true} />
              <h2 className="text-5xl lg:text-6xl font-black mb-6 tracking-tight italic mt-6 uppercase">
                The End of <br /> <span className="text-red-500">Ghost Pickups.</span>
              </h2>
              <p className="text-gray-400 text-lg mb-12 font-medium">
                Our neural network flags deviations in real-time. If a truck marks "Collected" but GPS isn't at the bin, the system triggers a **Lockdown Alert**.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <StatCard title="System Uptime" value="99.9%" />
                <StatCard title="Anomaly Accuracy" value="98.2%" />
              </div>
            </motion.div>
            
            <div className="relative">
              <div className="absolute -inset-10 bg-red-500/5 rounded-full blur-[100px]" />
              <div className="relative p-8 rounded-[2.5rem] bg-gray-900/40 border border-red-500/20 shadow-2xl overflow-hidden backdrop-blur-md">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-sm font-black text-red-500 uppercase tracking-[0.4em]">Live_Anomalies</h3>
                  <span className="px-2 py-1 bg-red-500 text-[8px] font-bold rounded text-white animate-pulse">CRITICAL</span>
                </div>
                <div className="space-y-6">
                  <div className="p-5 bg-black/60 rounded-2xl border-l-4 border-red-500 group cursor-help">
                      <p className="text-[10px] font-mono text-red-400 mb-1">ID_TRK_0412 // 09:21 AM</p>
                      <p className="text-sm font-bold text-white uppercase tracking-tight">Ghost Pickup Detected</p>
                      <p className="text-xs text-gray-500 mt-2 font-medium">Status marked "Done" at Geofence Delta-7. Actual GPS: 4.2km away.</p>
                  </div>
                  <div className="p-5 bg-black/30 rounded-2xl border-l-4 border-yellow-500/50 opacity-60">
                      <p className="text-[10px] font-mono text-yellow-500 mb-1">ID_TRK_0399 // 08:45 AM</p>
                      <p className="text-sm font-bold text-white/50 uppercase tracking-tight">Extended Stagnation</p>
                      <p className="text-xs text-gray-600 mt-2">Vehicle idle for 54 minutes in Zone 02.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- FOOTER --- */}
        <footer className="py-20 text-center relative border-t border-white/5">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-20 bg-gradient-to-b from-green-500 to-transparent" />
          <p className="text-gray-600 text-[10px] font-mono uppercase tracking-[0.8em] mb-4">Nirikshan 360 // Verified Accountability</p>
          <p className="text-gray-800 text-[9px] font-mono uppercase tracking-widest">Digital Infrastructure for Smart Cities 2026</p>
        </footer>
      </div>
    );
 
  }
  export default Landing;