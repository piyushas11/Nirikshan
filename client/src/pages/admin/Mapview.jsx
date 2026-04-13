import { useState, useEffect, useRef } from "react";
import {
  Thermometer, TruckIcon, AlertTriangle, X, ChevronRight,
  Navigation, Clock, Package, User, Building2, Search
} from "lucide-react";

// ─── Fake truck data ──────────────────────────────────────────────────────────
function generateTrucks() {
  const regions = [
    {
      state: "Maharashtra",
      coords: [
        [19.07,72.87], // Mumbai
        [18.52,73.85], // Pune
        [19.99,73.78], // Nashik
        [21.15,79.08], // Nagpur
        [19.87,75.34], // Aurangabad
      ]
    },
    {
      state: "Delhi",
      coords: [
        [28.64,77.21],
        [28.70,77.10],
        [28.55,77.30]
      ]
    },
    {
      state: "Karnataka",
      coords: [
        [12.97,77.59],
        [15.36,75.12],
        [12.30,76.65]
      ]
    },
    {
      state: "Tamil Nadu",
      coords: [
        [13.08,80.27],
        [11.01,76.96],
        [10.79,78.70]
      ]
    },
    {
      state: "Gujarat",
      coords: [
        [23.02,72.57],
        [21.17,72.83],
        [22.30,70.80]
      ]
    },
    {
      state: "Rajasthan",
      coords: [
        [26.91,75.78],
        [26.23,73.02],
        [24.58,73.68]
      ]
    },
    {
      state: "West Bengal",
      coords: [
        [22.57,88.36],
        [26.72,88.43]
      ]
    },
    {
      state: "Telangana",
      coords: [
        [17.38,78.48],
        [18.67,78.10]
      ]
    }
  ];

  const trucks = [];

  regions.forEach((region, rIdx) => {
    region.coords.forEach((coord, cIdx) => {

      for (let i = 0; i < 12; i++) { // ~150–200 trucks total
        trucks.push({
          id: `TK-${rIdx}${cIdx}${i}`,
          state: region.state,
          district: `Zone ${cIdx}`,

          // realistic spread
          lat: coord[0] + (Math.random() - 0.5) * 0.25,
          lng: coord[1] + (Math.random() - 0.5) * 0.25,

          status: ["COLLECTING","IN_TRANSIT","AT_FACILITY","IDLE"][Math.floor(Math.random()*4)],
          waste: +(Math.random()*5).toFixed(1),
          worker: "Worker " + i,
          contractor: "Contractor " + rIdx,
          lastUpdate: Math.floor(Math.random()*10) + "m ago",
          anomaly: Math.random() < 0.12,
          route: "R-" + i,
          capacity: 5
        });
      }

    });
  });

  return trucks;
}

const TRUCKS = generateTrucks();

const STATUS_CONFIG = {
  COLLECTING:   { color: "#22c55e", label: "Collecting",  bg: "rgba(34,197,94,0.15)"   },
  IN_TRANSIT:   { color: "#3b82f6", label: "In Transit",  bg: "rgba(59,130,246,0.15)"  },
  AT_FACILITY:  { color: "#8b5cf6", label: "At Facility", bg: "rgba(139,92,246,0.15)"  },
  IDLE:         { color: "#6b7280", label: "Idle",        bg: "rgba(107,114,128,0.15)" },
};

// ─── Truck side panel ─────────────────────────────────────────────────────────
function TruckPanel({ truck, onClose }) {
  const cfg = STATUS_CONFIG[truck.status];
  const pct = (truck.waste / truck.capacity) * 100;
  return (
    <div style={{
      position: "absolute", right: 20, top: 80, width: 300, zIndex: 1000,
      background: "rgba(10,20,15,0.97)", backdropFilter: "blur(20px)",
      border: `1px solid ${truck.anomaly ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.1)"}`,
      borderRadius: 16, overflow: "hidden", animation: "slideIn 0.25s ease",
      fontFamily: "'DM Sans',sans-serif", color: "#fff",
    }}>
      {/* Header */}
      <div style={{ padding: "16px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)",
        background: truck.anomaly ? "rgba(239,68,68,0.05)" : "rgba(255,255,255,0.02)",
        display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
            <TruckIcon size={15} color={cfg.color} />
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16 }}>{truck.id}</span>
            {truck.anomaly && (
              <span style={{ fontSize: 9, background: "rgba(239,68,68,0.2)", color: "#ef4444",
                padding: "2px 7px", borderRadius: 99, fontWeight: 700, letterSpacing: "0.05em" }}>
                ⚠ {truck.anomalyType?.replace(/_/g, " ")}
              </span>
            )}
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6,
            padding: "3px 10px", borderRadius: 99, background: cfg.bg,
            border: `1px solid ${cfg.color}33` }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.color,
              boxShadow: `0 0 6px ${cfg.color}` }} />
            <span style={{ fontSize: 11, color: cfg.color, fontWeight: 600 }}>{cfg.label}</span>
          </div>
        </div>
        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.07)", border: "none",
          cursor: "pointer", padding: 6, borderRadius: 8, color: "rgba(255,255,255,0.5)",
          display: "flex", alignItems: "center" }}>
          <X size={14} />
        </button>
      </div>

      {/* Capacity bar */}
      <div style={{ padding: "12px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Waste Capacity</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: pct > 85 ? "#f59e0b" : "#22c55e" }}>
            {truck.waste}t / {truck.capacity}t
          </span>
        </div>
        <div style={{ height: 5, background: "rgba(255,255,255,0.08)", borderRadius: 99 }}>
          <div style={{ width: `${pct}%`, height: "100%", borderRadius: 99,
            background: pct > 85 ? "linear-gradient(90deg,#f59e0b,#ef4444)" : "linear-gradient(90deg,#22c55e,#3b82f6)" }} />
        </div>
      </div>

      {/* Details */}
      <div style={{ padding: "12px 18px" }}>
        {[
          [User,      "Worker",      truck.worker],
          [Building2, "Contractor",  truck.contractor],
          [Navigation,"Route",       truck.route],
          [Package,   "District",    `${truck.district}, ${truck.state}`],
          [Clock,     "Last Update", truck.lastUpdate],
        ].map(([Icon, label, val]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center",
              justifyContent: "center", flexShrink: 0 }}>
              <Icon size={12} color="rgba(255,255,255,0.4)" />
            </div>
            <div>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{label}</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 1 }}>{val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ padding: "0 18px 16px", display: "flex", gap: 8 }}>
        <button style={{ flex: 1, padding: "8px 0", borderRadius: 8,
          border: "1px solid rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.07)",
          color: "#22c55e", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Track Batch</button>
        <button style={{ flex: 1, padding: "8px 0", borderRadius: 8,
          border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.07)",
          color: "#ef4444", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Flag Anomaly</button>
      </div>
    </div>
  );
}

// ─── Main map view ────────────────────────────────────────────────────────────
export default function MapView() {
  const mapRef    = useRef(null);
  const leafletRef = useRef(null);   // Leaflet map instance
  const markersRef = useRef([]);     // array of L.marker
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [showHeatmap, setShowHeatmap]     = useState(false);
  const [search, setSearch]               = useState("");
  const [filterStatus, setFilterStatus]   = useState("ALL");
  const [leafletReady, setLeafletReady]   = useState(false);
  const heatLayerRef = useRef(null);
  const selectedRef  = useRef(null);  // keep track for closure

  // Keep selectedRef in sync
  useEffect(() => { selectedRef.current = selectedTruck; }, [selectedTruck]);

  // ── Load Leaflet dynamically ──────────────────────────────────────────────
  useEffect(() => {
    if (window.L) { setLeafletReady(true); return; }

    const linkCSS = document.createElement("link");
    linkCSS.rel  = "stylesheet";
    linkCSS.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(linkCSS);

    const script  = document.createElement("script");
    script.src    = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setLeafletReady(true);
    document.head.appendChild(script);
  }, []);

  // ── Init map once Leaflet is ready ────────────────────────────────────────
  useEffect(() => {
    if (!leafletReady || leafletRef.current) return;

    const L = window.L;
    const map = L.map(mapRef.current, {
      center: [22, 82], zoom: 5,
      zoomControl: false,
      attributionControl: false,
    });

    // Dark tile layer
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      { maxZoom: 18 }
    ).addTo(map);

    // Custom zoom control
    L.control.zoom({ position: "bottomright" }).addTo(map);

    leafletRef.current = map;

    // Build markers
    buildMarkers(TRUCKS, map, L);
  }, [leafletReady]);

  // ── Rebuild markers when filter changes ──────────────────────────────────
  useEffect(() => {
    if (!leafletRef.current || !leafletReady) return;
    const L = window.L;
    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const filtered = TRUCKS.filter(t => {
      const ms = filterStatus === "ALL" || t.status === filterStatus;
      const ms2 = !search || t.id.toLowerCase().includes(search.toLowerCase()) ||
        t.worker.toLowerCase().includes(search.toLowerCase());
      return ms && ms2;
    });
    buildMarkers(filtered, leafletRef.current, L);
  }, [filterStatus, search, leafletReady]);

  // ── Heatmap layer toggle ──────────────────────────────────────────────────
  useEffect(() => {
    if (!leafletRef.current || !leafletReady) return;
    const L = window.L;
    if (heatLayerRef.current) {
      heatLayerRef.current.remove();
      heatLayerRef.current = null;
    }
    if (showHeatmap) {
      // Draw colored circles as "heatmap" (no plugin needed)
      const heatGroup = L.layerGroup();
      const hotspots = [
        { lat: 19.1, lng: 72.9, r: 60000, color: "#ef4444" },  // Mumbai high
        { lat: 28.7, lng: 77.2, r: 45000, color: "#f59e0b" },  // Delhi medium
        { lat: 12.9, lng: 77.6, r: 50000, color: "#ef4444" },  // Bangalore high
        { lat: 23.0, lng: 72.6, r: 40000, color: "#f59e0b" },  // Ahmedabad medium
        { lat: 13.1, lng: 80.3, r: 30000, color: "#22c55e" },  // Chennai low
        { lat: 22.6, lng: 88.4, r: 35000, color: "#22c55e" },  // Kolkata low
        { lat: 17.4, lng: 78.5, r: 30000, color: "#22c55e" },  // Hyderabad low
      ];
      hotspots.forEach(h => {
        L.circle([h.lat, h.lng], {
          radius: h.r, color: h.color, fillColor: h.color,
          fillOpacity: 0.18, weight: 1, opacity: 0.35,
        }).addTo(heatGroup);
      });
      heatGroup.addTo(leafletRef.current);
      heatLayerRef.current = heatGroup;
    }
  }, [showHeatmap, leafletReady]);

  function buildMarkers(trucks, map, L) {
    trucks.forEach(truck => {
      const cfg = STATUS_CONFIG[truck.status];

      // SVG icon
      const svgIcon = `
        <svg width="32" height="38" viewBox="0 0 32 38" xmlns="http://www.w3.org/2000/svg">
          <filter id="shadow"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.5"/></filter>
          <circle cx="16" cy="14" r="13" fill="${truck.anomaly ? "#1a0a0a" : "#0d1b2a"}" 
            stroke="${truck.anomaly ? "#ef4444" : cfg.color}" stroke-width="2" filter="url(#shadow)"/>
          ${truck.anomaly
            ? `<circle cx="16" cy="14" r="13" fill="${cfg.color}00" stroke="#ef4444" stroke-width="1.5" opacity="0.4"><animate attributeName="r" values="13;17;13" dur="1.5s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.4;0;0.4" dur="1.5s" repeatCount="indefinite"/></circle>`
            : ""}
          <g transform="translate(6,4)" fill="none" stroke="${cfg.color}" stroke-width="1.5" stroke-linecap="round">
            <rect x="1" y="5" width="14" height="9" rx="1.5"/>
            <path d="M10 5V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v2"/>
            <circle cx="4.5" cy="14.5" r="1.5" fill="${cfg.color}"/>
            <circle cx="11.5" cy="14.5" r="1.5" fill="${cfg.color}"/>
          </g>
          ${truck.anomaly
            ? `<circle cx="24" cy="6" r="5" fill="#ef4444" stroke="#0a1a0f" stroke-width="1.5"/>
               <text x="24" y="10" text-anchor="middle" font-size="7" font-weight="800" fill="white">!</text>`
            : ""}
          <path d="M16 27 L16 35" stroke="${cfg.color}" stroke-width="1.5" opacity="0.5"/>
        </svg>`;

      const icon = L.divIcon({
        html: svgIcon,
        iconSize: [32, 38],
        iconAnchor: [16, 38],
        className: "",
      });

      const marker = L.marker([truck.lat, truck.lng], { icon });

      // Hover tooltip
      marker.bindTooltip(`
        <div style="
          background:rgba(10,20,15,0.97);border:1px solid rgba(255,255,255,0.12);
          border-radius:10px;padding:10px 12px;font-family:'DM Sans',sans-serif;color:#fff;
          min-width:180px;box-shadow:0 8px 24px rgba(0,0,0,0.5);
        ">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <span style="font-weight:700;font-size:14px;letter-spacing:0.02em">${truck.id}</span>
            ${truck.anomaly ? `<span style="font-size:9px;background:rgba(239,68,68,0.2);color:#ef4444;padding:2px 7px;border-radius:99px;font-weight:700">⚠ ANOMALY</span>` : ""}
          </div>
          <div style="display:flex;align-items:center;gap:5px;margin-bottom:8px">
            <div style="width:7px;height:7px;border-radius:50%;background:${cfg.color};box-shadow:0 0 5px ${cfg.color}"></div>
            <span style="font-size:11px;color:${cfg.color};font-weight:600">${cfg.label}</span>
          </div>
          <div style="font-size:11px;color:rgba(255,255,255,0.5);line-height:1.7">
            <div>👤 ${truck.worker}</div>
            <div>🏢 ${truck.contractor}</div>
            <div>📍 ${truck.district}</div>
            <div>🗺️ Route: ${truck.route}</div>
            <div>📦 ${truck.waste}t / ${truck.capacity}t capacity</div>
            <div>🕐 ${truck.lastUpdate}</div>
          </div>
        </div>`,
        {
          permanent: false,
          direction: "top",
          offset: [0, -38],
          opacity: 1,
          className: "leaflet-custom-tooltip",
        }
      );

      // Click → open panel
      marker.on("click", () => {
        setSelectedTruck(prev => prev?.id === truck.id ? null : truck);
      });

      marker.addTo(map);
      markersRef.current.push(marker);
    });
  }

  const anomalyCount = TRUCKS.filter(t => t.anomaly).length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }
        @keyframes slideIn { from { opacity:0; transform:translateX(16px); } to { opacity:1; transform:translateX(0); } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(8px); }  to { opacity:1; transform:translateY(0); } }
        @keyframes pulse   { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        /* Override Leaflet tooltip style */
        .leaflet-custom-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .leaflet-custom-tooltip::before { display: none !important; }
        .leaflet-tooltip-top.leaflet-custom-tooltip::before { display: none !important; }
        /* Dark map tiles already handle background */
        .leaflet-container { background: #0a1628 !important; }
      `}</style>

      <div style={{
        height: "100vh", width: "100%",
        background: "linear-gradient(135deg,#0a1a0f 0%,#0d1b2a 50%,#0a1628 100%)",
        fontFamily: "'DM Sans',sans-serif", color: "#fff",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>

        {/* Topbar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 24px", height: 60,
          background: "rgba(0,0,0,0.45)", backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0, zIndex: 2000 }}>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <TruckIcon size={18} color="#22c55e" />
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16 }}>India Fleet Map</span>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 16 }}>
            {[
              { label: "Trucks",    val: TRUCKS.length,   color: "#3b82f6" },
              { label: "Anomalies", val: anomalyCount,    color: "#ef4444" },
              { label: "Complaints",val: 67,              color: "#f59e0b" },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 7,
                padding: "5px 14px", borderRadius: 99,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.color }} />
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{s.label}:</span>
                <span style={{ fontSize: 12, color: s.color, fontWeight: 700 }}>{s.val}</span>
              </div>
            ))}
          </div>

          {/* Controls */}
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ position: "relative" }}>
              <Search size={12} color="rgba(255,255,255,0.35)"
                style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search truck / worker…"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8, padding: "7px 10px 7px 28px", color: "#fff", fontSize: 12,
                  outline: "none", width: 180 }} />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8, padding: "7px 10px", color: "rgba(255,255,255,0.7)",
                fontSize: 12, outline: "none", cursor: "pointer" }}>
              <option value="ALL">All Status</option>
              <option value="COLLECTING">Collecting</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="AT_FACILITY">At Facility</option>
              <option value="IDLE">Idle</option>
            </select>
            <button onClick={() => setShowHeatmap(h => !h)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
                borderRadius: 8,
                border: showHeatmap ? "1px solid rgba(245,158,11,0.5)" : "1px solid rgba(255,255,255,0.1)",
                background: showHeatmap ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.04)",
                color: showHeatmap ? "#f59e0b" : "rgba(255,255,255,0.6)",
                cursor: "pointer", fontSize: 12, fontWeight: 500, transition: "all 0.2s" }}>
              <Thermometer size={13} /> Heatmap
            </button>
          </div>
        </div>

        {/* Map + sidebar */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

          {/* Map container */}
          <div style={{ flex: 1, position: "relative" }}>
            <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

            {/* Truck detail panel */}
            {selectedTruck && (
              <TruckPanel truck={selectedTruck} onClose={() => setSelectedTruck(null)} />
            )}

            {/* Legend */}
            <div style={{
              position: "absolute", bottom: 30, left: 16, zIndex: 1000,
              background: "rgba(10,20,15,0.92)", backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 16px",
            }}>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 600,
                letterSpacing: "0.08em", marginBottom: 8 }}>TRUCK STATUS</p>
              {Object.entries(STATUS_CONFIG).map(([, cfg]) => (
                <div key={cfg.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color,
                    boxShadow: `0 0 4px ${cfg.color}` }} />
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>{cfg.label}</span>
                </div>
              ))}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", marginTop: 7, paddingTop: 7 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444",
                    animation: "pulse 1.5s infinite" }} />
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>Anomaly flagged</span>
                </div>
              </div>
              {showHeatmap && (
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", marginTop: 7, paddingTop: 7 }}>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 6 }}>COMPLAINT HEAT</p>
                  {[
                    { color: "rgba(239,68,68,0.7)",  label: "High density"   },
                    { color: "rgba(245,158,11,0.6)", label: "Medium density" },
                    { color: "rgba(34,197,94,0.5)",  label: "Low density"    },
                  ].map(h => (
                    <div key={h.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <div style={{ width: 14, height: 8, borderRadius: 2, background: h.color }} />
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{h.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar — truck list */}
          <div style={{ width: 240, background: "rgba(0,0,0,0.35)",
            borderLeft: "1px solid rgba(255,255,255,0.06)",
            display: "flex", flexDirection: "column", overflow: "hidden", zIndex: 1000 }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13 }}>Live Fleet</h3>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
                {TRUCKS.length} trucks tracked
              </p>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
              {TRUCKS
                .filter(t => filterStatus === "ALL" || t.status === filterStatus)
                .filter(t => !search || t.id.toLowerCase().includes(search.toLowerCase()) || t.worker.toLowerCase().includes(search.toLowerCase()))
                .map((truck, i) => {
                  const cfg = STATUS_CONFIG[truck.status];
                  return (
                    <div key={truck.id}
                      onClick={() => setSelectedTruck(prev => prev?.id === truck.id ? null : truck)}
                      style={{
                        padding: "10px 12px", borderRadius: 10, marginBottom: 6, cursor: "pointer",
                        background: selectedTruck?.id === truck.id ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.02)",
                        border: selectedTruck?.id === truck.id ? "1px solid rgba(34,197,94,0.3)" :
                          truck.anomaly ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(255,255,255,0.05)",
                        transition: "all 0.2s",
                        animation: `fadeUp 0.35s ease ${i * 30}ms both`,
                      }}
                      onMouseEnter={e => { if (selectedTruck?.id !== truck.id) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                      onMouseLeave={e => { if (selectedTruck?.id !== truck.id) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "'Syne',sans-serif" }}>{truck.id}</span>
                        {truck.anomaly && <AlertTriangle size={12} color="#ef4444" />}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.color }} />
                        <span style={{ fontSize: 10, color: cfg.color }}>{cfg.label}</span>
                      </div>
                      <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                        {truck.district} · {truck.waste}t
                      </p>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}