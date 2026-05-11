"use client";

import { useState, useEffect } from "react";
import { Send, X, Check } from "lucide-react";
import { createClient } from "@/app/lib/supabase/client";

interface LePointProps {
  onClose: () => void;
}

export default function LePoint({ onClose }: LePointProps) {
  const [actionsDone, setActionsDone] = useState<string[]>([]);
  const [actionsRemaining, setActionsRemaining] = useState<{ id: string; titre: string; keep: boolean }[]>([]);
  const [summary, setSummary] = useState("");
  const [loadingAI, setLoadingAI] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: done } = await supabase
      .from("user_actions")
      .select("titre")
      .eq("user_id", user.id)
      .eq("done", true)
      .gte("created_at", weekAgo.toISOString());

    const { data: remaining } = await supabase
      .from("user_actions")
      .select("id, titre")
      .eq("user_id", user.id)
      .eq("done", false);

    const doneList = done?.map(a => a.titre) || [];
    setActionsDone(doneList);
    setActionsRemaining((remaining || []).map(a => ({ ...a, keep: true })));

    // Générer le résumé Téfi
    try {
      const res = await fetch("/api/tefi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Génère un résumé sobre de 2-3 phrases pour Le Point hebdomadaire FIRMAMENT.
Accompli cette semaine : ${doneList.join(", ") || "rien de coché cette semaine"}.
Actions restantes : ${remaining?.map(a => a.titre).join(", ") || "aucune"}.
Parle à la deuxième personne, en ami stratège, sans jugement.`,
          }],
        }),
      });
      const data = await res.json();
      setSummary(data.text || "Une semaine de travail. Continue.");
    } catch {
      setSummary("Une semaine de travail. Continue.");
    }
    setLoadingAI(false);
  }

  async function handleSend() {
    setSending(true);
    const kept = actionsRemaining.filter(a => a.keep).map(a => a.titre);
    await fetch("/api/point", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        summary,
        actions_done: actionsDone,
        actions_remaining: kept,
        decisions: [],
      }),
    });
    setSending(false);
    setSent(true);
  }

  return (
    <div style={{
      position: "fixed", inset: 0, backgroundColor: "rgba(26,18,16,0.5)",
      display: "flex", alignItems: "flex-end", zIndex: 100,
    }}>
      <div style={{
        backgroundColor: "var(--fond)", width: "100%", borderRadius: "20px 20px 0 0",
        padding: "24px 20px 40px", maxHeight: "85vh", overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <p style={{ color: "var(--texte-discret)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "DM Sans" }}>
              FIRMAMENT
            </p>
            <h2 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "24px", fontWeight: 300, color: "var(--texte)" }}>
              Le Point
            </h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--texte-discret)" }}>
            <X size={20} />
          </button>
        </div>

        {sent ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "var(--vert)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Check size={22} color="white" />
            </div>
            <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "20px", color: "var(--texte)", marginBottom: "8px" }}>
              Point envoyé.
            </p>
            <p style={{ color: "var(--texte-discret)", fontSize: "14px" }}>
              Vérifie ta boîte mail.
            </p>
            <button onClick={onClose} style={{ marginTop: "24px", backgroundColor: "var(--bordeaux)", color: "var(--fond-blanc)", borderRadius: "12px", padding: "14px 28px", border: "none", cursor: "pointer", fontFamily: "DM Sans", fontSize: "14px", fontWeight: 500 }}>
              Fermer
            </button>
          </div>
        ) : (
          <>
            {/* Résumé Téfi */}
            <div style={{ backgroundColor: "var(--fond-blanc)", borderRadius: "10px", padding: "16px", marginBottom: "16px", borderLeft: "2px solid rgba(92,26,46,0.15)" }}>
              <p style={{ color: "var(--texte-discret)", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "DM Sans", marginBottom: "8px" }}>
                Résumé de Téfi
              </p>
              {loadingAI ? (
                <p style={{ color: "var(--texte-discret)", fontSize: "14px", fontStyle: "italic" }}>Téfi prépare ton résumé···</p>
              ) : (
                <p style={{ color: "var(--texte-secondary)", fontSize: "15px", fontStyle: "italic", fontFamily: "Cormorant Garamond, serif", lineHeight: "1.6" }}>
                  {summary}
                </p>
              )}
            </div>

            {/* Accompli */}
            {actionsDone.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <p style={{ color: "var(--texte-discret)", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "DM Sans", marginBottom: "10px" }}>
                  Accompli cette semaine
                </p>
                {actionsDone.map((a, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderBottom: "1px solid rgba(26,18,16,0.06)" }}>
                    <Check size={13} color="var(--vert)" />
                    <span style={{ fontSize: "14px", color: "var(--texte-secondary)", fontFamily: "DM Sans" }}>{a}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Restant */}
            {actionsRemaining.length > 0 && (
              <div style={{ marginBottom: "24px" }}>
                <p style={{ color: "var(--texte-discret)", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "DM Sans", marginBottom: "10px" }}>
                  Ce qui reste — cocher ce qu{"'"}on garde
                </p>
                {actionsRemaining.map((a) => (
                  <button key={a.id}
                    onClick={() => setActionsRemaining(prev => prev.map(x => x.id === a.id ? { ...x, keep: !x.keep } : x))}
                    style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", background: "none", border: "none", padding: "8px 0", cursor: "pointer", textAlign: "left", borderBottom: "1px solid rgba(26,18,16,0.06)" }}>
                    <div style={{ width: "18px", height: "18px", borderRadius: "4px", border: `1.5px solid ${a.keep ? "var(--bordeaux)" : "var(--texte-discret)"}`, backgroundColor: a.keep ? "var(--bordeaux-light)" : "transparent", flexShrink: 0 }} />
                    <span style={{ fontSize: "14px", color: a.keep ? "var(--texte-secondary)" : "var(--texte-discret)", fontFamily: "DM Sans", textDecoration: a.keep ? "none" : "line-through" }}>{a.titre}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Bouton envoyer */}
            <button onClick={handleSend} disabled={sending || loadingAI}
              style={{ width: "100%", backgroundColor: !sending && !loadingAI ? "var(--bordeaux)" : "var(--texte-discret)", color: "var(--fond-blanc)", borderRadius: "12px", padding: "15px", fontSize: "15px", fontFamily: "DM Sans, sans-serif", fontWeight: 500, border: "none", cursor: !sending && !loadingAI ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <Send size={15} />
              {sending ? "Envoi···" : "Envoyer ce Point par email"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
