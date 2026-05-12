/* eslint-disable react/no-unescaped-entities */
"use client";

import { ArrowRight } from "lucide-react";

const IS_ISNT = {
  is: ["Un compagnon stratégique qui te comprend vraiment", "Un espace de clarification mentale sans jugement", "Un plan d'action généré depuis ton propre chaos", "Un rythme de travail qui tient dans la durée"],
  isnt: ["Un dashboard de productivité", "Un chatbot générique", "Un outil de coaching avec des injonctions", "Un tableau de bord avec des KPIs"],
};

const PILLARS = [
  { num: "01", title: "Clarifier", desc: "Transformer le chaos mental en priorités identifiables. Téfi lit entre les lignes de ce que tu écris." },
  { num: "02", title: "Structurer", desc: "Transformer les pensées en décisions et en plans d'action séquencés. Chaque tâche à sa place." },
  { num: "03", title: "Cadencer", desc: "Créer un rythme d'exécution soutenable. Avancer sans s'épuiser. Tenir dans la durée." },
];

export default function LandingPage() {
  return (
    <div style={{ backgroundColor: "var(--fond)", fontFamily: "DM Sans, sans-serif" }}>

      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, backgroundColor: "rgba(248,245,240,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(26,18,16,0.06)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "Cormorant Garamond, serif", color: "var(--bordeaux)", fontSize: "20px", fontWeight: 300, letterSpacing: "0.1em" }}>FIRMAMENT</span>
        <a href="/auth/login" style={{ backgroundColor: "var(--bordeaux)", color: "var(--fond-blanc)", borderRadius: "10px", padding: "8px 18px", fontSize: "13px", fontFamily: "DM Sans", fontWeight: 500, textDecoration: "none" }}>
          On se connaît déjà →
        </a>
      </nav>

      {/* HERO */}
      <section style={{ padding: "80px 24px 72px", maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
        <p style={{ color: "var(--texte-discret)", fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "16px" }}>Powered by Duleme & Cie</p>
        <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "clamp(32px,5vw,52px)", fontWeight: 300, color: "var(--texte)", lineHeight: "1.2", marginBottom: "16px", fontStyle: "italic" }}>
          Tu me dis ce que tu as dans la tête.
          <br />
          <span style={{ color: "var(--bordeaux)" }}>FIRMAMENT t'aide à savoir quoi faire.</span>
        </h1>
        <p style={{ color: "var(--texte-discret)", fontSize: "16px", marginBottom: "36px", lineHeight: "1.7" }}>
          Le compagnon stratégique des dirigeants ambitieux.<br />
          Pas un dashboard. Une interface de clarification mentale.
        </p>
        <a href="/dump" style={{ display: "inline-flex", alignItems: "center", gap: "10px", backgroundColor: "var(--bordeaux)", color: "var(--fond-blanc)", borderRadius: "13px", padding: "18px 36px", fontSize: "16px", fontFamily: "DM Sans", fontWeight: 500, textDecoration: "none" }}>
          Essayer maintenant — c'est gratuit <ArrowRight size={18} />
        </a>
        <p style={{ color: "var(--texte-discret)", fontSize: "12px", marginTop: "12px" }}>
          Aucune carte bancaire · 30 jours complets offerts
        </p>
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

      {/* CTA FINAL */}
      <section style={{ padding: "60px 24px", textAlign: "center" }}>
        <a href="/dump" style={{ display: "inline-flex", alignItems: "center", gap: "10px", backgroundColor: "var(--bordeaux)", color: "var(--fond-blanc)", borderRadius: "13px", padding: "18px 36px", fontSize: "16px", fontFamily: "DM Sans", fontWeight: 500, textDecoration: "none" }}>
          Commencer maintenant <ArrowRight size={18} />
        </a>
      </section>

      {/* FOOTER */}
      <footer style={{ backgroundColor: "var(--fond)", borderTop: "1px solid rgba(26,18,16,0.08)", padding: "32px 24px" }}>
        <div style={{ maxWidth: "640px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <span style={{ fontFamily: "Cormorant Garamond, serif", color: "var(--bordeaux)", fontSize: "16px", fontWeight: 300 }}>FIRMAMENT <span style={{ color: "var(--texte-discret)", fontSize: "11px", fontFamily: "DM Sans" }}>· Duleme & Cie</span></span>
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
