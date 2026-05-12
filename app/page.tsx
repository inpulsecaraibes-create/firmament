/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { getCosmicLine } from "./lib/cosmic";
import Logo from "./components/Logo";

const cosmicLine = getCosmicLine();

const IS_ISNT = {
  is: ["Un compagnon stratégique qui te comprend vraiment", "Un espace de clarification mentale sans jugement", "Un plan d'action généré depuis ton propre chaos", "Un rythme de travail qui tient dans la durée"],
  isnt: ["Un dashboard de productivité", "Un chatbot générique", "Un outil de coaching avec des injonctions", "Un tableau de bord avec des KPIs"],
};

const PILLARS = [
  { num: "01", title: "Clarifier", desc: "Transformer le chaos mental en priorités identifiables. Téfi lit entre les lignes de ce que tu écris." },
  { num: "02", title: "Structurer", desc: "Transformer les pensées en décisions et en plans d'action séquencés. Chaque tâche à sa place." },
  { num: "03", title: "Cadencer", desc: "Créer un rythme d'exécution soutenable. Avancer sans s'épuiser. Tenir dans la durée." },
];

interface TefiResp { observation: string; priority: string; actions: string[]; question: string; }

export default function LandingPage() {
  const [dump, setDump] = useState("");
  const [loading, setLoading] = useState(false);
  const [tefi, setTefi] = useState<TefiResp | null>(null);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [listening, setListening] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null);

  async function handleClarify() {
    if (dump.trim().length < 10 || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/tefi", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ brainDump: dump }) });
      const d = await res.json();
      if (d.observation) setTefi(d);
      else throw new Error();
    } catch {
      setTefi({ observation: "J'ai du mal à te répondre là — une petite pause technique. Tu veux réessayer dans quelques secondes ?", priority: "", actions: [], question: "" });
    } finally { setLoading(false); }
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!tefi) return;
    await fetch("/api/resume-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, priority: tefi.priority, actions: tefi.actions, brainDump: dump }) });
    setEmailSent(true);
  }

  function toggleVoice() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    if (listening) { recRef.current?.stop(); setListening(false); return; }
    const r = new SR(); r.lang = "fr-FR"; r.continuous = true; r.interimResults = true;
    r.onresult = (ev: { results: SpeechRecognitionResultList }) => setDump(Array.from(ev.results).map((x) => (x as SpeechRecognitionResult)[0].transcript).join(""));
    r.onend = () => setListening(false);
    r.start(); recRef.current = r; setListening(true);
  }

  const S = {
    input: { width: "100%", backgroundColor: "var(--fond-blanc)", color: "var(--texte)", borderBottom: "2px solid var(--texte-discret)", borderTop: "none", borderLeft: "none", borderRight: "none", fontSize: "16px", lineHeight: "1.7", padding: "16px 4px", fontFamily: "DM Sans, sans-serif", resize: "none" } as React.CSSProperties,
  };

  return (
    <div style={{ backgroundColor: "var(--fond)", fontFamily: "DM Sans, sans-serif" }}>

      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, backgroundColor: "rgba(248,245,240,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(26,18,16,0.06)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Logo size={26} variant="bordeaux" />
          <span style={{ fontFamily: "Cormorant Garamond, serif", color: "var(--bordeaux)", fontSize: "20px", fontWeight: 300, letterSpacing: "0.1em" }}>FIRMAMENT</span>
        </div>
        <a href="/auth/login" style={{ backgroundColor: "var(--bordeaux)", color: "var(--fond-blanc)", borderRadius: "10px", padding: "8px 18px", fontSize: "13px", fontFamily: "DM Sans", fontWeight: 500, textDecoration: "none" }}>
          On se connaît déjà →
        </a>
      </nav>

      {/* HERO */}
      <section style={{ padding: "64px 24px 48px", maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
        <p style={{ color: "var(--texte-discret)", fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "16px" }}>Powered by Duleme & Cie</p>
        <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "clamp(28px,5vw,46px)", fontWeight: 300, color: "var(--texte)", lineHeight: "1.25", marginBottom: "12px", fontStyle: "italic" }}>
          Qu'est-ce qui occupe tout l'espace dans ton esprit aujourd'hui ?
        </h1>
        <p style={{ color: "var(--texte-discret)", fontSize: "15px", marginBottom: "32px" }}>Vide ta tête. Téfi s'occupe du reste.</p>

        {!tefi ? (
          <div style={{ textAlign: "left" }}>
            <textarea value={dump} onChange={e => setDump(e.target.value)}
              placeholder="Écris tout ce qui tourne dans ta tête — sans filtre, sans structure. Téfi fera le tri." rows={7} style={S.input}
              onFocus={e => { (e.target as HTMLTextAreaElement).style.borderBottomColor = "var(--bordeaux)"; }}
              onBlur={e => { (e.target as HTMLTextAreaElement).style.borderBottomColor = "var(--texte-discret)"; }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", margin: "8px 0 14px" }}>
              <button onClick={toggleVoice} style={{ background: "none", border: "none", cursor: "pointer", color: listening ? "var(--bordeaux)" : "var(--texte-discret)", fontSize: "13px", fontFamily: "DM Sans" }}>
                🎤 {listening ? "Arrêter la dictée" : "Dicter à Téfi"}
              </button>
              {dump.length > 20 && <span style={{ fontSize: "11px", color: "var(--texte-discret)" }}>{dump.length} car.</span>}
            </div>
            <p style={{ fontSize: "11px", color: "var(--texte-discret)", fontStyle: "italic", marginBottom: "16px", textAlign: "center" }}>
              Tes pensées sont chiffrées et ne quittent pas FIRMAMENT.
            </p>
            <button onClick={handleClarify} disabled={dump.trim().length < 10 || loading}
              style={{ backgroundColor: dump.trim().length >= 10 && !loading ? "var(--bordeaux)" : "var(--texte-discret)", color: "var(--fond-blanc)", borderRadius: "12px", padding: "16px", fontSize: "15px", fontFamily: "DM Sans", fontWeight: 500, border: "none", width: "100%", cursor: dump.trim().length >= 10 && !loading ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              {loading ? "Téfi réfléchit···" : <><span>Clarifier</span><ArrowRight size={16} /></>}
            </button>
          </div>
        ) : (
          <div style={{ textAlign: "left" }}>
            {/* Observation */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "var(--bordeaux)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontFamily: "Cormorant Garamond, serif", color: "var(--fond-blanc)", fontSize: "18px", fontStyle: "italic" }}>t</span>
              </div>
              <div style={{ backgroundColor: "var(--fond-blanc)", borderLeft: "2px solid rgba(92,26,46,0.15)", borderRadius: "0 12px 12px 12px", padding: "14px 16px", flex: 1 }}>
                <p style={{ color: "var(--texte-secondary)", fontSize: "15px", lineHeight: "1.6", fontStyle: "italic" }}>{tefi.observation}</p>
              </div>
            </div>

            {/* Priorité */}
            {tefi.priority && <div style={{ backgroundColor: "var(--bordeaux)", borderRadius: "12px", padding: "18px 20px", marginBottom: "20px" }}>
              <p style={{ color: "rgba(248,245,240,0.5)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "6px" }}>Priorité absolue</p>
              <p style={{ color: "var(--fond-blanc)", fontSize: "17px", fontFamily: "Cormorant Garamond, serif", fontWeight: 500, lineHeight: "1.4" }}>{tefi.priority}</p>
            </div>}

            {/* Actions */}
            {tefi.actions.length > 0 && <div style={{ backgroundColor: "var(--fond-blanc)", borderRadius: "12px", padding: "16px 18px", marginBottom: "20px" }}>
              <p style={{ color: "var(--texte-discret)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "10px" }}>Actions</p>
              {tefi.actions.map((a, i) => (
                <div key={i} style={{ padding: "8px 0", borderBottom: i < tefi.actions.length - 1 ? "1px solid rgba(26,18,16,0.07)" : "none", fontSize: "15px", color: "var(--texte-secondary)", lineHeight: "1.5" }}>
                  <span style={{ color: "var(--or)", fontWeight: 600, marginRight: "6px" }}>{i + 1}.</span>{a}
                </div>
              ))}
            </div>}

            {/* Question */}
            {tefi.question && <div style={{ backgroundColor: "var(--fond-or)", borderRadius: "12px", padding: "16px 18px", marginBottom: "20px" }}>
              <p style={{ color: "var(--texte-secondary)", fontSize: "15px", fontStyle: "italic", fontFamily: "Cormorant Garamond, serif", lineHeight: "1.6" }}>{tefi.question}</p>
            </div>}

            {/* CTA */}
            {!emailSent ? (
              <div style={{ backgroundColor: "var(--fond-blanc)", border: "1px solid rgba(92,26,46,0.12)", borderRadius: "12px", padding: "20px" }}>
                <p style={{ fontSize: "14px", color: "var(--texte-secondary)", fontStyle: "italic", marginBottom: "14px" }}>
                  Ce début de clarté est précieux. Tu veux le garder ?
                </p>
                <a href="/auth/register" style={{ display: "block", backgroundColor: "var(--bordeaux)", color: "var(--fond-blanc)", borderRadius: "12px", padding: "14px", fontSize: "15px", fontFamily: "DM Sans", fontWeight: 500, textDecoration: "none", textAlign: "center", marginBottom: "12px" }}>
                  Créer mon espace FIRMAMENT →
                </a>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "10px 0" }}>
                  <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(26,18,16,0.08)" }} />
                  <span style={{ color: "var(--texte-discret)", fontSize: "12px", whiteSpace: "nowrap" }}>ou reçois ce résumé par mail</span>
                  <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(26,18,16,0.08)" }} />
                </div>
                <form onSubmit={handleEmail} style={{ display: "flex", gap: "8px" }}>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ton@email.com" required
                    style={{ flex: 1, backgroundColor: "transparent", color: "var(--texte)", borderBottom: "1.5px solid var(--texte-discret)", borderTop: "none", borderLeft: "none", borderRight: "none", fontSize: "15px", padding: "8px 4px", fontFamily: "DM Sans" }}
                    onFocus={e => { (e.target as HTMLInputElement).style.borderBottomColor = "var(--bordeaux)"; }}
                    onBlur={e => { (e.target as HTMLInputElement).style.borderBottomColor = "var(--texte-discret)"; }}
                  />
                  <button type="submit" style={{ backgroundColor: "var(--bordeaux)", color: "var(--fond-blanc)", borderRadius: "10px", padding: "8px 16px", border: "none", cursor: "pointer", fontSize: "13px", fontFamily: "DM Sans", fontWeight: 500 }}>
                    Envoyer
                  </button>
                </form>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "20px", backgroundColor: "var(--fond-blanc)", borderRadius: "12px" }}>
                <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "20px", color: "var(--texte)" }}>C'est envoyé.</p>
                <p style={{ color: "var(--texte-discret)", fontSize: "13px", marginTop: "6px" }}>Tu peux revenir quand tu veux.</p>
              </div>
            )}
            <button onClick={() => { setTefi(null); setDump(""); setEmailSent(false); }}
              style={{ marginTop: "14px", background: "none", border: "none", cursor: "pointer", color: "var(--texte-discret)", fontSize: "12px", fontFamily: "DM Sans", width: "100%", textAlign: "center" }}>
              Recommencer
            </button>
          </div>
        )}
        <p style={{ color: "var(--texte-discret)", fontSize: "11px", fontStyle: "italic", marginTop: "32px" }}>{cosmicLine}</p>
      </section>

      {/* CE QUE FIRMAMENT EST / N'EST PAS */}
      <section style={{ padding: "60px 24px", backgroundColor: "var(--fond-blanc)" }}>
        <div style={{ maxWidth: "640px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "28px", fontWeight: 300, color: "var(--texte)", textAlign: "center", marginBottom: "36px" }}>Ce que FIRMAMENT est — et n'est pas</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            <div>
              <p style={{ color: "var(--vert)", fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "14px", fontWeight: 600 }}>C'est</p>
              {IS_ISNT.is.map((item, i) => <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "12px" }}><span style={{ color: "var(--vert)", flexShrink: 0 }}>✓</span><p style={{ fontSize: "14px", color: "var(--texte-secondary)", lineHeight: "1.5" }}>{item}</p></div>)}
            </div>
            <div>
              <p style={{ color: "var(--texte-discret)", fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "14px", fontWeight: 600 }}>Ce n'est pas</p>
              {IS_ISNT.isnt.map((item, i) => <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "12px" }}><span style={{ color: "var(--texte-discret)", flexShrink: 0 }}>✕</span><p style={{ fontSize: "14px", color: "var(--texte-discret)", lineHeight: "1.5" }}>{item}</p></div>)}
            </div>
          </div>
        </div>
      </section>

      {/* 3 PILIERS */}
      <section style={{ padding: "60px 24px" }}>
        <div style={{ maxWidth: "640px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "28px", fontWeight: 300, color: "var(--texte)", textAlign: "center", marginBottom: "36px" }}>Les 3 piliers</h2>
          {PILLARS.map(p => (
            <div key={p.num} style={{ backgroundColor: "var(--fond-blanc)", border: "1px solid rgba(26,18,16,0.07)", borderRadius: "12px", padding: "24px 28px", display: "flex", gap: "20px", marginBottom: "3px" }}>
              <span style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "36px", fontWeight: 300, color: "var(--bordeaux)", opacity: 0.25, lineHeight: 1, flexShrink: 0 }}>{p.num}</span>
              <div>
                <h3 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "22px", color: "var(--texte)", marginBottom: "8px" }}>{p.title}</h3>
                <p style={{ fontSize: "14px", color: "var(--texte-secondary)", lineHeight: "1.65" }}>{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TÉMOIGNAGES */}
      <section style={{ padding: "60px 24px", backgroundColor: "var(--fond-blanc)" }}>
        <div style={{ maxWidth: "640px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "28px", fontWeight: 300, color: "var(--texte)", textAlign: "center", marginBottom: "36px" }}>Ce qu'ils en disent</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: "16px" }}>
            {[
              { quote: "Pour la première fois, j'ai l'impression que quelqu'un comprend vraiment ce que je vis. Téfi ne me juge pas — il m'aide à voir clair.", name: "Marie L.", role: "Fondatrice, secteur conseil" },
              { quote: "J'avais 47 tâches dans la tête. En 10 minutes, j'avais 3 priorités claires. C'est ça FIRMAMENT.", name: "Thomas D.", role: "Dirigeant, PME industrie" },
            ].map((t, i) => (
              <div key={i} style={{ backgroundColor: "var(--fond)", borderRadius: "12px", padding: "24px", borderLeft: "2px solid rgba(92,26,46,0.15)" }}>
                <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "16px", fontStyle: "italic", color: "var(--texte-secondary)", lineHeight: "1.65", marginBottom: "16px" }}>"{t.quote}"</p>
                <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--texte)" }}>{t.name}</p>
                <p style={{ fontSize: "12px", color: "var(--texte-discret)" }}>{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ backgroundColor: "var(--fond)", borderTop: "1px solid rgba(26,18,16,0.08)", padding: "32px 24px" }}>
        <div style={{ maxWidth: "640px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <span style={{ fontFamily: "Cormorant Garamond, serif", color: "var(--bordeaux)", fontSize: "16px", fontWeight: 300 }}>
            FIRMAMENT <span style={{ color: "var(--texte-discret)", fontSize: "11px", fontFamily: "DM Sans" }}>· Duleme & Cie</span>
          </span>
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            {[["admin@frmmnt.fr", "mailto:admin@frmmnt.fr"], ["RGPD", "/rgpd"], ["CGU", "/cgu"], ["Mentions légales", "/mentions-legales"]].map(([l, h]) => (
              <a key={l} href={h} style={{ fontSize: "12px", color: "var(--texte-discret)", textDecoration: "none" }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
