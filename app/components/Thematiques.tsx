"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, AlertCircle, Check } from "lucide-react";

export interface Action {
  id: string;
  titre: string;
  done: boolean;
  urgent: boolean;
  locked: boolean;
  priority_order: number;
}

export interface Thematique {
  id: string;
  titre: string;
  emoji?: string;
  actions: Action[];
}

interface ThematiquesProps {
  thematiques: Thematique[];
  onToggleAction: (actionId: string, done: boolean) => void;
  onToggleUrgent: (actionId: string, urgent: boolean) => void;
}

export default function Thematiques({ thematiques, onToggleAction, onToggleUrgent }: ThematiquesProps) {
  const [open, setOpen] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setOpen(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  if (thematiques.length === 0) {
    return (
      <div style={{ padding: "20px 0", textAlign: "center" }}>
        <p style={{ color: "var(--texte-discret)", fontSize: "14px", fontStyle: "italic", fontFamily: "Cormorant Garamond, serif" }}>
          {`Tes thématiques apparaîtront ici au fil de tes Dumps.`}
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {thematiques.map((theme) => {
        const isOpen = open.has(theme.id);
        const doneCount = theme.actions.filter(a => a.done).length;
        const urgentCount = theme.actions.filter(a => a.urgent && !a.done).length;

        return (
          <div key={theme.id} style={{
            backgroundColor: "var(--fond-blanc)",
            border: "1px solid rgba(26,18,16,0.08)",
            borderRadius: "10px",
            overflow: "hidden",
          }}>
            {/* Header thématique */}
            <button
              onClick={() => toggle(theme.id)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                width: "100%", padding: "14px 16px",
                background: "none", border: "none", cursor: "pointer", textAlign: "left",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {theme.emoji && <span style={{ fontSize: "16px" }}>{theme.emoji}</span>}
                <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: "14px", fontWeight: 500, color: "var(--texte)" }}>
                  {theme.titre}
                </span>
                {urgentCount > 0 && (
                  <span style={{ backgroundColor: "rgba(92,26,46,0.1)", color: "var(--bordeaux)", fontSize: "10px", fontWeight: 600, padding: "2px 6px", borderRadius: "10px", fontFamily: "DM Sans" }}>
                    {urgentCount} urgent{urgentCount > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "var(--texte-discret)", fontSize: "12px", fontFamily: "DM Sans" }}>
                  {doneCount}/{theme.actions.length}
                </span>
                {isOpen ? <ChevronDown size={15} color="var(--texte-discret)" /> : <ChevronRight size={15} color="var(--texte-discret)" />}
              </div>
            </button>

            {/* Actions dépliées */}
            {isOpen && (
              <div style={{ borderTop: "1px solid rgba(26,18,16,0.06)" }}>
                {theme.actions.map((action) => (
                  <div key={action.id} style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    padding: "10px 16px",
                    borderBottom: "1px solid rgba(26,18,16,0.04)",
                    opacity: action.locked ? 0.4 : 1,
                  }}>
                    {/* Checkbox */}
                    <button
                      onClick={() => !action.locked && onToggleAction(action.id, !action.done)}
                      disabled={action.locked}
                      style={{
                        width: "20px", height: "20px", borderRadius: "5px",
                        border: `1.5px solid ${action.done ? "var(--vert)" : "rgba(92,26,46,0.2)"}`,
                        backgroundColor: action.done ? "var(--vert)" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0, cursor: action.locked ? "not-allowed" : "pointer",
                        background: action.done ? "var(--vert)" : "transparent",
                        transition: "all 0.15s",
                      }}
                    >
                      {action.done && <Check size={11} color="white" strokeWidth={3} />}
                    </button>

                    {/* Titre */}
                    <span style={{
                      flex: 1, fontSize: "13px", fontFamily: "DM Sans, sans-serif",
                      color: action.done ? "var(--texte-discret)" : "var(--texte-secondary)",
                      textDecoration: action.done ? "line-through" : "none",
                      lineHeight: "1.4",
                    }}>
                      {action.titre}
                    </span>

                    {/* Badge urgent */}
                    {action.urgent && !action.done && (
                      <button
                        onClick={() => onToggleUrgent(action.id, false)}
                        title="Retirer l'urgence"
                        style={{ background: "none", border: "none", cursor: "pointer", padding: "2px" }}
                      >
                        <AlertCircle size={14} color="#5C1A2E" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
