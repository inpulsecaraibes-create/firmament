"use client";

import { useState } from "react";
import { Check, Circle } from "lucide-react";

interface ActionListProps {
  actions: string[];
  initialChecked?: boolean[];
  isLoggedIn?: boolean;
  onActionClick?: (title: string) => void;
  onRegister?: () => void;
}

export default function ActionList({ actions, initialChecked, isLoggedIn = true, onActionClick, onRegister }: ActionListProps) {
  const [checked] = useState<boolean[]>(
    initialChecked || actions.map(() => false)
  );
  const [exploring, setExploring] = useState<boolean[]>(actions.map(() => false));
  const [bubbleIndex, setBubbleIndex] = useState<number | null>(null);

  function toggle(i: number) {
    if (!isLoggedIn) {
      setBubbleIndex(bubbleIndex === i ? null : i);
      return;
    }
    // Connecté : état "en exploration", Téfi rebondit
    const nextExploring = [...exploring];
    nextExploring[i] = !nextExploring[i];
    setExploring(nextExploring);
    if (nextExploring[i] && onActionClick) {
      onActionClick(actions[i]);
    }
  }

  const doneCount = checked.filter(Boolean).length;

  return (
    <div style={{ marginBottom: "4px" }}>
      {doneCount > 0 && (
        <p style={{ fontSize: "11px", color: "var(--vert)", fontFamily: "DM Sans, sans-serif", marginBottom: "8px", fontWeight: 500 }}>
          {doneCount}/{actions.length} fait{doneCount > 1 ? "es" : ""}
        </p>
      )}

      {actions.map((action, i) => (
        <div key={i} style={{ position: "relative" }}>
          {/* Bulle non connecté */}
          {bubbleIndex === i && !isLoggedIn && (
            <div style={{
              position: "absolute", bottom: "100%", left: 0, right: 0,
              backgroundColor: "var(--fond-blanc)", border: "1px solid rgba(92,26,46,0.15)",
              borderRadius: "10px", padding: "12px 14px", marginBottom: "6px", zIndex: 10,
              boxShadow: "0 4px 16px rgba(26,18,16,0.08)",
            }}>
              {/* Bug F — ton de Téfi, pas un message système */}
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "10px" }}>
                <div style={{ width: "22px", height: "22px", borderRadius: "50%", backgroundColor: "var(--bordeaux)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontFamily: "Cormorant Garamond, serif", color: "var(--fond-blanc)", fontSize: "12px", fontStyle: "italic" }}>t</span>
                </div>
                <p style={{ fontSize: "13px", color: "var(--texte-secondary)", fontFamily: "DM Sans", lineHeight: "1.55", fontStyle: "italic" }}>
                  {`Je vois que ça t'intéresse d'aller plus loin. J'aimerais qu'on en parle vraiment — pour ça, il me faut ton espace. Ça prend 30 secondes.`}
                </p>
              </div>
              <button onClick={() => { setBubbleIndex(null); onRegister?.(); }}
                style={{ backgroundColor: "var(--bordeaux)", color: "var(--fond-blanc)", borderRadius: "8px", padding: "8px 14px", border: "none", cursor: "pointer", fontSize: "13px", fontFamily: "DM Sans", fontWeight: 500, marginRight: "8px" }}>
                Créer mon espace
              </button>
              <button onClick={() => setBubbleIndex(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--texte-discret)", fontSize: "12px", fontFamily: "DM Sans" }}>
                Pas maintenant
              </button>
            </div>
          )}

        <button
          onClick={() => toggle(i)}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            width: "100%",
            background: "none",
            border: "none",
            padding: "11px 0",
            cursor: "pointer",
            textAlign: "left",
            borderBottom: i < actions.length - 1 ? "1px solid rgba(26,18,16,0.07)" : "none",
          }}
        >
          {/* Checkbox — états : vide / en exploration (connecté) / coché */}
          <div style={{
            width: "22px", height: "22px", borderRadius: "6px",
            border: `1.5px solid ${checked[i] ? "var(--vert)" : exploring[i] ? "var(--or)" : "rgba(92,26,46,0.25)"}`,
            backgroundColor: checked[i] ? "var(--vert)" : exploring[i] ? "rgba(140,109,63,0.1)" : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, marginTop: "1px", transition: "all 0.15s",
          }}>
            {checked[i] && <Check size={12} color="white" strokeWidth={3} />}
            {exploring[i] && !checked[i] && <Circle size={8} color="var(--or)" />}
          </div>

          {/* Texte */}
          <span style={{
            fontSize: "15px", lineHeight: "1.5", fontFamily: "DM Sans, sans-serif",
            color: checked[i] ? "var(--texte-discret)" : "var(--texte-secondary)",
            textDecoration: checked[i] ? "line-through" : "none", transition: "all 0.2s",
          }}>
            <span style={{ color: checked[i] ? "var(--texte-discret)" : "var(--or)", fontWeight: 600, marginRight: "6px", fontSize: "13px" }}>
              {i + 1}.
            </span>
            {action}
          </span>
        </button>
        </div>
      ))}
    </div>
  );
}
