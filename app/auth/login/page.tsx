"use client";

import { useState } from "react";
import { createClient } from "@/app/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) {
      setError("Une erreur est survenue. Vérifie ton adresse email et réessaie.");
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

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
        {!sent ? (
          <>
            <div className="text-center mb-10">
              <h2 style={{ fontFamily: "Cormorant Garamond, serif", color: "var(--texte)", fontSize: "26px", fontWeight: 300, lineHeight: "1.3" }}>
                Accéder à ton espace
              </h2>
              <p style={{ color: "var(--texte-discret)", fontSize: "14px", marginTop: "10px", lineHeight: "1.5" }}>
                Entre ton email. Tu recevras un lien de connexion — pas de mot de passe.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ton@email.com"
                required
                style={{
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
                  marginBottom: "24px",
                }}
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
                  borderRadius: "12px",
                  padding: "16px 28px",
                  fontSize: "15px",
                  fontFamily: "DM Sans, sans-serif",
                  fontWeight: 500,
                  cursor: email.trim() && !loading ? "pointer" : "not-allowed",
                  border: "none",
                  width: "100%",
                  transition: "background-color 0.2s",
                }}
              >
                {loading ? "Envoi en cours···" : "Recevoir mon lien →"}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div style={{
              width: "56px", height: "56px", borderRadius: "50%",
              backgroundColor: "var(--bordeaux-light)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 24px",
            }}>
              <span style={{ fontSize: "24px" }}>✉️</span>
            </div>
            <h2 style={{ fontFamily: "Cormorant Garamond, serif", color: "var(--texte)", fontSize: "26px", fontWeight: 300, marginBottom: "12px" }}>
              Vérifie ta boîte mail
            </h2>
            <p style={{ color: "var(--texte-secondary)", fontSize: "15px", lineHeight: "1.6" }}>
              Un lien de connexion a été envoyé à
            </p>
            <p style={{ color: "var(--bordeaux)", fontSize: "15px", fontWeight: 500, margin: "6px 0 16px" }}>
              {email}
            </p>
            <p style={{ color: "var(--texte-discret)", fontSize: "13px", lineHeight: "1.5" }}>
              Clique sur le lien dans l&apos;email pour accéder à FIRMAMENT.
              <br />Le lien est valable 1 heure.
            </p>
            <button
              onClick={() => setSent(false)}
              style={{
                marginTop: "24px", background: "none", border: "none",
                color: "var(--texte-discret)", fontSize: "13px",
                cursor: "pointer", textDecoration: "underline",
                fontFamily: "DM Sans, sans-serif",
              }}
            >
              Changer d&apos;adresse email
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
