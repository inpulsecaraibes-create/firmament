"use client";

import { useState, useEffect } from "react";
import { Brain, Users, BarChart2, Clock } from "lucide-react";
import TextSize from "./TextSize";
import ObjectifAimant from "./ObjectifAimant";
import Thematiques, { Thematique } from "./Thematiques";
import LePoint from "./LePoint";
import LeRelais from "./LeRelais";
import SwipeableAction, { ActionData } from "./SwipeableAction";
import BottomNav from "./BottomNav";
import { createClient } from "@/app/lib/supabase/client";
import { getCosmicLine } from "@/app/lib/cosmic";

interface AccueilConnecteProps {
  userName: string;
  emailVerified?: boolean;
  onDump: () => void;
  onSetObjectif: () => void;
}

type TopAction = ActionData & { theme?: string };

const cosmicLine = getCosmicLine();

export default function AccueilConnecte({ userName, emailVerified = true, onDump, onSetObjectif }: AccueilConnecteProps) {
  const [objectif, setObjectif] = useState<{ phrase: string; progress: number } | null>(null);
  const [top3, setTop3] = useState<TopAction[]>([]);
  const [thematiques, setThematiques] = useState<Thematique[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPoint, setShowPoint] = useState(false);
  const [showRelais, setShowRelais] = useState(false);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const supabase = createClient();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Jours restants d'accès gratuit
    const { data: prof } = await supabase.from("profiles").select("trial_ends_at").eq("id", user.id).single();
    if (prof?.trial_ends_at) {
      const days = Math.ceil((new Date(prof.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      setDaysLeft(days);
    }

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
        urgent: a.urgent || false,
        done: a.done || false,
        is_priority: a.is_priority || false,
        is_sleeping: a.is_sleeping || false,
        deadline: a.deadline || null,
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
      {showPoint && <LePoint onClose={() => setShowPoint(false)} />}
      {showRelais && <LeRelais onClose={() => setShowRelais(false)} />}

      {/* Bug E — bannière email non validé */}
      {!emailVerified && (
        <div style={{ backgroundColor: "var(--fond-or)", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
          <p style={{ fontSize: "12px", color: "var(--texte-secondary)", flex: 1 }}>
            📧 Vérifie ta boîte mail pour activer ton compte.
          </p>
          <button
            onClick={async () => {
              const supabase = createClient();
              const { data: { user } } = await supabase.auth.getUser();
              if (user?.email) {
                await supabase.auth.resend({ type: "signup", email: user.email });
                alert("Email renvoyé !");
              }
            }}
            style={{ background: "none", border: "1px solid var(--or)", borderRadius: "6px", padding: "4px 10px", fontSize: "11px", cursor: "pointer", color: "var(--or)", fontFamily: "DM Sans", fontWeight: 500, flexShrink: 0 }}>
            Renvoyer
          </button>
        </div>
      )}

      <div style={{ padding: "20px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ color: "var(--texte-discret)", fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "DM Sans" }}>
            FIRMAMENT
          </p>
          <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "22px", fontWeight: 300, color: "var(--texte)", marginTop: "2px" }}>
            {greeting}{userName ? `, ${userName}` : ""}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <TextSize />
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <a href="/decisions" style={{ color: "var(--texte-discret)", fontSize: "11px", fontFamily: "DM Sans", textDecoration: "none", display: "flex", alignItems: "center", gap: "3px" }}>
              <span>⚖</span> Décisions
            </a>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {daysLeft !== null && daysLeft <= 10 && daysLeft > 0 && (
                <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: daysLeft <= 5 ? "var(--bordeaux)" : "var(--or)", fontFamily: "DM Sans" }}>
                  <Clock size={11} /> {daysLeft}j
                </span>
              )}
              <button onClick={() => setShowPoint(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--texte-discret)", display: "flex", alignItems: "center", gap: "4px" }}>
                <BarChart2 size={14} />
                <span style={{ fontSize: "11px", fontFamily: "DM Sans" }}>Le Point</span>
              </button>
            </div>
            <a href="/parametres" style={{ color: "var(--texte-discret)", fontSize: "11px", fontFamily: "DM Sans", textDecoration: "none" }}>
              ⚙
            </a>
          </div>
        </div>
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
              <div style={{ backgroundColor: "var(--fond-blanc)", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(26,18,16,0.07)", position: "relative" }}>
                <p style={{ fontSize: "10px", color: "var(--texte-discret)", padding: "8px 16px 0", fontStyle: "italic" }}>
                  ← glisse pour modifier · glisse → pour les options
                </p>
                {top3.map((action, i) => (
                  <div key={action.id} style={{ borderBottom: i < top3.length - 1 ? "1px solid rgba(26,18,16,0.06)" : "none", position: "relative", overflow: "hidden" }}>
                    <SwipeableAction
                      action={action}
                      showIndex={i}
                      onDone={toggleAction}
                      onUpdate={(id, updates) => {
                        setTop3(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
                        supabase.from("user_actions").update(updates).eq("id", id);
                      }}
                      onTefiRebound={() => {
                        onDump();
                      }}
                    />
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

          {/* Téfi disponible */}
          <button
            onClick={onDump}
            style={{
              display: "block", width: "100%", background: "none", border: "none",
              cursor: "pointer", padding: "16px 0",
              color: "var(--texte-discret)", fontSize: "13px",
              fontFamily: "Cormorant Garamond, serif", fontStyle: "italic",
              textAlign: "center",
            }}
          >
            Téfi est disponible si tu veux parler.
          </button>
        </div>
      </div>

      {/* Barre du bas fixe */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        backgroundColor: "var(--fond-blanc)",
        borderTop: "1px solid rgba(26,18,16,0.08)",
        padding: "8px 16px 20px",
        display: "flex", gap: "10px",
        paddingBottom: "calc(8px + env(safe-area-inset-bottom, 8px))",
      }}>
        <button onClick={onDump} style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", backgroundColor: "var(--bordeaux)", color: "var(--fond-blanc)", borderRadius: "12px", padding: "13px 20px", border: "none", cursor: "pointer", fontSize: "14px", fontFamily: "DM Sans", fontWeight: 500 }}>
          <Brain size={16} /> Le Dump
        </button>
        <button onClick={() => setShowRelais(true)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", backgroundColor: "transparent", color: "var(--texte-secondary)", borderRadius: "12px", padding: "13px 12px", border: "1.5px solid rgba(26,18,16,0.1)", cursor: "pointer", fontSize: "14px", fontFamily: "DM Sans", fontWeight: 500 }}>
          <Users size={16} /> Le Relais
        </button>
        <a href="/parametres" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "44px", height: "44px", borderRadius: "12px", border: "1.5px solid rgba(26,18,16,0.1)", color: "var(--texte-discret)", textDecoration: "none", fontSize: "18px", flexShrink: 0 }}>
          ⚙
        </a>
      </div>

      {/* Ligne cosmique au-dessus de la nav */}
      <p style={{
        position: "fixed", bottom: "56px", left: 0, right: 0,
        textAlign: "center", color: "var(--texte-discret)",
        fontSize: "10px", fontStyle: "italic", fontFamily: "DM Sans",
        pointerEvents: "none",
      }}>
        {cosmicLine}
      </p>

      <BottomNav active="home" onHome={() => {}} onDump={onDump} />
    </main>
  );
}
