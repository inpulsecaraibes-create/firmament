/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState } from "react";
import { createClient } from "@/app/lib/supabase/client";

export default function ObjectifPage() {
  const [step, setStep] = useState<"invite" | "question" | "confirm" | "done">("invite");
  const [objectifRaw, setObjectifRaw] = useState("");
  const [objectifPhrase, setObjectifPhrase] = useState("");
  const [objectifEdit, setObjectifEdit] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleGenerate() {
    if (!objectifRaw.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/terri", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "user", content: objectifRaw },
            { role: "assistant", content: "Je t'entends. En quelques mots, quel résultat concret tu veux avoir atteint dans 30 jours ?" },
            { role: "user", content: `Formule mon objectif en une seule phrase courte, puissante, à la première personne. Commence directement par la phrase, sans introduction. Exemple : "Sortir de l'opérationnel sur au moins 3 sujets clés."` },
          ],
        }),
      });
      const d = await res.json();
      const phrase = (d.text || objectifRaw).replace(/^["«»"]|["«»"]$/g, "").trim();
      setObjectifPhrase(phrase);
      setObjectifEdit(phrase);
      setStep("confirm");
    } catch {
      setObjectifPhrase(objectifRaw);
      setObjectifEdit(objectifRaw);
      setStep("confirm");
    }
    setLoading(false);
  }

  async function handleSave() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({
        objectif_aimant: objectifEdit || objectifPhrase,
        objectif_debut: new Date().toISOString(),
        objectif_horizon: 30,
        onboarding_step: "complete",
        onboarding_complete: true,
      }).eq("id", user.id);
    }
    window.location.href = "/home";
  }

  async function skip() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await supabase.from("profiles").update({ onboarding_step: "complete", onboarding_complete: true }).eq("id", user.id);
    window.location.href = "/home";
  }

  const tefi = (text: string) => (
    <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "24px" }}>
      <div style={{ width: "34px", height: "34px", borderRadius: "50%", backgroundColor: "var(--bordeaux)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ fontFamily: "Cormorant Garamond, serif", color: "var(--fond-blanc)", fontSize: "18px", fontStyle: "italic" }}>t</span>
      </div>
      <div style={{ backgroundColor: "var(--fond-blanc)", borderLeft: "2px solid rgba(92,26,46,0.15)", borderRadius: "0 12px 12px 12px", padding: "14px 16px", flex: 1 }}>
        <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "16px", fontStyle: "italic", color: "var(--texte-secondary)", lineHeight: "1.55" }}>{text}</p>
      </div>
    </div>
  );

  return (
    <main style={{ backgroundColor: "var(--fond)", minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>

        {step === "invite" && (
          <>
            {tefi("Maintenant que je te connais un peu mieux… est-ce que tu veux qu'on pose ensemble ton premier objectif ? Pas une to-do. Un vrai cap. Ça change tout ce qu'on va faire ici.")}
            <button onClick={() => setStep("question")}
              style={{ width: "100%", backgroundColor: "var(--fond-or)", border: "1.5px solid var(--or)", borderRadius: "12px", padding: "14px 20px", fontSize: "14px", fontFamily: "DM Sans", color: "var(--texte-secondary)", cursor: "pointer", marginBottom: "10px" }}>
              ✨ Oui, on pose mon objectif
            </button>
            <button onClick={skip}
              style={{ width: "100%", background: "none", border: "1.5px solid rgba(26,18,16,0.1)", borderRadius: "12px", padding: "13px", fontSize: "13px", fontFamily: "DM Sans", color: "var(--texte-discret)", cursor: "pointer" }}>
              Plus tard — je commence par mes tâches
            </button>
          </>
        )}

        {step === "question" && (
          <>
            {tefi("En quelques mots — qu'est-ce que tu veux avoir accompli dans les 30 prochains jours ?")}
            <textarea value={objectifRaw} onChange={e => setObjectifRaw(e.target.value)} placeholder="Je veux…" rows={3} autoFocus
              style={{ width: "100%", backgroundColor: "var(--fond-blanc)", color: "var(--texte)", borderBottom: "2px solid var(--texte-discret)", borderTop: "none", borderLeft: "none", borderRight: "none", resize: "none", fontSize: "15px", lineHeight: "1.7", padding: "12px 4px", fontFamily: "DM Sans", marginBottom: "20px" }}
              onFocus={e => { e.target.style.borderBottomColor = "var(--bordeaux)"; }} onBlur={e => { e.target.style.borderBottomColor = "var(--texte-discret)"; }} />
            <button onClick={handleGenerate} disabled={!objectifRaw.trim() || loading}
              style={{ width: "100%", backgroundColor: objectifRaw.trim() && !loading ? "var(--bordeaux)" : "var(--texte-discret)", color: "var(--fond-blanc)", borderRadius: "12px", padding: "14px", fontSize: "15px", fontFamily: "DM Sans", fontWeight: 500, border: "none", cursor: "pointer" }}>
              {loading ? "Terri formule ton cap···" : "Formuler mon cap →"}
            </button>
          </>
        )}

        {step === "confirm" && (
          <>
            <p style={{ fontSize: "14px", color: "var(--texte-discret)", marginBottom: "16px", fontStyle: "italic" }}>
              D'après ce que tu m'as dit, ton cap pour les 30 prochains jours serait :
            </p>
            <div style={{ backgroundColor: "var(--bordeaux)", borderRadius: "12px", padding: "20px 22px", marginBottom: "20px" }}>
              <p style={{ color: "rgba(248,245,240,0.5)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "8px" }}>Ton Objectif Aimant</p>
              <textarea value={objectifEdit} onChange={e => setObjectifEdit(e.target.value)} rows={3}
                style={{ width: "100%", backgroundColor: "transparent", color: "var(--fond-blanc)", border: "none", borderBottom: "1px solid rgba(248,245,240,0.2)", resize: "none", fontSize: "17px", fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", lineHeight: "1.4", padding: "4px 0" }} />
            </div>
            <p style={{ color: "var(--texte-discret)", fontSize: "12px", textAlign: "center", marginBottom: "16px" }}>Tu peux modifier la formulation ci-dessus.</p>
            <button onClick={handleSave} disabled={loading}
              style={{ width: "100%", backgroundColor: "var(--bordeaux)", color: "var(--fond-blanc)", borderRadius: "12px", padding: "14px", fontSize: "15px", fontFamily: "DM Sans", fontWeight: 500, border: "none", cursor: "pointer", marginBottom: "10px" }}>
              {loading ? "···" : "C'est mon cap. On commence →"}
            </button>
            <button onClick={skip} style={{ width: "100%", background: "none", border: "none", color: "var(--texte-discret)", fontSize: "12px", cursor: "pointer", fontFamily: "DM Sans" }}>
              Reformuler plus tard
            </button>
          </>
        )}
      </div>
    </main>
  );
}
