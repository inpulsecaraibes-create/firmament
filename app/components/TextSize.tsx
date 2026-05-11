"use client";

import { useState, useEffect } from "react";

const SIZES = [100, 115, 130];
const LABELS = ["A", "A", "A"];
const KEY = "firmament_text_size";

export default function TextSize() {
  const [sizeIndex, setSizeIndex] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    if (saved) {
      const idx = parseInt(saved);
      setSizeIndex(idx);
      applySize(idx);
    }
  }, []);

  function applySize(idx: number) {
    document.documentElement.style.fontSize = `${SIZES[idx]}%`;
  }

  function handleChange(idx: number) {
    setSizeIndex(idx);
    applySize(idx);
    localStorage.setItem(KEY, String(idx));
    setOpen(false);
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        title="Taille du texte"
        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--texte-discret)", fontSize: "12px", fontFamily: "DM Sans, sans-serif", fontWeight: 600, padding: "4px 6px", letterSpacing: "0.05em" }}
        aria-label="Ajuster la taille du texte"
      >
        AA
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "100%", right: 0, zIndex: 50,
          backgroundColor: "var(--fond-blanc)", borderRadius: "10px",
          border: "1px solid rgba(26,18,16,0.1)", padding: "6px",
          display: "flex", flexDirection: "column", gap: "2px",
          boxShadow: "0 4px 16px rgba(26,18,16,0.08)",
          minWidth: "100px",
        }}>
          {SIZES.map((_, i) => (
            <button key={i} onClick={() => handleChange(i)}
              style={{
                background: sizeIndex === i ? "var(--bordeaux-light)" : "none",
                border: "none", cursor: "pointer",
                padding: "8px 12px", borderRadius: "6px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                color: sizeIndex === i ? "var(--bordeaux)" : "var(--texte-secondary)",
                fontFamily: "DM Sans, sans-serif",
              }}>
              <span style={{ fontSize: `${10 + i * 2}px`, fontWeight: 600 }}>{LABELS[i]}</span>
              <span style={{ fontSize: "11px", color: "var(--texte-discret)" }}>
                {i === 0 ? "Normal" : i === 1 ? "Grand" : "Très grand"}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
