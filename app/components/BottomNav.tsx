"use client";

import { Brain, Home, Scale, Settings } from "lucide-react";

interface BottomNavProps {
  active: "home" | "dump" | "decisions" | "parametres";
  onHome: () => void;
  onDump: () => void;
}

export default function BottomNav({ active, onHome, onDump }: BottomNavProps) {
  const items = [
    { id: "home", icon: <Home size={20} />, label: "Accueil", action: onHome },
    { id: "dump", icon: <Brain size={20} />, label: "Le Dump", action: onDump },
    { id: "decisions", icon: <Scale size={20} />, label: "Décisions", action: () => { window.location.href = "/decisions"; } },
    { id: "parametres", icon: <Settings size={20} />, label: "Paramètres", action: () => { window.location.href = "/parametres"; } },
  ];

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40,
      backgroundColor: "var(--fond-blanc)",
      borderTop: "1px solid rgba(26,18,16,0.08)",
      display: "flex",
      paddingBottom: "env(safe-area-inset-bottom, 8px)",
    }}>
      {items.map(item => (
        <button
          key={item.id}
          onClick={item.action}
          style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: "3px", padding: "10px 4px",
            background: "none", border: "none", cursor: "pointer",
            color: active === item.id ? "var(--bordeaux)" : "var(--texte-discret)",
            transition: "color 0.15s",
          }}
        >
          {item.icon}
          <span style={{ fontSize: "9px", fontFamily: "DM Sans", letterSpacing: "0.05em" }}>
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
}
