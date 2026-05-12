/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { createClient } from "@/app/lib/supabase/client";

type Step = "q1" | "q2" | "message" | "sent";

export default function RelaisPage() {
  const [step, setStep] = useState<Step>("q1");
  const [urgent, setUrgent] = useState("");
  const [besoin, setBesoin] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const supabase = createClient();

  async function handleSend() {
    setSending(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from("profiles").select("prenom,entreprise").eq("id", user?.id || "").single();

    await fetch("/api/relais", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ besoin, urgence: urgent, message, prenom: profile?.prenom, entreprise: profile?.entreprise }),
    });
    setSending(false);
    setStep("sent");
  }

  const btn = (label: string, onClick: () => void, selected = false) => (
    <button onClick={onClick}
      style={{ width: "100%", padding: "13px 18px", borderRadius: "12px", border: `1.5px solid ${selected ? "var(--bordeaux)" : "rgba(92,26,46,0.15)"}`, backgroundColor: selected ? "rgba(92,26,46,0.06)" : "transparent", color: selected ? "var(--bordeaux)" : "var(--texte-secondary)", fontSize: "14px", fontFamily: "DM Sans", cursor: "pointer", marginBottom: "10px", textAlign: "left" }}>
      {label}
    </button>
  );

  return (
    <main style={{ backgroundColor: "var(--fond)", minHeight: "100dvh", fontFamily: "DM Sans, sans-serif" }}>
      <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid rgba(26,18,16,0.07)", backgroundColor: "var(--fond-blanc)" }}>
        <a href="/home" style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--bordeaux)", textDecoration: "none", fontSize: "14px", fontWeight: 500 }}>
          <ArrowLeft size={18} /> Mon espace
        </a>
      </div>

      <div style={{ padding: "32px 24px", maxWidth: "420px", margin: "0 auto" }}>
        <p style={{ color: "var(--texte-discret)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "6px" }}>FIRMAMENT</p>
        <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "26px", fontWeight: 300, color: "var(--texte)", marginBottom: "28px" }}>Le Relais</h1>

        {step === "q1" && (
          <>
            <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "18px", color: "var(--texte)", marginBottom: "20px", lineHeight: "1.4" }}>C'est urgent ?</p>
            {btn("🔴 Oui, ça ne peut pas attendre", () => { setUrgent("oui"); setStep("q2"); })}
            {btn("Ça peut attendre quelques jours", () => { setUrgent("non"); setStep("q2"); })}
          </>
        )}

        {step === "q2" && (
          <>
            <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "18px", color: "var(--texte)", marginBottom: "20px", lineHeight: "1.4" }}>De quoi as-tu besoin ?</p>
            {["Une information ou réponse rapide", "Monter en compétences sur un sujet", "Un accompagnement profond"].map(b => btn(b, () => { setBesoin(b); setStep("message"); }, besoin === b))}
          </>
        )}

        {step === "message" && (
          <>
            <div style={{ backgroundColor: "var(--fond-or)", borderRadius: "12px", padding: "14px 16px", marginBottom: "20px" }}>
              <p style={{ fontSize: "13px", color: "var(--texte-secondary)" }}>
                {besoin === "Une information ou réponse rapide" && "L'équipe reviendra vers toi très vite."}
                {besoin === "Monter en compétences sur un sujet" && "Téfi va identifier le module le plus adapté."}
                {besoin === "Un accompagnement profond" && "L'équipe te propose un appel pour aller plus loin."}
              </p>
            </div>
            <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "17px", color: "var(--texte)", marginBottom: "14px" }}>Un mot de contexte ? (optionnel)</p>
            <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Ce qui se passe en ce moment…" rows={4}
              style={{ width: "100%", backgroundColor: "var(--fond-blanc)", color: "var(--texte)", borderBottom: "2px solid var(--texte-discret)", borderTop: "none", borderLeft: "none", borderRight: "none", resize: "none", fontSize: "15px", lineHeight: "1.6", padding: "10px 4px", fontFamily: "DM Sans", marginBottom: "20px" }}
              onFocus={e => { e.target.style.borderBottomColor = "var(--bordeaux)"; }} onBlur={e => { e.target.style.borderBottomColor = "var(--texte-discret)"; }} />
            <button onClick={handleSend} disabled={sending}
              style={{ width: "100%", backgroundColor: "var(--bordeaux)", color: "var(--fond-blanc)", borderRadius: "12px", padding: "15px", fontSize: "15px", fontFamily: "DM Sans", fontWeight: 500, border: "none", cursor: "pointer" }}>
              {sending ? "Envoi···" : "Envoyer au Relais →"}
            </button>
          </>
        )}

        {step === "sent" && (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "var(--vert)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Check size={22} color="white" />
            </div>
            <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "22px", color: "var(--texte)", marginBottom: "8px" }}>Le Relais a reçu ta demande.</p>
            <p style={{ color: "var(--texte-discret)", fontSize: "14px", marginBottom: "28px" }}>L'équipe reviendra vers toi très vite.</p>
            <a href="/home" style={{ display: "inline-block", backgroundColor: "var(--bordeaux)", color: "var(--fond-blanc)", borderRadius: "12px", padding: "13px 28px", fontSize: "14px", fontFamily: "DM Sans", fontWeight: 500, textDecoration: "none" }}>
              Retour à mon espace
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
