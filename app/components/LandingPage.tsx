/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState } from "react";
import Logo from "./Logo";
import { createClient } from "@/app/lib/supabase/client";

interface LandingPageProps {
  onStart: () => void;
  onLogin: () => void;
}

const PILLARS = [
  {
    num: "01",
    title: "Clarifier",
    desc: "Transformer le chaos mental en priorités identifiables. Téfi lit entre les lignes de ce que tu écris."
  },
  {
    num: "02",
    title: "Structurer",
    desc: "Transformer les pensées en décisions et en plans d'action séquencés. Chaque tâche à sa place."
  },
  {
    num: "03",
    title: "Cadencer",
    desc: "Créer un rythme d'exécution soutenable. Avancer sans s'épuiser. Tenir dans la durée."
  },
];

const IS_ISNT = {
  is: [
    "Un compagnon stratégique qui te comprend vraiment",
    "Un espace de clarification mentale sans jugement",
    "Un plan d'action généré depuis ton propre chaos",
    "Un rythme de travail qui tient dans la durée",
  ],
  isnt: [
    "Un dashboard de productivité",
    "Un chatbot générique",
    "Un outil de coaching agressif",
    "Un tableau de bord avec des KPIs",
  ],
};

const OFFERS = [
  {
    name: "FIRMAMENT",
    subtitle: "Découverte",
    price: "Gratuit",
    duration: "30 jours complets",
    features: ["Dumps illimités avec Téfi", "Smart to-do séquencé", "Objectif Aimant", "Le Point hebdomadaire"],
    cta: "Commencer gratuitement",
    highlight: false,
  },
  {
    name: "FIRMAMENT Pro",
    subtitle: "Solo",
    price: "12,50 €",
    duration: "par mois",
    features: ["Tout inclus sans limite", "Mémoire longue de Téfi", "Export agenda ICS", "Notifications intelligentes", "Decision log complet"],
    cta: "S'abonner",
    highlight: true,
  },
  {
    name: "FONDATION / IMPÉRIUM",
    subtitle: "Accompagnement dirigeants",
    price: "Sur devis",
    duration: "",
    features: ["Tout FIRMAMENT Pro inclus", "Modules de formation", "Sessions live avec formateur", "Suivi personnalisé Téfi"],
    cta: "Contacter Duleme & Cie",
    highlight: false,
  },
  {
    name: "RÉVÉLATION",
    subtitle: "Audit Neurosciences & Business",
    price: "10 000 €",
    duration: "",
    features: ["Audit complet Neurosciences & Business", "Espace RÉVÉLATION dédié", "Suivi intensif avec Téfi", "FIRMAMENT Pro inclus"],
    cta: "Contacter Duleme & Cie",
    highlight: true,
  },
];

export default function LandingPage({ onStart, onLogin }: LandingPageProps) {
  const [formData, setFormData] = useState({ prenom: "", email: "", entreprise: "", anciennete: "", etat: "", parrain: "" });
  const [formSent, setFormSent] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [cookieAccepted, setCookieAccepted] = useState<boolean | null>(null);
  const supabase = createClient();

  async function handleForm(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.prenom || !formData.email) return;
    setFormLoading(true);
    await supabase.from("leads").insert({
      email: formData.email.trim().toLowerCase(),
      source: "landing_form",
      brain_dump: JSON.stringify(formData),
    });
    setFormLoading(false);
    setFormSent(true);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    backgroundColor: "transparent",
    color: "var(--texte)",
    borderBottom: "1.5px solid rgba(26,18,16,0.15)",
    borderTop: "none", borderLeft: "none", borderRight: "none",
    fontSize: "15px", padding: "12px 4px",
    fontFamily: "DM Sans, sans-serif",
    transition: "border-color 0.2s",
    marginBottom: "16px",
  };

  const pillStyle = (selected: boolean): React.CSSProperties => ({
    padding: "10px 16px", borderRadius: "20px",
    border: `1.5px solid ${selected ? "var(--bordeaux)" : "rgba(92,26,46,0.15)"}`,
    backgroundColor: selected ? "var(--bordeaux-light)" : "transparent",
    color: selected ? "var(--bordeaux)" : "var(--texte-secondary)",
    fontSize: "13px", fontFamily: "DM Sans, sans-serif",
    cursor: "pointer", fontWeight: selected ? 500 : 400,
    transition: "all 0.15s",
  });

  return (
    <div style={{ backgroundColor: "var(--fond)", minHeight: "100dvh", fontFamily: "DM Sans, sans-serif" }}>

      {/* Cookie banner */}
      {cookieAccepted === null && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
          backgroundColor: "var(--fond-blanc)", borderTop: "1px solid rgba(26,18,16,0.08)",
          padding: "14px 20px", display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: "12px", flexWrap: "wrap",
        }}>
          <p style={{ fontSize: "12px", color: "var(--texte-discret)", flex: 1, lineHeight: "1.5" }}>
            FIRMAMENT utilise uniquement des cookies fonctionnels pour ton authentification. Aucune publicité, aucun suivi tiers.
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => setCookieAccepted(false)}
              style={{ background: "none", border: "1px solid rgba(26,18,16,0.15)", borderRadius: "8px", padding: "6px 12px", fontSize: "12px", cursor: "pointer", color: "var(--texte-discret)", fontFamily: "DM Sans" }}>
              Refuser les non-essentiels
            </button>
            <button onClick={() => setCookieAccepted(true)}
              style={{ backgroundColor: "var(--bordeaux)", color: "var(--fond-blanc)", border: "none", borderRadius: "8px", padding: "6px 12px", fontSize: "12px", cursor: "pointer", fontFamily: "DM Sans", fontWeight: 500 }}>
              Accepter
            </button>
          </div>
        </div>
      )}

      {/* NAV */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        backgroundColor: "rgba(248,245,240,0.92)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(26,18,16,0.06)",
        padding: "14px 24px", display: "flex",
        alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Logo size={28} variant="bordeaux" />
          <span style={{ fontFamily: "Cormorant Garamond, serif", color: "var(--bordeaux)", fontSize: "20px", fontWeight: 300, letterSpacing: "0.1em" }}>
            FIRMAMENT
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <a href="#pilliers" style={{ color: "var(--texte-discret)", fontSize: "13px", textDecoration: "none" }}>La méthode</a>
          <a href="#offres" style={{ color: "var(--texte-discret)", fontSize: "13px", textDecoration: "none" }}>Les offres</a>
          <a href="https://dulemeandcie.fr" target="_blank" rel="noopener noreferrer" style={{ color: "var(--texte-discret)", fontSize: "13px", textDecoration: "none" }}>Duleme & Cie</a>
          <button onClick={onLogin}
            style={{ backgroundColor: "var(--bordeaux)", color: "var(--fond-blanc)", borderRadius: "10px", padding: "8px 16px", border: "none", cursor: "pointer", fontSize: "13px", fontFamily: "DM Sans", fontWeight: 500 }}>
            On se connaît déjà →
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: "80px 24px 60px", maxWidth: "640px", margin: "0 auto", textAlign: "center" }}>
        <p style={{ color: "var(--texte-discret)", fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "16px" }}>
          Powered by Duleme & Cie
        </p>
        <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "clamp(32px, 6vw, 52px)", fontWeight: 300, color: "var(--texte)", lineHeight: "1.2", marginBottom: "24px" }}>
          {`Tu me dis ce que tu as dans la tête.`}
          <br />
          <span style={{ color: "var(--bordeaux)", fontStyle: "italic" }}>
            {`FIRMAMENT t'aide à savoir quoi faire.`}
          </span>
        </h1>
        <p style={{ fontSize: "16px", color: "var(--texte-secondary)", lineHeight: "1.7", marginBottom: "36px", maxWidth: "480px", margin: "0 auto 36px" }}>
          Le compagnon stratégique des dirigeants ambitieux. Pas un dashboard. Pas un outil de productivité. Une interface de clarification mentale.
        </p>
        <button onClick={onStart}
          style={{
            backgroundColor: "var(--bordeaux)", color: "var(--fond-blanc)",
            borderRadius: "13px", padding: "18px 36px",
            fontSize: "16px", fontFamily: "DM Sans", fontWeight: 500,
            border: "none", cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: "8px",
          }}>
          Essayer maintenant — c'est gratuit
          <span>→</span>
        </button>
        <p style={{ color: "var(--texte-discret)", fontSize: "12px", marginTop: "12px" }}>
          Aucune carte bancaire requise · 30 jours complets offerts
        </p>
      </section>

      {/* IS / ISN'T */}
      <section style={{ padding: "60px 24px", backgroundColor: "var(--fond-blanc)", margin: "0" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "28px", fontWeight: 300, color: "var(--texte)", textAlign: "center", marginBottom: "40px" }}>
            Ce que FIRMAMENT est — et n'est pas
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            <div>
              <p style={{ color: "var(--vert)", fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "16px", fontWeight: 600 }}>C'est</p>
              {IS_ISNT.is.map((item, i) => (
                <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "12px", alignItems: "flex-start" }}>
                  <span style={{ color: "var(--vert)", fontSize: "16px", flexShrink: 0 }}>✓</span>
                  <p style={{ fontSize: "14px", color: "var(--texte-secondary)", lineHeight: "1.5" }}>{item}</p>
                </div>
              ))}
            </div>
            <div>
              <p style={{ color: "var(--texte-discret)", fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "16px", fontWeight: 600 }}>Ce n'est pas</p>
              {IS_ISNT.isnt.map((item, i) => (
                <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "12px", alignItems: "flex-start" }}>
                  <span style={{ color: "var(--texte-discret)", fontSize: "16px", flexShrink: 0 }}>✕</span>
                  <p style={{ fontSize: "14px", color: "var(--texte-discret)", lineHeight: "1.5" }}>{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3 PILLIERS */}
      <section id="pilliers" style={{ padding: "60px 24px" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "28px", fontWeight: 300, color: "var(--texte)", textAlign: "center", marginBottom: "8px" }}>
            Les 3 piliers
          </h2>
          <p style={{ color: "var(--texte-discret)", fontSize: "14px", textAlign: "center", marginBottom: "40px" }}>
            La méthode FIRMAMENT en 3 mouvements
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {PILLARS.map((p) => (
              <div key={p.num} style={{
                backgroundColor: "var(--fond-blanc)",
                border: "1px solid rgba(26,18,16,0.07)",
                borderRadius: "12px", padding: "24px 28px",
                display: "flex", gap: "20px", alignItems: "flex-start",
              }}>
                <span style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "36px", fontWeight: 300, color: "var(--bordeaux)", opacity: 0.3, lineHeight: 1, flexShrink: 0 }}>{p.num}</span>
                <div>
                  <h3 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "22px", fontWeight: 400, color: "var(--texte)", marginBottom: "8px" }}>{p.title}</h3>
                  <p style={{ fontSize: "14px", color: "var(--texte-secondary)", lineHeight: "1.65" }}>{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TÉMOIGNAGES */}
      <section style={{ padding: "60px 24px", backgroundColor: "var(--fond-blanc)" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "28px", fontWeight: 300, color: "var(--texte)", textAlign: "center", marginBottom: "40px" }}>
            Ce qu'ils en disent
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {[
              { quote: "Pour la première fois, j'ai l'impression que quelqu'un comprend vraiment ce que je vis en tant que dirigeant. Téfi ne me juge pas — il m'aide à voir clair.", name: "Marie L.", role: "Fondatrice, secteur conseil" },
              { quote: "J'avais 47 tâches dans la tête. En 10 minutes, j'avais 3 priorités claires. C'est ça FIRMAMENT.", name: "Thomas D.", role: "Dirigeant, PME industrie" },
            ].map((t, i) => (
              <div key={i} style={{
                backgroundColor: "var(--fond)", borderRadius: "12px",
                padding: "24px", borderLeft: "2px solid rgba(92,26,46,0.15)",
              }}>
                <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "16px", fontStyle: "italic", color: "var(--texte-secondary)", lineHeight: "1.65", marginBottom: "16px" }}>
                  &ldquo;{t.quote}&rdquo;
                </p>
                <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--texte)" }}>{t.name}</p>
                <p style={{ fontSize: "12px", color: "var(--texte-discret)" }}>{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OFFRES */}
      <section id="offres" style={{ padding: "60px 24px" }}>
        <div style={{ maxWidth: "780px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "28px", fontWeight: 300, color: "var(--texte)", textAlign: "center", marginBottom: "8px" }}>
            Les offres Duleme & Cie
          </h2>
          <p style={{ color: "var(--texte-discret)", fontSize: "14px", textAlign: "center", marginBottom: "40px" }}>
            FIRMAMENT est le fil conducteur de tous nos accompagnements.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            {OFFERS.map((o) => (
              <div key={o.name} style={{
                backgroundColor: o.highlight ? "var(--bordeaux)" : "var(--fond-blanc)",
                border: `1px solid ${o.highlight ? "transparent" : "rgba(26,18,16,0.08)"}`,
                borderRadius: "14px", padding: "28px 24px",
                display: "flex", flexDirection: "column",
              }}>
                <p style={{ fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: o.highlight ? "rgba(248,245,240,0.5)" : "var(--texte-discret)", marginBottom: "4px" }}>{o.subtitle}</p>
                <h3 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "22px", fontWeight: 400, color: o.highlight ? "var(--fond-blanc)" : "var(--texte)", marginBottom: "12px" }}>{o.name}</h3>
                <div style={{ marginBottom: "20px" }}>
                  <span style={{ fontSize: "28px", fontWeight: 600, color: o.highlight ? "var(--fond-blanc)" : "var(--texte)", fontFamily: "Cormorant Garamond, serif" }}>{o.price}</span>
                  {o.duration && <span style={{ fontSize: "13px", color: o.highlight ? "rgba(248,245,240,0.6)" : "var(--texte-discret)", marginLeft: "6px" }}>{o.duration}</span>}
                </div>
                <ul style={{ listStyle: "none", padding: 0, flex: 1, marginBottom: "20px" }}>
                  {o.features.map((f, i) => (
                    <li key={i} style={{ fontSize: "13px", color: o.highlight ? "rgba(248,245,240,0.8)" : "var(--texte-secondary)", padding: "5px 0", display: "flex", gap: "8px", alignItems: "flex-start" }}>
                      <span style={{ color: o.highlight ? "rgba(248,245,240,0.5)" : "var(--or)", flexShrink: 0 }}>·</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button onClick={onStart}
                  style={{
                    backgroundColor: o.highlight ? "var(--fond-blanc)" : "var(--bordeaux)",
                    color: o.highlight ? "var(--bordeaux)" : "var(--fond-blanc)",
                    borderRadius: "10px", padding: "12px 16px",
                    border: "none", cursor: "pointer",
                    fontSize: "13px", fontFamily: "DM Sans", fontWeight: 500,
                  }}>
                  {o.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FORMULAIRE INSCRIPTION */}
      <section style={{ padding: "60px 24px", backgroundColor: "var(--fond-blanc)" }}>
        <div style={{ maxWidth: "480px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "28px", fontWeight: 300, color: "var(--texte)", textAlign: "center", marginBottom: "8px" }}>
            Tu préfères t'inscrire d'abord ?
          </h2>
          <p style={{ color: "var(--texte-discret)", fontSize: "14px", textAlign: "center", marginBottom: "32px" }}>
            Laisse tes coordonnées — on te contacte pour t'accueillir.
          </p>

          {formSent ? (
            <div style={{ textAlign: "center", padding: "32px" }}>
              <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "22px", color: "var(--texte)", marginBottom: "8px" }}>Tu es sur la liste.</p>
              <p style={{ color: "var(--texte-discret)", fontSize: "14px" }}>Tu recevras ton accès par email sous peu.</p>
            </div>
          ) : (
            <form onSubmit={handleForm}>
              <input placeholder="Prénom *" value={formData.prenom} onChange={e => setFormData({ ...formData, prenom: e.target.value })} required
                style={inputStyle} onFocus={e => { e.target.style.borderBottomColor = "var(--bordeaux)"; }} onBlur={e => { e.target.style.borderBottomColor = "rgba(26,18,16,0.15)"; }} />
              <input type="email" placeholder="Email professionnel *" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required
                style={inputStyle} onFocus={e => { e.target.style.borderBottomColor = "var(--bordeaux)"; }} onBlur={e => { e.target.style.borderBottomColor = "rgba(26,18,16,0.15)"; }} />
              <input placeholder="Entreprise ou secteur" value={formData.entreprise} onChange={e => setFormData({ ...formData, entreprise: e.target.value })}
                style={inputStyle} onFocus={e => { e.target.style.borderBottomColor = "var(--bordeaux)"; }} onBlur={e => { e.target.style.borderBottomColor = "rgba(26,18,16,0.15)"; }} />

              <p style={{ fontSize: "13px", color: "var(--texte-secondary)", marginBottom: "10px" }}>Ancienneté en tant que dirigeant</p>
              <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
                {["Moins de 3 ans", "Plus de 3 ans"].map(opt => (
                  <button type="button" key={opt} onClick={() => setFormData({ ...formData, anciennete: opt })} style={pillStyle(formData.anciennete === opt)}>{opt}</button>
                ))}
              </div>

              <p style={{ fontSize: "13px", color: "var(--texte-secondary)", marginBottom: "10px" }}>En ce moment tu te sens…</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "24px" }}>
                {["Dans le flou", "Surchargé", "En transition", "En croissance"].map(opt => (
                  <button type="button" key={opt} onClick={() => setFormData({ ...formData, etat: opt })} style={pillStyle(formData.etat === opt)}>{opt}</button>
                ))}
              </div>

              <input placeholder="Je viens de la part de… (optionnel)" value={formData.parrain} onChange={e => setFormData({ ...formData, parrain: e.target.value })}
                style={{ ...inputStyle, fontSize: "13px", color: "var(--texte-discret)" }}
                onFocus={e => { e.target.style.borderBottomColor = "var(--bordeaux)"; }} onBlur={e => { e.target.style.borderBottomColor = "rgba(26,18,16,0.15)"; }} />

              <button type="submit" disabled={!formData.prenom || !formData.email || formLoading}
                style={{
                  backgroundColor: formData.prenom && formData.email && !formLoading ? "var(--bordeaux)" : "var(--texte-discret)",
                  color: "var(--fond-blanc)", borderRadius: "12px", padding: "15px",
                  fontSize: "15px", fontFamily: "DM Sans", fontWeight: 500,
                  border: "none", width: "100%", cursor: formData.prenom && formData.email && !formLoading ? "pointer" : "not-allowed",
                }}>
                {formLoading ? "Envoi···" : "M'inscrire sur la liste →"}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ backgroundColor: "var(--fond)", borderTop: "1px solid rgba(26,18,16,0.08)", padding: "40px 24px" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "24px", marginBottom: "32px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <Logo size={24} variant="bordeaux" />
                <span style={{ fontFamily: "Cormorant Garamond, serif", color: "var(--bordeaux)", fontSize: "18px", fontWeight: 300, letterSpacing: "0.1em" }}>FIRMAMENT</span>
              </div>
              <p style={{ fontSize: "12px", color: "var(--texte-discret)", lineHeight: "1.6" }}>
                Powered by Duleme & Cie
              </p>
            </div>
            <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
              <div>
                <p style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--texte-discret)", marginBottom: "10px" }}>Légal</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <a href="/rgpd" style={{ fontSize: "13px", color: "var(--texte-secondary)", textDecoration: "none" }}>Politique de confidentialité</a>
                  <a href="/cgu" style={{ fontSize: "13px", color: "var(--texte-secondary)", textDecoration: "none" }}>CGU</a>
                  <a href="/mentions-legales" style={{ fontSize: "13px", color: "var(--texte-secondary)", textDecoration: "none" }}>Mentions légales</a>
                </div>
              </div>
              <div>
                <p style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--texte-discret)", marginBottom: "10px" }}>Contact</p>
                <a href="mailto:bonjour@dulemeandcie.fr" style={{ fontSize: "13px", color: "var(--texte-secondary)", textDecoration: "none" }}>bonjour@dulemeandcie.fr</a>
              </div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(26,18,16,0.07)", paddingTop: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
            <p style={{ fontSize: "11px", color: "var(--texte-discret)", lineHeight: "1.5" }}>
              DULEME AND CIE · 27, chemin Malanga · 97215 Rivière Salée
            </p>
            <p style={{ fontSize: "11px", color: "var(--texte-discret)" }}>
              © {new Date().getFullYear()} Duleme & Cie
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
