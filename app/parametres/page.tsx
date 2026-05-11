/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Moon, Sun, Trash2 } from "lucide-react";
import { createClient } from "@/app/lib/supabase/client";
import { getTheme, setTheme } from "@/app/lib/theme";

export default function Parametres() {
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState(0);
  const [prenom, setPrenom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [entreprise, setEntreprise] = useState("");
  const [localisation, setLocalisation] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const supabase = createClient();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setDarkMode(getTheme() === "dark");
    const s = localStorage.getItem("firmament_text_size");
    if (s) setFontSize(parseInt(s));

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { window.location.href = "/"; return; }
      setUserEmail(user.email || "");
      const { data: p } = await supabase.from("profiles").select("prenom,telephone,entreprise,localisation").eq("id", user.id).single();
      if (p) {
        setPrenom(p.prenom || "");
        setTelephone(p.telephone || "");
        setEntreprise(p.entreprise || "");
        setLocalisation(p.localisation || "");
      }
    });
  }, []);

  function toggleDark(val: boolean) {
    setDarkMode(val);
    setTheme(val ? "dark" : "light");
  }

  function applyFontSize(idx: number) {
    setFontSize(idx);
    localStorage.setItem("firmament_text_size", String(idx));
    document.documentElement.style.fontSize = ["100%", "115%", "130%"][idx];
  }

  async function handleSave() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ prenom, telephone, entreprise, localisation }).eq("id", user.id);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button onClick={() => onChange(!value)}
      style={{ width: "44px", height: "26px", borderRadius: "13px", backgroundColor: value ? "var(--bordeaux)" : "rgba(26,18,16,0.15)", position: "relative", border: "none", cursor: "pointer", transition: "background-color 0.2s", flexShrink: 0 }}>
      <div style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "white", position: "absolute", top: "3px", left: value ? "21px" : "3px", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
    </button>
  );

  const inputStyle: React.CSSProperties = {
    width: "100%", backgroundColor: "transparent", color: "var(--texte)",
    borderBottom: "1.5px solid rgba(26,18,16,0.12)", borderTop: "none", borderLeft: "none", borderRight: "none",
    fontSize: "15px", padding: "10px 4px", fontFamily: "DM Sans", marginBottom: "4px",
  };

  return (
    <main style={{ backgroundColor: "var(--fond)", minHeight: "100dvh", fontFamily: "DM Sans, sans-serif" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto", paddingBottom: "60px" }}>

        <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid rgba(26,18,16,0.07)" }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--bordeaux)", textDecoration: "none", fontSize: "14px", fontFamily: "DM Sans", fontWeight: 500 }}>
            <ArrowLeft size={18} /> Mon espace
          </a>
        </div>

        <div style={{ padding: "20px" }}>
          <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "26px", fontWeight: 300, color: "var(--texte)", marginBottom: "28px" }}>Paramètres</h1>

          <p style={{ fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--texte-discret)", marginBottom: "12px" }}>Apparence</p>
          <div style={{ backgroundColor: "var(--fond-blanc)", borderRadius: "12px", padding: "0 16px", marginBottom: "20px", border: "1px solid rgba(26,18,16,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 0", borderBottom: "1px solid rgba(26,18,16,0.07)" }}>
              {darkMode ? <Moon size={16} color="var(--texte-discret)" /> : <Sun size={16} color="var(--texte-discret)" />}
              <p style={{ flex: 1, fontSize: "14px", fontWeight: 500, color: "var(--texte)" }}>Mode sombre</p>
              <Toggle value={darkMode} onChange={toggleDark} />
            </div>
            <div style={{ padding: "14px 0" }}>
              <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--texte)", marginBottom: "12px" }}>Taille du texte</p>
              <div style={{ display: "flex", gap: "8px" }}>
                {["Normal", "Grand", "Très grand"].map((label, i) => (
                  <button key={i} onClick={() => applyFontSize(i)}
                    style={{ flex: 1, padding: "8px 4px", borderRadius: "8px", border: `1.5px solid ${fontSize === i ? "var(--bordeaux)" : "rgba(26,18,16,0.1)"}`, backgroundColor: fontSize === i ? "var(--bordeaux-light)" : "transparent", color: fontSize === i ? "var(--bordeaux)" : "var(--texte-discret)", fontSize: `${12 + i * 2}px`, cursor: "pointer", fontFamily: "DM Sans", fontWeight: fontSize === i ? 500 : 400 }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p style={{ fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--texte-discret)", marginBottom: "12px" }}>Mon compte</p>
          <div style={{ backgroundColor: "var(--fond-blanc)", borderRadius: "12px", padding: "16px", marginBottom: "20px", border: "1px solid rgba(26,18,16,0.08)" }}>
            <p style={{ fontSize: "12px", color: "var(--texte-discret)", marginBottom: "16px" }}>{userEmail}</p>
            <input value={prenom} onChange={e => setPrenom(e.target.value)} placeholder="Prénom" style={inputStyle}
              onFocus={e => { e.target.style.borderBottomColor = "var(--bordeaux)"; }} onBlur={e => { e.target.style.borderBottomColor = "rgba(26,18,16,0.12)"; }} />
            <input value={entreprise} onChange={e => setEntreprise(e.target.value)} placeholder="Entreprise" style={inputStyle}
              onFocus={e => { e.target.style.borderBottomColor = "var(--bordeaux)"; }} onBlur={e => { e.target.style.borderBottomColor = "rgba(26,18,16,0.12)"; }} />
            <input value={telephone} onChange={e => setTelephone(e.target.value)} placeholder="Téléphone" style={inputStyle}
              onFocus={e => { e.target.style.borderBottomColor = "var(--bordeaux)"; }} onBlur={e => { e.target.style.borderBottomColor = "rgba(26,18,16,0.12)"; }} />
            <select value={localisation} onChange={e => setLocalisation(e.target.value)} style={{ ...inputStyle, appearance: "none" as const, marginTop: "12px" }}>
              <option value="">Localisation</option>
              {["Martinique", "Guadeloupe", "Réunion", "Guyane", "Mayotte", "France métropolitaine", "Autre"].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <button onClick={handleSave} disabled={saving}
              style={{ marginTop: "16px", backgroundColor: "var(--bordeaux)", color: "var(--fond-blanc)", borderRadius: "10px", padding: "12px", border: "none", cursor: "pointer", fontSize: "14px", fontFamily: "DM Sans", fontWeight: 500, width: "100%" }}>
              {saved ? "Sauvegardé ✓" : saving ? "···" : "Sauvegarder"}
            </button>
          </div>

          <div style={{ backgroundColor: "var(--fond-blanc)", borderRadius: "12px", padding: "0 16px", marginBottom: "20px", border: "1px solid rgba(26,18,16,0.08)" }}>
            {[["Politique de confidentialité", "/rgpd"], ["CGU", "/cgu"], ["Mentions légales", "/mentions-legales"]].map(([label, href]) => (
              <a key={href} href={href} style={{ display: "flex", justifyContent: "space-between", padding: "13px 0", borderBottom: "1px solid rgba(26,18,16,0.06)", fontSize: "14px", color: "var(--texte-secondary)", textDecoration: "none" }}>
                {label} <span style={{ color: "var(--texte-discret)" }}>→</span>
              </a>
            ))}
          </div>

          <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}
            style={{ width: "100%", padding: "13px", backgroundColor: "transparent", border: "1px solid rgba(26,18,16,0.1)", borderRadius: "12px", color: "var(--texte-secondary)", fontSize: "14px", fontFamily: "DM Sans", cursor: "pointer", marginBottom: "12px" }}>
            Se déconnecter
          </button>

          {!showDeleteConfirm ? (
            <button onClick={() => setShowDeleteConfirm(true)}
              style={{ width: "100%", padding: "10px", backgroundColor: "transparent", border: "none", color: "var(--texte-discret)", fontSize: "12px", fontFamily: "DM Sans", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              <Trash2 size={12} /> Supprimer mon compte
            </button>
          ) : (
            <div style={{ backgroundColor: "rgba(176,0,32,0.05)", borderRadius: "10px", padding: "14px", textAlign: "center" }}>
              <p style={{ fontSize: "13px", color: "var(--texte-secondary)", marginBottom: "12px" }}>Action irréversible.</p>
              <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}
                style={{ backgroundColor: "#B00020", color: "white", borderRadius: "8px", padding: "8px 16px", border: "none", cursor: "pointer", fontSize: "13px", fontFamily: "DM Sans", fontWeight: 500, marginRight: "8px" }}>
                Confirmer
              </button>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--texte-discret)", fontSize: "12px" }}>Annuler</button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
