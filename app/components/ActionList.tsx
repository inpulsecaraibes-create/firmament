"use client";

import { useState } from "react";
import { Check } from "lucide-react";

interface ActionListProps {
  actions: string[];
  initialChecked?: boolean[];
}

export default function ActionList({ actions, initialChecked }: ActionListProps) {
  const [checked, setChecked] = useState<boolean[]>(
    initialChecked || actions.map(() => false)
  );

  function toggle(i: number) {
    const next = [...checked];
    next[i] = !next[i];
    setChecked(next);
  }

  const doneCount = checked.filter(Boolean).length;

  return (
    <div style={{ marginBottom: "4px" }}>
      {/* Progression discrète */}
      {doneCount > 0 && (
        <p style={{ fontSize: "11px", color: "var(--vert)", fontFamily: "DM Sans, sans-serif", marginBottom: "8px", fontWeight: 500 }}>
          {doneCount}/{actions.length} fait{doneCount > 1 ? "es" : ""}
        </p>
      )}

      {actions.map((action, i) => (
        <button
          key={i}
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
          {/* Checkbox */}
          <div style={{
            width: "22px", height: "22px", borderRadius: "6px",
            border: `1.5px solid ${checked[i] ? "var(--vert)" : "rgba(92,26,46,0.25)"}`,
            backgroundColor: checked[i] ? "var(--vert)" : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, marginTop: "1px",
            transition: "all 0.15s",
          }}>
            {checked[i] && <Check size={12} color="white" strokeWidth={3} />}
          </div>

          {/* Texte */}
          <span style={{
            fontSize: "15px",
            lineHeight: "1.5",
            fontFamily: "DM Sans, sans-serif",
            color: checked[i] ? "var(--texte-discret)" : "var(--texte-secondary)",
            textDecoration: checked[i] ? "line-through" : "none",
            transition: "all 0.2s",
          }}>
            <span style={{ color: checked[i] ? "var(--texte-discret)" : "var(--or)", fontWeight: 600, marginRight: "6px", fontSize: "13px" }}>
              {i + 1}.
            </span>
            {action}
          </span>
        </button>
      ))}
    </div>
  );
}
