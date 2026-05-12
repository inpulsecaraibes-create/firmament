/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/app/lib/supabase/client";

function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

const LOCALISATIONS = ["Martinique", "Guadeloupe", "Réunion", "Guyane", "Mayotte", "France métropolitaine", "Autre"];

export default function RegisterPage() {
  const [form, setForm] = useState({ prenom: "", email: "", password: "", telephone: "", localisation: "", entreprise: "", parrain: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  function set(key: string, val: string) { setForm(f => ({ ...f, [key]: val })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 8) { setError("Le mot de passe doit faire au moins 8 caractères."); return; }
    setLoading(true); setError("");
    try {
      // Créer le compte
      const { data, error: signUpErr } = await supabase.auth.signUp({ email: form.email.trim().toLowerCase(), password: form.password });
      if (signUpErr) {
        if (signUpErr.message.toLowerCase().includes("already")) {
          setError("__exists__");
        } else {
          setError("Une erreur est survenue. Réessaie.");
        }
        setLoading(false); return;
      }
      if (!data.user) { setError("Inscription échouée."); setLoading(false); return; }

      // Générer code referral unique
      let referralCode = generateReferralCode();
      const { data: existing } = await supabase.from("profiles").select("id").eq("referral_code", referralCode).single();
      if (existing) referralCode = generateReferralCode() + Math.random().toString(36).slice(2, 4).toUpperCase();

      // Sauvegarder le profil
      await supabase.from("profiles").upsert({
        id: data.user.id,
        email: form.email.trim().toLowerCase(),
        prenom: form.prenom.trim(),
        telephone: form.telephone.trim(),
        localisation: form.localisation,
        entreprise: form.entreprise.trim(),
        referral_code: referralCode,
        trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      // Bug A fix : migration via API (service role bypass RLS timing issue)
      const uid = data.user?.id;
      if (uid) {
        const pending = JSON.parse(localStorage.getItem("firmament_pending_tasks") || "[]");
        if (pending.length > 0) {
          try {
            const res = await fetch("/api/migrate-tasks", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: uid, pendingTasks: pending }),
            });
            if (res.ok) localStorage.removeItem("firmament_pending_tasks");
          } catch (e) { console.error("Migration failed:", e); }
        }
      }

      // Parrainage
      if (form.parrain.trim()) {
        const { data: parrain } = await supabase.from("profiles").select("id").eq("referral_code", form.parrain.trim().toUpperCase()).single();
        if (parrain) {
          await supabase.from("referrals").insert({ parrain_id: parrain.id, filleul_id: data.user.id });
        }
      }

      window.location.href = "/auth/onboarding";
    } catch { setError("Une erreur inattendue est survenue."); setLoading(false); }
  }

  const inp: React.CSSProperties = { width: "100%", backgroundColor: "transparent", color: "var(--texte)", borderBottom: "1.5px solid var(--texte-discret)", borderTop: "none", borderLeft: "none", borderRight: "none", fontSize: "15px", padding: "10px 4px", fontFamily: "DM Sans", marginBottom: "16px" };
  const focus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => { (e.target as HTMLElement).style.setProperty("border-bottom-color", "var(--bordeaux)"); };
  const blur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => { (e.target as HTMLElement).style.setProperty("border-bottom-color", "var(--texte-discret)"); };

  return (
    <main style={{ backgroundColor: "var(--fond)", minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <p style={{ color: "var(--texte-discret)", fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "6px" }}>Duleme & Cie</p>
          <h1 style={{ fontFamily: "Cormorant Garamond, serif", color: "var(--bordeaux)", fontSize: "32px", fontWeight: 300 }}>FIRMAMENT</h1>
          <h2 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "22px", fontWeight: 300, color: "var(--texte)", marginTop: "8px" }}>Crée ton espace</h2>
          <p style={{ color: "var(--texte-discret)", fontSize: "13px", marginTop: "6px" }}>Tes pensées, ta structure. Sécurisé.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <input value={form.prenom} onChange={e => set("prenom", e.target.value)} placeholder="Prénom *" required style={inp} onFocus={focus} onBlur={blur} />
          <input value={form.entreprise} onChange={e => set("entreprise", e.target.value)} placeholder="Entreprise *" required style={inp} onFocus={focus} onBlur={blur} />
          <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="Email *" required style={inp} onFocus={focus} onBlur={blur} />
          <div style={{ position: "relative" }}>
            <input type={showPwd ? "text" : "password"} value={form.password} onChange={e => set("password", e.target.value)} placeholder="Mot de passe (min. 8 car.) *" required style={{ ...inp, paddingRight: "40px" }} onFocus={focus} onBlur={blur} />
            <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: "absolute", right: "4px", top: "10px", background: "none", border: "none", cursor: "pointer", color: "var(--texte-discret)" }}>
              {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <input value={form.telephone} onChange={e => set("telephone", e.target.value)} placeholder="Téléphone" style={inp} onFocus={focus} onBlur={blur} />
          <select value={form.localisation} onChange={e => set("localisation", e.target.value)} style={{ ...inp, appearance: "none" as const }} onFocus={focus} onBlur={blur}>
            <option value="">Localisation</option>
            {LOCALISATIONS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <input value={form.parrain} onChange={e => set("parrain", e.target.value)} placeholder="Code d'un ami (optionnel)" style={{ ...inp, fontSize: "13px", color: "var(--texte-discret)" }} onFocus={focus} onBlur={blur} />

          {error === "__exists__" ? (
            <div style={{ backgroundColor: "var(--fond-or)", borderRadius: "10px", padding: "12px 16px", marginBottom: "12px", textAlign: "center" }}>
              <p style={{ fontSize: "13px", color: "var(--texte-secondary)", marginBottom: "8px" }}>Cet email a déjà un espace.</p>
              <a href="/auth/login" style={{ color: "var(--bordeaux)", fontSize: "13px", fontWeight: 500 }}>On se connaît déjà →</a>
            </div>
          ) : error ? (
            <p style={{ color: "#B00020", fontSize: "13px", marginBottom: "12px", textAlign: "center" }}>{error}</p>
          ) : null}

          <button type="submit" disabled={loading || !form.prenom || !form.email || !form.password || !form.entreprise}
            style={{ backgroundColor: !loading && form.prenom && form.email && form.password && form.entreprise ? "var(--bordeaux)" : "var(--texte-discret)", color: "var(--fond-blanc)", borderRadius: "12px", padding: "15px", fontSize: "15px", fontFamily: "DM Sans", fontWeight: 500, border: "none", width: "100%", cursor: "pointer", marginBottom: "16px" }}>
            {loading ? "Création···" : "Créer mon espace →"}
          </button>

          <p style={{ textAlign: "center", fontSize: "13px", color: "var(--texte-discret)" }}>
            Déjà un espace ?{" "}
            <a href="/auth/login" style={{ color: "var(--bordeaux)", textDecoration: "none", fontWeight: 500 }}>On se connaît déjà →</a>
          </p>
        </form>
      </div>
    </main>
  );
}
