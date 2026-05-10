"use client";

import { useState, useEffect } from "react";
import { Brain, Users, AlertCircle, Check } from "lucide-react";
import ObjectifAimant from "./ObjectifAimant";
import Thematiques, { Thematique } from "./Thematiques";
import { createClient } from "@/app/lib/supabase/client";
import { getCosmicLine } from "@/app/lib/cosmic";

interface AccueilConnecteProps {
  userName: string;
  onDump: () => void;
  onRelais: () => void;
  onSetObjectif: () => void;
}

interface TopAction {
  id: string;
  titre: string;
  urgent: boolean;
  done: boolean;
  theme?: string;
}

const cosmicLine = getCosmicLine();

export default function AccueilConnecte({ userName, onDump, onRelais, onSetObjectif }: AccueilConnecteProps) {
  const [objectif, setObjectif] = useState<{ phrase: string; progress: number } | null>(null);
  const [top3, setTop3] = useState<TopAction[]>([]);
  const [thematiques, setThematiques] = useState<Thematique[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Charger l'objectif actif
    const { data: obj } = await supabase
      .from("objectifs")
      .select("*")
      .eq("user_id", user.id)
      .eq("active", true)
      .single();
    if (obj) setObjectif({ phrase: obj.phrase, progress: obj.progress });

    // Charger les actions top 3 (urgentes ou les plus prioritaires)
    const { data: actions } = await supabase
      .from("user_actions")
      .select("*, thematiques(titre)")
      .eq("user_id", user.id)
      .eq("done", false)
      .order("urgent", { ascending: false })
      .order("priority_order", { ascending: true })
      .limit(3);

    if (actions) {
      setTop3(actions.map(a => ({
        id: a.id,
        titre: a.titre,
        urgent: a.urgent,
        done: a.done,
        theme: a.thematiques?.titre,
      })));
    }

    // Charger toutes les thématiques avec leurs actions
    const { data: themes } = await supabase
      .from("thematiques")
      .select("*, user_actions(*)")
      .eq("user_id", user.id)
      .order("ordre");

    if (themes) {
      setThematiques(themes.map(t => ({
        id: t.id,
        titre: t.titre,
        emoji: t.emoji,
        actions: (t.user_actions || []).sort((a: { priority_order: number }, b: { priority_order: number }) => a.priority_order - b.priority_order),
      })));
    }

    setLoading(false);
  }

  async function toggleAction(actionId: string, done: boolean) {
    await supabase.from("user_actions").update({ done }).eq("id", actionId);
    setTop3(prev => prev.map(a => a.id === actionId ? { ...a, done } : a));
    setThematiques(prev => prev.map(t => ({
      ...t,
      actions: t.actions.map(a => a.id === actionId ? { ...a, done } : a),
    })));
  }

  async function toggleUrgent(actionId: string, urgent: boolean) {
    await supabase.from("user_actions").update({ urgent }).eq("id", actionId);
    setTop3(prev => prev.map(a => a.id === actionId ? { ...a, urgent } : a));
    setThematiques(prev => prev.map(t => ({
      ...t,
      actions: t.actions.map(a => a.id === actionId ? { ...a, urgent } : a),
    })));
  }

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? "Bonjour" : greetingHour < 18 ? "Bonjour" : "Bonsoir";

  return (
    <main style={{ backgroundColor: "var(--fond)", minHeight: "100dvh", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <div style={{ padding: "20px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ color: "var(--texte-discret)", fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "DM Sans" }}>
            FIRMAMENT
          </p>
          <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "22px", fontWeight: 300, color: "var(--texte)", marginTop: "2px" }}>
            {greeting}{userName ? `, ${userName}` : ""}
          </p>
        </div>
        <a href="/parametres" style={{ color: "var(--texte-discret)", fontSize: "12px", fontFamily: "DM Sans", textDecoration: "none" }}>
          ···
        </a>
      </div>

      {/* Contenu scrollable */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 100px" }}>

        {/* Objectif Aimant */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
          <ObjectifAimant
            phrase={objectif?.phrase}
            progress={objectif?.progress || 0}
            onSetObjectif={onSetObjectif}
          />
        </div>

        {/* Top 3 actions */}
        {(top3.length > 0 || !loading) && (
          <div style={{ marginBottom: "24px" }}>
            <p style={{ color: "var(--texte-discret)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "DM Sans", marginBottom: "12px" }}>
              Tes 3 actions du moment
            </p>

            {top3.length === 0 ? (
              <p style={{ color: "var(--texte-discret)", fontSize: "14px", fontStyle: "italic", fontFamily: "Cormorant Garamond, serif", padding: "8px 0" }}>
                Fais un Dump — Téfi identifiera tes priorités.
              </p>
            ) : (
              <div style={{ backgroundColor: "var(--fond-blanc)", borderRadius: "12px", padding: "4px 0", border: "1px solid rgba(26,18,16,0.07)" }}>
                {top3.map((action, i) => (
                  <div key={action.id} style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    padding: "12px 16px",
                    borderBottom: i < top3.length - 1 ? "1px solid rgba(26,18,16,0.06)" : "none",
                  }}>
                    <button
                      onClick={() => toggleAction(action.id, !action.done)}
                      style={{
                        width: "22px", height: "22px", borderRadius: "6px",
                        border: `1.5px solid ${action.done ? "var(--vert)" : "rgba(92,26,46,0.2)"}`,
                        backgroundColor: action.done ? "var(--vert)" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0, cursor: "pointer", transition: "all 0.15s",
                      }}
                    >
                      {action.done && <Check size={12} color="white" strokeWidth={3} />}
                    </button>
                    <div style={{ flex: 1 }}>
                      <p style={{
                        fontSize: "14px", fontFamily: "DM Sans, sans-serif", lineHeight: "1.4",
                        color: action.done ? "var(--texte-discret)" : "var(--texte-secondary)",
                        textDecoration: action.done ? "line-through" : "none",
                      }}>
                        {action.titre}
                      </p>
                      {action.theme && (
                        <p style={{ fontSize: "11px", color: "var(--texte-discret)", marginTop: "2px" }}>
                          {action.theme}
                        </p>
                      )}
                    </div>
                    {action.urgent && !action.done && (
                      <button onClick={() => toggleUrgent(action.id, false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                        <AlertCircle size={15} color="var(--bordeaux)" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Séparateur */}
        <div style={{ height: "1px", backgroundColor: "rgba(26,18,16,0.07)", margin: "4px 0 20px" }} />

        {/* Thématiques */}
        <div style={{ marginBottom: "16px" }}>
          <p style={{ color: "var(--texte-discret)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "DM Sans", marginBottom: "12px" }}>
            Tes thématiques
          </p>
          <Thematiques
            thematiques={thematiques}
            onToggleAction={toggleAction}
            onToggleUrgent={toggleUrgent}
          />
        </div>
      </div>

      {/* Barre du bas — Le Dump + Le Relais */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        backgroundColor: "var(--fond-blanc)",
        borderTop: "1px solid rgba(26,18,16,0.08)",
        padding: "12px 20px 28px",
        display: "flex", gap: "12px",
      }}>
        <button
          onClick={onDump}
          style={{
            flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            backgroundColor: "var(--bordeaux)", color: "var(--fond-blanc)",
            borderRadius: "12px", padding: "14px 20px", border: "none", cursor: "pointer",
            fontSize: "14px", fontFamily: "DM Sans, sans-serif", fontWeight: 500,
          }}
        >
          <Brain size={16} />
          Le Dump
        </button>
        <button
          onClick={onRelais}
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            backgroundColor: "transparent", color: "var(--texte-secondary)",
            borderRadius: "12px", padding: "14px 16px",
            border: "1.5px solid rgba(26,18,16,0.1)", cursor: "pointer",
            fontSize: "14px", fontFamily: "DM Sans, sans-serif", fontWeight: 500,
          }}
        >
          <Users size={16} />
          Le Relais
        </button>
      </div>

      {/* Ligne cosmique */}
      <p style={{
        position: "fixed", bottom: "4px", left: 0, right: 0,
        textAlign: "center", color: "var(--texte-discret)",
        fontSize: "10px", fontStyle: "italic", fontFamily: "DM Sans",
        pointerEvents: "none",
      }}>
        {cosmicLine}
      </p>
    </main>
  );
}
