"use client";

import { useState } from "react";

interface ObjectifAimantProps {
  phrase?: string;
  progress?: number; // 0-100
  onSetObjectif?: () => void;
}

export default function ObjectifAimant({ phrase, progress = 0, onSetObjectif }: ObjectifAimantProps) {
  const [showPhrase, setShowPhrase] = useState(false);

  const size = 88;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  const isComplete = progress >= 100;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "4px" }}>
      <button
        onClick={() => phrase ? setShowPhrase(!showPhrase) : onSetObjectif?.()}
        style={{ background: "none", border: "none", cursor: "pointer", padding: "8px", position: "relative" }}
        aria-label="Objectif Aimant"
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Fond de l'anneau */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke="rgba(92,26,46,0.1)"
            strokeWidth={strokeWidth}
          />
          {/* Progression */}
          {progress > 0 && (
            <circle
              cx={size / 2} cy={size / 2} r={radius}
              fill="none"
              stroke={isComplete ? "#1B3A2D" : "#5C1A2E"}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              style={{ transition: "stroke-dashoffset 0.6s ease" }}
            />
          )}
          {/* Centre */}
          {isComplete ? (
            <text x={size / 2} y={size / 2 + 6} textAnchor="middle" fontSize="22">✦</text>
          ) : phrase ? (
            <>
              <text x={size / 2} y={size / 2 - 4} textAnchor="middle" fontSize="13" fill="#5C1A2E" fontFamily="DM Sans" fontWeight="500">
                {progress}%
              </text>
              <text x={size / 2} y={size / 2 + 10} textAnchor="middle" fontSize="9" fill="#B0A098" fontFamily="DM Sans">
                du cap
              </text>
            </>
          ) : (
            <text x={size / 2} y={size / 2 + 5} textAnchor="middle" fontSize="20" fill="rgba(92,26,46,0.3)">
              ◎
            </text>
          )}
        </svg>

        {/* Célébration 100% */}
        {isComplete && (
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(27,58,45,0.08) 0%, transparent 70%)",
            animation: "pulse 2s infinite",
          }} />
        )}
      </button>

      {/* Phrase de l'objectif */}
      {phrase && showPhrase && (
        <div style={{
          backgroundColor: "var(--fond-blanc)",
          border: "1px solid rgba(92,26,46,0.1)",
          borderRadius: "10px",
          padding: "12px 16px",
          maxWidth: "280px",
          textAlign: "center",
          marginTop: "4px",
        }}>
          <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "15px", fontStyle: "italic", color: "var(--texte-secondary)", lineHeight: "1.5" }}>
            {phrase}
          </p>
        </div>
      )}

      {/* Invitation si pas d'objectif */}
      {!phrase && (
        <button
          onClick={onSetObjectif}
          style={{ background: "none", border: "none", cursor: "pointer", marginTop: "4px" }}
        >
          <p style={{ color: "var(--texte-discret)", fontSize: "12px", fontStyle: "italic", fontFamily: "Cormorant Garamond, serif", textAlign: "center" }}>
            Poser ton cap avec Téfi →
          </p>
        </button>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
