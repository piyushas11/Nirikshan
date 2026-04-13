// SettingsPage.jsx
import { useState, useEffect } from "react";
import { Settings, Bell, Shield, Database, Zap, Users, Save, ChevronRight, ToggleLeft, ToggleRight, AlertTriangle, CheckCircle } from "lucide-react";

const SECTIONS = [
  { id: "notifications", label: "Notifications",    icon: Bell     },
  { id: "anomalies",     label: "Anomaly Rules",    icon: AlertTriangle },
  { id: "security",      label: "Security",         icon: Shield   },
  { id: "system",        label: "System",           icon: Database },
];

function Toggle({ on, onChange, color = "#22c55e" }) {
  return (
    <div onClick={() => onChange(!on)} style={{ width: 40, height: 22, borderRadius: 99, background: on ? color : "rgba(255,255,255,0.1)", border: `1px solid ${on ? color + "60" : "rgba(255,255,255,0.12)"}`, cursor: "pointer", position: "relative", transition: "all 0.25s", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 2, left: on ? 20 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.25s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }} />
    </div>
  );
}

function SettingRow({ label, sub, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>{label}</p>
        {sub && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{sub}</p>}
      </div>
      {children}
    </div>
  );
}

function NumberInput({ value, onChange, min, max, unit }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <input type="number" value={value} onChange={e => onChange(Number(e.target.value))} min={min} max={max}
        style={{ width: 64, padding: "6px 10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, outline: "none", textAlign: "center" }} />
      {unit && <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{unit}</span>}
    </div>
  );
}

export default function SettingsPage() {
  const [section, setSection] = useState("notifications");
  const [saved, setSaved]     = useState(false);
  const [vis, setVis]         = useState(false);
  useEffect(() => { setTimeout(() => setVis(true), 50); }, []);

  // Notification settings
  const [notifAnomaly,     setNotifAnomaly]     = useState(true);
  const [notifComplaint,   setNotifComplaint]   = useState(true);
  const [notifBatch,       setNotifBatch]       = useState(false);
  const [notifEmail,       setNotifEmail]       = useState(true);
  const [notifSMS,         setNotifSMS]         = useState(false);
  const [dailyDigest,      setDailyDigest]      = useState(true);

  // Anomaly thresholds
  const [batchYellowHrs,   setBatchYellowHrs]   = useState(6);
  const [batchRedHrs,      setBatchRedHrs]       = useState(12);
  const [credCliff,        setCredCliff]         = useState(40);
  const [complaintSurge,   setComplaintSurge]    = useState(50);
  const [fakePhotoThresh,  setFakePhotoThresh]   = useState(30);
  const [ghostPickup,      setGhostPickup]       = useState(true);
  const [routeDeviation,   setRouteDeviation]    = useState(true);
  const [disposalMismatch, setDisposalMismatch]  = useState(true);
  const [timeViolation,    setTimeViolation]     = useState(true);

  // Security
  const [twoFA,            setTwoFA]             = useState(true);
  const [sessionTimeout,   setSessionTimeout]    = useState(60);
  const [auditLog,         setAuditLog]          = useState(true);

  // System
  const [autoReport,       setAutoReport]        = useState(true);
  const [reportDay,        setReportDay]         = useState("Monday");
  const [dataRetention,    setDataRetention]     = useState(90);
  const [credUpdateFreq,   setCredUpdateFreq]    = useState(24);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1100, margin: "0 auto", opacity: vis ? 1 : 0, transition: "opacity 0.4s ease" }}>
      <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(10px)}to{opacity:1;transform:translateX(0)}} @keyframes popIn{from{opacity:0;transform:scale(0.92)}to{opacity:1;transform:scale(1)}}`}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 26, letterSpacing: "-0.03em" }}>
            System <span style={{ background: "linear-gradient(90deg,#6b7280,#9ca3af)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Settings</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginTop: 4 }}>Configure anomaly rules, notifications, and system behaviour</p>
        </div>
        <button onClick={handleSave}
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 22px", borderRadius: 10, background: saved ? "rgba(34,197,94,0.15)" : "linear-gradient(90deg,#6b7280,#4b5563)", border: saved ? "1px solid rgba(34,197,94,0.3)" : "none", color: saved ? "#22c55e" : "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, transition: "all 0.3s" }}>
          {saved ? <CheckCircle size={14} /> : <Save size={14} />}
          {saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 20 }}>
        {/* Sidebar nav */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {SECTIONS.map(s => {
            const active = section === s.id;
            return (
              <div key={s.id} onClick={() => setSection(s.id)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, cursor: "pointer", transition: "all 0.18s",
                  background: active ? "rgba(255,255,255,0.07)" : "transparent",
                  border: active ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent" }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>
                <s.icon size={15} color={active ? "#fff" : "rgba(255,255,255,0.4)"} />
                <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? "#fff" : "rgba(255,255,255,0.5)" }}>{s.label}</span>
              </div>
            );
          })}
        </div>

        {/* Content panel */}
        <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 24, animation: "slideIn 0.25s ease" }} key={section}>

          {section === "notifications" && (
            <>
              <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Notification Preferences</h2>
              <SettingRow label="Anomaly Alerts" sub="Get notified when a new anomaly is flagged"><Toggle on={notifAnomaly} onChange={setNotifAnomaly} color="#ef4444" /></SettingRow>
              <SettingRow label="Complaint Assignments" sub="Notify when a complaint is raised or escalated"><Toggle on={notifComplaint} onChange={setNotifComplaint} color="#f59e0b" /></SettingRow>
              <SettingRow label="Batch Stagnation Alerts" sub="Notify on yellow / red batch stale flags"><Toggle on={notifBatch} onChange={setNotifBatch} color="#8b5cf6" /></SettingRow>
              <SettingRow label="Email Notifications" sub="Send alerts to admin email"><Toggle on={notifEmail} onChange={setNotifEmail} /></SettingRow>
              <SettingRow label="SMS Alerts" sub="Critical anomaly SMS to registered number"><Toggle on={notifSMS} onChange={setNotifSMS} /></SettingRow>
              <SettingRow label="Daily Digest" sub="Morning summary of previous day's activity"><Toggle on={dailyDigest} onChange={setDailyDigest} /></SettingRow>
            </>
          )}

          {section === "anomalies" && (
            <>
              <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Anomaly Detection Rules</h2>
              <SettingRow label="Ghost Pickup Detection" sub="Flag batch marked 'Collected' without GPS match"><Toggle on={ghostPickup} onChange={setGhostPickup} color="#ef4444" /></SettingRow>
              <SettingRow label="Route Deviation" sub="Alert when truck visits stops out of assigned order"><Toggle on={routeDeviation} onChange={setRouteDeviation} color="#ef4444" /></SettingRow>
              <SettingRow label="Disposal Mismatch" sub="Flag when disposal method doesn't match waste type"><Toggle on={disposalMismatch} onChange={setDisposalMismatch} color="#ef4444" /></SettingRow>
              <SettingRow label="Time Window Violation" sub="Flag collection outside scheduled time window"><Toggle on={timeViolation} onChange={setTimeViolation} color="#f59e0b" /></SettingRow>
              <SettingRow label="Batch Yellow Alert Threshold" sub="Hours before batch stagnation turns yellow"><NumberInput value={batchYellowHrs} onChange={setBatchYellowHrs} min={1} max={24} unit="hrs" /></SettingRow>
              <SettingRow label="Batch Red Alert Threshold" sub="Hours before batch stagnation turns critical"><NumberInput value={batchRedHrs} onChange={setBatchRedHrs} min={1} max={48} unit="hrs" /></SettingRow>
              <SettingRow label="Credibility Cliff Score" sub="Auto-freeze contractor below this score"><NumberInput value={credCliff} onChange={setCredCliff} min={10} max={60} unit="pts" /></SettingRow>
              <SettingRow label="Complaint Surge %" sub="% above 7-day average before zone alert fires"><NumberInput value={complaintSurge} onChange={setComplaintSurge} min={10} max={200} unit="%" /></SettingRow>
              <SettingRow label="Fake Clearance Threshold" sub="% citizen rejections before worker is flagged"><NumberInput value={fakePhotoThresh} onChange={setFakePhotoThresh} min={5} max={100} unit="%" /></SettingRow>
            </>
          )}

          {section === "security" && (
            <>
              <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Security Settings</h2>
              <SettingRow label="Two-Factor Authentication" sub="Require OTP for all admin logins"><Toggle on={twoFA} onChange={setTwoFA} color="#3b82f6" /></SettingRow>
              <SettingRow label="Audit Log" sub="Record all admin actions with timestamps"><Toggle on={auditLog} onChange={setAuditLog} color="#3b82f6" /></SettingRow>
              <SettingRow label="Session Timeout" sub="Auto-logout after inactivity"><NumberInput value={sessionTimeout} onChange={setSessionTimeout} min={5} max={480} unit="mins" /></SettingRow>
              <div style={{ marginTop: 20, padding: "14px 16px", borderRadius: 12, background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)" }}>
                <p style={{ fontSize: 12, color: "#3b82f6", fontWeight: 600, marginBottom: 4 }}>Admin URL</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Access admin panel at <code style={{ color: "rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.05)", padding: "1px 6px", borderRadius: 4 }}>/admin</code> — this path is not linked from the public landing page.</p>
              </div>
            </>
          )}

          {section === "system" && (
            <>
              <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, marginBottom: 20 }}>System Configuration</h2>
              <SettingRow label="Auto-Generate Weekly Report" sub="Trigger Llama 3.1 report every Monday"><Toggle on={autoReport} onChange={setAutoReport} /></SettingRow>
              <SettingRow label="Report Generation Day" sub="Day of week for automated report">
                <select value={reportDay} onChange={e => setReportDay(e.target.value)}
                  style={{ padding: "7px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#fff", fontSize: 12, outline: "none" }}>
                  {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(d => <option key={d} value={d} style={{ background: "#0d1b2a" }}>{d}</option>)}
                </select>
              </SettingRow>
              <SettingRow label="Data Retention Period" sub="Days before old batch records are archived"><NumberInput value={dataRetention} onChange={setDataRetention} min={30} max={365} unit="days" /></SettingRow>
              <SettingRow label="Credibility Score Update Frequency" sub="How often credibility scores recalculate"><NumberInput value={credUpdateFreq} onChange={setCredUpdateFreq} min={1} max={168} unit="hrs" /></SettingRow>

              <div style={{ marginTop: 20, padding: "16px", borderRadius: 12, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#ef4444", marginBottom: 6 }}>Danger Zone</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 12 }}>These actions are irreversible. Use with caution.</p>
                <div style={{ display: "flex", gap: 10 }}>
                  <button style={{ padding: "8px 16px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Clear All Anomalies</button>
                  <button style={{ padding: "8px 16px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Reset Credibility Scores</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}