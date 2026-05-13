"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/app/lib/supabase/client";

type Step = "q1" | "q2" | "q3" | "tefi_response" | "objectif_invite" | "objectif_question" | "objectif_confirm" | "done";

interface OnboardingProps {
  onComplete: () => void;
}

const TEFI_RESPONSES: Record<string, Record<string, string>> = {
  "moins_3": {
    "flou": "C'est souvent là que tout commence. Le flou n'est pas un problème — c'est un signal. On va le transformer en direction.",
    "surcharge": "Démarrer en étant déjà surchargé, c'est courant. Mais ça ne doit pas devenir la norme. On va trier ce qui compte vraiment.",
    "transition": "Les transitions sont des carrefours. Ce que tu décides maintenant va compter. On va être précis.",
    "croissance": "La croissance au début, c'est une bonne nouvelle. Et aussi un moment où tout peut s'emballer. On va structurer ça.",
  },
  "plus_3": {
    "flou": "Après tout ce chemin, se retrouver dans le flou — c'est souvent un signe que quelque chose a changé. On va identifier quoi.",
    "surcharge": "Tu portes beaucoup. Probablement trop seul. On va commencer par déposer tout ça — et voir ce qui mérite vraiment ton énergie.",
    "transition": "Quand on a de l'expérience, une transition est rarement un hasard. Il y a quelque chose que tu cherches. On va le trouver.",
    "croissance": "La croissance, c'est excitant. C'est aussi là où les fondations se fragilisent si on n'y fait pas attention. On va structurer ça.",
  },
  "reflexion": {
    "flou": "Être en réflexion avec du flou — c'est presque la définition du démarrage. Et c'est exactement là que FIRMAMENT est utile.",
    "surcharge": "Même avant de lancer, tu es déjà surchargé ? Il faut qu'on pose les fondations avant d'accélérer.",
    "transition": "Une transition avant même d'avoir lancé — ça veut dire que tu repenses quelque chose en profondeur. Bien. On va creuser.",
    "croissance": "Une énergie de croissance en phase de réflexion — c'est une bonne base. On va canaliser ça.",
  },
};

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<Step>("q1");
  const [entreprise, setEntreprise] = useState("");
  const [anciennete, setAnciennete] = useState("");
  const [etatMoment, setEtatMoment] = useState("");
  const [terriMessage, setTefiMessage] = useState("");
  const [objectifQuestion, setObjectifQuestion] = useState("");
  const [objectifPhrase, setObjectifPhrase] = useState("");
  const [objectifEdit, setObjectifEdit] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const etatKey: Record<string, string> = {
    "Dans le flou": "flou",
    "Surchargé": "surcharge",
    "En transition": "transition",
    "En croissance": "croissance",
  };

  const ancienneteKey: Record<string, string> = {
    "Moins de 3 ans": "moins_3",
    "Plus de 3 ans": "plus_3",
    "En réflexion / création": "reflexion",
  };

  function getTefiResponse(): string {
    const ak = ancienneteKey[anciennete] || "plus_3";
    const ek = etatKey[etatMoment] || "flou";
    return TEFI_RESPONSES[ak]?.[ek] || "Tu es au bon endroit. On va y voir plus clair ensemble.";
  }

  async function handleQ3(etat: string) {
    setEtatMoment(etat);
    setLoading(true);

    const ak = ancienneteKey[anciennete] || "plus_3";
    const ek = etatKey[etat] || "flou";
    const msg = TEFI_RESPONSES[ak]?.[ek] || "Tu es au bon endroit. On va y voir plus clair ensemble.";
    setTefiMessage(msg);

    // Sauvegarder le profil dans Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({
        entreprise,
        anciennete,
        etat_moment: etat,
      }).eq("id", user.id);
    }

    setLoading(false);
    setTimeout(() => setStep("tefi_response"), 100);
  }

  async function handleObjectifOui() {
    setStep("objectif_question");
  }

  async function handleObjectifGenerate() {
    if (!objectifQuestion.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("/api/terri", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Mon entreprise : ${entreprise}. Ancienneté : ${anciennete}. État : ${etatMoment}. Mon objectif en quelques mots : ${objectifQuestion}`,
            },
            {
              role: "assistant",
              content: getTefiResponse(),
            },
            {
              role: "user",
              content: `Formule mon objectif pour les 30 prochains jours en une seule phrase courte, puissante, à la première personne. Uniquement la phrase, sans introduction ni explication. Ex : "Sortir de l'opérationnel sur au moins 3 sujets clés."`,
            },
          ],
        }),
      });
      const data = await res.json();
      const phrase = data.text?.replace(/^["«»"]|["«»"]$/g, "").trim() || objectifQuestion;
      setObjectifPhrase(phrase);
      setObjectifEdit(phrase);
      setStep("objectif_confirm");
    } catch {
      setObjectifPhrase(objectifQuestion);
      setObjectifEdit(objectifQuestion);
      setStep("objectif_confirm");
    }
    setLoading(false);
  }

  async function handleObjectifSave() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("objectifs").insert({
        user_id: user.id,
        phrase: objectifEdit || objectifPhrase,
        horizon: "30 jours",
        progress: 0,
        active: true,
      });
      await supabase.from("profiles").update({ onboarding_done: true }).eq("id", user.id);
    }
    onComplete();
  }

  async function handleSkipObjectif() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ onboarding_done: true }).eq("id", user.id);
    }
    onComplete();
  }

  const pillStyle = (selected: boolean): React.CSSProperties => ({
    padding: "12px 18px",
    borderRadius: "24px",
    border: `1.5px solid ${selected ? "var(--bordeaux)" : "rgba(92,26,46,0.15)"}`,
    backgroundColor: selected ? "var(--bordeaux-light)" : "transparent",
    color: selected ? "var(--bordeaux)" : "var(--texte-secondary)",
    fontSize: "14px",
    fontFamily: "DM Sans, sans-serif",
    cursor: "pointer",
    transition: "all 0.15s",
    fontWeight: selected ? 500 : 400,
  });

  const terriAvatar = (
    <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "var(--bordeaux)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ fontFamily: "Cormorant Garamond, serif", color: "var(--fond-blanc)", fontSize: "18px", fontStyle: "italic" }}>t</span>
    </div>
  );

  function TefiSays({ children }: { children: React.ReactNode }) {
    return (
      <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "28px" }}>
        {terriAvatar}
        <div style={{
          backgroundColor: "var(--fond-blanc)",
          borderLeft: "2px solid rgba(92,26,46,0.15)",
          borderRadius: "0 12px 12px 12px",
          padding: "14px 18px", flex: 1,
        }}>
          <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "17px", fontWeight: 400, color: "var(--texte-secondary)", lineHeight: "1.5", fontStyle: "italic" }}>
            {children}
          </p>
        </div>
      </div>
    );
  }

  return (
    <main style={{ backgroundColor: "var(--fond)", minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px" }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>

        {/* Q1 — Entreprise */}
        {step === "q1" && (
          <>
            <TefiSays>{`Avant qu'on commence… dis-moi en quelques mots ce que tu fais. Ton entreprise, ton activité — comme tu l'expliquerais à quelqu'un que tu viens de rencontrer.`}</TefiSays>
            <textarea
              value={entreprise}
              onChange={e => setEntreprise(e.target.value)}
              placeholder="Je fais…"
              rows={4}
              autoFocus
              style={{
                width: "100%", backgroundColor: "var(--fond-blanc)", color: "var(--texte)",
                borderBottom: "2px solid var(--texte-discret)", borderTop: "none", borderLeft: "none", borderRight: "none",
                resize: "none", fontSize: "15px", lineHeight: "1.7", padding: "12px 4px",
                fontFamily: "DM Sans, sans-serif", marginBottom: "20px",
              }}
              onFocus={e => { e.target.style.borderBottomColor = "var(--bordeaux)"; }}
              onBlur={e => { e.target.style.borderBottomColor = "var(--texte-discret)"; }}
            />
            <button onClick={() => entreprise.trim() && setStep("q2")} disabled={!entreprise.trim()}
              style={{ width: "100%", backgroundColor: entreprise.trim() ? "var(--bordeaux)" : "var(--texte-discret)", color: "var(--fond-blanc)", borderRadius: "12px", padding: "15px", fontSize: "15px", fontFamily: "DM Sans, sans-serif", fontWeight: 500, border: "none", cursor: entreprise.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              Continuer <ArrowRight size={16} />
            </button>
          </>
        )}

        {/* Q2 — Ancienneté */}
        {step === "q2" && (
          <>
            <TefiSays>Et tu es dans ce rôle de dirigeant depuis…</TefiSays>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {["Moins de 3 ans", "Plus de 3 ans", "En réflexion / création"].map(opt => (
                <button key={opt} onClick={() => { setAnciennete(opt); setStep("q3"); }}
                  style={pillStyle(anciennete === opt)}>
                  {opt}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Q3 — État du moment */}
        {step === "q3" && (
          <>
            <TefiSays>Sois honnête avec moi — en ce moment, tu te sens plutôt…</TefiSays>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {[
                { label: "Dans le flou", emoji: "🌫️" },
                { label: "Surchargé", emoji: "🔥" },
                { label: "En transition", emoji: "🔄" },
                { label: "En croissance", emoji: "🚀" },
              ].map(({ label, emoji }) => (
                <button key={label} onClick={() => !loading && handleQ3(label)} disabled={loading}
                  style={{
                    ...pillStyle(etatMoment === label),
                    display: "flex", flexDirection: "column", alignItems: "center",
                    gap: "6px", padding: "16px 12px",
                  }}>
                  <span style={{ fontSize: "22px" }}>{emoji}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
            {loading && <p style={{ textAlign: "center", color: "var(--texte-discret)", fontSize: "13px", marginTop: "16px" }}>Terri prend note···</p>}
          </>
        )}

        {/* Réponse de Terri */}
        {step === "tefi_response" && (
          <>
            <TefiSays>{terriMessage}</TefiSays>
            <button onClick={() => setStep("objectif_invite")}
              style={{ width: "100%", backgroundColor: "var(--bordeaux)", color: "var(--fond-blanc)", borderRadius: "12px", padding: "15px", fontSize: "15px", fontFamily: "DM Sans, sans-serif", fontWeight: 500, border: "none", cursor: "pointer" }}>
              On continue →
            </button>
          </>
        )}

        {/* Invitation objectif */}
        {step === "objectif_invite" && (
          <>
            <TefiSays>Maintenant que je te connais un peu mieux… est-ce que tu veux qu{"'"}on pose ensemble ton premier objectif ? Pas une to-do. Un vrai cap. Ça change tout ce qu{"'"}on va faire ici.</TefiSays>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button onClick={handleObjectifOui}
                style={{ ...pillStyle(false), backgroundColor: "var(--fond-or)", borderColor: "var(--or)", color: "var(--texte-secondary)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                ✨ Oui, on pose mon objectif
              </button>
              <button onClick={handleSkipObjectif}
                style={{ ...pillStyle(false), color: "var(--texte-discret)" }}>
                Plus tard — je commence par mes tâches
              </button>
            </div>
          </>
        )}

        {/* Question objectif */}
        {step === "objectif_question" && (
          <>
            <TefiSays>En quelques mots — qu{"'"}est-ce que tu veux avoir accompli dans les 30 prochains jours ?</TefiSays>
            <textarea
              value={objectifQuestion}
              onChange={e => setObjectifQuestion(e.target.value)}
              placeholder="Je veux…"
              rows={3}
              autoFocus
              style={{
                width: "100%", backgroundColor: "var(--fond-blanc)", color: "var(--texte)",
                borderBottom: "2px solid var(--texte-discret)", borderTop: "none", borderLeft: "none", borderRight: "none",
                resize: "none", fontSize: "15px", lineHeight: "1.7", padding: "12px 4px",
                fontFamily: "DM Sans, sans-serif", marginBottom: "20px",
              }}
              onFocus={e => { e.target.style.borderBottomColor = "var(--bordeaux)"; }}
              onBlur={e => { e.target.style.borderBottomColor = "var(--texte-discret)"; }}
            />
            <button onClick={handleObjectifGenerate} disabled={!objectifQuestion.trim() || loading}
              style={{ width: "100%", backgroundColor: objectifQuestion.trim() && !loading ? "var(--bordeaux)" : "var(--texte-discret)", color: "var(--fond-blanc)", borderRadius: "12px", padding: "15px", fontSize: "15px", fontFamily: "DM Sans, sans-serif", fontWeight: 500, border: "none", cursor: objectifQuestion.trim() && !loading ? "pointer" : "not-allowed" }}>
              {loading ? "Terri formule ton cap···" : "Formuler mon cap →"}
            </button>
          </>
        )}

        {/* Confirmation objectif */}
        {step === "objectif_confirm" && (
          <>
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "20px" }}>
              {terriAvatar}
              <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "14px", color: "var(--texte-secondary)", lineHeight: "1.6", fontStyle: "italic" }}>
                {`D'après ce que tu m'as dit, ton cap pour les 30 prochains jours serait :`}
              </p>
            </div>

            <div style={{ backgroundColor: "var(--bordeaux)", borderRadius: "12px", padding: "20px 22px", marginBottom: "20px" }}>
              <p style={{ color: "rgba(248,245,240,0.5)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "DM Sans", marginBottom: "8px" }}>
                Ton Objectif Aimant
              </p>
              <textarea
                value={objectifEdit}
                onChange={e => setObjectifEdit(e.target.value)}
                style={{
                  width: "100%", backgroundColor: "transparent", color: "var(--fond-blanc)",
                  border: "none", borderBottom: "1px solid rgba(248,245,240,0.2)",
                  resize: "none", fontSize: "17px", fontFamily: "Cormorant Garamond, serif",
                  fontStyle: "italic", lineHeight: "1.4", padding: "4px 0",
                }}
                rows={3}
              />
            </div>

            <p style={{ color: "var(--texte-discret)", fontSize: "12px", textAlign: "center", marginBottom: "16px" }}>
              Tu peux modifier la formulation directement ci-dessus.
            </p>

            <button onClick={handleObjectifSave}
              style={{ width: "100%", backgroundColor: "var(--bordeaux)", color: "var(--fond-blanc)", borderRadius: "12px", padding: "15px", fontSize: "15px", fontFamily: "DM Sans, sans-serif", fontWeight: 500, border: "none", cursor: "pointer", marginBottom: "10px" }}>
              C{"'"}est mon cap. On commence →
            </button>
            <button onClick={handleSkipObjectif}
              style={{ width: "100%", background: "none", border: "none", color: "var(--texte-discret)", fontSize: "13px", cursor: "pointer", fontFamily: "DM Sans" }}>
              Reformuler plus tard
            </button>
          </>
        )}

      </div>
    </main>
  );
}
