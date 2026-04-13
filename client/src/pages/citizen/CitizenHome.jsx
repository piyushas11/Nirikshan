import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useRealtime } from "../../hooks/useRealtime";
import axiosInstance from "../../lib/axios";

// ── Mini components ───────────────────────────────────────────────────────────
function ScanLine() {
  return (
    <div style={{ position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden",borderRadius:"inherit" }}>
      <div style={{ position:"absolute",left:0,right:0,height:1,background:"linear-gradient(90deg,transparent,rgba(34,197,94,0.2),transparent)",animation:"scanline 5s linear infinite" }} />
    </div>
  );
}

function Section({ children, accent, style: sx={} }) {
  return (
    <div style={{ background:"rgba(255,255,255,0.018)",border:`1px solid ${accent?accent+"22":"rgba(255,255,255,0.06)"}`,borderRadius:16,padding:"18px 20px",position:"relative",overflow:"hidden",...sx }}>
      {accent && <div style={{ position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${accent},transparent)` }} />}
      {children}
    </div>
  );
}

const STATUS_COLOR = {
  CREATED:    "#3b82f6",
  PICKED_UP:  "#f59e0b",
  AT_CENTER:  "#8b5cf6",
  SEGREGATED: "#f97316",
  PROCESSED:  "#22c55e",
};

// ── QR + Progress Modal ───────────────────────────────────────────────────────
// Hardcoded progress steps for demo
const PROGRESS_STEPS = [
  { key:"CREATED",    label:"Batch Created",      icon:"📦", desc:"Your waste report was submitted and a QR code was generated." },
  { key:"PICKED_UP",  label:"Picked Up",           icon:"🚚", desc:"The waste collector scanned the QR and picked up your batch." },
  { key:"AT_CENTER",  label:"At Sorting Center",   icon:"🏭", desc:"Batch arrived at the processing facility." },
  { key:"SEGREGATED", label:"Segregated",           icon:"♻️", desc:"Waste has been sorted by type by the facility team." },
  { key:"PROCESSED",  label:"Processed",            icon:"✅", desc:"Your waste was fully processed and recycled/disposed correctly." },
];

function BatchProgressModal({ batch, qr, onClose }) {
  const [show, setShow] = useState(false);
  useEffect(() => { setTimeout(() => setShow(true), 60); }, []);

  const currentIdx = PROGRESS_STEPS.findIndex(s => s.key === (batch?.status || "CREATED"));
  const safeIdx = currentIdx === -1 ? 0 : currentIdx;

  return (
    <div style={{ position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }} onClick={onClose}>
      <div style={{ position:"absolute",inset:0,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(12px)" }} />
      <div onClick={e=>e.stopPropagation()} style={{ position:"relative",width:"100%",maxWidth:460,background:"linear-gradient(135deg,#060e09,#08101a)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:20,overflow:"hidden",opacity:show?1:0,transform:show?"translateY(0) scale(1)":"translateY(20px) scale(0.97)",transition:"all 0.4s cubic-bezier(0.4,0,0.2,1)" }}>
        <ScanLine />
        <div style={{ position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,#22c55e,#3b82f6)" }} />

        {/* Header */}
        <div style={{ padding:"20px 22px 0",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <div>
            <p style={{ fontSize:9,color:"rgba(255,255,255,0.3)",fontFamily:"'DM Mono',monospace",letterSpacing:"0.1em",marginBottom:4 }}>BATCH TRACKER</p>
            <h3 style={{ fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:18,color:"#fff" }}>Track Progress</h3>
          </div>
          <button onClick={onClose} style={{ width:32,height:32,borderRadius:9,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.09)",color:"rgba(255,255,255,0.5)",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>✕</button>
        </div>

        <div style={{ padding:"16px 22px 22px",overflowY:"auto",maxHeight:"80vh" }}>
          {/* QR */}
          {qr && (
            <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:10,marginBottom:20 }}>
              <div style={{ padding:12,borderRadius:16,background:"#fff",boxShadow:"0 0 40px rgba(34,197,94,0.15)" }}>
                <img src={`data:image/png;base64,${qr}`} alt="QR" style={{ width:140,height:140,display:"block" }} />
              </div>
              <div style={{ padding:"4px 12px",borderRadius:99,background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.2)",fontSize:10,color:"#22c55e",fontFamily:"'DM Mono',monospace",letterSpacing:"0.07em" }}>
                {batch?.id}
              </div>
            </div>
          )}

          {/* Progress timeline */}
          <div style={{ position:"relative" }}>
            {/* Vertical line */}
            <div style={{ position:"absolute",left:17,top:20,bottom:20,width:2,background:"rgba(255,255,255,0.06)",borderRadius:99 }}>
              <div style={{ width:"100%",background:"linear-gradient(180deg,#22c55e,#3b82f6)",borderRadius:99,height:`${(safeIdx/(PROGRESS_STEPS.length-1))*100}%`,transition:"height 1.5s cubic-bezier(0.4,0,0.2,1)" }} />
            </div>

            {PROGRESS_STEPS.map((step, i) => {
              const done = i <= safeIdx;
              const current = i === safeIdx;
              const color = done ? STATUS_COLOR[step.key] || "#22c55e" : "rgba(255,255,255,0.15)";
              return (
                <div key={step.key} style={{ display:"flex",alignItems:"flex-start",gap:14,marginBottom:i<PROGRESS_STEPS.length-1?20:0,animation:`waveIn 0.4s ease ${i*0.08}s both` }}>
                  {/* Dot */}
                  <div style={{ width:36,height:36,borderRadius:"50%",background:done?`${color}18`:"rgba(255,255,255,0.03)",border:`2px solid ${done?color:"rgba(255,255,255,0.1)"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:current?`0 0 16px ${color}60`:"none",transition:"all 0.4s",position:"relative",zIndex:1 }}>
                    {current && <div style={{ position:"absolute",inset:-4,borderRadius:"50%",border:`1.5px solid ${color}`,animation:"ripple 1.5s ease-out infinite" }} />}
                    <span style={{ fontSize:16 }}>{step.icon}</span>
                  </div>
                  {/* Text */}
                  <div style={{ paddingTop:6,flex:1 }}>
                    <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:2 }}>
                      <span style={{ fontSize:12,fontWeight:700,fontFamily:"'Syne',sans-serif",color:done?"#fff":"rgba(255,255,255,0.25)" }}>{step.label}</span>
                      {current && <span style={{ fontSize:9,color:color,background:`${color}14`,padding:"2px 7px",borderRadius:99,border:`1px solid ${color}30`,fontFamily:"'DM Mono',monospace",fontWeight:700 }}>CURRENT</span>}
                      {done && !current && <span style={{ fontSize:9,color:"#22c55e",fontFamily:"'DM Mono',monospace" }}>✓</span>}
                    </div>
                    <p style={{ fontSize:11,color:done?"rgba(255,255,255,0.4)":"rgba(255,255,255,0.18)",lineHeight:1.5,fontFamily:"'DM Mono',monospace" }}>{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color, delay=0 }) {
  const [show, setShow] = useState(false);
  useEffect(() => { setTimeout(() => setShow(true), delay); }, []);
  return (
    <div style={{ flex:1,padding:"16px",borderRadius:14,background:"rgba(255,255,255,0.018)",border:`1px solid ${color}20`,opacity:show?1:0,transform:show?"translateY(0)":"translateY(8px)",transition:"all 0.5s ease",position:"relative",overflow:"hidden",minWidth:0 }}>
      <div style={{ position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${color},transparent)` }} />
      <div style={{ fontSize:20,marginBottom:8 }}>{icon}</div>
      <p style={{ fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:22,color,lineHeight:1,marginBottom:4 }}>{value}</p>
      <p style={{ fontSize:10,color:"rgba(255,255,255,0.3)",fontFamily:"'DM Mono',monospace",letterSpacing:"0.06em" }}>{label}</p>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CitizenHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [batches,    setBatches]    = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [profile,    setProfile]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [mounted,    setMounted]    = useState(false);
  const [modal,      setModal]      = useState({ open:false, batch:null, qr:null });

  useEffect(() => { setTimeout(() => setMounted(true), 60); }, []);

  useRealtime("batches", `citizen_id=eq.${user?.id}`, (payload) => {
    if (payload.eventType === "INSERT") setBatches(p => [payload.new, ...p]);
    else if (payload.eventType === "UPDATE") setBatches(p => p.map(b => b.id===payload.new.id?payload.new:b));
  });

  useRealtime("complaints", `citizen_id=eq.${user?.id}`, (payload) => {
    if (payload.eventType === "INSERT") setComplaints(p => [payload.new, ...p]);
    else if (payload.eventType === "UPDATE") setComplaints(p => p.map(c => c.id===payload.new.id?payload.new:c));
  });

  useEffect(() => {
    (async () => {
      try {
        const [b, c, p] = await Promise.all([
          axiosInstance.get("/batch/citizen"),
          axiosInstance.get("/complaint/citizen"),
          axiosInstance.get("/citizen/profile"),
        ]);
        setBatches(b.data); setComplaints(c.data); setProfile(p.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleShowQR = async (batch) => {
    try {
      const res = await axiosInstance.get(`/qr/batch/${batch.id}`);
      setModal({ open:true, batch, qr:res.data.qr_base64 });
    } catch {
      // Even if QR fetch fails, show the progress modal with batch info
      setModal({ open:true, batch, qr:null });
    }
  };

  if (loading) {
    return (
      <div style={{ display:"flex",alignItems:"center",justifyContent:"center",minHeight:"80vh",flexDirection:"column",gap:14 }}>
        <div style={{ position:"relative",width:52,height:52 }}>
          <svg width="52" height="52" style={{ transform:"rotate(-90deg)" }}>
            <circle cx="26" cy="26" r="20" fill="none" stroke="rgba(34,197,94,0.1)" strokeWidth="4"/>
            <circle cx="26" cy="26" r="20" fill="none" stroke="#22c55e" strokeWidth="4"
              strokeDasharray="126" strokeDashoffset="90" strokeLinecap="round"
              style={{ animation:"spinDash 1.4s linear infinite" }}
            />
          </svg>
          <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18 }}>🌿</div>
        </div>
        <p style={{ fontSize:12,color:"rgba(255,255,255,0.3)",fontFamily:"'DM Mono',monospace",letterSpacing:"0.08em" }}>Loading dashboard…</p>
        <style>{`@keyframes spinDash{0%{stroke-dashoffset:126}100%{stroke-dashoffset:-126}}`}</style>
      </div>
    );
  }

  const latestBatch = batches[0];
  const processedCount = batches.filter(b=>b.status==="PROCESSED").length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
        @keyframes scanline{0%{top:-1px}100%{top:100%}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes floatIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes glow{0%,100%{box-shadow:0 0 8px rgba(34,197,94,0.3)}50%{box-shadow:0 0 20px rgba(34,197,94,0.65)}}
        @keyframes waveIn{from{opacity:0;transform:translateX(-7px)}to{opacity:1;transform:translateX(0)}}
        @keyframes ripple{0%{transform:scale(1);opacity:.7}100%{transform:scale(1.6);opacity:0}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes spinDash{0%{stroke-dashoffset:126}100%{stroke-dashoffset:-126}}
        @keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
      `}</style>

      <div style={{ maxWidth:720,margin:"0 auto",padding:"24px 20px 60px",opacity:mounted?1:0,transition:"opacity 0.4s ease",fontFamily:"'DM Sans',sans-serif" }}>

        {/* Hero */}
        <div style={{ marginBottom:28,animation:"fadeUp 0.5s ease both" }}>
          <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:8 }}>
            <div style={{ width:7,height:7,borderRadius:"50%",background:"#22c55e",animation:"glow 2s infinite" }} />
            <span style={{ fontSize:10,color:"rgba(255,255,255,0.3)",fontFamily:"'DM Mono',monospace",letterSpacing:"0.1em" }}>CITIZEN DASHBOARD · LIVE</span>
          </div>
          <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12 }}>
            <div>
              <h1 style={{ fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:24,letterSpacing:"-0.02em",background:"linear-gradient(90deg,#fff 30%,rgba(255,255,255,0.45))",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:2 }}>
                Hey, {user?.user_metadata?.name?.split(" ")[0] || "Citizen"} 👋
              </h1>
              <p style={{ fontSize:11,color:"rgba(255,255,255,0.28)",fontFamily:"'DM Mono',monospace" }}>Your waste accountability dashboard</p>
            </div>
            {profile && (
              <div style={{ padding:"10px 16px",borderRadius:14,background:"rgba(34,197,94,0.07)",border:"1px solid rgba(34,197,94,0.2)",textAlign:"center",flexShrink:0 }}>
                <p style={{ fontSize:10,color:"rgba(255,255,255,0.35)",fontFamily:"'DM Mono',monospace",letterSpacing:"0.07em",marginBottom:2 }}>SEG. SCORE</p>
                <p style={{ fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:22,color:"#22c55e",lineHeight:1 }}>{profile.segregation_score ?? 0}<span style={{ fontSize:12,fontWeight:400 }}>%</span></p>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:"flex",gap:10,marginBottom:16,animation:"floatIn 0.5s ease 0.08s both" }}>
          <StatCard label="TOTAL BATCHES" value={batches.length} icon="🗑️" color="#3b82f6" delay={100} />
          <StatCard label="PROCESSED"     value={processedCount} icon="✅" color="#22c55e" delay={160} />
          <StatCard label="COMPLAINTS"    value={complaints.length} icon="📋" color="#f59e0b" delay={220} />
          <StatCard label="SEG. SCORE"    value={`${profile?.segregation_score??0}%`} icon="♻️" color="#8b5cf6" delay={280} />
        </div>

        {/* Latest batch spotlight */}
        {latestBatch && (
          <div style={{ marginBottom:16,animation:"floatIn 0.5s ease 0.16s both" }}>
            <Section accent={STATUS_COLOR[latestBatch.status]||"#3b82f6"}>
              <ScanLine />
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12 }}>
                <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                  <span style={{ fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.4)",fontFamily:"'DM Mono',monospace",letterSpacing:"0.08em" }}>LATEST BATCH</span>
                </div>
                <div style={{ padding:"3px 10px",borderRadius:99,fontSize:10,fontWeight:700,background:`${STATUS_COLOR[latestBatch.status]||"#3b82f6"}15`,color:STATUS_COLOR[latestBatch.status]||"#3b82f6",border:`1px solid ${STATUS_COLOR[latestBatch.status]||"#3b82f6"}30`,fontFamily:"'DM Mono',monospace" }}>
                  {latestBatch.status.replace(/_/g," ")}
                </div>
              </div>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",gap:12 }}>
                <div>
                  <p style={{ fontSize:10,color:"rgba(255,255,255,0.25)",fontFamily:"'DM Mono',monospace",marginBottom:2 }}>{latestBatch.id}</p>
                  <p style={{ fontSize:14,fontWeight:700,color:"#fff",fontFamily:"'Syne',sans-serif",marginBottom:2 }}>{latestBatch.waste_type}</p>
                  <p style={{ fontSize:10,color:"rgba(255,255,255,0.3)",fontFamily:"'DM Mono',monospace" }}>
                    {new Date(latestBatch.created_at).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}
                  </p>
                </div>
                <div style={{ display:"flex",gap:8 }}>
                  <button onClick={()=>handleShowQR(latestBatch)} style={{ padding:"8px 16px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#22c55e,#3b82f6)",color:"#000",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"'Syne',sans-serif",letterSpacing:"0.06em",transition:"all 0.2s",position:"relative",overflow:"hidden" }}
                    onMouseEnter={e=>e.currentTarget.style.transform="scale(1.04)"}
                    onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
                    <div style={{ position:"absolute",inset:0,background:"linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.2) 50%,transparent 70%)",backgroundSize:"200% auto",animation:"shimmer 2s linear infinite" }} />
                    QR + TRACK →
                  </button>
                </div>
              </div>
            </Section>
          </div>
        )}

        {/* My Batches */}
        <div style={{ marginBottom:16,animation:"floatIn 0.5s ease 0.22s both" }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12 }}>
            <span style={{ fontSize:13,fontWeight:700,fontFamily:"'Syne',sans-serif",color:"#fff" }}>My Batches</span>
            <Link to="/citizen/report" style={{ padding:"6px 14px",borderRadius:10,background:"linear-gradient(135deg,rgba(34,197,94,0.2),rgba(59,130,246,0.2))",color:"#22c55e",fontSize:11,fontWeight:700,textDecoration:"none",fontFamily:"'DM Mono',monospace",border:"1px solid rgba(34,197,94,0.25)",transition:"all 0.2s" }}>
              + REPORT WASTE
            </Link>
          </div>

          {batches.length === 0 ? (
            <Section>
              <div style={{ textAlign:"center",padding:"20px 0" }}>
                <div style={{ fontSize:32,marginBottom:10 }}>🗑️</div>
                <p style={{ fontSize:13,color:"rgba(255,255,255,0.4)" }}>No batches yet. Report your first waste pickup!</p>
              </div>
            </Section>
          ) : (
            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              {batches.slice(0,5).map((batch,i) => {
                const c = STATUS_COLOR[batch.status]||"#6b7280";
                return (
                  <div key={batch.id} onClick={()=>handleShowQR(batch)} style={{ background:"rgba(255,255,255,0.018)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"13px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",transition:"all 0.2s",animation:`waveIn 0.4s ease ${i*0.06}s both` }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=`${c}30`;e.currentTarget.style.background="rgba(255,255,255,0.03)";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.06)";e.currentTarget.style.background="rgba(255,255,255,0.018)";}}>
                    <div>
                      <p style={{ fontSize:10,color:"rgba(255,255,255,0.25)",fontFamily:"'DM Mono',monospace",marginBottom:2 }}>{batch.id}</p>
                      <p style={{ fontSize:13,fontWeight:600,color:"#fff",marginBottom:2 }}>{batch.waste_type}</p>
                      <p style={{ fontSize:10,color:"rgba(255,255,255,0.28)",fontFamily:"'DM Mono',monospace" }}>{new Date(batch.created_at).toLocaleDateString("en-IN")}</p>
                    </div>
                    <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                      <div style={{ padding:"3px 10px",borderRadius:99,fontSize:10,fontWeight:700,background:`${c}12`,color:c,border:`1px solid ${c}28`,fontFamily:"'DM Mono',monospace" }}>
                        {batch.status.replace(/_/g," ")}
                      </div>
                      <span style={{ fontSize:13,color:c }}>→</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Complaints */}
        <div style={{ animation:"floatIn 0.5s ease 0.28s both" }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12 }}>
            <span style={{ fontSize:13,fontWeight:700,fontFamily:"'Syne',sans-serif",color:"#fff" }}>My Complaints</span>
            <Link to="/citizen/complaints" style={{ fontSize:11,color:"rgba(255,255,255,0.35)",textDecoration:"none",fontFamily:"'DM Mono',monospace",transition:"color 0.2s" }} onMouseEnter={e=>e.currentTarget.style.color="#22c55e"} onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.35)"}>
              VIEW ALL →
            </Link>
          </div>
          {complaints.length === 0 ? (
            <Section><p style={{ fontSize:12,color:"rgba(255,255,255,0.3)",textAlign:"center",padding:"12px 0",fontFamily:"'DM Mono',monospace" }}>No complaints filed.</p></Section>
          ) : (
            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              {complaints.slice(0,3).map((c,i) => {
                const sc = c.status==="RESOLVED"?"#22c55e":c.status==="PENDING"?"#3b82f6":"#f59e0b";
                return (
                  <Link key={c.id} to={`/citizen/track-complaint/${c.id}`} style={{ background:"rgba(255,255,255,0.018)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"13px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",textDecoration:"none",transition:"all 0.2s",animation:`waveIn 0.4s ease ${i*0.06}s both` }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=`${sc}28`;e.currentTarget.style.background="rgba(255,255,255,0.03)";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.06)";e.currentTarget.style.background="rgba(255,255,255,0.018)";}}>
                    <div>
                      <p style={{ fontSize:13,fontWeight:500,color:"rgba(255,255,255,0.8)",marginBottom:2 }}>{c.description||"No description"}</p>
                      <p style={{ fontSize:10,color:"rgba(255,255,255,0.28)",fontFamily:"'DM Mono',monospace" }}>{new Date(c.created_at).toLocaleDateString("en-IN")}</p>
                    </div>
                    <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                      <div style={{ padding:"3px 10px",borderRadius:99,fontSize:10,fontWeight:700,background:`${sc}12`,color:sc,border:`1px solid ${sc}28`,fontFamily:"'DM Mono',monospace" }}>{c.status}</div>
                      <span style={{ fontSize:13,color:sc }}>→</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* QR + Progress modal */}
      {modal.open && (
        <BatchProgressModal batch={modal.batch} qr={modal.qr} onClose={()=>setModal({open:false,batch:null,qr:null})} />
      )}
    </>
  );
}