import React from "react";
import { motion } from "framer-motion";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-gray-950 pt-24 pb-12 overflow-hidden border-t border-gray-900">
      {/* Background Decorative Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-green-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          
          {/* Brand Column */}
          <div className="space-y-6">
            <div className="text-2xl font-black tracking-tighter flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500 rounded-lg rotate-12 flex items-center justify-center text-black italic shadow-[0_0_15px_rgba(34,197,94,0.4)]">
                N
              </div>
<span className="text-white">NIRIKSHAN</span>
<span className="text-gray-500 font-light text-sm italic tracking-widest ml-1">
    360
  </span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
              Revolutionizing urban waste management through AI-driven accountability and 360° real-time tracking.
            </p>
            {/* Live System Pulse */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-900 border border-gray-800">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Global Node: Active</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-xs">Portals</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><a href="#" className="hover:text-green-400 transition-colors cursor-pointer">Citizen Reporting</a></li>
              <li><a href="#" className="hover:text-green-400 transition-colors cursor-pointer">Contractor Dashboard</a></li>
              <li><a href="#" className="hover:text-green-400 transition-colors cursor-pointer">Worker Verification</a></li>
              <li><a href="#" className="hover:text-green-400 transition-colors cursor-pointer">Admin Command Center</a></li>
            </ul>
          </div>

          {/* Technology */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-xs">Engine</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><a href="#" className="hover:text-blue-400 transition-colors cursor-pointer">Anomaly Detection</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors cursor-pointer">QR Batch Logic</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors cursor-pointer">GPS Geo-fencing</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors cursor-pointer">Llama 3.1 Integration</a></li>
            </ul>
          </div>

          {/* Newsletter / CTA */}
          <div className="space-y-6">
            <h4 className="text-white font-bold uppercase tracking-widest text-xs">System Updates</h4>
            <p className="text-gray-500 text-sm">Receive real-time alerts on zone performance.</p>
            <div className="flex flex-col gap-2">
              <input 
                type="email" 
                placeholder="admin@municipality.gov" 
                className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500/50 transition-all"
              />
              <button className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-green-400 transition-all text-sm shadow-xl">
                Subscribe to Feed
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-900 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-gray-600 text-[10px] font-mono uppercase tracking-[0.2em]">
            © {currentYear} NIRIKSHAN 360 // ALL SYSTEMS OPERATIONAL
          </p>
          
          <div className="flex gap-6 text-gray-600 text-[10px] font-mono uppercase tracking-widest">
            <a href="#" className="hover:text-white transition-colors">Privacy_Protocol</a>
            <a href="#" className="hover:text-white transition-colors">Terms_of_Service</a>
            <a href="#" className="hover:text-white transition-colors">API_Docs</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;