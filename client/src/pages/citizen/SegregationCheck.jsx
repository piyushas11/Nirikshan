import { useState, useRef, useEffect } from "react";
import axiosInstance from "../../lib/axios";

// POST /ai/segregation-check → { is_waste_image, score, wrong_items, improvement_steps, summary }

function extractError(err) {
  if (!err.response) {
    if (err.code === "ECONNABORTED" || err.message?.includes("timeout"))
      return "Request timed out — LLaVA may still be loading. Wait 30s and retry.";
    return `Network error — cannot reach the backend. Check your server is running. (${err.message})`;
  }
  const { status, data: d } = err.response;
  if (typeof d === "string" && d.length < 400) return d;
  if (d?.detail && typeof d.detail === "string") return d.detail;
  if (d?.message && typeof d.message === "string") return d.message;
  if (Array.isArray(d?.detail)) return d.detail.map(e => e.msg).join(", ");
  if (status === 503) return "Ollama is not running. Start it with: ollama serve";
  if (status === 504) return "LLaVA timed out. Model may be loading — retry in 30s.";
  if (status === 422) return "LLaVA model not found. Run: ollama pull llava";
  if (status === 413) return "Image too large — max 20 MB.";
  if (status === 400) return "Invalid file — upload a JPEG or PNG image.";
  return err.message || "Analysis failed. Check Ollama is running and llava is pulled.";
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

function Label({ text, accent }) {
  return (
    <span style={{ fontSize:10,fontWeight:700,letterSpacing:"0.1em",color:"rgba(255,255,255,0.4)",fontFamily:"'DM Mono',monospace" }}>
      {text}{accent && <span style={{ color:accent }}> {accent}</span>}
    </span>
  );
}

function ScoreRing({ score, color }) {
  const [v, setV] = useState(0);
  const r = 52, circ = 2 * Math.PI * r;
  useEffect(() => {
    let cur = 0;
    const id = setInterval(() => { cur += 2; setV(Math.min(cur, score)); if (cur >= score) clearInterval(id); }, 18);
    return () => clearInterval(id);
  }, [score]);
  return (
    <div style={{ position:"relative",width:128,height:128,flexShrink:0 }}>
      <svg width="128" height="128" style={{ transform:"rotate(-90deg)" }}>
        <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8"/>
        <circle cx="64" cy="64" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={circ-(circ*v/100)} strokeLinecap="round"
          style={{ transition:"stroke-dashoffset 0.03s linear",filter:`drop-shadow(0 0 7px ${color}80)` }} />
      </svg>
      <div style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center" }}>
        <span style={{ fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:28,color,lineHeight:1 }}>{v}</span>
        <span style={{ fontSize:11,color:"rgba(255,255,255,0.3)",fontFamily:"'DM Mono',monospace" }}>/ 100</span>
      </div>
    </div>
  );
}

function Typewriter({ text, speed = 15 }) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    setShown(""); if (!text) return;
    let i = 0;
    const id = setInterval(() => { setShown(text.slice(0,i+1)); i++; if (i>=text.length) clearInterval(id); }, speed);
    return () => clearInterval(id);
  }, [text]);
  return (
    <span style={{ fontSize:12,color:"rgba(255,255,255,0.65)",fontFamily:"'DM Mono',monospace",lineHeight:1.75,whiteSpace:"pre-wrap" }}>
      {shown}
      {shown.length < (text||"").length && <span style={{ borderRight:"2px solid #22c55e",animation:"blink 0.7s step-end infinite" }} />}
    </span>
  );
}

function AnalysingOverlay() {
  const steps = ["Sending to LLaVA…","Detecting waste items…","Scoring segregation…","Generating report…"];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx(i => (i+1) % steps.length), 2000);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ position:"absolute",inset:0,borderRadius:14,background:"rgba(6,14,9,0.93)",backdropFilter:"blur(8px)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,zIndex:20 }}>
      <ScanLine color="rgba(34,197,94,0.35)" />
      <div style={{ position:"relative",width:64,height:64 }}>
        <svg width="64" height="64" style={{ transform:"rotate(-90deg)" }}>
          <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4"/>
          <circle cx="32" cy="32" r="26" fill="none" stroke="#22c55e" strokeWidth="4"
            strokeDasharray="163" strokeDashoffset="100" strokeLinecap="round"
            style={{ animation:"spinDash 1.4s linear infinite" }} />
        </svg>
        <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22 }}>♻️</div>
      </div>
      <div style={{ textAlign:"center" }}>
        <p style={{ fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:14,color:"#fff",marginBottom:6 }}>LLaVA Analysing</p>
        <p key={idx} style={{ fontSize:11,color:"#22c55e",fontFamily:"'DM Mono',monospace",animation:"fadeUp 0.4s ease both" }}>{steps[idx]}</p>
      </div>
      <div style={{ display:"flex",gap:5 }}>
        {steps.map((_,i) => (
          <div key={i} style={{ width:i===idx?18:5,height:4,borderRadius:99,background:i===idx?"#22c55e":"rgba(255,255,255,0.12)",transition:"all 0.3s" }} />
        ))}
      </div>
    </div>
  );
}

export default function SegregationCheck() {
  const fileRef = useRef(null);
  const [mounted, setMounted]       = useState(false);
  const [photo, setPhoto]           = useState(null);
  const [preview, setPreview]       = useState(null);
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState(null);
  const [error, setError]           = useState("");
  const [dragOver, setDragOver]     = useState(false);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 60); }, []);

  const scoreColor = s => s >= 80 ? "#22c55e" : s >= 50 ? "#f59e0b" : "#ef4444";
  const scoreLabel = s => s >= 80 ? "Well Segregated" : s >= 50 ? "Needs Improvement" : "Poorly Segregated";
  const scoreEmoji = s => s >= 80 ? "🏆" : s >= 50 ? "⚠️" : "❌";

  const pickFile = file => {
    if (!file || !file.type.startsWith("image/")) return;
    setPhoto(file); setPreview(URL.createObjectURL(file));
    setResult(null); setShowResult(false); setError("");
  };

  const handleCheck = async () => {
    if (!photo) return setError("Upload a photo first.");
    setLoading(true); setError(""); setResult(null); setShowResult(false);
    try {
      const fd = new FormData();
      fd.append("photo", photo);
      const res = await axiosInstance.post("/ai/segregation-check", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 160000,
      });
      setResult(res.data);
      setTimeout(() => setShowResult(true), 80);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setPhoto(null); setPreview(null); setResult(null); setShowResult(false); setError(""); };
  const retry = () => { setResult(null); setShowResult(false); setError(""); setTimeout(handleCheck, 50); };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
        @keyframes scanline { 0%{top:-1px} 100%{top:100%} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes floatIn  { from{opacity:0;transform:translateY(18px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes glow     { 0%,100%{box-shadow:0 0 8px rgba(34,197,94,0.3)} 50%{box-shadow:0 0 20px rgba(34,197,94,0.65)} }
        @keyframes shimmer  { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes blink    { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes spinDash { 0%{stroke-dashoffset:163} 100%{stroke-dashoffset:-163} }
        @keyframes resultIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes waveIn   { from{opacity:0;transform:translateX(-7px)} to{opacity:1;transform:translateX(0)} }
        @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes spin     { from{transform:rotate(0)} to{transform:rotate(360deg)} }
      `}</style>

      <div style={{ maxWidth:640,margin:"0 auto",padding:"24px 20px 60px",opacity:mounted?1:0,transition:"opacity 0.4s ease",fontFamily:"'DM Sans',sans-serif" }}>

        {/* Header */}
        <div style={{ marginBottom:28,animation:"fadeUp 0.5s ease both" }}>
          <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:8 }}>
            <div style={{ width:7,height:7,borderRadius:"50%",background:"#22c55e",animation:"glow 2s infinite" }} />
            <span style={{ fontSize:10,color:"rgba(255,255,255,0.3)",fontFamily:"'DM Mono',monospace",letterSpacing:"0.1em" }}>AI VISION · LLAVA</span>
          </div>
          <h1 style={{ fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:26,letterSpacing:"-0.02em",background:"linear-gradient(90deg,#fff 30%,rgba(255,255,255,0.45))",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:4 }}>
            Segregation Check
          </h1>
          <p style={{ fontSize:11,color:"rgba(255,255,255,0.28)",fontFamily:"'DM Mono',monospace",letterSpacing:"0.06em" }}>
            Upload a waste photo — LLaVA scores your segregation quality
          </p>
        </div>

        {/* Upload */}
        <div style={{ marginBottom:14,animation:"floatIn 0.5s ease 0.08s both" }}>
          <Section accent="#3b82f6">
            <div style={{ display:"flex",alignItems:"center",gap:9,marginBottom:14 }}>
              <div style={{ width:26,height:26,borderRadius:"50%",background:photo?"rgba(34,197,94,0.15)":"rgba(59,130,246,0.1)",border:`1.5px solid ${photo?"#22c55e":"rgba(59,130,246,0.3)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,fontFamily:"'Syne',sans-serif",color:photo?"#22c55e":"rgba(59,130,246,0.6)",transition:"all 0.4s",boxShadow:photo?"0 0 9px rgba(34,197,94,0.3)":"none" }}>
                {photo?"✓":"1"}
              </div>
              <Label text="PHOTO OF SEGREGATED WASTE" accent="*required" />
            </div>
            <div onClick={()=>!loading&&fileRef.current?.click()}
              onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)}
              onDrop={e=>{e.preventDefault();setDragOver(false);pickFile(e.dataTransfer.files?.[0]);}}
              style={{ border:`2px dashed ${dragOver?"#3b82f6":photo?"rgba(34,197,94,0.4)":"rgba(255,255,255,0.09)"}`,borderRadius:14,minHeight:190,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:loading?"default":"pointer",transition:"all 0.3s",background:dragOver?"rgba(59,130,246,0.05)":photo?"rgba(34,197,94,0.03)":"rgba(255,255,255,0.01)",position:"relative",overflow:"hidden" }}>
              {loading && <AnalysingOverlay />}
              {preview ? (<>
                <img src={preview} alt="Preview" style={{ maxHeight:200,maxWidth:"100%",borderRadius:10,objectFit:"cover",opacity:loading?0.2:1,transition:"opacity 0.3s" }} />
                {!loading && <div style={{ position:"absolute",bottom:8,right:8,padding:"3px 9px",borderRadius:99,fontSize:9,fontWeight:700,background:"rgba(34,197,94,0.18)",color:"#22c55e",border:"1px solid rgba(34,197,94,0.3)",fontFamily:"'DM Mono',monospace" }}>✓ READY</div>}
              </>) : (
                <div style={{ textAlign:"center",padding:"22px 0" }}>
                  <div style={{ fontSize:38,marginBottom:12 }}>♻️</div>
                  <p style={{ fontSize:13,color:"rgba(255,255,255,0.4)",marginBottom:4 }}>{dragOver?"Drop it here":"Click or drag to upload"}</p>
                  <p style={{ fontSize:10,color:"rgba(255,255,255,0.18)",fontFamily:"'DM Mono',monospace",letterSpacing:"0.07em" }}>JPG · PNG · WEBP · max 20 MB</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={e=>pickFile(e.target.files?.[0])} />
            {photo && !loading && (
              <button onClick={reset} style={{ marginTop:10,fontSize:11,color:"#ef4444",background:"none",border:"none",cursor:"pointer",fontFamily:"'DM Mono',monospace",opacity:0.6,transition:"opacity 0.2s" }}
                onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0.6}>
                ✕ REMOVE PHOTO
              </button>
            )}
          </Section>
        </div>

        {/* Error + retry */}
        {error && (
          <div style={{ marginBottom:14,padding:"14px 15px",borderRadius:12,background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.25)",animation:"fadeUp 0.3s ease both" }}>
            <div style={{ display:"flex",alignItems:"flex-start",gap:9,marginBottom:photo?10:0 }}>
              <span style={{ flexShrink:0,fontSize:14 }}>⚠️</span>
              <p style={{ fontSize:12,color:"#fca5a5",fontFamily:"'DM Mono',monospace",lineHeight:1.6 }}>{error}</p>
            </div>
            {photo && !loading && (
              <button onClick={retry} style={{ marginTop:4,fontSize:11,fontWeight:700,color:"#ef4444",background:"rgba(239,68,68,0.12)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:8,padding:"6px 14px",cursor:"pointer",fontFamily:"'DM Mono',monospace",letterSpacing:"0.06em",transition:"all 0.2s" }}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(239,68,68,0.2)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(239,68,68,0.12)"}>
                ↺ RETRY ANALYSIS
              </button>
            )}
          </div>
        )}

        {/* Analyse button */}
        {!result && (
          <div style={{ marginBottom:14,animation:"floatIn 0.5s ease 0.14s both" }}>
            <button onClick={handleCheck} disabled={loading||!photo}
              style={{ width:"100%",padding:"16px 0",borderRadius:16,border:"none",cursor:(loading||!photo)?"not-allowed":"pointer",fontSize:13,fontWeight:800,letterSpacing:"0.1em",fontFamily:"'Syne',sans-serif",color:(!photo||loading)?"rgba(255,255,255,0.2)":"#000",background:(!photo||loading)?"rgba(255,255,255,0.04)":"linear-gradient(135deg,#22c55e 0%,#3b82f6 100%)",boxShadow:(!photo||loading)?"none":"0 8px 28px rgba(34,197,94,0.22)",transition:"all 0.3s",display:"flex",alignItems:"center",justifyContent:"center",gap:10,position:"relative",overflow:"hidden" }}
              onMouseEnter={e=>{if(photo&&!loading){e.currentTarget.style.transform="scale(1.02)";e.currentTarget.style.boxShadow="0 12px 36px rgba(34,197,94,0.3)";}}}
              onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.boxShadow=(!photo||loading)?"none":"0 8px 28px rgba(34,197,94,0.22)";}}>
              {photo&&!loading && <div style={{ position:"absolute",inset:0,background:"linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.15) 50%,transparent 70%)",backgroundSize:"200% auto",animation:"shimmer 3s linear infinite" }} />}
              {loading ? (<><div style={{ width:14,height:14,border:"2px solid rgba(255,255,255,0.2)",borderTopColor:"rgba(255,255,255,0.7)",borderRadius:"50%",animation:"spin 0.7s linear infinite" }} />ANALYSING WITH LLAVA…</>) : "ANALYSE SEGREGATION →"}
            </button>
          </div>
        )}

        {/* Results */}
        {result && showResult && (
          <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
            {result.is_waste_image === false ? (
              <div style={{ animation:"resultIn 0.5s ease both" }}>
                <Section accent="#f59e0b">
                  <ScanLine color="rgba(245,158,11,0.3)" />
                  <div style={{ display:"flex",gap:14,alignItems:"flex-start" }}>
                    <div style={{ fontSize:36,flexShrink:0 }}>🚫</div>
                    <div>
                      <p style={{ fontSize:13,fontWeight:700,color:"#fbbf24",fontFamily:"'Syne',sans-serif",marginBottom:6 }}>Not a Waste Image</p>
                      <p style={{ fontSize:12,color:"rgba(255,255,255,0.5)",lineHeight:1.7,fontFamily:"'DM Mono',monospace" }}>{result.summary}</p>
                    </div>
                  </div>
                  <button onClick={reset} style={{ marginTop:16,width:"100%",padding:"12px 0",borderRadius:12,border:"1px solid rgba(245,158,11,0.3)",background:"rgba(245,158,11,0.08)",color:"#fbbf24",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Syne',sans-serif",letterSpacing:"0.08em",transition:"all 0.2s" }}
                    onMouseEnter={e=>e.currentTarget.style.background="rgba(245,158,11,0.15)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(245,158,11,0.08)"}>
                    TRY ANOTHER PHOTO
                  </button>
                </Section>
              </div>
            ) : <>
              <div style={{ animation:"resultIn 0.5s ease 0s both" }}>
                <Section accent={scoreColor(result.score)}>
                  <ScanLine color={scoreColor(result.score)+"40"} />
                  <div style={{ display:"flex",alignItems:"center",gap:20 }}>
                    <ScoreRing score={result.score} color={scoreColor(result.score)} />
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:6 }}>
                        <span style={{ fontSize:20 }}>{scoreEmoji(result.score)}</span>
                        <span style={{ fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:15,color:scoreColor(result.score) }}>{scoreLabel(result.score)}</span>
                      </div>
                      <p style={{ fontSize:9,color:"rgba(255,255,255,0.28)",fontFamily:"'DM Mono',monospace",letterSpacing:"0.08em",marginBottom:12 }}>SEGREGATION SCORE</p>
                      <div style={{ height:5,background:"rgba(255,255,255,0.07)",borderRadius:99,overflow:"hidden" }}>
                        <div style={{ height:"100%",borderRadius:99,background:`linear-gradient(90deg,#3b82f6,${scoreColor(result.score)})`,width:`${result.score}%`,transition:"width 1.4s cubic-bezier(0.4,0,0.2,1)",boxShadow:`0 0 8px ${scoreColor(result.score)}60` }} />
                      </div>
                    </div>
                  </div>
                </Section>
              </div>
              {result.wrong_items?.length > 0 && (
                <div style={{ animation:"resultIn 0.5s ease 0.1s both" }}>
                  <Section accent="#ef4444">
                    <div style={{ display:"flex",alignItems:"center",gap:9,marginBottom:14 }}>
                      <span style={{ fontSize:13 }}>⚠️</span><Label text="ITEMS IN WRONG BIN" />
                      <span style={{ marginLeft:"auto",padding:"2px 9px",borderRadius:99,fontSize:9,fontWeight:700,background:"rgba(239,68,68,0.12)",color:"#ef4444",border:"1px solid rgba(239,68,68,0.25)",fontFamily:"'DM Mono',monospace" }}>{result.wrong_items.length}</span>
                    </div>
                    <ul style={{ listStyle:"none",display:"flex",flexDirection:"column",gap:7 }}>
                      {result.wrong_items.map((item,i) => (
                        <li key={i} style={{ display:"flex",alignItems:"flex-start",gap:9,padding:"9px 12px",borderRadius:10,background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.14)",animation:`waveIn 0.35s ease ${i*0.07}s both` }}>
                          <span style={{ width:18,height:18,borderRadius:"50%",background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#ef4444",flexShrink:0,fontWeight:800 }}>✕</span>
                          <span style={{ fontSize:12,color:"rgba(255,255,255,0.65)",lineHeight:1.5 }}>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </Section>
                </div>
              )}
              {result.improvement_steps?.length > 0 && (
                <div style={{ animation:"resultIn 0.5s ease 0.18s both" }}>
                  <Section accent="#3b82f6">
                    <div style={{ display:"flex",alignItems:"center",gap:9,marginBottom:14 }}>
                      <span style={{ fontSize:13 }}>💡</span><Label text="HOW TO IMPROVE" />
                    </div>
                    <ol style={{ listStyle:"none",display:"flex",flexDirection:"column",gap:8 }}>
                      {result.improvement_steps.map((step,i) => (
                        <li key={i} style={{ display:"flex",alignItems:"flex-start",gap:10,animation:`waveIn 0.35s ease ${i*0.07}s both` }}>
                          <span style={{ width:22,height:22,borderRadius:"50%",background:"rgba(59,130,246,0.14)",border:"1px solid rgba(59,130,246,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#3b82f6",fontWeight:800,fontFamily:"'Syne',sans-serif",flexShrink:0 }}>{i+1}</span>
                          <span style={{ fontSize:12,color:"rgba(255,255,255,0.65)",lineHeight:1.6,paddingTop:3 }}>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </Section>
                </div>
              )}
              {result.summary && (
                <div style={{ animation:"resultIn 0.5s ease 0.25s both" }}>
                  <Section>
                    <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:12 }}>
                      <span style={{ fontSize:10,color:"#22c55e",animation:"pulse 2s infinite" }}>◉</span>
                      <Label text="LLAVA ANALYSIS" />
                      <span style={{ marginLeft:"auto",fontSize:9,color:"#22c55e",fontFamily:"'DM Mono',monospace",animation:"pulse 2s infinite" }}>live</span>
                    </div>
                    <div style={{ background:"rgba(34,197,94,0.04)",border:"1px solid rgba(34,197,94,0.14)",borderRadius:10,padding:"12px 14px" }}>
                      <Typewriter text={result.summary} />
                    </div>
                  </Section>
                </div>
              )}
              <div style={{ animation:"resultIn 0.5s ease 0.32s both" }}>
                <button onClick={reset} style={{ width:"100%",padding:"13px 0",borderRadius:14,border:"1px solid rgba(255,255,255,0.09)",background:"rgba(255,255,255,0.03)",color:"rgba(255,255,255,0.5)",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Syne',sans-serif",letterSpacing:"0.08em",transition:"all 0.2s" }}
                  onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.06)";e.currentTarget.style.color="rgba(255,255,255,0.75)";}}
                  onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.03)";e.currentTarget.style.color="rgba(255,255,255,0.5)";}}>
                  CHECK ANOTHER PHOTO
                </button>
              </div>
            </>}
          </div>
        )}
      </div>
    </>
  );
}