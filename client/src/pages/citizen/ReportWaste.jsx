import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGeolocation } from "../../hooks/useGeolocation";
import axiosInstance from "../../lib/axios";

// ─────────────────────────────────────────────────────────────────────────────
//  ReportWaste.jsx
//  - runAICheck() calls POST /ai/validate-image  (real backend, not hardcoded)
//  - handleSubmit() surfaces the real FastAPI error on failure
//  - AI rejection shown inline; user must upload a different photo
// ─────────────────────────────────────────────────────────────────────────────

const WASTE_TYPES = [
  { value: "PLASTIC", label: "Plastic", icon: "🧴", color: "#3b82f6" },
  { value: "ORGANIC", label: "Organic", icon: "🍃", color: "#22c55e" },
  { value: "PAPER",   label: "Paper",   icon: "📄", color: "#f59e0b" },
  { value: "E_WASTE", label: "E-Waste", icon: "🔋", color: "#ef4444" },
  { value: "MIXED",   label: "Mixed",   icon: "🗑️", color: "#8b5cf6" },
];

// ── Shared helpers ────────────────────────────────────────────────────────────

function extractError(err) {
  if (!err.response) {
    if (err.code === "ECONNABORTED" || err.message?.includes("timeout"))
      return "Request timed out — the AI model may still be loading. Please retry.";
    return `Network error — cannot reach the server. Check your backend is running. (${err.message})`;
  }
  const { status, data: d } = err.response;
  if (typeof d === "string" && d.length < 400) return d;
  if (d?.detail && typeof d.detail === "string") return d.detail;
  if (d?.message && typeof d.message === "string") return d.message;
  if (Array.isArray(d?.detail))
    return d.detail.map(e => `${e.loc?.join?.(".")}: ${e.msg}`).join(" | ");
  if (status === 503) return "Ollama is not running. Run: ollama serve";
  if (status === 504) return "AI timed out. The model may still be loading — retry in 30s.";
  if (status === 422) return "LLaVA not found in Ollama. Run: ollama pull llava";
  if (status === 413) return "Image too large — max 20 MB.";
  if (status === 400) return "Invalid file — upload a JPEG or PNG image.";
  return err.message || "Something went wrong. Please try again.";
}

function ScanLine({ color = "rgba(34,197,94,0.22)" }) {
  return (
    <div style={{ position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden",borderRadius:"inherit" }}>
      <div style={{ position:"absolute",left:0,right:0,height:1,
        background:`linear-gradient(90deg,transparent,${color},transparent)`,
        animation:"scanline 4s linear infinite" }} />
    </div>
  );
}

function Section({ children, accent, style: sx = {} }) {
  return (
    <div style={{ background:"rgba(255,255,255,0.018)",
      border:`1px solid ${accent ? accent+"22" : "rgba(255,255,255,0.06)"}`,
      borderRadius:16,padding:"20px 22px",position:"relative",overflow:"hidden",...sx }}>
      {accent && <div style={{ position:"absolute",top:0,left:0,right:0,height:2,
        background:`linear-gradient(90deg,${accent},transparent)` }} />}
      {children}
    </div>
  );
}

function StepDot({ n, done, color }) {
  return (
    <div style={{ width:26,height:26,borderRadius:"50%",
      background:done ? `${color}18` : "rgba(255,255,255,0.04)",
      border:`1.5px solid ${done ? color : "rgba(255,255,255,0.1)"}`,
      display:"flex",alignItems:"center",justifyContent:"center",
      fontSize:10,fontWeight:800,fontFamily:"'Syne',sans-serif",
      color:done ? color : "rgba(255,255,255,0.25)",
      transition:"all 0.4s",boxShadow:done ? `0 0 9px ${color}50` : "none",flexShrink:0 }}>
      {done ? "✓" : n}
    </div>
  );
}

function AICheckOverlay() {
  const steps = [
    "Sending image to AI…",
    "Detecting waste materials…",
    "Validating content…",
    "Finalising result…",
  ];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx(i => Math.min(i + 1, steps.length - 1)), 2500);
    return () => clearInterval(id);
  }, []);
  const pct = Math.round(((idx + 1) / steps.length) * 100);
  return (
    <div style={{ position:"absolute",inset:0,borderRadius:14,
      background:"rgba(6,14,9,0.94)",backdropFilter:"blur(8px)",
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      gap:16,zIndex:20 }}>
      <ScanLine color="rgba(34,197,94,0.35)" />
      <div style={{ position:"relative",width:68,height:68 }}>
        <svg width="68" height="68" style={{ transform:"rotate(-90deg)" }}>
          <circle cx="34" cy="34" r="28" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5"/>
          <circle cx="34" cy="34" r="28" fill="none" stroke="#22c55e" strokeWidth="5"
            strokeDasharray="176" strokeDashoffset={176 - (176 * pct / 100)} strokeLinecap="round"
            style={{ transition:"stroke-dashoffset 2.5s cubic-bezier(0.4,0,0.2,1)",
              filter:"drop-shadow(0 0 6px rgba(34,197,94,0.6))" }} />
        </svg>
        <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",
          justifyContent:"center",fontSize:26 }}>🧠</div>
      </div>
      <div style={{ textAlign:"center" }}>
        <p style={{ fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:14,
          color:"#fff",marginBottom:6 }}>AI Validating Image</p>
        <p key={idx} style={{ fontSize:11,color:"#22c55e",fontFamily:"'DM Mono',monospace",
          animation:"fadeUp 0.4s ease both" }}>{steps[idx]}</p>
      </div>
      <div style={{ width:180,height:4,borderRadius:99,background:"rgba(255,255,255,0.07)",overflow:"hidden" }}>
        <div style={{ height:"100%",borderRadius:99,
          background:"linear-gradient(90deg,#22c55e,#3b82f6)",
          width:`${pct}%`,transition:"width 2.5s cubic-bezier(0.4,0,0.2,1)" }} />
      </div>
    </div>
  );
}

function SuccessScreen({ data, onTrack }) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    let v = 0;
    const id = setInterval(() => { v += 2; setPct(Math.min(v, 100)); if (v >= 100) clearInterval(id); }, 20);
    return () => clearInterval(id);
  }, []);
  const circ = 2 * Math.PI * 54;
  return (
    <div style={{ maxWidth:520,margin:"0 auto",padding:"48px 24px",
      display:"flex",flexDirection:"column",alignItems:"center",animation:"floatIn 0.5s ease both" }}>
      <div style={{ position:"relative",width:128,height:128,marginBottom:24 }}>
        <svg width="128" height="128" style={{ transform:"rotate(-90deg)" }}>
          <circle cx="64" cy="64" r="54" fill="none" stroke="rgba(34,197,94,0.1)" strokeWidth="7"/>
          <circle cx="64" cy="64" r="54" fill="none" stroke="#22c55e" strokeWidth="7"
            strokeDasharray={circ} strokeDashoffset={circ - (circ * pct / 100)} strokeLinecap="round"
            style={{ transition:"stroke-dashoffset 0.03s linear",
              filter:"drop-shadow(0 0 10px rgba(34,197,94,0.55))" }} />
        </svg>
        <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",
          justifyContent:"center",fontSize:44 }}>✅</div>
      </div>
      <h2 style={{ fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:26,
        color:"#fff",marginBottom:8,textAlign:"center" }}>Report Submitted!</h2>
      <p style={{ fontSize:13,color:"rgba(255,255,255,0.4)",textAlign:"center",
        maxWidth:300,lineHeight:1.65,marginBottom:28,fontFamily:"'DM Mono',monospace" }}>
        Your waste batch is live and tracked. Show the QR code to your collector.
      </p>
      {data?.qr_base64 && (
        <div style={{ marginBottom:28,display:"flex",flexDirection:"column",alignItems:"center",gap:12 }}>
          <div style={{ padding:14,borderRadius:20,background:"#fff",
            boxShadow:"0 0 50px rgba(34,197,94,0.2)" }}>
            <img src={`data:image/png;base64,${data.qr_base64}`} alt="QR"
              style={{ width:168,height:168,display:"block" }} />
          </div>
          <div style={{ padding:"5px 14px",borderRadius:99,
            background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.25)",
            fontSize:11,color:"#22c55e",fontFamily:"'DM Mono',monospace" }}>
            {data.batch_id}
          </div>
        </div>
      )}
      <div style={{ width:"100%",background:"rgba(34,197,94,0.05)",
        border:"1px solid rgba(34,197,94,0.18)",borderRadius:14,
        padding:"16px 20px",marginBottom:24 }}>
        {[
          { icon:"📩", label:"Batch Created", val:"Confirmed" },
          { icon:"📍", label:"Location",      val:"GPS Locked" },
          { icon:"🔔", label:"Collector",     val:"Notified" },
          { icon:"♻️", label:"AI Validation", val:"Passed" },
        ].map((row, i) => (
          <div key={i} style={{ display:"flex",alignItems:"center",
            justifyContent:"space-between",padding:"6px 0",
            borderBottom:i < 3 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
            <div style={{ display:"flex",alignItems:"center",gap:8 }}>
              <span style={{ fontSize:13 }}>{row.icon}</span>
              <span style={{ fontSize:11,color:"rgba(255,255,255,0.4)",
                fontFamily:"'DM Mono',monospace" }}>{row.label}</span>
            </div>
            <span style={{ fontSize:11,color:"#22c55e",fontWeight:700,
              fontFamily:"'DM Mono',monospace" }}>{row.val}</span>
          </div>
        ))}
      </div>
      <button onClick={onTrack}
        style={{ width:"100%",padding:"15px 0",borderRadius:14,border:"none",
          background:"linear-gradient(135deg,#22c55e,#3b82f6)",color:"#000",
          fontSize:13,fontWeight:800,fontFamily:"'Syne',sans-serif",
          letterSpacing:"0.1em",cursor:"pointer",
          boxShadow:"0 8px 28px rgba(34,197,94,0.25)",transition:"all 0.2s" }}
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"}
        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
        TRACK MY BATCH →
      </button>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ReportWaste() {
  const navigate = useNavigate();
  const { location, loading: gpsLoading } = useGeolocation();
  const fileRef = useRef(null);

  const [mounted, setMounted]               = useState(false);
  const [wasteType, setWasteType]           = useState("");
  const [notes, setNotes]                   = useState("");
  const [photo, setPhoto]                   = useState(null);
  const [photoPreview, setPhotoPreview]     = useState(null);
  const [error, setError]                   = useState("");
  const [dragOver, setDragOver]             = useState(false);
  const [aiChecking, setAiChecking]         = useState(false);
  const [aiValid, setAiValid]               = useState(null);
  const [aiRejectReason, setAiRejectReason] = useState("");
  const [submitting, setSubmitting]         = useState(false);
  const [submitted, setSubmitted]           = useState(false);
  const [submitData, setSubmitData]         = useState(null);

  useEffect(() => { setTimeout(() => setMounted(true), 60); }, []);

  const pickFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    setAiValid(null);
    setAiRejectReason("");
    setError("");
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    setAiValid(null);
    setAiRejectReason("");
    setError("");
  };

  // ── Real AI validation via POST /ai/validate-image ──────────────────────────
  const runAICheck = async () => {
    if (!photo) return;
    setAiChecking(true);
    setAiValid(null);
    setAiRejectReason("");
    setError("");
    try {
      const fd = new FormData();
      fd.append("photo", photo);
      const res = await axiosInstance.post("/ai/validate-image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000,
      });
      const { is_waste_image, reason } = res.data;
      if (is_waste_image) {
        setAiValid(true);
      } else {
        setAiValid(false);
        setAiRejectReason(reason || "This does not appear to be a waste image.");
      }
    } catch (err) {
      setError(extractError(err));
      setAiValid(null);
    } finally {
      setAiChecking(false);
    }
  };

  // ── Submission ──────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!wasteType) return setError("Please select a waste type.");
    if (!photo)     return setError("Please upload a photo.");
    if (!aiValid)   return setError("Please validate your image with AI first.");
    setSubmitting(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("photo", photo);
      fd.append("waste_type", wasteType);
      fd.append("notes", notes);
      if (location) {
        fd.append("gps_lat", String(location.latitude));
        fd.append("gps_lng", String(location.longitude));
      }
      const res = await axiosInstance.post("/batch/citizen-create", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 30000,
      });
      setSubmitData(res.data);
      setSubmitted(true);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const gpsColor  = gpsLoading ? "#f59e0b" : location ? "#22c55e" : "#ef4444";
  const canSubmit = !!(wasteType && photo && aiValid && !submitting);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
        @keyframes scanline { 0%{top:-1px} 100%{top:100%} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes floatIn  { from{opacity:0;transform:translateY(18px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes glow     { 0%,100%{box-shadow:0 0 8px rgba(34,197,94,0.3)} 50%{box-shadow:0 0 20px rgba(34,197,94,0.65)} }
        @keyframes shimmer  { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes ping     { 0%{transform:scale(1);opacity:.8} 100%{transform:scale(2);opacity:0} }
        @keyframes waveIn   { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:translateX(0)} }
        @keyframes spin     { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @keyframes aiBounce { 0%,100%{transform:scale(1)} 50%{transform:scale(1.03)} }
      `}</style>

      <div style={{ maxWidth:640,margin:"0 auto",padding:"24px 20px 60px",
        opacity:mounted?1:0,transition:"opacity 0.4s ease",fontFamily:"'DM Sans',sans-serif" }}>

        {submitted ? (
          <SuccessScreen
            data={submitData}
            onTrack={() => navigate(`/citizen/track-batch/${submitData?.batch_id}`)}
          />
        ) : (<>

          {/* Header */}
          <div style={{ marginBottom:28,animation:"fadeUp 0.5s ease both" }}>
            <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:8 }}>
              <div style={{ width:7,height:7,borderRadius:"50%",background:"#22c55e",animation:"glow 2s infinite" }} />
              <span style={{ fontSize:10,color:"rgba(255,255,255,0.3)",fontFamily:"'DM Mono',monospace",letterSpacing:"0.1em" }}>WASTE REPORT · LIVE</span>
            </div>
            <h1 style={{ fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:26,letterSpacing:"-0.02em",
              background:"linear-gradient(90deg,#fff 30%,rgba(255,255,255,0.45))",
              WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>Report Waste</h1>
          </div>

          {/* GPS */}
          <div style={{ marginBottom:14,animation:"floatIn 0.5s ease 0.07s both" }}>
            <Section accent={gpsColor}>
              <ScanLine />
              <div style={{ display:"flex",alignItems:"center",gap:12 }}>
                <div style={{ width:36,height:36,borderRadius:10,background:`${gpsColor}12`,
                  border:`1px solid ${gpsColor}22`,display:"flex",alignItems:"center",justifyContent:"center" }}>
                  <span style={{ fontSize:16 }}>📍</span>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:2 }}>
                    <span style={{ position:"relative",display:"inline-flex" }}>
                      {(gpsLoading||location) && <span style={{ position:"absolute",width:7,height:7,borderRadius:"50%",background:gpsColor,opacity:.5,animation:"ping 1.2s ease-out infinite" }} />}
                      <span style={{ width:7,height:7,borderRadius:"50%",background:gpsColor,display:"inline-block" }} />
                    </span>
                    <span style={{ fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.55)",fontFamily:"'DM Mono',monospace",letterSpacing:"0.08em" }}>GPS LOCATION</span>
                  </div>
                  <p style={{ fontSize:11,color:gpsColor,fontFamily:"'DM Mono',monospace" }}>
                    {gpsLoading?"Detecting…":location?`${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`:"GPS unavailable"}
                  </p>
                </div>
                <div style={{ padding:"3px 10px",borderRadius:99,fontSize:9,fontWeight:700,background:`${gpsColor}12`,color:gpsColor,border:`1px solid ${gpsColor}28`,fontFamily:"'DM Mono',monospace" }}>
                  {gpsLoading?"SEARCHING":location?"LOCKED":"OFFLINE"}
                </div>
              </div>
            </Section>
          </div>

          {/* Photo + AI Validation */}
          <div style={{ marginBottom:14,animation:"floatIn 0.5s ease 0.13s both" }}>
            <Section accent="#3b82f6">
              <div style={{ display:"flex",alignItems:"center",gap:9,marginBottom:14 }}>
                <StepDot n="1" done={!!aiValid} color="#3b82f6" />
                <span style={{ fontSize:10,fontWeight:700,letterSpacing:"0.1em",color:"rgba(255,255,255,0.45)",fontFamily:"'DM Mono',monospace" }}>
                  PHOTO OF WASTE <span style={{ color:"#3b82f6" }}>*</span>
                </span>
                {aiValid === true  && <span style={{ marginLeft:"auto",fontSize:9,color:"#22c55e",fontFamily:"'DM Mono',monospace",background:"rgba(34,197,94,0.1)",padding:"2px 8px",borderRadius:99,border:"1px solid rgba(34,197,94,0.25)" }}>AI VALIDATED ✓</span>}
                {aiValid === false && <span style={{ marginLeft:"auto",fontSize:9,color:"#ef4444",fontFamily:"'DM Mono',monospace",background:"rgba(239,68,68,0.1)",padding:"2px 8px",borderRadius:99,border:"1px solid rgba(239,68,68,0.25)" }}>REJECTED ✕</span>}
              </div>

              <div
                onClick={() => !aiChecking && fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); pickFile(e.dataTransfer.files?.[0]); }}
                style={{ border:`2px dashed ${dragOver?"#3b82f6":aiValid===true?"rgba(34,197,94,0.45)":aiValid===false?"rgba(239,68,68,0.4)":photo?"rgba(59,130,246,0.35)":"rgba(255,255,255,0.09)"}`,
                  borderRadius:14,minHeight:180,display:"flex",flexDirection:"column",
                  alignItems:"center",justifyContent:"center",cursor:aiChecking?"default":"pointer",
                  transition:"all 0.3s",background:dragOver?"rgba(59,130,246,0.05)":photo?"rgba(34,197,94,0.02)":"rgba(255,255,255,0.01)",
                  position:"relative",overflow:"hidden" }}>
                {aiChecking && <AICheckOverlay />}
                {photoPreview ? (<>
                  <img src={photoPreview} alt="Preview" style={{ maxHeight:190,maxWidth:"100%",borderRadius:10,objectFit:"cover",opacity:aiChecking?0.2:1,transition:"opacity 0.3s" }} />
                  {!aiChecking && (
                    <div style={{ position:"absolute",bottom:8,right:8,padding:"3px 9px",borderRadius:99,fontSize:9,fontWeight:700,
                      background:aiValid===true?"rgba(34,197,94,0.18)":aiValid===false?"rgba(239,68,68,0.18)":"rgba(59,130,246,0.18)",
                      color:aiValid===true?"#22c55e":aiValid===false?"#ef4444":"#3b82f6",
                      border:`1px solid ${aiValid===true?"rgba(34,197,94,0.3)":aiValid===false?"rgba(239,68,68,0.3)":"rgba(59,130,246,0.3)"}`,
                      fontFamily:"'DM Mono',monospace" }}>
                      {aiValid===true?"✓ VALIDATED":aiValid===false?"✕ REJECTED":"READY TO VALIDATE"}
                    </div>
                  )}
                </>) : (
                  <div style={{ textAlign:"center",padding:"20px 0" }}>
                    <div style={{ fontSize:36,marginBottom:10 }}>📷</div>
                    <p style={{ fontSize:13,color:"rgba(255,255,255,0.4)",marginBottom:3 }}>{dragOver?"Drop it here":"Click or drag to upload"}</p>
                    <p style={{ fontSize:10,color:"rgba(255,255,255,0.18)",fontFamily:"'DM Mono',monospace",letterSpacing:"0.07em" }}>JPG · PNG · max 20 MB</p>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={e => pickFile(e.target.files?.[0])} />

              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:10,minHeight:32 }}>
                {photo && !aiChecking && (
                  <button onClick={removePhoto} style={{ fontSize:11,color:"#ef4444",background:"none",border:"none",cursor:"pointer",fontFamily:"'DM Mono',monospace",opacity:0.6,transition:"opacity 0.2s" }}
                    onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0.6}>
                    ✕ REMOVE
                  </button>
                )}
                {photo && !aiChecking && aiValid === null && (
                  <button onClick={runAICheck}
                    style={{ marginLeft:"auto",padding:"8px 16px",borderRadius:10,background:"linear-gradient(135deg,rgba(34,197,94,0.15),rgba(59,130,246,0.15))",color:"#22c55e",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'DM Mono',monospace",border:"1px solid rgba(34,197,94,0.3)",transition:"all 0.2s",letterSpacing:"0.06em",animation:"aiBounce 2s ease infinite" }}
                    onMouseEnter={e=>e.currentTarget.style.background="linear-gradient(135deg,rgba(34,197,94,0.25),rgba(59,130,246,0.25))"}
                    onMouseLeave={e=>e.currentTarget.style.background="linear-gradient(135deg,rgba(34,197,94,0.15),rgba(59,130,246,0.15))"}>
                    🧠 VALIDATE WITH AI
                  </button>
                )}
                {photo && !aiChecking && aiValid === false && (
                  <button onClick={removePhoto}
                    style={{ marginLeft:"auto",padding:"8px 16px",borderRadius:10,background:"rgba(239,68,68,0.1)",color:"#ef4444",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'DM Mono',monospace",border:"1px solid rgba(239,68,68,0.3)",transition:"all 0.2s",letterSpacing:"0.06em" }}>
                    ↺ UPLOAD DIFFERENT PHOTO
                  </button>
                )}
              </div>

              {aiValid === false && aiRejectReason && (
                <div style={{ marginTop:10,padding:"11px 14px",borderRadius:12,background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.3)",animation:"fadeUp 0.3s ease both",display:"flex",alignItems:"flex-start",gap:9 }}>
                  <span style={{ fontSize:16,flexShrink:0 }}>🚫</span>
                  <div>
                    <p style={{ fontSize:12,fontWeight:700,color:"#ef4444",fontFamily:"'Syne',sans-serif",marginBottom:4 }}>Not a Waste Image</p>
                    <p style={{ fontSize:11,color:"rgba(255,255,255,0.5)",fontFamily:"'DM Mono',monospace",lineHeight:1.6 }}>{aiRejectReason}</p>
                  </div>
                </div>
              )}
            </Section>
          </div>

          {/* Waste type */}
          <div style={{ marginBottom:14,animation:"floatIn 0.5s ease 0.19s both" }}>
            <Section accent="#22c55e">
              <div style={{ display:"flex",alignItems:"center",gap:9,marginBottom:14 }}>
                <StepDot n="2" done={!!wasteType} color="#22c55e" />
                <span style={{ fontSize:10,fontWeight:700,letterSpacing:"0.1em",color:"rgba(255,255,255,0.45)",fontFamily:"'DM Mono',monospace" }}>WASTE TYPE <span style={{ color:"#22c55e" }}>*</span></span>
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8 }}>
                {WASTE_TYPES.map((t, i) => {
                  const active = wasteType === t.value;
                  return (
                    <button key={t.value} onClick={() => { setWasteType(t.value); setError(""); }}
                      style={{ padding:"12px 4px",borderRadius:12,border:`1.5px solid ${active?t.color:"rgba(255,255,255,0.07)"}`,background:active?`${t.color}12`:"rgba(255,255,255,0.02)",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:6,transition:"all 0.25s cubic-bezier(0.4,0,0.2,1)",transform:active?"translateY(-3px) scale(1.04)":"none",boxShadow:active?`0 6px 20px ${t.color}25`:"none",animation:`waveIn 0.4s ease ${i*0.06}s both`,position:"relative",overflow:"hidden" }}>
                      {active && <div style={{ position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${t.color},transparent)` }} />}
                      <span style={{ fontSize:22 }}>{t.icon}</span>
                      <span style={{ fontSize:9,fontWeight:700,letterSpacing:"0.07em",fontFamily:"'DM Mono',monospace",color:active?t.color:"rgba(255,255,255,0.3)",transition:"color 0.25s" }}>{t.label.toUpperCase()}</span>
                    </button>
                  );
                })}
              </div>
            </Section>
          </div>

          {/* Notes */}
          <div style={{ marginBottom:14,animation:"floatIn 0.5s ease 0.25s both" }}>
            <Section accent="#8b5cf6">
              <div style={{ display:"flex",alignItems:"center",gap:9,marginBottom:12 }}>
                <StepDot n="3" done={notes.length > 0} color="#8b5cf6" />
                <span style={{ fontSize:10,fontWeight:700,letterSpacing:"0.1em",color:"rgba(255,255,255,0.45)",fontFamily:"'DM Mono',monospace" }}>NOTES <span style={{ color:"rgba(255,255,255,0.22)",fontWeight:400 }}>optional</span></span>
              </div>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Bag near the gate, extra large load…" rows={3}
                style={{ width:"100%",background:"rgba(0,0,0,0.35)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:"11px 13px",fontSize:13,color:"rgba(255,255,255,0.75)",fontFamily:"'DM Sans',sans-serif",resize:"none",outline:"none",transition:"border-color 0.2s, box-shadow 0.2s",boxSizing:"border-box" }}
                onFocus={e=>{e.target.style.borderColor="rgba(139,92,246,0.4)";e.target.style.boxShadow="0 0 0 3px rgba(139,92,246,0.08)";}}
                onBlur={e=>{e.target.style.borderColor="rgba(255,255,255,0.07)";e.target.style.boxShadow="none";}} />
            </Section>
          </div>

          {/* Error */}
          {error && (
            <div style={{ marginBottom:14,padding:"11px 15px",borderRadius:12,background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.25)",display:"flex",alignItems:"flex-start",gap:9,animation:"fadeUp 0.3s ease both" }}>
              <span style={{ flexShrink:0 }}>⚠️</span>
              <p style={{ fontSize:12,color:"#fca5a5",fontFamily:"'DM Mono',monospace",lineHeight:1.6 }}>{error}</p>
            </div>
          )}

          {/* Submit */}
          <button onClick={handleSubmit} disabled={!canSubmit}
            style={{ width:"100%",padding:"16px 0",borderRadius:16,border:"none",cursor:canSubmit?"pointer":"not-allowed",fontSize:13,fontWeight:800,letterSpacing:"0.1em",fontFamily:"'Syne',sans-serif",color:canSubmit?"#000":"rgba(255,255,255,0.2)",background:canSubmit?"linear-gradient(135deg,#22c55e 0%,#3b82f6 100%)":"rgba(255,255,255,0.04)",boxShadow:canSubmit?"0 8px 28px rgba(34,197,94,0.22)":"none",transition:"all 0.3s",display:"flex",alignItems:"center",justifyContent:"center",gap:10,position:"relative",overflow:"hidden",animation:"floatIn 0.5s ease 0.31s both" }}
            onMouseEnter={e=>{if(canSubmit){e.currentTarget.style.transform="scale(1.02)";e.currentTarget.style.boxShadow="0 12px 36px rgba(34,197,94,0.3)";}}}
            onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.boxShadow=canSubmit?"0 8px 28px rgba(34,197,94,0.22)":"none";}}>
            {canSubmit && !submitting && <div style={{ position:"absolute",inset:0,background:"linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.15) 50%,transparent 70%)",backgroundSize:"200% auto",animation:"shimmer 3s linear infinite" }} />}
            {submitting ? (<><div style={{ width:14,height:14,border:"2px solid rgba(0,0,0,0.3)",borderTopColor:"#000",borderRadius:"50%",animation:"spin 0.7s linear infinite" }} />SUBMITTING…</>) : "SUBMIT WASTE REPORT →"}
          </button>
          <p style={{ textAlign:"center",marginTop:10,fontSize:10,color:"rgba(255,255,255,0.18)",fontFamily:"'DM Mono',monospace",letterSpacing:"0.06em" }}>
            {!aiValid ? "Step 1: validate photo · Step 2: pick type · Step 3: submit" : "You'll receive a QR code to show the collector"}
          </p>
        </>)}
      </div>
    </>
  );
}