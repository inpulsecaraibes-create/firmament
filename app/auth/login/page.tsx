"use client";

import { useState } from "react";
import { createClient } from "@/app/lib/supabase/client";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [mode, setMode] = useState<"login" | "reset">("login");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (authError) {
      setError("Email ou mot de passe incorrect.");
      setLoading(false);
      return;
    }

    window.location.href = "/";
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${window.location.origin}/auth/callback` }
    );

    if (resetError) {
      setError("Une erreur est survenue. Vérifie ton adresse email.");
      setLoading(false);
      return;
    }

    setResetSent(true);
    setLoading(false);
  }

  const inputStyle = {
    width: "100%",
    backgroundColor: "transparent",
    color: "var(--texte)",
    borderBottom: "2px solid var(--texte-discret)",
    borderTop: "none",
    borderLeft: "none",
    borderRight: "none",
    fontSize: "16px",
    padding: "12px 4px",
    fontFamily: "DM Sans, sans-serif",
    transition: "border-color 0.2s",
    marginBottom: "20px",
  };

  return (
    <main
      style={{ backgroundColor: "var(--fond)", minHeight: "100dvh" }}
      className="flex flex-col items-center justify-center px-6 py-12"
    >
      <div className="mb-12 text-center">
        <p style={{ color: "var(--texte-discret)", fontSize: "11px", letterSpacing: "0.2em" }} className="uppercase">
          Duleme & Cie
        </p>
        <h1 style={{ color: "var(--bordeaux)", fontFamily: "Cormorant Garamond, serif", fontSize: "42px", fontWeight: 300, letterSpacing: "0.12em" }}>
          FIRMAMENT
        </h1>
      </div>

      <div className="w-full max-w-sm">

        {/* CONNEXION */}
        {mode === "login" && (
          <>
            <div className="text-center mb-10">
              <h2 style={{ fontFamily: "Cormorant Garamond, serif", color: "var(--texte)", fontSize: "26px", fontWeight: 300 }}>
                Accéder à ton espace
              </h2>
            </div>

            <form onSubmit={handleLogin}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderBottomColor = "var(--bordeaux)"; }}
                onBlur={(e) => { e.target.style.borderBottomColor = "var(--texte-discret)"; }}
              />

              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mot de passe"
                  required
                  style={{ ...inputStyle, paddingRight: "40px" }}
                  onFocus={(e) => { e.target.style.borderBottomColor = "var(--bordeaux)"; }}
                  onBlur={(e) => { e.target.style.borderBottomColor = "var(--texte-discret)"; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute", right: "4px", top: "12px",
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--texte-discret)", padding: "0",
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {error && (
                <p style={{ color: "#B00020", fontSize: "13px", marginBottom: "12px", textAlign: "center" }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={!email.trim() || !password || loading}
                style={{
                  backgroundColor: email.trim() && password && !loading ? "var(--bordeaux)" : "var(--texte-discret)",
                  color: "var(--fond-blanc)",
                  borderRadius: "12px",
                  padding: "16px 28px",
                  fontSize: "15px",
                  fontFamily: "DM Sans, sans-serif",
                  fontWeight: 500,
                  cursor: email.trim() && password && !loading ? "pointer" : "not-allowed",
                  border: "none",
                  width: "100%",
                  transition: "background-color 0.2s",
                  marginBottom: "20px",
                }}
              >
                {loading ? "Connexion···" : "Se connecter →"}
              </button>

              <p style={{ textAlign: "center" }}>
                <button
                  type="button"
                  onClick={() => { setMode("reset"); setError(""); }}
                  style={{
                    background: "none", border: "none",
                    color: "var(--texte-discret)", fontSize: "13px",
                    cursor: "pointer", textDecoration: "underline",
                    fontFamily: "DM Sans, sans-serif",
                  }}
                >
                  Mot de passe oublié ?
                </button>
              </p>
            </form>
          </>
        )}

        {/* RÉINITIALISATION */}
        {mode === "reset" && !resetSent && (
          <>
            <div className="text-center mb-10">
              <h2 style={{ fontFamily: "Cormorant Garamond, serif", color: "var(--texte)", fontSize: "26px", fontWeight: 300 }}>
                Réinitialiser ton mot de passe
              </h2>
              <p style={{ color: "var(--texte-discret)", fontSize: "14px", marginTop: "10px" }}>
                Entre ton email. Tu recevras un lien pour créer un nouveau mot de passe.
              </p>
            </div>

            <form onSubmit={handleReset}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ton@email.com"
                required
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderBottomColor = "var(--bordeaux)"; }}
                onBlur={(e) => { e.target.style.borderBottomColor = "var(--texte-discret)"; }}
              />

              {error && (
                <p style={{ color: "#B00020", fontSize: "13px", marginBottom: "12px", textAlign: "center" }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={!email.trim() || loading}
                style={{
                  backgroundColor: email.trim() && !loading ? "var(--bordeaux)" : "var(--texte-discret)",
                  color: "var(--fond-blanc)",
                  borderRadius: "12px", padding: "16px 28px",
                  fontSize: "15px", fontFamily: "DM Sans, sans-serif",
                  fontWeight: 500, border: "none", width: "100%",
                  cursor: email.trim() && !loading ? "pointer" : "not-allowed",
                  marginBottom: "20px",
                }}
              >
                {loading ? "Envoi···" : "Envoyer le lien →"}
              </button>

              <p style={{ textAlign: "center" }}>
                <button
                  type="button"
                  onClick={() => { setMode("login"); setError(""); }}
                  style={{
                    background: "none", border: "none",
                    color: "var(--texte-discret)", fontSize: "13px",
                    cursor: "pointer", textDecoration: "underline",
                    fontFamily: "DM Sans, sans-serif",
                  }}
                >
                  ← Retour à la connexion
                </button>
              </p>
            </form>
          </>
        )}

        {/* CONFIRMATION RESET */}
        {mode === "reset" && resetSent && (
          <div className="text-center">
            <p style={{ fontSize: "32px", marginBottom: "16px" }}>✉️</p>
            <h2 style={{ fontFamily: "Cormorant Garamond, serif", color: "var(--texte)", fontSize: "24px", fontWeight: 300, marginBottom: "12px" }}>
              Vérifie ta boîte mail
            </h2>
            <p style={{ color: "var(--texte-secondary)", fontSize: "14px", lineHeight: "1.6" }}>
              Un lien de réinitialisation a été envoyé à <strong>{email}</strong>.
            </p>
          </div>
        )}

      </div>
    </main>
  );
}
