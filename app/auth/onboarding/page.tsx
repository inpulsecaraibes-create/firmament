/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState } from "react";
import { createClient } from "@/app/lib/supabase/client";

const TEFI_RESPONSES: Record<string, Record<string, string>> = {
  moins_3: {
    flou: "C'est souvent là que tout commence. Le flou n'est pas un problème — c'est un signal. On va le transformer en direction.",
    surcharge: "Démarrer en étant déjà surchargé — ça arrive. Mais ça ne doit pas devenir la norme. On va trier ce qui compte.",
    transition: "Les transitions sont des carrefours. Ce que tu décides maintenant va compter. On va être précis.",
    croissance: "La croissance au début, c'est une bonne nouvelle. Et aussi un moment où tout peut s'emballer. On va structurer ça.",
  },
  plus_3: {
    flou: "Après tout ce chemin, se retrouver dans le flou — c'est souvent un signe que quelque chose a changé. On va identifier quoi.",
    surcharge: "Tu portes beaucoup. Probablement trop seul. On va commencer par déposer tout ça — et voir ce qui mérite vraiment ton énergie.",
    transition: "Quand on a de l'expérience, une transition est rarement un hasard. Il y a quelque chose que tu cherches. On va le trouver.",
    croissance: "La croissance, c'est excitant. C'est aussi là où les fondations se fragilisent si on n'y fait pas attention. On va structurer ça.",
  },
};

const ETAT_MAP: Record<string, string> = { "Dans le flou": "flou", "Surchargé": "surcharge", "En transition": "transition", "En croissance": "croissance" };
const ANCIENNETE_MAP: Record<string, string> = { "Moins de 3 ans": "moins_3", "Plus de 3 ans": "plus_3" };

export default function OnboardingPage() {
  const [step, setStep] = useState(0); // 0=q1, 1=q2, 2=q3, 3=response
  const [entreprise, setEntreprise] = useState("");
  const [anciennete, setAnciennete] = useState("");
  const [etat, setEtat] = useState("");
  const [saving, setSaving] = useState(false);
  const [terriFeedback, setTefiFeedback] = useState("");
  const supabase = createClient();

  async function save(step: string, extra?: object) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("profiles").update({ onboarding_step: step, ...extra }).eq("id", user.id);
  }

  async function handleQ1() {
    if (!entreprise.trim()) return;
    await save("q1", { entreprise: entreprise.trim() });

    // Feedback stratégique de Terri sur l'entreprise
    try {
      const res = await fetch("/api/terri", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Mon activité : ${entreprise.trim()}. Donne-moi UN seul insight stratégique pertinent sur cette activité en 1-2 phrases. Pas un compliment. Quelque chose de vrai et utile. Pas de "c'est intéressant". Direct et sincère.`,
          }],
        }),
      });
      const d = await res.json();
      if (d.text) setTefiFeedback(d.text.split("\n")[0]);
    } catch { /* feedback non bloquant */ }

    setStep(1);
  }

  async function handleQ2(val: string) {
    setAnciennete(val);
    await save("q2", { anciennete: ANCIENNETE_MAP[val] });
    setStep(2);
  }

  async function handleQ3(val: string) {
    setEtat(val);
    await save("q3", { etat_moment: val });
    setStep(3);
  }

  async function goToObjectif() {
    setSaving(true);
    await save("questions_done");
    window.location.href = "/auth/objectif";
  }

  async function skip() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await supabase.from("profiles").update({ onboarding_step: "complete", onboarding_complete: true }).eq("id", user.id);
    window.location.href = "/home";
  }

  const terriMsg = () => {
    const ak = ANCIENNETE_MAP[anciennete] || "plus_3";
    const ek = ETAT_MAP[etat] || "flou";
    return TEFI_RESPONSES[ak]?.[ek] || "Tu es au bon endroit. On va y voir plus clair ensemble.";
  };

  const dots = (
    <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "32px" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: i <= step && step < 3 ? "var(--bordeaux)" : "rgba(26,18,16,0.15)", transition: "background-color 0.2s" }} />
      ))}
    </div>
  );

  const btn = (label: string, onClick: () => void) => (
    <button onClick={onClick} style={{ width: "100%", padding: "13px", borderRadius: "20px", border: "1.5px solid rgba(92,26,46,0.15)", backgroundColor: "transparent", color: "var(--texte-secondary)", fontSize: "14px", fontFamily: "DM Sans", cursor: "pointer", marginBottom: "10px", transition: "all 0.15s" }}
      onMouseEnter={e => { (e.target as HTMLButtonElement).style.borderColor = "var(--bordeaux)"; (e.target as HTMLButtonElement).style.color = "var(--bordeaux)"; }}
      onMouseLeave={e => { (e.target as HTMLButtonElement).style.borderColor = "rgba(92,26,46,0.15)"; (e.target as HTMLButtonElement).style.color = "var(--texte-secondary)"; }}>
      {label}
    </button>
  );

  const terriSays = (text: string) => (
    <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "28px" }}>
      <div style={{ width: "34px", height: "34px", borderRadius: "50%", backgroundColor: "var(--bordeaux)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ fontFamily: "Cormorant Garamond, serif", color: "var(--fond-blanc)", fontSize: "18px", fontStyle: "italic" }}>t</span>
      </div>
      <div style={{ backgroundColor: "var(--fond-blanc)", borderLeft: "2px solid rgba(92,26,46,0.15)", borderRadius: "0 12px 12px 12px", padding: "14px 16px", flex: 1 }}>
        <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "17px", fontStyle: "italic", color: "var(--texte-secondary)", lineHeight: "1.5" }}>{text}</p>
      </div>
    </div>
  );

  return (
    <main style={{ backgroundColor: "var(--fond)", minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
        {step < 3 && dots}

        {step === 0 && (
          <>
            {terriSays("Avant qu'on commence… dis-moi en quelques mots ce que tu fais. Ton entreprise, ton activité — comme tu l'expliquerais à quelqu'un que tu viens de rencontrer.")}
            <textarea value={entreprise} onChange={e => setEntreprise(e.target.value)} placeholder="Je fais…" rows={4} autoFocus
              style={{ width: "100%", backgroundColor: "var(--fond-blanc)", color: "var(--texte)", borderBottom: "2px solid var(--texte-discret)", borderTop: "none", borderLeft: "none", borderRight: "none", resize: "none", fontSize: "15px", lineHeight: "1.7", padding: "12px 4px", fontFamily: "DM Sans", marginBottom: "20px" }}
              onFocus={e => { e.target.style.borderBottomColor = "var(--bordeaux)"; }} onBlur={e => { e.target.style.borderBottomColor = "var(--texte-discret)"; }} />
            <button onClick={handleQ1} disabled={!entreprise.trim()}
              style={{ width: "100%", backgroundColor: entreprise.trim() ? "var(--bordeaux)" : "var(--texte-discret)", color: "var(--fond-blanc)", borderRadius: "12px", padding: "14px", fontSize: "15px", fontFamily: "DM Sans", fontWeight: 500, border: "none", cursor: entreprise.trim() ? "pointer" : "not-allowed", marginBottom: "12px" }}>
              Continuer →
            </button>
            <button onClick={skip} style={{ width: "100%", background: "none", border: "none", color: "var(--texte-discret)", fontSize: "12px", cursor: "pointer", fontFamily: "DM Sans" }}>Passer</button>
          </>
        )}

        {step === 1 && (
          <>
            {terriFeedback && terriSays(terriFeedback)}
            {terriSays("Et tu es dans ce rôle de dirigeant depuis…")}
            {["Moins de 3 ans", "Plus de 3 ans"].map(opt => btn(opt, () => handleQ2(opt)))}
            <button onClick={skip} style={{ width: "100%", background: "none", border: "none", color: "var(--texte-discret)", fontSize: "12px", cursor: "pointer", fontFamily: "DM Sans", marginTop: "4px" }}>Passer</button>
          </>
        )}

        {step === 2 && (
          <>
            {terriSays("Sois honnête avec moi — en ce moment, tu te sens plutôt…")}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {[{ l: "🌫️ Dans le flou" }, { l: "🔥 Surchargé" }, { l: "🔄 En transition" }, { l: "🚀 En croissance" }].map(({ l }) => (
                <button key={l} onClick={() => handleQ3(l.split(" ").slice(1).join(" "))}
                  style={{ padding: "16px 10px", borderRadius: "12px", border: "1.5px solid rgba(92,26,46,0.15)", backgroundColor: "transparent", color: "var(--texte-secondary)", fontSize: "13px", fontFamily: "DM Sans", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "22px" }}>{l.split(" ")[0]}</span>
                  <span>{l.split(" ").slice(1).join(" ")}</span>
                </button>
              ))}
            </div>
            <button onClick={skip} style={{ width: "100%", background: "none", border: "none", color: "var(--texte-discret)", fontSize: "12px", cursor: "pointer", fontFamily: "DM Sans", marginTop: "16px" }}>Passer</button>
          </>
        )}

        {step === 3 && (
          <>
            {terriSays(terriMsg())}
            <button onClick={goToObjectif} disabled={saving}
              style={{ width: "100%", backgroundColor: "var(--bordeaux)", color: "var(--fond-blanc)", borderRadius: "12px", padding: "15px", fontSize: "15px", fontFamily: "DM Sans", fontWeight: 500, border: "none", cursor: "pointer", marginBottom: "10px" }}>
              {saving ? "···" : "On pose mon objectif →"}
            </button>
            <button onClick={skip} disabled={saving}
              style={{ width: "100%", background: "none", border: "none", color: "var(--texte-discret)", fontSize: "13px", cursor: "pointer", fontFamily: "DM Sans" }}>
              Plus tard — je commence par mes tâches
            </button>
          </>
        )}
      </div>
    </main>
  );
}
