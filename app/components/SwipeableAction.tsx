"use client";

import { useRef, useState } from "react";
import { Check, AlertCircle, ArrowUp, Moon, X } from "lucide-react";

export interface ActionData {
  id: string;
  titre: string;
  done: boolean;
  urgent: boolean;
  is_priority: boolean;
  is_sleeping: boolean;
  deadline?: string | null;
  theme?: string;
}

interface SwipeableActionProps {
  action: ActionData;
  onDone: (id: string, done: boolean) => void;
  onUpdate: (id: string, updates: Partial<ActionData>) => void;
  onTefiRebound?: (title: string) => void;
  showIndex?: number;
}

const SWIPE_THRESHOLD = 60;

export default function SwipeableAction({
  action,
  onDone,
  onUpdate,
  onTefiRebound,
  showIndex,
}: SwipeableActionProps) {
  const [swipeX, setSwipeX] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const [rebounding, setRebounding] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);

  function onTouchStart(e: React.TouchEvent) {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    isDragging.current = false;
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!touchStart.current) return;
    const dx = e.touches[0].clientX - touchStart.current.x;
    const dy = e.touches[0].clientY - touchStart.current.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
      isDragging.current = true;
      e.stopPropagation();
      setSwipeX(Math.max(-120, Math.min(120, dx)));
    }
  }

  function onTouchEnd() {
    if (!isDragging.current) { touchStart.current = null; return; }
    if (swipeX < -SWIPE_THRESHOLD) {
      // Swipe gauche → Terri reformule
      if (onTefiRebound) onTefiRebound(action.titre);
      setRebounding(true);
      setTimeout(() => setRebounding(false), 800);
    } else if (swipeX > SWIPE_THRESHOLD) {
      // Swipe droit → panneau statut
      if (navigator.vibrate) navigator.vibrate(10);
      setShowPanel(true);
    }
    setSwipeX(0);
    touchStart.current = null;
    isDragging.current = false;
  }

  function updateStatus(field: "is_urgent" | "is_priority" | "is_sleeping", val: boolean) {
    const updates: Partial<ActionData> = { [field]: val };
    // "En sommeil" désactive les autres
    if (field === "is_sleeping" && val) {
      updates.urgent = false;
      updates.is_priority = false;
    }
    onUpdate(action.id, updates);
    if (navigator.vibrate) navigator.vibrate([5, 30, 5]);
  }

  const isSleeping = action.is_sleeping;

  return (
    <>
      {/* Panneau statut (swipe droit) */}
      {showPanel && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "flex-end" }}
          onClick={() => setShowPanel(false)}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: "var(--fond-blanc)",
              borderLeft: "2px solid var(--bordeaux)",
              borderRadius: "16px 16px 0 0",
              width: "100%",
              padding: "20px 20px 40px",
              animation: "slideUp 0.2s ease",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--texte)", flex: 1, lineHeight: "1.4", paddingRight: "12px" }}>
                {action.titre.length > 60 ? action.titre.slice(0, 60) + "…" : action.titre}
              </p>
              <button onClick={() => setShowPanel(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--texte-discret)" }}>
                <X size={18} />
              </button>
            </div>

            {/* Toggles */}
            {[
              { field: "is_urgent" as const, icon: <AlertCircle size={15} />, label: "⚡ Urgent", desc: "Remonte dans le top 3", value: action.urgent || false, disabled: isSleeping },
              { field: "is_priority" as const, icon: <ArrowUp size={15} />, label: "↑ Priorité haute", desc: "Monte d'un cran dans la liste", value: action.is_priority, disabled: isSleeping },
              { field: "is_sleeping" as const, icon: <Moon size={15} />, label: "💤 En sommeil", desc: "Retirer de la vue active", value: isSleeping, disabled: false },
            ].map(({ field, label, desc, value, disabled }) => (
              <button
                key={field}
                disabled={disabled}
                onClick={() => {
                  if (!disabled) {
                    if (field === "is_urgent") updateStatus("is_urgent", !action.urgent);
                    else updateStatus(field, !value);
                  }
                }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  width: "100%", padding: "14px 16px", background: "none",
                  border: "1px solid rgba(26,18,16,0.08)", borderRadius: "10px",
                  cursor: disabled ? "not-allowed" : "pointer", marginBottom: "8px",
                  opacity: disabled ? 0.35 : 1,
                  backgroundColor: value && !disabled ? "var(--fond-or)" : "transparent",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ color: value ? "var(--or)" : "var(--texte-discret)" }}>{label.split(" ")[0]}</span>
                  <div style={{ textAlign: "left" }}>
                    <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--texte)", marginBottom: "2px" }}>{label.replace(label.split(" ")[0] + " ", "")}</p>
                    <p style={{ fontSize: "11px", color: "var(--texte-discret)" }}>{desc}</p>
                  </div>
                </div>
                {/* Toggle visuel */}
                <div style={{
                  width: "42px", height: "24px", borderRadius: "12px",
                  backgroundColor: value && !disabled ? "var(--bordeaux)" : "rgba(26,18,16,0.12)",
                  position: "relative", transition: "background-color 0.2s",
                }}>
                  <div style={{
                    width: "18px", height: "18px", borderRadius: "50%",
                    backgroundColor: "white",
                    position: "absolute", top: "3px",
                    left: value && !disabled ? "21px" : "3px",
                    transition: "left 0.2s",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                  }} />
                </div>
              </button>
            ))}

            <button onClick={() => setShowPanel(false)}
              style={{ width: "100%", padding: "13px", backgroundColor: "var(--bordeaux)", color: "var(--fond-blanc)", borderRadius: "10px", border: "none", cursor: "pointer", fontSize: "14px", fontFamily: "DM Sans", fontWeight: 500, marginTop: "8px" }}>
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* L'action elle-même */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          display: "flex", alignItems: "center", gap: "12px",
          padding: "12px 16px",
          backgroundColor: rebounding ? "rgba(92,26,46,0.04)" : "transparent",
          transform: `translateX(${swipeX}px)`,
          transition: swipeX === 0 ? "transform 0.2s, background-color 0.3s" : "none",
          opacity: isSleeping ? 0.4 : 1,
          userSelect: "none",
        }}
      >
        {showIndex !== undefined && (
          <span style={{ fontSize: "11px", color: "var(--or)", fontWeight: 600, minWidth: "16px" }}>{showIndex + 1}.</span>
        )}
        <button
          onClick={() => onDone(action.id, !action.done)}
          style={{
            width: "22px", height: "22px", borderRadius: "6px",
            border: `1.5px solid ${action.done ? "var(--vert)" : "rgba(92,26,46,0.25)"}`,
            backgroundColor: action.done ? "var(--vert)" : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, cursor: "pointer", transition: "all 0.15s",
          }}
        >
          {action.done && <Check size={12} color="white" strokeWidth={3} />}
        </button>
        <div style={{ flex: 1 }}>
          <p style={{
            fontSize: "14px", fontFamily: "DM Sans", lineHeight: "1.4",
            color: action.done ? "var(--texte-discret)" : "var(--texte-secondary)",
            textDecoration: action.done ? "line-through" : "none",
          }}>
            {action.titre}
          </p>
          {action.theme && <p style={{ fontSize: "11px", color: "var(--texte-discret)", marginTop: "2px" }}>{action.theme}</p>}
          {action.deadline && <p style={{ fontSize: "11px", color: "var(--bordeaux)", marginTop: "2px" }}>⏰ {action.deadline}</p>}
        </div>
        {/* Badges */}
        <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
          {action.urgent && !action.done && (
            <span style={{ backgroundColor: "rgba(92,26,46,0.1)", color: "var(--bordeaux)", fontSize: "10px", fontWeight: 600, padding: "2px 6px", borderRadius: "8px" }}>!</span>
          )}
          {action.is_priority && !action.done && (
            <span style={{ backgroundColor: "rgba(140,109,63,0.1)", color: "var(--or)", fontSize: "10px", padding: "2px 5px", borderRadius: "8px" }}>↑</span>
          )}
        </div>
        {/* Indicateur swipe */}
        {swipeX !== 0 && (
          <div style={{
            position: "absolute",
            left: swipeX < 0 ? "auto" : "0",
            right: swipeX < 0 ? "0" : "auto",
            top: 0, bottom: 0,
            width: "48px",
            display: "flex", alignItems: "center", justifyContent: "center",
            backgroundColor: swipeX < 0 ? "rgba(92,26,46,0.08)" : "rgba(140,109,63,0.08)",
            borderRadius: swipeX < 0 ? "8px 0 0 8px" : "0 8px 8px 0",
          }}>
            <span style={{ fontSize: "16px" }}>{swipeX < 0 ? "↺" : "⚙"}</span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
