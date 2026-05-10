"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

export default function BrainDump() {
  const [text, setText] = useState("");

  return (
    <main
      style={{ backgroundColor: "var(--fond)", minHeight: "100dvh" }}
      className="flex flex-col items-center justify-center px-6 py-12"
    >
      {/* Logo */}
      <div className="mb-12 text-center">
        <p
          style={{ color: "var(--texte-discret)", fontSize: "11px", letterSpacing: "0.2em" }}
          className="uppercase"
        >
          Duleme & Cie
        </p>
        <h1
          style={{
            color: "var(--bordeaux)",
            fontFamily: "Cormorant Garamond, serif",
            fontSize: "42px",
            fontWeight: 300,
            letterSpacing: "0.12em",
          }}
        >
          FIRMAMENT
        </h1>
      </div>

      {/* Question centrale */}
      <div className="w-full max-w-lg text-center mb-8">
        <h2
          style={{
            fontFamily: "Cormorant Garamond, serif",
            color: "var(--texte)",
            fontSize: "28px",
            fontWeight: 300,
            lineHeight: "1.3",
          }}
        >
          {`Qu'est-ce qui t'encombre`}
          <br />
          {`le plus aujourd'hui ?`}
        </h2>
        <p style={{ color: "var(--texte-discret)", fontSize: "14px", marginTop: "12px" }}>
          {`Vide ta tête. Téfi s'occupe du reste.`}
        </p>
      </div>

      {/* Zone de saisie */}
      <div className="w-full max-w-lg">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Écris tout ce qui tourne dans ta tête — sans filtre, sans structure. Téfi fera le tri."
          rows={8}
          style={{
            width: "100%",
            backgroundColor: "var(--fond-blanc)",
            color: "var(--texte)",
            borderBottom: "2px solid var(--texte-discret)",
            borderTop: "none",
            borderLeft: "none",
            borderRight: "none",
            resize: "none",
            fontSize: "16px",
            lineHeight: "1.7",
            padding: "16px 4px",
            fontFamily: "DM Sans, sans-serif",
            transition: "border-color 0.2s",
          }}
          onFocus={(e) => { e.target.style.borderBottomColor = "var(--bordeaux)"; }}
          onBlur={(e) => { e.target.style.borderBottomColor = "var(--texte-discret)"; }}
        />

        <button
          disabled={text.trim().length < 10}
          style={{
            backgroundColor: text.trim().length >= 10 ? "var(--bordeaux)" : "var(--texte-discret)",
            color: "var(--fond-blanc)",
            borderRadius: "13px",
            padding: "16px 28px",
            fontSize: "15px",
            fontFamily: "DM Sans, sans-serif",
            fontWeight: 500,
            letterSpacing: "0.02em",
            cursor: text.trim().length >= 10 ? "pointer" : "not-allowed",
            transition: "background-color 0.2s",
            border: "none",
            width: "100%",
            marginTop: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          Clarifier
          <ArrowRight size={16} />
        </button>
      </div>

      {/* Ligne cosmique */}
      <p
        style={{
          color: "var(--texte-discret)",
          fontSize: "11px",
          fontStyle: "italic",
          marginTop: "48px",
          fontFamily: "DM Sans, sans-serif",
        }}
      >
        🌗 Dernier quartier · propice aux décisions de rupture
      </p>
    </main>
  );
}
