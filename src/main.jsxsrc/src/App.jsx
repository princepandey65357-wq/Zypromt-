import { useState, useEffect, useRef, useCallback } from "react";

// ══════════════════════════════════════════════════════════════
//  ZYPROMPT AI  —  Real Firebase Google Auth + Full App
// ══════════════════════════════════════════════════════════════

// ── Firebase config (real) ────────────────────────────────────
const FB_CONFIG = {
  apiKey: "AIzaSyC7WGq8bqphYcEPa3IpWf4ni09OhbcmejQ",
  authDomain: "zypromt-a9ce3.firebaseapp.com",
  projectId: "zypromt-a9ce3",
  storageBucket: "zypromt-a9ce3.firebasestorage.app",
  messagingSenderId: "817898196694",
  appId: "1:817898196694:web:5f2563876a294799128377",
};

// ── Firebase loader (CDN) ─────────────────────────────────────
let fbApp = null, fbAuth = null, fbFirestore = null;
let firebaseReady = false;
const fbReadyCallbacks = [];

function onFirebaseReady(cb) {
  if (firebaseReady) { cb(); return; }
  fbReadyCallbacks.push(cb);
}

(async () => {
  try {
    const [{ initializeApp }, { getAuth, GoogleAuthProvider, signInWithPopup,
      signInWithEmailAndPassword, createUserWithEmailAndPassword,
      sendPasswordResetEmail, onAuthStateChanged, signOut, updateProfile }] =
      await Promise.all([
        import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js"),
        import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js"),
      ]);

    fbApp = initializeApp(FB_CONFIG);
    fbAuth = getAuth(fbApp);

    window._fb = {
      auth: fbAuth,
      GoogleAuthProvider, signInWithPopup,
      signInWithEmailAndPassword, createUserWithEmailAndPassword,
      sendPasswordResetEmail, onAuthStateChanged, signOut, updateProfile,
    };

    firebaseReady = true;
    fbReadyCallbacks.forEach(cb => cb());
  } catch (e) {
    console.error("Firebase load error:", e);
  }
})();

// ── Theme ─────────────────────────────────────────────────────
const C = {
  bg: "#070809", surface: "#0E1017", sidebar: "#0A0C12", card: "#13161F",
  border: "#1C2030", accent: "#6C63FF", accentD: "#6C63FF20", accentL: "#A89EFF",
  text: "#EEF0FF", sub: "#8890AA", muted: "#454860",
  success: "#4ADE80", error: "#F87171", warn: "#FBBF24",
  grad: "linear-gradient(135deg,#6C63FF,#A259FF)",
};

// ── Helpers ───────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const ts = () => new Date().toISOString();
const validateEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const LS = {
  get: (k, d = null) => { try { const v = localStorage.getItem("zp_" + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem("zp_" + k, JSON.stringify(v)); } catch {} },
  del: (k) => { try { localStorage.removeItem("zp_" + k); } catch {} },
};

// ── Static data ───────────────────────────────────────────────
const AI_MODELS = [
  { id: "chatgpt", label: "ChatGPT", color: "#10A37F" },
  { id: "claude",  label: "Claude",  color: "#D4A574" },
  { id: "gemini",  label: "Gemini",  color: "#4285F4" },
  { id: "grok",    label: "Grok",    color: "#E44B23" },
];
const CATEGORIES = [
  { id: "general",   label: "General",    icon: "✦" },
  { id: "youtube",   label: "YouTube",    icon: "▶" },
  { id: "coding",    label: "Coding",     icon: "</>" },
  { id: "marketing", label: "Marketing",  icon: "◎" },
  { id: "education", label: "Education",  icon: "◈" },
  { id: "business",  label: "Business",   icon: "◇" },
  { id: "image",     label: "Image AI",   icon: "🎨" },
  { id: "viral",     label: "Viral Hook", icon: "🔥" },
];
const MODES = [
  { id: "normal", label: "Normal",   desc: "Direct" },
  { id: "super",  label: "⚡ Super", desc: "Enhanced" },
  { id: "ultra",  label: "🔮 Ultra", desc: "3 Variations" },
];

// ── Logo ──────────────────────────────────────────────────────
function Logo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <rect width="36" height="36" rx="9" fill={C.accent} />
      <polygon points="8,18 14,10 20,18 14,26" fill="white" opacity="0.95" />
      <polygon points="17,18 23,10 29,18 23,26" fill="white" opacity="0.45" />
    </svg>
  );
}

function GIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

// ── Claude API ────────────────────────────────────────────────
async function callClaude(system, userMsg) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514", max_tokens: 1000, system,
      messages: [{ role: "user", content: userMsg }],
    }),
  });
  const d = await r.json();
  if (!d.content) throw new Error(d.error?.message || "API Error");
  return d.content.map(i => i.text || "").join("\n");
}

function buildSystem(model, category, mode) {
  const fmt = {
    chatgpt: "Use markdown: ## headers, bullets, numbered steps.",
    claude:  "Bold section labels, clean prose, XML-style structure.",
    gemini:  "Emoji section markers, numbered list, scannable.",
    grok:    "Bold punchy headers, direct tone.",
  }[model] || "";
  const modeRule = {
    normal: "Output ONE high-quality professional prompt ONLY. No preamble.",
    super:  "Enrich the idea, then output ONE improved optimized prompt ONLY.",
    ultra:  "Output exactly 3 labeled variations:\n[BEGINNER VERSION]\n[EXPERT VERSION]\n[CREATIVE VERSION]",
  }[mode] || "";
  const catHint = {
    youtube:   "Include: Hook, Retention structure, CTA, Engagement triggers",
    coding:    "Include: Language spec, edge cases, test cases, documentation",
    marketing: "Include: Target audience, pain points, USP, CTA",
    education: "Include: Learning objectives, examples, quiz questions, summary",
    business:  "Include: Executive summary, KPIs, action items",
    image:     "Include: Subject, Style, Lighting, Color palette, Camera angle, Mood, Negative prompts",
    viral:     "Include: Pattern interrupt hook, emotional trigger, share mechanism, CTA",
  }[category] || "";
  return `You are Zyprompt AI — a PURE PROMPT EXPORT ENGINE.
RULES: Never chat. Output ONLY the finished prompt(s). Zero preamble.
TARGET MODEL: ${model.toUpperCase()} — ${fmt}
CATEGORY: ${category}${catHint ? `\nSTRUCTURE: ${catHint}` : ""}
MODE: ${modeRule}
Generate now:`;
}

// ── Export helpers ────────────────────────────────────────────
function exportPDF(text) {
  const w = window.open("", "_blank");
  w.document.write(`<html><head><title>Zyprompt</title>
  <style>body{font-family:monospace;padding:40px;max-width:800px;margin:0 auto;line-height:1.8;white-space:pre-wrap;font-size:14px;}
  h2{font-size:16px;margin-bottom:20px;}</style></head>
  <body><h2>Zyprompt AI — Generated Prompt</h2>${text.replace(/</g, "&lt;")}</body></html>`);
  w.document.close(); w.print();
}
function exportTXT(text) {
  const blob = new Blob(["ZYPROMPT AI\n" + "─".repeat(40) + "\n\n" + text], { type: "text/plain" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
  a.download = "zyprompt_" + Date.now() + ".txt"; a.click();
}

// ── Shared UI ─────────────────────────────────────────────────
function Chip({ label, icon, selected, onClick, color }) {
  return (
    <button onClick={onClick} style={{
      padding: "5px 11px", borderRadius: "7px", cursor: "pointer", fontFamily: "inherit",
      border: `1px solid ${selected ? (color || C.accent) : C.border}`,
      background: selected ? (color ? color + "18" : C.accentD) : "transparent",
      color: selected ? (color || C.accentL) : C.sub,
      fontSize: "12px", fontWeight: selected ? 700 : 400,
      display: "flex", alignItems: "center", gap: "5px",
      transition: "all .15s", whiteSpace: "nowrap",
    }}>{icon && <span style={{ fontSize: "11px" }}>{icon}</span>}{label}</button>
  );
}

function Tag({ label, color }) {
  return (
    <span style={{
      padding: "2px 7px", borderRadius: "5px", fontSize: "10px", fontWeight: 700,
      border: `1px solid ${color}44`, background: color + "18", color,
    }}>{label}</span>
  );
}

function CopyBtn({ text }) {
  const [d, setD] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setD(true); setTimeout(() => setD(false), 2000); }}
      style={{
        padding: "5px 11px", borderRadius: "7px", cursor: "pointer", fontFamily: "inherit",
        border: `1px solid ${d ? C.success : C.border}`, background: d ? "#4ADE8018" : "transparent",
        color: d ? C.success : C.sub, fontSize: "12px", fontWeight: 500,
        display: "flex", alignItems: "center", gap: "4px", transition: "all .15s",
      }}>
      {d ? "✓ Copied" : "⎘ Copy"}
    </button>
  );
}

function ActionBtn({ icon, label, onClick, active }) {
  return (
    <button onClick={onClick} style={{
      padding: "5px 11px", borderRadius: "7px", cursor: "pointer", fontFamily: "inherit",
      border: `1px solid ${active ? "#FBBF2488" : C.border}`,
      background: active ? "#FBBF2418" : "transparent",
      color: active ? "#FBBF24" : C.sub, fontSize: "12px",
      display: "flex", alignItems: "center", gap: "4px", transition: "all .15s",
    }}>{icon} {label}</button>
  );
}

// ══════════════════════════════════════════════════════════════
//  LANDING
// ══════════════════════════════════════════════════════════════
function Landing({ onAuth }) {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Inter','Segoe UI',sans-serif", display: "flex", flexDirection: "column" }}>
      <nav style={{ padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Logo size={26} />
          <span style={{ color: C.text, fontWeight: 800, fontSize: "18px" }}>Zy<span style={{ color: C.accent }}>prompt</span></span>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => onAuth("login")} style={{ padding: "8px 18px", borderRadius: "9px", border: `1px solid ${C.border}`, background: "transparent", color: C.sub, fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Sign In</button>
          <button onClick={() => onAuth("signup")} style={{ padding: "8px 18px", borderRadius: "9px", border: "none", background: C.grad, color: "#fff", fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Get Started</button>
        </div>
      </nav>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "40px 24px" }}>
        <Logo size={60} />
        <h1 style={{ color: C.text, fontSize: "clamp(28px,5vw,52px)", fontWeight: 900, margin: "20px 0 14px", letterSpacing: "-1.5px", lineHeight: 1.1 }}>
          Turn Any Idea Into a<br /><span style={{ background: C.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Perfect AI Prompt</span>
        </h1>
        <p style={{ color: C.sub, fontSize: "clamp(14px,2vw,17px)", maxWidth: "480px", lineHeight: 1.7, margin: "0 0 32px" }}>
          Hindi / English / Hinglish — koi bhi language, koi bhi idea.<br />
          Professional prompts for ChatGPT, Claude, Gemini & more.
        </p>
        <button onClick={() => onAuth("signup")} style={{ padding: "14px 40px", borderRadius: "12px", border: "none", background: C.grad, color: "#fff", fontSize: "16px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          Start Free →
        </button>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center", marginTop: "36px" }}>
          {["✦ AI Prompt Engine", "🎙 Voice Input", "⭐ Favorites", "📄 PDF Export", "🔐 Google Login"].map(f => (
            <span key={f} style={{ padding: "6px 14px", borderRadius: "20px", border: `1px solid ${C.border}`, color: C.sub, fontSize: "12px", background: C.card }}>{f}</span>
          ))}
        </div>
      </div>

      <footer style={{ borderTop: `1px solid ${C.border}`, padding: "14px", textAlign: "center", color: C.muted, fontSize: "12px" }}>
        Made by <span style={{ color: C.accent }}>Zyprompt AI</span>
      </footer>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  AUTH MODAL — Real Firebase
// ══════════════════════════════════════════════════════════════
function AuthModal({ mode: initMode, onClose, onSuccess }) {
  const [mode, setMode] = useState(initMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [fbLoaded, setFbLoaded] = useState(firebaseReady);

  useEffect(() => {
    if (!firebaseReady) onFirebaseReady(() => setFbLoaded(true));
  }, []);

  const inp = (val, setVal, type = "text", placeholder = "") => (
    <input type={showPw && type === "password" ? "text" : type} value={val}
      onChange={e => setVal(e.target.value)} placeholder={placeholder}
      style={{
        width: "100%", padding: "12px 14px", borderRadius: "9px",
        border: `1px solid ${C.border}`, background: C.card,
        color: C.text, fontSize: "14px", outline: "none",
        marginBottom: "10px", boxSizing: "border-box", fontFamily: "inherit",
      }} />
  );

  // ── Google Sign In ──────────────────────────────────────────
  const handleGoogle = async () => {
    if (!fbLoaded) { setErr("Firebase loading... please wait."); return; }
    setLoading(true); setErr("");
    try {
      const { auth, GoogleAuthProvider, signInWithPopup } = window._fb;
      const provider = new GoogleAuthProvider();
      provider.addScope("email");
      provider.addScope("profile");
      const result = await signInWithPopup(auth, provider);
      const u = result.user;
      const userData = {
        uid: u.uid, name: u.displayName || "User",
        email: u.email, photo: u.photoURL,
        provider: "google", createdAt: ts(),
        stats: LS.get("stats_" + u.uid, { totalPrompts: 0 }),
      };
      LS.set("user_" + u.uid, userData);
      onSuccess(userData);
    } catch (e) {
      if (e.code === "auth/popup-blocked") setErr("Popup blocked! Please allow popups for this site.");
      else if (e.code === "auth/popup-closed-by-user") setErr("Sign-in cancelled.");
      else setErr("Google sign-in failed: " + e.message);
    }
    setLoading(false);
  };

  // ── Email Auth ──────────────────────────────────────────────
  const handleEmail = async () => {
    if (!fbLoaded) { setErr("Firebase loading... please wait."); return; }
    setErr("");
    if (mode === "signup" && name.trim().length < 2) { setErr("Name must be at least 2 characters."); return; }
    if (!validateEmail(email)) { setErr("Enter a valid email address."); return; }
    if (pw.length < 6) { setErr("Password must be at least 6 characters."); return; }
    if (mode === "signup" && pw !== pw2) { setErr("Passwords do not match."); return; }
    setLoading(true);
    try {
      const { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } = window._fb;
      let userCred;
      if (mode === "signup") {
        userCred = await createUserWithEmailAndPassword(auth, email, pw);
        await updateProfile(userCred.user, { displayName: name.trim() });
      } else {
        userCred = await signInWithEmailAndPassword(auth, email, pw);
      }
      const u = userCred.user;
      const userData = {
        uid: u.uid, name: u.displayName || name.trim() || "User",
        email: u.email, photo: u.photoURL,
        provider: "email", createdAt: ts(),
        stats: LS.get("stats_" + u.uid, { totalPrompts: 0 }),
      };
      LS.set("user_" + u.uid, userData);
      onSuccess(userData);
    } catch (e) {
      const msgs = {
        "auth/email-already-in-use": "Account already exists. Please sign in.",
        "auth/wrong-password": "Wrong password. Please try again.",
        "auth/user-not-found": "No account found. Please sign up.",
        "auth/invalid-credential": "Invalid email or password.",
        "auth/too-many-requests": "Too many attempts. Please try again later.",
      };
      setErr(msgs[e.code] || e.message);
    }
    setLoading(false);
  };

  // ── Forgot Password ─────────────────────────────────────────
  const handleForgot = async () => {
    if (!validateEmail(email)) { setErr("Enter a valid email."); return; }
    setLoading(true);
    try {
      const { auth, sendPasswordResetEmail } = window._fb;
      await sendPasswordResetEmail(auth, email);
      setMsg("✓ Password reset email sent! Check your inbox.");
    } catch (e) {
      setErr(e.code === "auth/user-not-found" ? "No account with this email." : e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000000AA", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter','Segoe UI',sans-serif", padding: "16px" }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "20px", padding: "32px 28px", width: "100%", maxWidth: "390px", maxHeight: "90vh", overflowY: "auto" }}>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "22px" }}>
          <Logo size={24} />
          <span style={{ color: C.text, fontWeight: 800, fontSize: "16px" }}>Zy<span style={{ color: C.accent }}>prompt</span></span>
          <button onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none", color: C.sub, cursor: "pointer", fontSize: "18px" }}>✕</button>
        </div>

        {mode !== "forgot" && (
          <div style={{ display: "flex", gap: "4px", marginBottom: "20px", background: C.card, borderRadius: "10px", padding: "4px" }}>
            {[["login", "Sign In"], ["signup", "Sign Up"]].map(([m, l]) => (
              <button key={m} onClick={() => { setMode(m); setErr(""); setMsg(""); }} style={{
                flex: 1, padding: "9px", borderRadius: "8px", border: "none",
                background: mode === m ? C.accent : "transparent",
                color: mode === m ? "#fff" : C.sub, fontWeight: 600, fontSize: "13px",
                cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
              }}>{l}</button>
            ))}
          </div>
        )}

        {mode === "forgot" && <h3 style={{ color: C.text, margin: "0 0 16px", fontSize: "17px" }}>Reset Password</h3>}

        {/* Google Button */}
        {mode !== "forgot" && (
          <>
            <button onClick={handleGoogle} disabled={loading || !fbLoaded} style={{
              width: "100%", padding: "12px", borderRadius: "10px",
              border: `1px solid ${C.border}`, background: C.card,
              color: C.text, fontSize: "14px", fontWeight: 600, cursor: loading ? "wait" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
              marginBottom: "14px", fontFamily: "inherit
