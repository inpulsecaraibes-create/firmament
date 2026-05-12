/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Moon, Sun } from "lucide-react";
import { createClient } from "@/app/lib/supabase/client";

const LOCALISATIONS = ["Martinique", "Guadeloupe", "Réunion", "Guyane", "Mayotte", "France métropolitaine", "Autre"];

export default function ParametresPage() {
  const [dark, setDark] = useState(false);
  const [fontSize, setFontSize] = useState(1);
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [entreprise, setEntreprise] = useState("");
  const [localisation, setLocalisation] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [referralCount, setReferralCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [sesameCode, setSesameCode] = useState("");
  const [sesameResult, setSesameResult] = useState<string | null>(null);
  const [sesameLoading, setSesameLoading] = useState(false);
  const supabase = createClient();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const savedTheme = localStorage.getItem("firmament_theme");
    const isDark = savedTheme === "dark";
    setDark(isDark);
    if (isDark) document.documentElement.setAttribute("data-theme", "dark");

    const savedSize = parseInt(localStorage.getItem("firmament_text_size") || "1");
    setFontSize(savedSize);
    document.documentElement.style.fontSize = `${85 + savedSize * 15}%`;

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setEmail(user.email || "");
      const { data: p } = await supabase.from("profiles").select("prenom,telephone,entreprise,localisation,referral_code").eq("id", user.id).single();
      if (p) { setPrenom(p.prenom || ""); setTelephone(p.telephone || ""); setEntreprise(p.entreprise || ""); setLocalisation(p.localisation || ""); setReferralCode(p.referral_code || ""); }
      const { count } = await supabase.from("referrals").select("*", { count: "exact", head: true }).eq("parrain_id", user.id).eq("validated", true);
      setReferralCount(count || 0);
    });
  }, []);

  function toggleDark(val: boolean) {
    setDark(val);
    localStorage.setItem("firmament_theme", val ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", val ? "dark" : "light");
  }

  function applySize(s: number) {
    setFontSize(s);
    localStorage.setItem("firmament_text_size", String(s));
    document.documentElement.style.fontSize = `${85 + s * 15}%`;
  }

  async function handleSave() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await supabase.from("profiles").update({ prenom, telephone, entreprise, localisation }).eq("id", user.id);
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  const inp: React.CSSProperties = { width: "100%", backgroundColor: "transparent", color: "var(--texte)", borderBottom: "1.5px solid rgba(26,18,16,0.12)", borderTop: "none", borderLeft: "none", borderRight: "none", fontSize: "15px", padding: "10px 4px", fontFamily: "DM Sans", marginBottom: "4px" };

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button onClick={() => onChange(!value)} style={{ width: "44px", height: "26px", borderRadius: "13px", backgroundColor: value ? "var(--bordeaux)" : "rgba(26,18,16,0.15)", position: "relative", border: "none", cursor: "pointer", transition: "background-color 0.2s", flexShrink: 0 }}>
      <div style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "white", position: "absolute", top: "3px", left: value ? "21px" : "3px", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
    </button>
  );

  return (
    <main style={{ backgroundColor: "var(--fond)", minHeight: "100dvh", fontFamily: "DM Sans, sans-serif", paddingBottom: "60px" }}>
      <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid rgba(26,18,16,0.07)" }}>
        <a href="/home" style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--bordeaux)", textDecoration: "none", fontSize: "14px", fontWeight: 500 }}>
          <ArrowLeft size={18} /> Mon espace
        </a>
      </div>

      <div style={{ padding: "20px", maxWidth: "480px", margin: "0 auto" }}>
        <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "26px", fontWeight: 300, color: "var(--texte)", marginBottom: "28px" }}>Paramètres</h1>

        {/* APPARENCE */}
        <p style={{ fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--texte-discret)", marginBottom: "10px" }}>Apparence</p>
        <div style={{ backgroundColor: "var(--fond-blanc)", borderRadius: "12px", padding: "0 16px", marginBottom: "20px", border: "1px solid rgba(26,18,16,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 0", borderBottom: "1px solid rgba(26,18,16,0.07)" }}>
            {dark ? <Moon size={16} color="var(--texte-discret)" /> : <Sun size={16} color="var(--texte-discret)" />}
            <p style={{ flex: 1, fontSize: "14px", color: "var(--texte)" }}>Mode sombre</p>
            <Toggle value={dark} onChange={toggleDark} />
          </div>
          <div style={{ padding: "14px 0" }}>
            <p style={{ fontSize: "14px", color: "var(--texte)", marginBottom: "12px" }}>Taille du texte</p>
            <div style={{ display: "flex", gap: "8px" }}>
              {[["Normal", 1], ["Grand", 2], ["Très grand", 3]].map(([l, s]) => (
                <button key={String(s)} onClick={() => applySize(Number(s))}
                  style={{ flex: 1, padding: "8px 4px", borderRadius: "8px", border: `1.5px solid ${fontSize === Number(s) ? "var(--bordeaux)" : "rgba(26,18,16,0.1)"}`, backgroundColor: fontSize === Number(s) ? "var(--bordeaux-light)" : "transparent", color: fontSize === Number(s) ? "var(--bordeaux)" : "var(--texte-discret)", fontSize: `${10 + Number(s) * 2}px`, cursor: "pointer", fontFamily: "DM Sans" }}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* COMPTE */}
        <p style={{ fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--texte-discret)", marginBottom: "10px" }}>Mon compte</p>
        <div style={{ backgroundColor: "var(--fond-blanc)", borderRadius: "12px", padding: "16px", marginBottom: "20px", border: "1px solid rgba(26,18,16,0.08)" }}>
          <p style={{ fontSize: "12px", color: "var(--texte-discret)", marginBottom: "16px" }}>{email}</p>
          {[["Prénom", prenom, setPrenom], ["Entreprise", entreprise, setEntreprise], ["Téléphone", telephone, setTelephone]].map(([l, v, s]) => (
            <input key={String(l)} value={String(v)} onChange={e => (s as (val: string) => void)(e.target.value)} placeholder={String(l)} style={inp}
              onFocus={e => { (e.target as HTMLInputElement).style.borderBottomColor = "var(--bordeaux)"; }}
              onBlur={e => { (e.target as HTMLInputElement).style.borderBottomColor = "rgba(26,18,16,0.12)"; }} />
          ))}
          <select value={localisation} onChange={e => setLocalisation(e.target.value)} style={{ ...inp, appearance: "none" as const, marginTop: "8px" }}>
            <option value="">Localisation</option>
            {LOCALISATIONS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <button onClick={handleSave} disabled={saving}
            style={{ marginTop: "14px", backgroundColor: "var(--bordeaux)", color: "var(--fond-blanc)", borderRadius: "10px", padding: "12px", border: "none", cursor: "pointer", fontSize: "14px", fontFamily: "DM Sans", fontWeight: 500, width: "100%" }}>
            {saved ? "Sauvegardé ✓" : saving ? "···" : "Sauvegarder"}
          </button>
        </div>

        {/* PARRAINAGE */}
        {referralCode && (
          <>
            <p style={{ fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--texte-discret)", marginBottom: "10px" }}>Parrainage</p>
            <div style={{ backgroundColor: "var(--fond-blanc)", borderRadius: "12px", padding: "16px", marginBottom: "20px", border: "1px solid rgba(26,18,16,0.08)" }}>
              <p style={{ fontSize: "14px", color: "var(--texte)", marginBottom: "4px" }}>Ton code : <strong style={{ color: "var(--bordeaux)", fontFamily: "monospace", fontSize: "16px" }}>{referralCode}</strong></p>
              <p style={{ fontSize: "13px", color: "var(--texte-discret)", marginBottom: "12px" }}>
                {referralCount >= 3 ? "3 filleuls actifs — ton mois offert est activé ! 🎉" : `${referralCount} personne${referralCount > 1 ? "s ont" : " a"} utilisé ton code. Il t'en manque ${3 - referralCount} pour ton mois offert.`}
              </p>
              <button onClick={() => navigator.clipboard.writeText(referralCode)}
                style={{ backgroundColor: "transparent", border: "1px solid rgba(92,26,46,0.2)", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", color: "var(--bordeaux)", cursor: "pointer", fontFamily: "DM Sans" }}>
                Copier mon code
              </button>
            </div>
          </>
        )}

        {/* CODE SÉSAME */}
        <p style={{ fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--texte-discret)", marginBottom: "10px" }}>Code Sésame</p>
        <div style={{ backgroundColor: "var(--fond-blanc)", borderRadius: "12px", padding: "16px", marginBottom: "20px", border: "1px solid rgba(26,18,16,0.08)" }}>
          <p style={{ fontSize: "13px", color: "var(--texte-discret)", marginBottom: "12px" }}>Un code reçu de l'équipe Duleme & Cie — prolonge ton accès de 30 jours.</p>
          <div style={{ display: "flex", gap: "8px" }}>
            <input value={sesameCode} onChange={e => setSesameCode(e.target.value.toUpperCase())} placeholder="XXXXXX" maxLength={10}
              style={{ flex: 1, backgroundColor: "transparent", color: "var(--texte)", borderBottom: "1.5px solid var(--texte-discret)", borderTop: "none", borderLeft: "none", borderRight: "none", fontSize: "15px", padding: "8px 4px", fontFamily: "monospace", letterSpacing: "0.15em" }}
              onFocus={e => { (e.target as HTMLInputElement).style.borderBottomColor = "var(--bordeaux)"; }}
              onBlur={e => { (e.target as HTMLInputElement).style.borderBottomColor = "var(--texte-discret)"; }} />
            <button onClick={async () => {
              if (!sesameCode.trim()) return;
              setSesameLoading(true); setSesameResult(null);
              const res = await fetch("/api/sesame", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: sesameCode }) });
              const d = await res.json();
              if (d.success) { setSesameResult(`✓ ${d.newDaysLeft} jours d'accès activés !`); setSesameCode(""); }
              else setSesameResult(d.error || "Code invalide");
              setSesameLoading(false);
            }} disabled={sesameLoading || !sesameCode.trim()}
              style={{ backgroundColor: sesameCode.trim() && !sesameLoading ? "var(--bordeaux)" : "var(--texte-discret)", color: "var(--fond-blanc)", borderRadius: "8px", padding: "8px 16px", border: "none", cursor: "pointer", fontSize: "13px", fontFamily: "DM Sans", fontWeight: 500 }}>
              {sesameLoading ? "···" : "Activer"}
            </button>
          </div>
          {sesameResult && <p style={{ fontSize: "12px", color: sesameResult.startsWith("✓") ? "var(--vert)" : "#B00020", marginTop: "8px" }}>{sesameResult}</p>}
        </div>

        {/* LÉGAL */}
        <div style={{ backgroundColor: "var(--fond-blanc)", borderRadius: "12px", padding: "0 16px", marginBottom: "20px", border: "1px solid rgba(26,18,16,0.08)" }}>
          {[["Politique de confidentialité", "/rgpd"], ["CGU", "/cgu"], ["Mentions légales", "/mentions-legales"]].map(([l, h]) => (
            <a key={l} href={h} style={{ display: "flex", justifyContent: "space-between", padding: "13px 0", borderBottom: "1px solid rgba(26,18,16,0.06)", fontSize: "14px", color: "var(--texte-secondary)", textDecoration: "none" }}>
              {l} <span style={{ color: "var(--texte-discret)" }}>→</span>
            </a>
          ))}
        </div>

        <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}
          style={{ width: "100%", padding: "13px", backgroundColor: "transparent", border: "1px solid rgba(26,18,16,0.1)", borderRadius: "12px", color: "var(--texte-secondary)", fontSize: "14px", fontFamily: "DM Sans", cursor: "pointer", marginBottom: "12px" }}>
          Se déconnecter
        </button>

        {!showDelete ? (
          <button onClick={() => setShowDelete(true)} style={{ width: "100%", padding: "10px", backgroundColor: "transparent", border: "none", color: "var(--texte-discret)", fontSize: "12px", fontFamily: "DM Sans", cursor: "pointer" }}>
            Supprimer mon compte
          </button>
        ) : (
          <div style={{ backgroundColor: "rgba(176,0,32,0.05)", borderRadius: "10px", padding: "14px", textAlign: "center" }}>
            <p style={{ fontSize: "13px", color: "var(--texte-secondary)", marginBottom: "12px" }}>Toutes tes données seront supprimées définitivement.</p>
            <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}
              style={{ backgroundColor: "#B00020", color: "white", borderRadius: "8px", padding: "8px 16px", border: "none", cursor: "pointer", fontSize: "13px", fontFamily: "DM Sans", fontWeight: 500, marginRight: "8px" }}>
              Confirmer
            </button>
            <button onClick={() => setShowDelete(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--texte-discret)", fontSize: "12px" }}>Annuler</button>
          </div>
        )}
      </div>
    </main>
  );
}
