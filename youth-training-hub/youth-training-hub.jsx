import { useState, useEffect, useCallback, useMemo } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// DATA: Drill libraries & session templates
// ═══════════════════════════════════════════════════════════════════════════════

const DRILL_LIBRARY = {
  rugby: {
    "Warm-Up & Agility": [
      { id: "r-wu-1", name: "Dynamic Stretch Corridor", duration: 8 },
      { id: "r-wu-2", name: "Ladder & Cone Agility", duration: 10 },
      { id: "r-wu-3", name: "Touch Rugby (light)", duration: 10 },
    ],
    "Contact & Tackle": [
      { id: "r-ct-1", name: "Tackle Technique Pairs", duration: 10 },
      { id: "r-ct-2", name: "Ruck Clear-Out Circuit", duration: 12 },
      { id: "r-ct-3", name: "1v1 Channel Tackle", duration: 8 },
    ],
    "Passing & Handling": [
      { id: "r-ph-1", name: "Lateral Pass Relay", duration: 8 },
      { id: "r-ph-2", name: "Miss-Pass Progression", duration: 10 },
      { id: "r-ph-3", name: "Offload Under Pressure", duration: 10 },
    ],
    "Phase Play & Attack": [
      { id: "r-pp-1", name: "Overlap 3v2", duration: 12 },
      { id: "r-pp-2", name: "Multi-Phase Attack", duration: 15 },
      { id: "r-pp-3", name: "Loop & Switch Plays", duration: 12 },
    ],
    Defence: [
      { id: "r-df-1", name: "Drift Defence Pattern", duration: 12 },
      { id: "r-df-2", name: "Blitz Defence Walk-Through", duration: 10 },
      { id: "r-df-3", name: "Line Speed Drill", duration: 8 },
    ],
    "Set Piece": [
      { id: "r-sp-1", name: "Lineout Lifting & Timing", duration: 15 },
      { id: "r-sp-2", name: "Scrum Engagement", duration: 12 },
      { id: "r-sp-3", name: "Restart Kick-Off Patterns", duration: 10 },
    ],
    "Game Scenarios": [
      { id: "r-gs-1", name: "Small-Sided Game (6v6)", duration: 15 },
      { id: "r-gs-2", name: "Full Match Scenario", duration: 20 },
      { id: "r-gs-3", name: "Red Zone Attack/Defence", duration: 12 },
    ],
    Fitness: [
      { id: "r-fc-1", name: "Bronco / Shuttle Test", duration: 10 },
      { id: "r-fc-2", name: "Repeated Sprint Sets", duration: 12 },
    ],
  },
  soccer: {
    "Warm-Up & Agility": [
      { id: "s-wu-1", name: "Dynamic Movement Patterns", duration: 8 },
      { id: "s-wu-2", name: "Rondo (5v2)", duration: 10 },
      { id: "s-wu-3", name: "Ball Mastery Circuit", duration: 8 },
    ],
    "Passing & Possession": [
      { id: "s-pp-1", name: "4v2 Keep-Ball Grid", duration: 10 },
      { id: "s-pp-2", name: "Switching Play", duration: 12 },
      { id: "s-pp-3", name: "One-Touch Passing Triangles", duration: 8 },
      { id: "s-pp-4", name: "Positional Play Grid", duration: 15 },
    ],
    "Attacking Play": [
      { id: "s-ap-1", name: "Overlap & Underlap Runs", duration: 12 },
      { id: "s-ap-2", name: "Counter-Attack 3v2", duration: 10 },
      { id: "s-ap-3", name: "Combination Play", duration: 12 },
    ],
    Defending: [
      { id: "s-df-1", name: "Pressing Triggers", duration: 12 },
      { id: "s-df-2", name: "1v1 Defending Channel", duration: 8 },
      { id: "s-df-3", name: "Defensive Block Shape", duration: 12 },
    ],
    "Shooting & Finishing": [
      { id: "s-sf-1", name: "Finishing Circuit", duration: 15 },
      { id: "s-sf-2", name: "Crossing & Heading", duration: 12 },
    ],
    "Set Pieces": [
      { id: "s-sp-1", name: "Corner Routines", duration: 12 },
      { id: "s-sp-2", name: "Free Kick Patterns", duration: 10 },
    ],
    "Game Scenarios": [
      { id: "s-gs-1", name: "Small-Sided Game (4v4)", duration: 15 },
      { id: "s-gs-2", name: "Conditioned Game", duration: 15 },
      { id: "s-gs-3", name: "Full Match Scrimmage", duration: 20 },
    ],
  },
  gaa: {
    "Warm-Up & Agility": [
      { id: "g-wu-1", name: "Dynamic Warm-Up Laps", duration: 8 },
      { id: "g-wu-2", name: "Ladder / Cone Agility", duration: 10 },
      { id: "g-wu-3", name: "Keepball (hand-pass)", duration: 10 },
    ],
    "Hand-Passing": [
      { id: "g-hp-1", name: "Hand-Pass Accuracy Pairs", duration: 8 },
      { id: "g-hp-2", name: "Pop-Pass Under Pressure", duration: 10 },
    ],
    "Kick-Passing": [
      { id: "g-kp-1", name: "Kick-Pass to Target Zones", duration: 10 },
      { id: "g-kp-2", name: "Diagonal Kick-Pass", duration: 10 },
      { id: "g-kp-3", name: "Kick-Pass Off Both Feet", duration: 12 },
    ],
    "Shooting & Scoring": [
      { id: "g-ss-1", name: "Point-Taking Circuit", duration: 12 },
      { id: "g-ss-2", name: "Goal Chance Finishing", duration: 10 },
      { id: "g-ss-3", name: "Free-Taking Practice", duration: 10 },
    ],
    "Tackling & Defence": [
      { id: "g-td-1", name: "1v1 Tackling Drill", duration: 8 },
      { id: "g-td-2", name: "Hook & Block Practice", duration: 10 },
      { id: "g-td-3", name: "Defensive Shape", duration: 12 },
    ],
    "Attack & Movement": [
      { id: "g-am-1", name: "Overlap Runs (3v2)", duration: 12 },
      { id: "g-am-2", name: "Kick-Out Attack Pattern", duration: 12 },
    ],
    "Game Scenarios": [
      { id: "g-gs-1", name: "Small-Sided Game (5v5)", duration: 15 },
      { id: "g-gs-2", name: "Conditioned Game", duration: 15 },
      { id: "g-gs-3", name: "Full Match Scenario", duration: 20 },
    ],
  },
};

const SESSION_TEMPLATES = {
  rugby: [
    { name: "Standard Team Session", drills: ["r-wu-1","r-wu-3","r-ph-1","r-pp-1","r-df-1","r-gs-1"] },
    { name: "Contact & Defence Focus", drills: ["r-wu-2","r-ct-1","r-ct-2","r-df-1","r-df-3","r-gs-2"] },
    { name: "Attack & Phase Play", drills: ["r-wu-3","r-ph-2","r-pp-2","r-pp-3","r-gs-3"] },
    { name: "Set Piece Session", drills: ["r-wu-1","r-sp-1","r-sp-2","r-sp-3","r-gs-1"] },
    { name: "Light / Recovery", drills: ["r-wu-1","r-ph-1","r-wu-3"] },
  ],
  soccer: [
    { name: "Standard Team Session", drills: ["s-wu-1","s-wu-2","s-pp-1","s-ap-1","s-gs-2"] },
    { name: "Possession & Build-Up", drills: ["s-wu-2","s-pp-3","s-pp-4","s-pp-2","s-gs-2"] },
    { name: "Attacking & Finishing", drills: ["s-wu-3","s-ap-2","s-ap-3","s-sf-1","s-gs-1"] },
    { name: "Defensive Organisation", drills: ["s-wu-1","s-df-1","s-df-2","s-df-3","s-gs-3"] },
  ],
  gaa: [
    { name: "Standard Team Session", drills: ["g-wu-1","g-wu-3","g-hp-1","g-kp-1","g-ss-1","g-gs-1"] },
    { name: "Skills & Scoring", drills: ["g-wu-2","g-hp-2","g-kp-3","g-ss-1","g-ss-2","g-gs-2"] },
    { name: "Attack Patterns", drills: ["g-wu-3","g-am-1","g-am-2","g-gs-1"] },
    { name: "Defence & Tackling", drills: ["g-wu-1","g-td-1","g-td-2","g-td-3","g-gs-3"] },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// SPORT COLOURS
// ═══════════════════════════════════════════════════════════════════════════════

const SPORT_COLORS = {
  rugby:      { bg: "#1a5632", accent: "#2d8a56", light: "#e8f5ee", icon: "\u{1F3C9}" },
  soccer:     { bg: "#1a3d6e", accent: "#2b6cb0", light: "#e8f0fa", icon: "\u26BD" },
  gaa:        { bg: "#7c3a1a", accent: "#c05621", light: "#fef3e8", icon: "\u{1F3D0}" },
  swimming:   { bg: "#0e7490", accent: "#06b6d4", light: "#e0f7fa", icon: "\u{1F3CA}" },
  athletics:  { bg: "#92400e", accent: "#d97706", light: "#fef3c7", icon: "\u{1F3C3}" },
  tennis:     { bg: "#5b7e1a", accent: "#84cc16", light: "#f0fce8", icon: "\u{1F3BE}" },
  gymnastics: { bg: "#7e22ce", accent: "#a855f7", light: "#f3e8ff", icon: "\u{1F938}" },
  dance:      { bg: "#be185d", accent: "#ec4899", light: "#fce7f3", icon: "\u{1F483}" },
  hurling:    { bg: "#4a3520", accent: "#92702a", light: "#f5f0e8", icon: "\u{1F3D1}" },
  camogie:    { bg: "#6b2140", accent: "#b5465a", light: "#fae8ee", icon: "\u{1F3D1}" },
  basketball: { bg: "#c2410c", accent: "#ea580c", light: "#fff7ed", icon: "\u{1F3C0}" },
  hockey:     { bg: "#155e75", accent: "#0891b2", light: "#ecfeff", icon: "\u{1F3D2}" },
  cycling:    { bg: "#4d7c0f", accent: "#65a30d", light: "#f7fee7", icon: "\u{1F6B4}" },
  martial_arts: { bg: "#581c87", accent: "#7c3aed", light: "#ede9fe", icon: "\u{1F94B}" },
};

function getSportStyle(name) {
  const key = (name || "").toLowerCase().trim().replace(/\s+/g, "_");
  if (SPORT_COLORS[key]) return SPORT_COLORS[key];
  // Check without underscores
  const keyAlt = key.replace(/_/g, "");
  for (const [k, v] of Object.entries(SPORT_COLORS)) {
    if (k.replace(/_/g, "") === keyAlt) return v;
  }
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash);
  const h = Math.abs(hash) % 360;
  return { bg: `hsl(${h},45%,30%)`, accent: `hsl(${h},55%,45%)`, light: `hsl(${h},60%,94%)`, icon: "\u{1F3C5}" };
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function findDrill(sport, drillId) {
  const lib = DRILL_LIBRARY[sport];
  if (!lib) return null;
  for (const cat of Object.values(lib)) {
    const found = cat.find((d) => d.id === drillId);
    if (found) return { ...found, notes: "" };
  }
  return null;
}

function genCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let c = "";
  for (let i = 0; i < 6; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return c;
}

function toDateStr(d) {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`;
}
function toTimeStr(d) {
  const dt = new Date(d);
  return `${String(dt.getHours()).padStart(2,"0")}:${String(dt.getMinutes()).padStart(2,"0")}`;
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}
function fmtDateTime(d) {
  const dt = new Date(d);
  return `${fmtDate(d)} \u00B7 ${dt.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit",hour12:false})}`;
}
function totalMins(drills) {
  return (drills || []).reduce((s, d) => s + (d.duration || 0), 0);
}
function getMonStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}
function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
function weekLabel(date) {
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════

const FONT = "'Figtree', 'DM Sans', 'Helvetica Neue', sans-serif";
const CLR = { bg: "#f5f4f0", card: "#ffffff", border: "#e8e6e1", text: "#1a1917", muted: "#8a8780", subtle: "#c5c3bc" };

export default function App() {
  const [data, setData] = useState({ youths: [], teams: [], coachSessions: [], parentActivities: [] });
  const [loaded, setLoaded] = useState(false);
  const [role, setRole] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get("youth-training-hub-v2");
        if (res?.value) setData(JSON.parse(res.value));
      } catch {}
      setLoaded(true);
    })();
  }, []);

  const save = useCallback((nd) => {
    setData(nd);
    (async () => { try { await window.storage.set("youth-training-hub-v2", JSON.stringify(nd)); } catch {} })();
  }, []);

  const up = useCallback((patch) => {
    const next = { ...data, ...patch };
    save(next);
    return next;
  }, [data, save]);

  if (!loaded) return <div style={{ fontFamily: FONT, minHeight: "100vh", background: CLR.bg, maxWidth: 520, margin: "0 auto" }}><div style={{ background: "#0f172a", color: "#fff", padding: "20px" }}><h1 style={{ fontSize: 19, fontWeight: 700, margin: 0 }}>Youth Training Hub</h1></div><div style={{ textAlign: "center", padding: 40, color: CLR.muted }}>Loading\u2026</div></div>;

  if (!role) return <RoleSelect setRole={setRole} />;
  if (role === "coach") return <CoachView data={data} up={up} setRole={setRole} />;
  if (role === "parent") return <ParentView data={data} up={up} setRole={setRole} />;
  return <TimelineView data={data} setRole={setRole} />;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED STYLE HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

const ss = {
  app: { fontFamily: FONT, minHeight: "100vh", background: CLR.bg, color: CLR.text, maxWidth: 520, margin: "0 auto" },
  header: (bg) => ({ background: bg || "#0f172a", color: "#fff", padding: "16px 20px 12px", position: "sticky", top: 0, zIndex: 10 }),
  hTitle: { fontSize: 19, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" },
  hSub: { fontSize: 12, opacity: 0.7, marginTop: 2 },
  back: { background: "none", border: "none", color: "#fff", fontSize: 13, cursor: "pointer", padding: "0 0 4px", opacity: 0.8, fontFamily: FONT },
  body: { padding: "14px 20px 80px" },
  card: { background: CLR.card, borderRadius: 12, padding: 16, marginBottom: 10, border: `1px solid ${CLR.border}` },
  label: { fontSize: 12, fontWeight: 600, color: CLR.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, display: "block" },
  input: { width: "100%", padding: "10px 12px", fontSize: 15, border: `1.5px solid ${CLR.border}`, borderRadius: 10, outline: "none", fontFamily: FONT, boxSizing: "border-box", background: "#fff" },
  btn: (bg, fg="#fff") => ({ background: bg, color: fg, border: "none", borderRadius: 10, padding: "12px 20px", fontSize: 15, fontWeight: 600, cursor: "pointer", width: "100%", fontFamily: FONT }),
  btnSm: (bg, fg="#fff") => ({ background: bg, color: fg, border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONT }),
  section: { fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: CLR.muted, margin: "18px 0 8px" },
  empty: { textAlign: "center", padding: "36px 20px", color: CLR.muted, fontSize: 14 },
  tag: (bg, fg) => ({ display: "inline-block", background: bg, color: fg, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 16, marginRight: 5 }),
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 30, display: "flex", alignItems: "flex-end", justifyContent: "center" },
  sheet: { background: "#fff", borderRadius: "20px 20px 0 0", maxWidth: 520, width: "100%", maxHeight: "70vh", overflow: "auto", padding: "20px 20px 32px" },
  drillRow: { display: "flex", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${CLR.border}`, gap: 8 },
  iconBtn: { background: "none", border: "none", fontSize: 15, cursor: "pointer", padding: 3, opacity: 0.45, lineHeight: 1 },
  roleSwitch: { background: "none", border: "none", color: "#fff", fontSize: 11, cursor: "pointer", opacity: 0.55, fontFamily: FONT, float: "right", padding: 0 },
};

// ═══════════════════════════════════════════════════════════════════════════════
// ROLE SELECT
// ═══════════════════════════════════════════════════════════════════════════════

function RoleSelect({ setRole }) {
  return (
    <div style={ss.app}>
      <div style={ss.header()}>
        <h1 style={{ ...ss.hTitle, fontSize: 22 }}>Youth Training Hub</h1>
        <div style={ss.hSub}>Multi-sport session diary & player timeline</div>
      </div>
      <div style={{ ...ss.body, paddingTop: 24 }}>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: CLR.muted, marginBottom: 22 }}>
          Choose your role to get started. You can switch any time.
        </p>
        {[
          { key: "coach", icon: "\u{1F4CB}", title: "I'm a Coach", desc: "Log team sessions with drill templates, link players via codes" },
          { key: "parent", icon: "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}", title: "I'm a Parent", desc: "Register your child, log any sport/activity, share codes with coaches" },
          { key: "timeline", icon: "\u{1F4CA}", title: "View Timeline", desc: "See a youth\u2019s combined training load \u2014 Notion-style weekly view" },
        ].map(r => (
          <div key={r.key} style={{ ...ss.card, cursor: "pointer", display: "flex", gap: 14, alignItems: "center" }} onClick={() => setRole(r.key)}>
            <div style={{ fontSize: 30 }}>{r.icon}</div>
            <div><div style={{ fontWeight: 700, fontSize: 16 }}>{r.title}</div><div style={{ fontSize: 13, color: CLR.muted, marginTop: 2 }}>{r.desc}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COACH VIEW
// ═══════════════════════════════════════════════════════════════════════════════

function CoachView({ data, up, setRole }) {
  const [view, setView] = useState("home");
  const [activeTeam, setActiveTeam] = useState(null);
  const [ntName, setNtName] = useState(""); const [ntSport, setNtSport] = useState("rugby"); const [ntLevel, setNtLevel] = useState("");
  const [linkCode, setLinkCode] = useState("");
  const [selTpl, setSelTpl] = useState(null); const [sDrills, setSDrills] = useState([]); const [sNotes, setSNotes] = useState("");
  const [sDate, setSDate] = useState(""); const [sTime, setSTime] = useState(""); const [sAtt, setSAtt] = useState([]);
  const [showPicker, setShowPicker] = useState(false); const [pickerCat, setPickerCat] = useState(null);
  const [detSess, setDetSess] = useState(null);

  const sport = activeTeam?.sport || "rugby";
  const sty = getSportStyle(sport);
  const tpls = SESSION_TEMPLATES[sport] || [];
  const dLib = DRILL_LIBRARY[sport] || {};
  const tSess = activeTeam ? data.coachSessions.filter(s => s.teamId === activeTeam.id) : [];
  const linked = activeTeam ? data.youths.filter(y => (activeTeam.linkedYouthCodes || []).includes(y.code)) : [];

  function addTeam() {
    if (!ntName.trim()) return;
    const t = { id: "t-" + Date.now(), name: ntName.trim(), sport: ntSport, level: ntLevel.trim(), linkedYouthCodes: [] };
    up({ teams: [...data.teams, t] });
    setActiveTeam(t); setNtName(""); setNtLevel(""); setView("home");
  }

  function doLink() {
    if (!linkCode.trim() || !activeTeam) return;
    const code = linkCode.trim().toUpperCase();
    const y = data.youths.find(yy => yy.code === code);
    if (!y) { alert("No youth found with code: " + code); return; }
    if ((activeTeam.linkedYouthCodes || []).includes(code)) { alert(y.name + " already linked."); setLinkCode(""); return; }
    const ut = { ...activeTeam, linkedYouthCodes: [...(activeTeam.linkedYouthCodes||[]), code] };
    up({ teams: data.teams.map(t => t.id === activeTeam.id ? ut : t) });
    setActiveTeam(ut); setLinkCode("");
  }

  function startSess(tpl) {
    const drills = tpl.drills.map(id => findDrill(sport, id)).filter(Boolean);
    setSelTpl(tpl); setSDrills(drills); setSNotes("");
    const now = new Date(); setSDate(toDateStr(now)); setSTime(toTimeStr(now));
    setSAtt(linked.map(y => y.code));
    setView("newSession");
  }

  function saveSess() {
    const td = new Date(`${sDate}T${sTime}:00`).toISOString();
    const s = { id: "cs-" + Date.now(), teamId: activeTeam.id, trainingDate: td, recordedAt: new Date().toISOString(), templateName: selTpl?.name || "Custom", drills: sDrills, notes: sNotes, attendees: sAtt, sport: activeTeam.sport, teamName: activeTeam.name };
    up({ coachSessions: [s, ...data.coachSessions] });
    setView("home");
  }

  // ── ADD TEAM ──
  if (view === "addTeam") {
    return (
      <div style={ss.app}>
        <div style={ss.header(getSportStyle(ntSport).bg)}>
          <button style={ss.back} onClick={() => setView("home")}>\u2190 Back</button>
          <h1 style={ss.hTitle}>Add Team</h1>
        </div>
        <div style={ss.body}>
          <div style={ss.card}>
            <span style={ss.label}>Sport</span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
              {["rugby","soccer","gaa"].map(sp => {
                const s2 = getSportStyle(sp); const on = ntSport === sp;
                return <button key={sp} onClick={() => setNtSport(sp)} style={ss.btnSm(on ? s2.bg : "#f0efeb", on ? "#fff" : CLR.text)}>{s2.icon} {sp.charAt(0).toUpperCase()+sp.slice(1)}</button>;
              })}
            </div>
            <span style={ss.label}>Team Name</span>
            <input style={{ ...ss.input, marginBottom: 14 }} placeholder="e.g. U16 Boys" value={ntName} onChange={e => setNtName(e.target.value)} />
            <span style={ss.label}>Level (optional)</span>
            <input style={{ ...ss.input, marginBottom: 18 }} placeholder="e.g. Division 2" value={ntLevel} onChange={e => setNtLevel(e.target.value)} />
            <button style={ss.btn(getSportStyle(ntSport).bg)} onClick={addTeam}>Save Team</button>
          </div>
        </div>
      </div>
    );
  }

  // ── NEW SESSION ──
  if (view === "newSession" && activeTeam) {
    return (
      <div style={ss.app}>
        <div style={ss.header(sty.bg)}>
          <button style={ss.back} onClick={() => { setView("home"); setShowPicker(false); }}>\u2190 Cancel</button>
          <h1 style={ss.hTitle}>{selTpl?.name || "Custom Session"}</h1>
          <div style={ss.hSub}>{sDrills.length} drills \u00B7 {totalMins(sDrills)} min</div>
        </div>
        <div style={ss.body}>
          {/* Date/Time */}
          <div style={ss.card}>
            <span style={{ ...ss.label, marginBottom: 10 }}>Training Date & Time</span>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}><span style={{ ...ss.label, fontSize: 10 }}>Date</span><input type="date" value={sDate} onChange={e => setSDate(e.target.value)} style={{ ...ss.input, marginTop: 3 }} /></div>
              <div style={{ flex: 1 }}><span style={{ ...ss.label, fontSize: 10 }}>Time</span><input type="time" value={sTime} onChange={e => setSTime(e.target.value)} style={{ ...ss.input, marginTop: 3 }} /></div>
            </div>
          </div>

          {/* Attendance */}
          {linked.length > 0 && (
            <div style={ss.card}>
              <span style={ss.label}>Attendance \u2014 tap to toggle</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                {linked.map(y => {
                  const on = sAtt.includes(y.code);
                  return <button key={y.code} onClick={() => setSAtt(p => on ? p.filter(c=>c!==y.code) : [...p, y.code])} style={{ ...ss.btnSm(on ? sty.bg : "#f0efeb", on ? "#fff" : CLR.muted), opacity: on ? 1 : 0.6 }}>{on ? "\u2713 " : ""}{y.name}</button>;
                })}
              </div>
            </div>
          )}

          {/* Drills */}
          <div style={ss.card}>
            {sDrills.length === 0 && <div style={{ ...ss.empty, padding: "10px 0" }}>No drills \u2014 tap + below.</div>}
            {sDrills.map((d, i) => (
              <div key={d.id+"-"+i} style={ss.drillRow}>
                <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <button style={ss.iconBtn} onClick={() => { if(i>0){ const n=[...sDrills]; [n[i],n[i-1]]=[n[i-1],n[i]]; setSDrills(n); } }}>\u25B2</button>
                  <button style={ss.iconBtn} onClick={() => { if(i<sDrills.length-1){ const n=[...sDrills]; [n[i],n[i+1]]=[n[i+1],n[i]]; setSDrills(n); } }}>\u25BC</button>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{d.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                    <input type="number" value={d.duration} onChange={e => { const v=parseInt(e.target.value)||0; setSDrills(p=>p.map((x,j)=>j===i?{...x,duration:v}:x)); }} style={{ width: 44, padding: "2px 5px", fontSize: 13, border: `1px solid ${CLR.border}`, borderRadius: 6, textAlign: "center", fontFamily: FONT }} />
                    <span style={{ fontSize: 11, color: CLR.muted }}>min</span>
                  </div>
                  <input placeholder="Note\u2026" value={d.notes||""} onChange={e => setSDrills(p=>p.map((x,j)=>j===i?{...x,notes:e.target.value}:x))} style={{ ...ss.input, fontSize: 11, padding: "4px 7px", marginTop: 3, border: "1px solid #eee", background: "#fafaf8" }} />
                </div>
                <button style={{ ...ss.iconBtn, color: "#dc2626", fontSize: 17, opacity: 0.6 }} onClick={() => setSDrills(p=>p.filter((_,j)=>j!==i))}>\u00D7</button>
              </div>
            ))}
          </div>
          <button style={ss.btn(sty.light, sty.bg)} onClick={() => { setShowPicker(true); setPickerCat(null); }}>+ Add Drill</button>
          <div style={{ ...ss.section, marginTop: 18 }}>Session Notes</div>
          <textarea style={{ ...ss.input, minHeight: 65, resize: "vertical" }} placeholder="Any observations\u2026" value={sNotes} onChange={e => setSNotes(e.target.value)} />
          <button style={{ ...ss.btn(sty.bg), marginTop: 16 }} onClick={saveSess} disabled={sDrills.length===0}>Save Session \u2713</button>
        </div>

        {showPicker && (
          <div style={ss.overlay} onClick={() => setShowPicker(false)}>
            <div style={ss.sheet} onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{pickerCat || "Pick a Category"}</h3>
                {pickerCat && <button style={ss.btnSm("#f0efeb", CLR.text)} onClick={() => setPickerCat(null)}>\u2190 Back</button>}
              </div>
              {!pickerCat ? Object.keys(dLib).map(cat => (
                <div key={cat} onClick={() => setPickerCat(cat)} style={{ padding: "11px 0", borderBottom: `1px solid ${CLR.border}`, cursor: "pointer", fontSize: 15, fontWeight: 500, display: "flex", justifyContent: "space-between" }}>{cat}<span style={{ color: CLR.subtle }}>\u203A</span></div>
              )) : (dLib[pickerCat]||[]).map(drill => (
                <div key={drill.id} onClick={() => { setSDrills(p=>[...p,{...drill,notes:""}]); setShowPicker(false); setPickerCat(null); }} style={{ padding: "11px 0", borderBottom: `1px solid ${CLR.border}`, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><div style={{ fontSize: 14, fontWeight: 600 }}>{drill.name}</div><div style={{ fontSize: 12, color: CLR.muted }}>{drill.duration} min</div></div>
                  <span style={{ color: sty.accent, fontWeight: 700, fontSize: 18 }}>+</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── SESSION DETAIL ──
  if (view === "sessionDetail" && detSess) {
    const attNames = (detSess.attendees||[]).map(c => { const y = data.youths.find(yy=>yy.code===c); return y ? y.name : c; });
    return (
      <div style={ss.app}>
        <div style={ss.header(sty.bg)}>
          <button style={ss.back} onClick={() => setView("history")}>\u2190 History</button>
          <h1 style={ss.hTitle}>{detSess.templateName}</h1>
          <div style={ss.hSub}>{fmtDateTime(detSess.trainingDate)}</div>
        </div>
        <div style={ss.body}>
          {detSess.recordedAt && <div style={{ fontSize: 11, color: CLR.subtle, textAlign: "right", marginBottom: 6 }}>Logged {fmtDateTime(detSess.recordedAt)}</div>}
          {attNames.length > 0 && <div style={ss.card}><span style={ss.label}>Attendance ({attNames.length})</span><div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>{attNames.map((n,i) => <span key={i} style={ss.tag(sty.light, sty.bg)}>{n}</span>)}</div></div>}
          <div style={ss.card}>
            <div style={{ fontSize: 12, color: CLR.muted, marginBottom: 4 }}>{detSess.drills.length} drills \u00B7 {totalMins(detSess.drills)} min</div>
            {detSess.drills.map((d,i) => (
              <div key={i} style={{ ...ss.drillRow, borderBottom: i < detSess.drills.length-1 ? `1px solid ${CLR.border}` : "none" }}>
                <span style={{ width: 22, height: 22, borderRadius: 11, background: sty.light, color: sty.bg, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i+1}</span>
                <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13 }}>{d.name}</div><div style={{ fontSize: 11, color: CLR.muted }}>{d.duration} min</div>{d.notes && <div style={{ fontSize: 11, color: "#666", fontStyle: "italic" }}>{d.notes}</div>}</div>
              </div>
            ))}
          </div>
          {detSess.notes && <div style={ss.card}><span style={ss.label}>Notes</span><div style={{ fontSize: 14, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{detSess.notes}</div></div>}
        </div>
      </div>
    );
  }

  // ── HISTORY ──
  if (view === "history" && activeTeam) {
    return (
      <div style={ss.app}>
        <div style={ss.header(sty.bg)}>
          <button style={ss.back} onClick={() => setView("home")}>\u2190 {activeTeam.name}</button>
          <h1 style={ss.hTitle}>Session History</h1><div style={ss.hSub}>{tSess.length} sessions</div>
        </div>
        <div style={ss.body}>
          {tSess.length === 0 ? <div style={ss.empty}>No sessions yet.</div> : tSess.map(s => (
            <div key={s.id} style={{ ...ss.card, cursor: "pointer" }} onClick={() => { setDetSess(s); setView("sessionDetail"); }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div><div style={{ fontWeight: 600, fontSize: 14 }}>{s.templateName}</div><div style={{ fontSize: 12, color: CLR.muted, marginTop: 2 }}>{fmtDateTime(s.trainingDate)} \u00B7 {s.drills.length} drills</div></div>
                <span style={{ color: CLR.subtle }}>\u203A</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── COACH HOME ──
  return (
    <div style={ss.app}>
      <div style={ss.header(activeTeam ? sty.bg : "#1a5632")}>
        <button style={ss.roleSwitch} onClick={() => setRole(null)}>Switch role \u2197</button>
        <h1 style={ss.hTitle}>{activeTeam ? `${sty.icon} ${activeTeam.name}` : "\u{1F4CB} Coach Dashboard"}</h1>
        {activeTeam && <div style={ss.hSub}>{sport.charAt(0).toUpperCase()+sport.slice(1)}{activeTeam.level ? ` \u00B7 ${activeTeam.level}` : ""} \u00B7 {tSess.length} sessions</div>}
      </div>
      <div style={ss.body}>
        <div style={ss.section}>Your Teams</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {data.teams.map(t => {
            const ts = getSportStyle(t.sport); const on = activeTeam?.id === t.id;
            return <button key={t.id} onClick={() => setActiveTeam(t)} style={{ ...ss.btnSm(on ? ts.bg : "#fff", on ? "#fff" : CLR.text), border: on ? "none" : `1.5px solid ${CLR.border}` }}>{ts.icon} {t.name}</button>;
          })}
          <button style={{ ...ss.btnSm("#f0efeb", CLR.muted), border: "1.5px dashed #ccc" }} onClick={() => setView("addTeam")}>+ Add Team</button>
        </div>

        {!activeTeam && data.teams.length === 0 && <div style={ss.empty}><div style={{ fontSize: 32, marginBottom: 10 }}>{"\u{1F3DF}\uFE0F"}</div>Add your first team to get started.</div>}

        {activeTeam && (
          <>
            <div style={ss.section}>Linked Players ({linked.length})</div>
            <div style={ss.card}>
              {linked.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>{linked.map(y => <span key={y.code} style={ss.tag(sty.light, sty.bg)}>{y.name}</span>)}</div>}
              <div style={{ display: "flex", gap: 8 }}>
                <input style={{ ...ss.input, flex: 1 }} placeholder="Enter youth code\u2026" value={linkCode} onChange={e => setLinkCode(e.target.value)} maxLength={6} />
                <button style={ss.btnSm(sty.bg)} onClick={doLink}>Link</button>
              </div>
              <div style={{ fontSize: 11, color: CLR.muted, marginTop: 6 }}>Get the 6-character code from the player\u2019s parent.</div>
            </div>

            <div style={ss.section}>Quick Log \u2014 Pick a Template</div>
            {tpls.map(t => (
              <div key={t.name} style={{ ...ss.card, cursor: "pointer" }} onClick={() => startSess(t)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><div style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</div><div style={{ fontSize: 12, color: CLR.muted, marginTop: 2 }}>{t.drills.length} drills \u00B7 {totalMins(t.drills.map(id=>findDrill(sport,id)).filter(Boolean))} min</div></div>
                  <span style={ss.tag(sty.light, sty.bg)}>Use</span>
                </div>
              </div>
            ))}
            <button style={{ ...ss.btn(sty.light, sty.bg), marginBottom: 6 }} onClick={() => { const now = new Date(); setSelTpl({name:"Custom Session",drills:[]}); setSDrills([]); setSNotes(""); setSDate(toDateStr(now)); setSTime(toTimeStr(now)); setSAtt(linked.map(y=>y.code)); setView("newSession"); }}>+ Start Blank Session</button>

            {tSess.length > 0 && (
              <>
                <div style={{ ...ss.section, display: "flex", justifyContent: "space-between" }}><span>Recent Sessions</span><button style={{ ...ss.back, color: sty.accent, fontSize: 12, padding: 0 }} onClick={() => setView("history")}>See all \u2192</button></div>
                {tSess.slice(0,3).map(s => (
                  <div key={s.id} style={{ ...ss.card, cursor: "pointer" }} onClick={() => { setDetSess(s); setView("sessionDetail"); }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{s.templateName}</div>
                    <div style={{ fontSize: 12, color: CLR.muted, marginTop: 2 }}>{fmtDateTime(s.trainingDate)} \u00B7 {s.drills.length} drills</div>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PARENT VIEW
// ═══════════════════════════════════════════════════════════════════════════════

function ParentView({ data, up, setRole }) {
  const [view, setView] = useState("home");
  const [activeYouth, setActiveYouth] = useState(null);
  const [regName, setRegName] = useState("");
  const [actName, setActName] = useState(""); const [actDate, setActDate] = useState(toDateStr(new Date())); const [actTime, setActTime] = useState(toTimeStr(new Date())); const [actDur, setActDur] = useState("60");

  const yActs = activeYouth ? data.parentActivities.filter(a => a.youthCode === activeYouth.code) : [];

  function regYouth() {
    if (!regName.trim()) return;
    const y = { id: "y-" + Date.now(), name: regName.trim(), code: genCode() };
    up({ youths: [...data.youths, y] });
    setActiveYouth(y); setRegName(""); setView("registered");
  }

  function logAct() {
    if (!actName.trim() || !activeYouth) return;
    const a = { id: "pa-" + Date.now(), youthCode: activeYouth.code, activity: actName.trim(), trainingDate: new Date(`${actDate}T${actTime}:00`).toISOString(), duration: parseInt(actDur) || 60, recordedAt: new Date().toISOString() };
    up({ parentActivities: [a, ...data.parentActivities] });
    setActName(""); setView("home");
  }

  if (view === "registered" && activeYouth) {
    return (
      <div style={ss.app}>
        <div style={ss.header("#4338ca")}><h1 style={ss.hTitle}>Player Registered!</h1></div>
        <div style={ss.body}>
          <div style={{ ...ss.card, textAlign: "center", padding: 28 }}>
            <div style={{ fontSize: 14, color: CLR.muted, marginBottom: 8 }}>{activeYouth.name}\u2019s unique code</div>
            <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: "0.15em", color: "#4338ca", fontFamily: "'Courier New', monospace", margin: "12px 0" }}>{activeYouth.code}</div>
            <div style={{ fontSize: 13, color: CLR.muted, lineHeight: 1.6, maxWidth: 300, margin: "0 auto" }}>Share this code with each of {activeYouth.name}\u2019s coaches. They enter it once to link the player to their team.</div>
          </div>
          <button style={ss.btn("#4338ca")} onClick={() => setView("home")}>Done</button>
        </div>
      </div>
    );
  }

  if (view === "logActivity" && activeYouth) {
    return (
      <div style={ss.app}>
        <div style={ss.header("#4338ca")}>
          <button style={ss.back} onClick={() => setView("home")}>\u2190 Back</button>
          <h1 style={ss.hTitle}>Log Activity</h1>
          <div style={ss.hSub}>for {activeYouth.name}</div>
        </div>
        <div style={ss.body}>
          <div style={ss.card}>
            <span style={ss.label}>Activity / Sport Name</span>
            <input style={{ ...ss.input, marginBottom: 14 }} placeholder="e.g. Swimming, Tennis, Dance\u2026" value={actName} onChange={e => setActName(e.target.value)} />
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1 }}><span style={ss.label}>Date</span><input type="date" value={actDate} onChange={e => setActDate(e.target.value)} style={{ ...ss.input, marginTop: 3 }} /></div>
              <div style={{ flex: 1 }}><span style={ss.label}>Time</span><input type="time" value={actTime} onChange={e => setActTime(e.target.value)} style={{ ...ss.input, marginTop: 3 }} /></div>
            </div>
            <span style={ss.label}>Duration (minutes)</span>
            <input type="number" value={actDur} onChange={e => setActDur(e.target.value)} style={{ ...ss.input, marginBottom: 18 }} />
            <button style={ss.btn("#4338ca")} onClick={logAct}>Save Activity</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={ss.app}>
      <div style={ss.header("#4338ca")}>
        <button style={ss.roleSwitch} onClick={() => setRole(null)}>Switch role \u2197</button>
        <h1 style={ss.hTitle}>{"\u{1F468}\u200D\u{1F469}\u200D\u{1F467}"} Parent Dashboard</h1>
        {activeYouth && <div style={ss.hSub}>Managing: {activeYouth.name} \u00B7 Code: {activeYouth.code}</div>}
      </div>
      <div style={ss.body}>
        <div style={ss.section}>Your Children</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {data.youths.map(y => {
            const on = activeYouth?.code === y.code;
            return <button key={y.code} onClick={() => setActiveYouth(y)} style={{ ...ss.btnSm(on ? "#4338ca" : "#fff", on ? "#fff" : CLR.text), border: on ? "none" : `1.5px solid ${CLR.border}` }}>{y.name}</button>;
          })}
          <button style={{ ...ss.btnSm("#f0efeb", CLR.muted), border: "1.5px dashed #ccc" }} onClick={() => setView("register")}>+ Register Child</button>
        </div>

        {view === "register" && (
          <div style={ss.card}>
            <span style={ss.label}>Child\u2019s Full Name</span>
            <input style={{ ...ss.input, marginBottom: 12 }} placeholder="e.g. Ciar\u00E1n O\u2019Brien" value={regName} onChange={e => setRegName(e.target.value)} />
            <button style={ss.btn("#4338ca")} onClick={regYouth}>Register & Get Code</button>
          </div>
        )}

        {activeYouth && (
          <>
            <div style={{ ...ss.card, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 11, color: CLR.muted, flex: 1 }}>Share this code with coaches:</div>
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "0.12em", color: "#4338ca", fontFamily: "'Courier New', monospace" }}>{activeYouth.code}</div>
            </div>

            <button style={{ ...ss.btn("#6366f1"), marginBottom: 8 }} onClick={() => { const now = new Date(); setActDate(toDateStr(now)); setActTime(toTimeStr(now)); setActDur("60"); setActName(""); setView("logActivity"); }}>+ Log an Activity</button>

            {yActs.length > 0 && (
              <>
                <div style={ss.section}>Recent Activities</div>
                {yActs.slice(0, 5).map(a => {
                  const s2 = getSportStyle(a.activity);
                  return <div key={a.id} style={ss.card}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={ss.tag(s2.light, s2.bg)}>{s2.icon} {a.activity}</span><span style={{ fontSize: 12, color: CLR.muted }}>{a.duration} min</span></div><div style={{ fontSize: 12, color: CLR.muted, marginTop: 4 }}>{fmtDateTime(a.trainingDate)}</div></div>;
                })}
              </>
            )}

            <button style={{ ...ss.btn("#0f172a"), marginTop: 12 }} onClick={() => setRole("timeline")}>View {activeYouth.name}\u2019s Timeline \u2192</button>
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIMELINE VIEW — Notion-style
// ═══════════════════════════════════════════════════════════════════════════════

function TimelineView({ data, setRole }) {
  const [selYouth, setSelYouth] = useState(null);
  const [wOff, setWOff] = useState(0);
  const [expDay, setExpDay] = useState(null);

  const youth = selYouth || data.youths[0] || null;

  const allEvts = useMemo(() => {
    if (!youth) return [];
    const evts = [];
    data.coachSessions.forEach(s => {
      if ((s.attendees||[]).includes(youth.code)) {
        evts.push({ id: s.id, type: "coach", sport: s.sport||"rugby", label: s.teamName||s.templateName, detail: s.templateName, date: s.trainingDate, duration: totalMins(s.drills), drills: s.drills });
      }
    });
    data.parentActivities.forEach(a => {
      if (a.youthCode === youth.code) {
        evts.push({ id: a.id, type: "parent", sport: a.activity, label: a.activity, detail: null, date: a.trainingDate, duration: a.duration, drills: null });
      }
    });
    evts.sort((a,b) => new Date(a.date) - new Date(b.date));
    return evts;
  }, [youth, data]);

  const today = new Date();
  const cwStart = getMonStart(today);
  const vwStart = addDays(cwStart, wOff * 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(vwStart, i));
  const dayNames = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  const evtsByDay = useMemo(() => {
    const m = {};
    days.forEach(d => { const k = toDateStr(d); m[k] = allEvts.filter(e => toDateStr(e.date) === k); });
    return m;
  }, [days, allEvts]);

  const weekEvts = days.flatMap(d => evtsByDay[toDateStr(d)] || []);
  const weekMins = weekEvts.reduce((s,e) => s + (e.duration||0), 0);
  const weekSports = [...new Set(weekEvts.map(e => e.sport))];

  if (data.youths.length === 0) {
    return (
      <div style={ss.app}>
        <div style={ss.header()}><button style={ss.roleSwitch} onClick={() => setRole(null)}>Switch role \u2197</button><h1 style={ss.hTitle}>{"\u{1F4CA}"} Training Timeline</h1></div>
        <div style={ss.body}><div style={ss.empty}><div style={{ fontSize: 32, marginBottom: 10 }}>{"\u{1F464}"}</div>No youth players registered yet. A parent needs to register a child first.</div></div>
      </div>
    );
  }

  return (
    <div style={ss.app}>
      <div style={ss.header()}>
        <button style={ss.roleSwitch} onClick={() => setRole(null)}>Switch role \u2197</button>
        <h1 style={ss.hTitle}>{"\u{1F4CA}"} {youth?.name || "Timeline"}</h1>
        <div style={ss.hSub}>Combined training load across all sports</div>
      </div>
      <div style={ss.body}>
        {/* Youth selector */}
        {data.youths.length > 1 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {data.youths.map(y => (
              <button key={y.code} onClick={() => { setSelYouth(y); setExpDay(null); }} style={{ ...ss.btnSm(youth?.code === y.code ? "#0f172a" : "#fff", youth?.code === y.code ? "#fff" : CLR.text), border: youth?.code === y.code ? "none" : `1.5px solid ${CLR.border}` }}>{y.name}</button>
            ))}
          </div>
        )}

        {youth && (
          <>
            {/* Week nav */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "8px 0 10px" }}>
              <button onClick={() => { setWOff(w => w-1); setExpDay(null); }} style={{ ...ss.btnSm("#f0efeb", CLR.text), padding: "6px 12px" }}>\u2190</button>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{weekLabel(vwStart)} \u2014 {weekLabel(addDays(vwStart, 6))}</div>
                <div style={{ fontSize: 11, color: CLR.muted }}>{wOff === 0 ? "This week" : wOff === -1 ? "Last week" : wOff === 1 ? "Next week" : `${Math.abs(wOff)} wk${Math.abs(wOff)>1?"s":""} ${wOff < 0 ? "ago" : "ahead"}`}</div>
              </div>
              <button onClick={() => { setWOff(w => w+1); setExpDay(null); }} style={{ ...ss.btnSm("#f0efeb", CLR.text), padding: "6px 12px" }}>\u2192</button>
            </div>

            {/* Week summary */}
            <div style={{ ...ss.card, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
              <div><div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>{weekEvts.length}</div><div style={{ fontSize: 11, color: CLR.muted }}>sessions</div></div>
              <div style={{ textAlign: "center" }}><div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>{Math.round(weekMins/60*10)/10}h</div><div style={{ fontSize: 11, color: CLR.muted }}>total</div></div>
              <div style={{ textAlign: "right" }}>
                <div style={{ display: "flex", gap: 3, justifyContent: "flex-end" }}>{weekSports.map(sp => { const s2 = getSportStyle(sp); return <span key={sp} style={{ ...ss.tag(s2.light, s2.bg), fontSize: 10, padding: "2px 7px" }}>{s2.icon}</span>; })}</div>
                <div style={{ fontSize: 11, color: CLR.muted, marginTop: 3 }}>{weekSports.length} sport{weekSports.length !== 1 ? "s" : ""}</div>
              </div>
            </div>

            {/* ── TIMELINE GRID ── */}
            <div style={{ marginTop: 10, borderRadius: 12, overflow: "hidden", border: `1px solid ${CLR.border}`, background: "#fff" }}>
              {/* Headers */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: `1px solid ${CLR.border}` }}>
                {days.map((d, i) => {
                  const isToday = toDateStr(d) === toDateStr(today);
                  return (
                    <div key={i} style={{ textAlign: "center", padding: "8px 2px 6px", background: isToday ? "#f8f7f4" : "transparent", borderRight: i < 6 ? `1px solid ${CLR.border}` : "none" }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: isToday ? "#0f172a" : CLR.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{dayNames[i]}</div>
                      <div style={{ fontSize: 14, fontWeight: isToday ? 800 : 500, color: isToday ? "#0f172a" : CLR.text, marginTop: 1 }}>{new Date(d).getDate()}</div>
                    </div>
                  );
                })}
              </div>

              {/* Event blocks */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", minHeight: 90 }}>
                {days.map((d, i) => {
                  const key = toDateStr(d);
                  const dayEvts = evtsByDay[key] || [];
                  const isToday = key === toDateStr(today);
                  return (
                    <div key={i} onClick={() => dayEvts.length > 0 && setExpDay(expDay === key ? null : key)} style={{ padding: "5px 3px", borderRight: i < 6 ? `1px solid ${CLR.border}` : "none", background: isToday ? "#fafaf8" : "transparent", cursor: dayEvts.length > 0 ? "pointer" : "default", minHeight: 75, display: "flex", flexDirection: "column", gap: 3 }}>
                      {dayEvts.map(evt => {
                        const s2 = getSportStyle(evt.sport);
                        return (
                          <div key={evt.id} style={{ background: s2.light, borderLeft: `3px solid ${s2.bg}`, borderRadius: "0 4px 4px 0", padding: "4px 4px", fontSize: 9, fontWeight: 600, color: s2.bg, lineHeight: 1.3 }}>
                            <div>{s2.icon}</div>
                            <div style={{ marginTop: 1 }}>{evt.duration}m</div>
                          </div>
                        );
                      })}
                      {dayEvts.length === 0 && <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 4, height: 4, borderRadius: 2, background: CLR.subtle, opacity: 0.3 }} /></div>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Expanded day detail */}
            {expDay && (evtsByDay[expDay] || []).length > 0 && (
              <div style={{ ...ss.card, marginTop: 8 }}>
                <div style={{ ...ss.label, marginBottom: 8 }}>{fmtDate(expDay + "T12:00:00")}</div>
                {(evtsByDay[expDay] || []).map(evt => {
                  const s2 = getSportStyle(evt.sport);
                  return (
                    <div key={evt.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${CLR.border}` }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: s2.light, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>{s2.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{evt.label}</div>
                        <div style={{ fontSize: 12, color: CLR.muted }}>
                          {evt.duration} min{evt.detail && evt.detail !== evt.label ? ` \u00B7 ${evt.detail}` : ""} \u00B7 {evt.type === "coach" ? "Coach" : "Parent"} logged
                        </div>
                        {evt.drills && <div style={{ fontSize: 11, color: CLR.muted }}>{evt.drills.length} drills</div>}
                      </div>
                      <span style={ss.tag(s2.light, s2.bg)}>{new Date(evt.date).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit",hour12:false})}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* All-time stats */}
            {allEvts.length > 0 && (
              <>
                <div style={ss.section}>All-Time Overview</div>
                <div style={ss.card}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div><div style={{ fontSize: 20, fontWeight: 800 }}>{allEvts.length}</div><div style={{ fontSize: 11, color: CLR.muted }}>sessions</div></div>
                    <div style={{ textAlign: "center" }}><div style={{ fontSize: 20, fontWeight: 800 }}>{Math.round(allEvts.reduce((s,e)=>s+e.duration,0)/60*10)/10}h</div><div style={{ fontSize: 11, color: CLR.muted }}>total hours</div></div>
                    <div style={{ textAlign: "right" }}><div style={{ fontSize: 20, fontWeight: 800 }}>{[...new Set(allEvts.map(e=>e.sport))].length}</div><div style={{ fontSize: 11, color: CLR.muted }}>sports</div></div>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 10 }}>
                    {[...new Set(allEvts.map(e => e.sport))].map(sp => {
                      const s2 = getSportStyle(sp); const ct = allEvts.filter(e=>e.sport===sp).length;
                      return <span key={sp} style={ss.tag(s2.light, s2.bg)}>{s2.icon} {sp} ({ct})</span>;
                    })}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
