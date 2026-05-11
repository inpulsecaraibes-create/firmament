/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Moon, Sun, Zap, Trash2 } from "lucide-react";
import { createClient } from "@/app/lib/supabase/client";
import { getTheme, setTheme } from "@/app/lib/theme";

export default function Parametres() {
  const [darkMode, setDarkMode] = useState(false);
  const [cosmicOn, setCosmicOn] = useState(true);
  const [notifOn, setNotifOn] = useState(true);
  const [sousMarinOn, setSousMarinOn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    setDarkMode(getTheme() === "dark");
    setCosmicOn(localStorage.getItem("firmament_cosmic") !== "off");
    setNotifOn(localStorage.getItem("firmament_notif") !== "off");
    setSousMarinOn(localStorage.getItem("firmament_sousmarin") === "on");

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { window.location.href = "/"; return; }
      setUserEmail(user.email || "");
      const { data: profile } = await supabase
        .from("profiles")
        .select("date_fin_periode_complete")
        .eq("id", user.id)
        .single();
      if (profile?.date_fin_periode_complete) {
        const days = Math.ceil((new Date(profile.date_fin_periode_complete).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        setDaysLeft(days);
      }
    });
  }, []);

  function toggleDark(val: boolean) {
    setDarkMode(val);
    setTheme(val ? "dark" : "light");
  }

  function toggleCosmic(val: boolean) {
    setCosmicOn(val);
    localStorage.setItem("firmament_cosmic", val ? "on" : "off");
  }

  function toggleNotif(val: boolean) {
    setNotifOn(val);
    localStorage.setItem("firmament_notif", val ? "on" : "off");
  }

  function toggleSousMarin(val: boolean) {
    setSousMarinOn(val);
    localStorage.setItem("firmament_sousmarin", val ? "on" : "off");
    if (val) {
      setNotifOn(false);
      localStorage.setItem("firmament_notif", "off");
    }
  }

  async function handleDelete() {
    setDeleting(true);
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const Toggle = ({ value, onChange, disabled }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) => (
    <button
      onClick={() => !disabled && onChange(!value)}
      style={{
        width: "44px", height: "26px", borderRadius: "13px",
        backgroundColor: value && !disabled ? "var(--bordeaux)" : "rgba(26,18,16,0.15)",
        position: "relative", border: "none", cursor: disabled ? "not-allowed" : "pointer",
        transition: "background-color 0.2s", flexShrink: 0, opacity: disabled ? 0.4 : 1,
      }}
    >
      <div style={{
        width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "white",
        position: "absolute", top: "3px",
        left: value && !disabled ? "21px" : "3px",
        transition: "left 0.2s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </button>
  );

  const Row = ({ icon, label, desc, value, onChange, disabled }: { icon: React.ReactNode; label: string; desc?: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) => (
    <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "16px 0", borderBottom: "1px solid rgba(26,18,16,0.07)" }}>
      <div style={{ color: "var(--texte-discret)", flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--texte)" }}>{label}</p>
        {desc && <p style={{ fontSize: "12px", color: "var(--texte-discret)", marginTop: "2px" }}>{desc}</p>}
      </div>
      <Toggle value={value} onChange={onChange} disabled={disabled} />
    </div>
  );

  return (
    <main style={{ backgroundColor: "var(--fond)", minHeight: "100dvh", fontFamily: "DM Sans, sans-serif" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "0 0 80px" }}>

        {/* Header */}
        <div style={{ padding: "20px 20px 0", display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
          <button onClick={() => window.history.back()} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--bordeaux)", padding: "4px" }}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "24px", fontWeight: 300, color: "var(--texte)" }}>
            Paramètres
          </h1>
        </div>

        <div style={{ padding: "0 20px" }}>

          {/* Compte */}
          <p style={{ fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--texte-discret)", marginBottom: "8px" }}>Mon espace</p>
          <div style={{ backgroundColor: "var(--fond-blanc)", borderRadius: "12px", padding: "16px", marginBottom: "20px", border: "1px solid rgba(26,18,16,0.08)" }}>
            <p style={{ fontSize: "13px", color: "var(--texte-discret)", marginBottom: "4px" }}>Connecté en tant que</p>
            <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--texte)" }}>{userEmail}</p>
            {daysLeft !== null && (
              <div style={{ marginTop: "12px", backgroundColor: daysLeft <= 5 ? "rgba(92,26,46,0.08)" : "var(--fond-or)", borderRadius: "8px", padding: "10px 12px" }}>
                <p style={{ fontSize: "13px", color: daysLeft <= 5 ? "var(--bordeaux)" : "var(--or)", fontWeight: 500 }}>
                  {daysLeft > 0 ? `${daysLeft} jours d'accès complet restants` : "Accès complet expiré"}
                </p>
                {daysLeft <= 7 && daysLeft > 0 && (
                  <p style={{ fontSize: "12px", color: "var(--texte-discret)", marginTop: "4px" }}>
                    Téfi sera là pour toi après. Il y a plus, quand tu veux.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Apparence */}
          <p style={{ fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--texte-discret)", marginBottom: "8px" }}>Apparence</p>
          <div style={{ backgroundColor: "var(--fond-blanc)", borderRadius: "12px", padding: "0 16px", marginBottom: "20px", border: "1px solid rgba(26,18,16,0.08)" }}>
            <Row icon={darkMode ? <Moon size={16} /> : <Sun size={16} />} label="Mode sombre" desc="Fond noir chaud, texte clair" value={darkMode} onChange={toggleDark} />
            <Row icon={<span style={{ fontSize: "12px" }}>🌗</span>} label="Ligne cosmique" desc="Phase lunaire et numérologie en bas d'écran" value={cosmicOn} onChange={toggleCosmic} />
          </div>

          {/* Notifications */}
          <p style={{ fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--texte-discret)", marginBottom: "8px" }}>Notifications</p>
          <div style={{ backgroundColor: "var(--fond-blanc)", borderRadius: "12px", padding: "0 16px", marginBottom: "20px", border: "1px solid rgba(26,18,16,0.08)" }}>
            <Row icon={<Zap size={16} />} label="Notifications Téfi" desc="Rappels et messages de Téfi" value={notifOn && !sousMarinOn} onChange={toggleNotif} disabled={sousMarinOn} />
            <Row
              icon={<span style={{ fontSize: "14px" }}>🤿</span>}
              label="Mode sous-marin"
              desc="Bloque toutes les notifications sans exception"
              value={sousMarinOn}
              onChange={toggleSousMarin}
            />
          </div>

          {/* Confidentialité */}
          <p style={{ fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--texte-discret)", marginBottom: "8px" }}>Confidentialité</p>
          <div style={{ backgroundColor: "var(--fond-blanc)", borderRadius: "12px", padding: "0 16px", marginBottom: "20px", border: "1px solid rgba(26,18,16,0.08)" }}>
            <div style={{ padding: "16px 0", borderBottom: "1px solid rgba(26,18,16,0.07)" }}>
              <a href="/rgpd" style={{ fontSize: "14px", color: "var(--texte-secondary)", textDecoration: "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                Politique de confidentialité <span style={{ color: "var(--texte-discret)" }}>→</span>
              </a>
            </div>
            <div style={{ padding: "16px 0" }}>
              <a href="/cgu" style={{ fontSize: "14px", color: "var(--texte-secondary)", textDecoration: "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                Conditions générales d'utilisation <span style={{ color: "var(--texte-discret)" }}>→</span>
              </a>
            </div>
          </div>

          {/* Déconnexion */}
          <button
            onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}
            style={{ width: "100%", padding: "14px", backgroundColor: "transparent", border: "1px solid rgba(26,18,16,0.1)", borderRadius: "12px", color: "var(--texte-secondary)", fontSize: "14px", fontFamily: "DM Sans", cursor: "pointer", marginBottom: "12px" }}
          >
            Se déconnecter
          </button>

          {/* Supprimer compte */}
          {!showDeleteConfirm ? (
            <button onClick={() => setShowDeleteConfirm(true)}
              style={{ width: "100%", padding: "14px", backgroundColor: "transparent", border: "none", color: "var(--texte-discret)", fontSize: "13px", fontFamily: "DM Sans", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              <Trash2 size={13} /> Supprimer mon compte
            </button>
          ) : (
            <div style={{ backgroundColor: "rgba(176,0,32,0.06)", borderRadius: "12px", padding: "16px", textAlign: "center" }}>
              <p style={{ fontSize: "14px", color: "var(--texte-secondary)", marginBottom: "12px", lineHeight: "1.5" }}>
                Toutes tes données seront supprimées définitivement. Cette action est irréversible.
              </p>
              <button onClick={handleDelete} disabled={deleting}
                style={{ backgroundColor: "#B00020", color: "white", borderRadius: "10px", padding: "10px 20px", border: "none", cursor: "pointer", fontSize: "13px", fontFamily: "DM Sans", fontWeight: 500, marginRight: "10px" }}>
                {deleting ? "Suppression···" : "Confirmer la suppression"}
              </button>
              <button onClick={() => setShowDeleteConfirm(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--texte-discret)", fontSize: "13px" }}>
                Annuler
              </button>
            </div>
          )}

          <p style={{ fontSize: "11px", color: "var(--texte-discret)", textAlign: "center", marginTop: "24px", fontStyle: "italic" }}>
            FIRMAMENT · Powered by Duleme & Cie
          </p>
        </div>
      </div>
    </main>
  );
}
