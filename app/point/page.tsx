/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Check, Send } from "lucide-react";
import { createClient } from "@/app/lib/supabase/client";
import { generateICS, downloadICS } from "@/app/lib/ics";

interface Task { id: string; title: string; }

export default function PointPage() {
  const [available, setAvailable] = useState(false);
  const [daysUntil, setDaysUntil] = useState(0);
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [summary, setSummary] = useState("");
  const [loadingAI, setLoadingAI] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: p } = await supabase.from("profiles").select("created_at").eq("id", user.id).single();
      if (p) {
        const daysSince = Math.floor((Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24));
        const isAvailable = daysSince >= 7;
        setAvailable(isAvailable);
        setDaysUntil(Math.max(0, 7 - daysSince));

        if (isAvailable) {
          const { data: t } = await supabase.from("tasks").select("id,title").eq("user_id", user.id).eq("status", "active").limit(15);
          if (t) setActiveTasks(t);

          try {
            const res = await fetch("/api/tefi", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                messages: [{ role: "user", content: `Génère un résumé sobre de 2-3 phrases pour un bilan hebdomadaire. Tâches actives : ${t?.map(x => x.title).join(", ") || "aucune"}. Parle à la deuxième personne, en ami stratège, sans jugement.` }],
                userId: user.id,
              }),
            });
            const d = await res.json();
            setSummary(d.text || "Une semaine de travail. Continue.");
          } catch { setSummary("Une semaine de travail. Continue."); }
          setLoadingAI(false);
        }
      }
    })();
  }, [supabase]);

  async function handleSend() {
    setSending(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await fetch("/api/point", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ summary, actions_remaining: activeTasks.map(t => t.title) }),
    });
    await supabase.from("points").insert({ user_id: user.id, summary, top3: activeTasks.slice(0, 3) });
    setSending(false); setSent(true);
  }

  function handleICS() {
    const nextWeek = new Date(); nextWeek.setDate(nextWeek.getDate() + 7); nextWeek.setHours(9, 0, 0, 0);
    const events = activeTasks.slice(0, 5).map((t, i) => ({ title: `FIRMAMENT — ${t.title}`, date: new Date(nextWeek.getTime() + i * 24 * 60 * 60 * 1000) }));
    downloadICS(generateICS(events), `firmament-point-${new Date().toISOString().split("T")[0]}.ics`);
  }

  return (
    <main style={{ backgroundColor: "var(--fond)", minHeight: "100dvh", fontFamily: "DM Sans, sans-serif", paddingBottom: "40px" }}>
      <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid rgba(26,18,16,0.07)", backgroundColor: "var(--fond-blanc)" }}>
        <a href="/home" style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--bordeaux)", textDecoration: "none", fontSize: "14px", fontWeight: 500 }}>
          <ArrowLeft size={18} /> Mon espace
        </a>
      </div>

      <div style={{ padding: "20px", maxWidth: "480px", margin: "0 auto" }}>
        <p style={{ color: "var(--texte-discret)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "6px" }}>FIRMAMENT</p>
        <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "26px", fontWeight: 300, color: "var(--texte)", marginBottom: "20px" }}>Le Point</h1>

        {!available ? (
          <div style={{ textAlign: "center", padding: "32px 16px" }}>
            <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "20px", color: "var(--texte)", marginBottom: "10px" }}>Pas encore disponible.</p>
            <p style={{ color: "var(--texte-discret)", fontSize: "14px" }}>Le Point sera disponible dans {daysUntil} jour{daysUntil > 1 ? "s" : ""} — ça fait {7 - daysUntil} jour{7 - daysUntil > 1 ? "s" : ""} qu'on travaille ensemble.</p>
          </div>
        ) : sent ? (
          <div style={{ textAlign: "center", padding: "32px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "var(--vert)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Check size={22} color="white" />
            </div>
            <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "22px", color: "var(--texte)", marginBottom: "8px" }}>Point envoyé.</p>
            <p style={{ color: "var(--texte-discret)", fontSize: "14px" }}>Vérifie ta boîte mail.</p>
          </div>
        ) : (
          <>
            {/* Résumé Téfi */}
            <div style={{ backgroundColor: "var(--fond-blanc)", borderRadius: "10px", padding: "16px", marginBottom: "16px", borderLeft: "2px solid rgba(92,26,46,0.15)" }}>
              <p style={{ color: "var(--texte-discret)", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "8px" }}>Résumé de Téfi</p>
              {loadingAI ? <p style={{ color: "var(--texte-discret)", fontSize: "14px", fontStyle: "italic" }}>Téfi prépare ton résumé···</p> : (
                <p style={{ color: "var(--texte-secondary)", fontSize: "15px", fontStyle: "italic", fontFamily: "Cormorant Garamond, serif", lineHeight: "1.6" }}>{summary}</p>
              )}
            </div>

            {/* Tâches actives */}
            {activeTasks.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <p style={{ color: "var(--texte-discret)", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "10px" }}>Tâches en cours</p>
                {activeTasks.slice(0, 8).map(t => (
                  <div key={t.id} style={{ display: "flex", gap: "10px", padding: "8px 0", borderBottom: "1px solid rgba(26,18,16,0.06)" }}>
                    <span style={{ color: "var(--texte-discret)", flexShrink: 0 }}>○</span>
                    <span style={{ fontSize: "14px", color: "var(--texte-secondary)" }}>{t.title}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Boutons */}
            <button onClick={handleSend} disabled={sending || loadingAI}
              style={{ width: "100%", backgroundColor: !sending && !loadingAI ? "var(--bordeaux)" : "var(--texte-discret)", color: "var(--fond-blanc)", borderRadius: "12px", padding: "15px", fontSize: "15px", fontFamily: "DM Sans", fontWeight: 500, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "10px" }}>
              <Send size={15} /> {sending ? "Envoi···" : "Envoyer ce Point par email"}
            </button>
            <button onClick={handleICS}
              style={{ width: "100%", backgroundColor: "transparent", border: "1px solid rgba(26,18,16,0.12)", borderRadius: "12px", padding: "13px", fontSize: "14px", fontFamily: "DM Sans", cursor: "pointer", color: "var(--texte-secondary)" }}>
              📅 Exporter vers mon agenda (.ics)
            </button>
          </>
        )}
      </div>
    </main>
  );
}
