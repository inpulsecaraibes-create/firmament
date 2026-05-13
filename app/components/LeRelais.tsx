"use client";

import { useState } from "react";
import { X, Check } from "lucide-react";

interface LeRelaisProps {
  onClose: () => void;
}

type Step = "urgence" | "besoin" | "detail" | "confirm" | "sent";

const BESOINS = [
  { id: "info", label: "Une information / réponse rapide", result: "diagnostic" },
  { id: "formation", label: "Monter en compétences sur un sujet", result: "levier" },
  { id: "accompagnement", label: "Un accompagnement profond", result: "pointcap" },
];

const RESULT_MESSAGES: Record<string, { title: string; desc: string }> = {
  diagnostic: {
    title: "Le Diagnostic",
    desc: "L'équipe reviendra vers toi très vite.",
  },
  levier: {
    title: "Le Levier",
    desc: "Terri va identifier le module ARSENAL le plus adapté à ta situation.",
  },
  pointcap: {
    title: "Le Point de Cap",
    desc: "L'équipe Duleme & Cie te propose un appel pour aller plus loin ensemble.",
  },
};

export default function LeRelais({ onClose }: LeRelaisProps) {
  const [step, setStep] = useState<Step>("urgence");
  const [urgence, setUrgence] = useState("");
  const [besoin, setBesoin] = useState("");
  const [result, setResult] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend() {
    setSending(true);
    const selectedBesoin = BESOINS.find(b => b.id === besoin);
    await fetch("/api/relais", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        besoin: selectedBesoin?.label,
        urgence,
        message,
      }),
    });
    setSending(false);
    setStep("sent");
  }

  const pillStyle = (selected: boolean): React.CSSProperties => ({
    width: "100%",
    padding: "14px 18px",
    borderRadius: "12px",
    border: `1.5px solid ${selected ? "var(--bordeaux)" : "rgba(92,26,46,0.15)"}`,
    backgroundColor: selected ? "var(--bordeaux-light)" : "var(--fond-blanc)",
    color: selected ? "var(--bordeaux)" : "var(--texte-secondary)",
    fontSize: "14px",
    fontFamily: "DM Sans, sans-serif",
    cursor: "pointer",
    textAlign: "left" as const,
    fontWeight: selected ? 500 : 400,
    transition: "all 0.15s",
  });

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(26,18,16,0.5)", display: "flex", alignItems: "flex-end", zIndex: 100 }}>
      <div style={{ backgroundColor: "var(--fond)", width: "100%", borderRadius: "20px 20px 0 0", padding: "24px 20px 48px", maxHeight: "80vh", overflowY: "auto" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <p style={{ color: "var(--texte-discret)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "DM Sans" }}>FIRMAMENT</p>
            <h2 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "24px", fontWeight: 300, color: "var(--texte)" }}>Le Relais</h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--texte-discret)" }}>
            <X size={20} />
          </button>
        </div>

        {/* Q1 — Urgence */}
        {step === "urgence" && (
          <>
            <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "18px", fontWeight: 300, color: "var(--texte)", marginBottom: "20px", lineHeight: "1.4" }}>
              {`C'est plutôt urgent ?`}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button style={pillStyle(urgence === "oui")} onClick={() => { setUrgence("oui"); setStep("besoin"); }}>
                🔴 Oui, ça ne peut pas attendre
              </button>
              <button style={pillStyle(urgence === "non")} onClick={() => { setUrgence("non"); setStep("besoin"); }}>
                Ça peut attendre quelques jours
              </button>
            </div>
          </>
        )}

        {/* Q2 — Besoin */}
        {step === "besoin" && (
          <>
            <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "18px", fontWeight: 300, color: "var(--texte)", marginBottom: "20px", lineHeight: "1.4" }}>
              {`De quoi as-tu besoin ?`}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {BESOINS.map(b => (
                <button key={b.id} style={pillStyle(besoin === b.id)}
                  onClick={() => { setBesoin(b.id); setResult(b.result); setStep("detail"); }}>
                  {b.label}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Détail optionnel */}
        {step === "detail" && (
          <>
            <div style={{ backgroundColor: "var(--fond-or)", borderRadius: "12px", padding: "16px 18px", marginBottom: "20px" }}>
              <p style={{ color: "var(--texte-discret)", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "DM Sans", marginBottom: "6px" }}>
                {RESULT_MESSAGES[result]?.title}
              </p>
              <p style={{ color: "var(--texte-secondary)", fontSize: "14px", lineHeight: "1.5" }}>
                {RESULT_MESSAGES[result]?.desc}
              </p>
            </div>
            <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "17px", color: "var(--texte)", marginBottom: "14px" }}>
              Un mot de contexte ? (optionnel)
            </p>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Ce qui se passe en ce moment…"
              rows={3}
              style={{ width: "100%", backgroundColor: "var(--fond-blanc)", color: "var(--texte)", borderBottom: "2px solid var(--texte-discret)", borderTop: "none", borderLeft: "none", borderRight: "none", resize: "none", fontSize: "15px", lineHeight: "1.6", padding: "10px 4px", fontFamily: "DM Sans, sans-serif", marginBottom: "20px" }}
              onFocus={e => { e.target.style.borderBottomColor = "var(--bordeaux)"; }}
              onBlur={e => { e.target.style.borderBottomColor = "var(--texte-discret)"; }}
            />
            <button onClick={handleSend} disabled={sending}
              style={{ width: "100%", backgroundColor: !sending ? "var(--bordeaux)" : "var(--texte-discret)", color: "var(--fond-blanc)", borderRadius: "12px", padding: "15px", fontSize: "15px", fontFamily: "DM Sans, sans-serif", fontWeight: 500, border: "none", cursor: !sending ? "pointer" : "not-allowed" }}>
              {sending ? "Envoi···" : "Envoyer au Relais →"}
            </button>
          </>
        )}

        {/* Envoyé */}
        {step === "sent" && (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "var(--vert)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Check size={22} color="white" />
            </div>
            <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "20px", color: "var(--texte)", marginBottom: "8px" }}>
              Le Relais a reçu ta demande.
            </p>
            <p style={{ color: "var(--texte-discret)", fontSize: "14px", lineHeight: "1.5" }}>
              {RESULT_MESSAGES[result]?.desc}
            </p>
            <button onClick={onClose} style={{ marginTop: "24px", backgroundColor: "var(--bordeaux)", color: "var(--fond-blanc)", borderRadius: "12px", padding: "14px 28px", border: "none", cursor: "pointer", fontFamily: "DM Sans", fontSize: "14px", fontWeight: 500 }}>
              Fermer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
