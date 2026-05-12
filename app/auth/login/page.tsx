/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/app/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [mode, setMode] = useState<"login" | "reset">("login");
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (err) { setError("Email ou mot de passe incorrect."); setLoading(false); return; }
    window.location.href = "/home";
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: `${window.location.origin}/auth/callback` });
    if (err) { setError("Une erreur est survenue."); setLoading(false); return; }
    setResetSent(true); setLoading(false);
  }

  const inp: React.CSSProperties = { width: "100%", backgroundColor: "transparent", color: "var(--texte)", borderBottom: "2px solid var(--texte-discret)", borderTop: "none", borderLeft: "none", borderRight: "none", fontSize: "16px", padding: "12px 4px", fontFamily: "DM Sans", marginBottom: "20px" };

  return (
    <main style={{ backgroundColor: "var(--fond)", minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px" }}>
      <div style={{ width: "100%", maxWidth: "360px" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <p style={{ color: "var(--texte-discret)", fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "6px" }}>Duleme & Cie</p>
          <h1 style={{ fontFamily: "Cormorant Garamond, serif", color: "var(--bordeaux)", fontSize: "36px", fontWeight: 300, letterSpacing: "0.12em" }}>FIRMAMENT</h1>
        </div>

        {mode === "login" && !resetSent && (
          <form onSubmit={handleLogin}>
            <h2 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "24px", fontWeight: 300, color: "var(--texte)", marginBottom: "28px", textAlign: "center" }}>Accéder à ton espace</h2>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required style={inp}
              onFocus={e => { (e.target as HTMLInputElement).style.borderBottomColor = "var(--bordeaux)"; }}
              onBlur={e => { (e.target as HTMLInputElement).style.borderBottomColor = "var(--texte-discret)"; }} />
            <div style={{ position: "relative" }}>
              <input type={showPwd ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Mot de passe" required style={{ ...inp, paddingRight: "40px" }}
                onFocus={e => { (e.target as HTMLInputElement).style.borderBottomColor = "var(--bordeaux)"; }}
                onBlur={e => { (e.target as HTMLInputElement).style.borderBottomColor = "var(--texte-discret)"; }} />
              <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: "absolute", right: "4px", top: "12px", background: "none", border: "none", cursor: "pointer", color: "var(--texte-discret)" }}>
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button type="button" onClick={() => { setMode("reset"); setError(""); }} style={{ background: "none", border: "none", color: "var(--texte-discret)", fontSize: "12px", cursor: "pointer", marginBottom: "24px", padding: 0, fontFamily: "DM Sans" }}>
              Mot de passe oublié ?
            </button>
            {error && <p style={{ color: "#B00020", fontSize: "13px", marginBottom: "12px", textAlign: "center" }}>{error}</p>}
            <button type="submit" disabled={loading || !email || !password}
              style={{ backgroundColor: email && password && !loading ? "var(--bordeaux)" : "var(--texte-discret)", color: "var(--fond-blanc)", borderRadius: "12px", padding: "16px", fontSize: "15px", fontFamily: "DM Sans", fontWeight: 500, border: "none", width: "100%", cursor: "pointer", marginBottom: "16px" }}>
              {loading ? "Connexion···" : "On se connaît déjà →"}
            </button>
            <p style={{ textAlign: "center", fontSize: "13px", color: "var(--texte-discret)" }}>
              Pas encore d'espace ?{" "}
              <a href="/auth/register" style={{ color: "var(--bordeaux)", textDecoration: "none", fontWeight: 500 }}>Créer le mien</a>
            </p>
          </form>
        )}

        {mode === "reset" && !resetSent && (
          <form onSubmit={handleReset}>
            <h2 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "24px", fontWeight: 300, color: "var(--texte)", marginBottom: "10px", textAlign: "center" }}>Mot de passe oublié</h2>
            <p style={{ color: "var(--texte-discret)", fontSize: "14px", marginBottom: "24px", textAlign: "center" }}>Entre ton email — tu recevras un lien.</p>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ton@email.com" required style={inp}
              onFocus={e => { (e.target as HTMLInputElement).style.borderBottomColor = "var(--bordeaux)"; }}
              onBlur={e => { (e.target as HTMLInputElement).style.borderBottomColor = "var(--texte-discret)"; }} />
            {error && <p style={{ color: "#B00020", fontSize: "13px", marginBottom: "12px", textAlign: "center" }}>{error}</p>}
            <button type="submit" disabled={loading || !email}
              style={{ backgroundColor: email && !loading ? "var(--bordeaux)" : "var(--texte-discret)", color: "var(--fond-blanc)", borderRadius: "12px", padding: "15px", fontSize: "15px", fontFamily: "DM Sans", fontWeight: 500, border: "none", width: "100%", cursor: "pointer", marginBottom: "12px" }}>
              {loading ? "Envoi···" : "Envoyer le lien →"}
            </button>
            <button type="button" onClick={() => { setMode("login"); setError(""); }} style={{ background: "none", border: "none", color: "var(--texte-discret)", fontSize: "13px", cursor: "pointer", width: "100%", textAlign: "center", fontFamily: "DM Sans" }}>
              ← Retour à la connexion
            </button>
          </form>
        )}

        {resetSent && (
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "32px", marginBottom: "16px" }}>✉️</p>
            <h2 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "24px", fontWeight: 300, color: "var(--texte)", marginBottom: "10px" }}>Vérifie ta boîte mail</h2>
            <p style={{ color: "var(--texte-discret)", fontSize: "14px", lineHeight: "1.6" }}>Lien envoyé à <strong>{email}</strong>.</p>
          </div>
        )}
      </div>
    </main>
  );
}
