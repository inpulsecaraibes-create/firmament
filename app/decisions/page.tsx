"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/app/lib/supabase/client";

interface Decision { id: string; content: string; created_at: string; }

export default function DecisionsPage() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const supabase = createClient();

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("decisions").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) setDecisions(data);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const fmt = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

  return (
    <main style={{ backgroundColor: "var(--fond)", minHeight: "100dvh", fontFamily: "DM Sans, sans-serif", paddingBottom: "40px" }}>
      <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid rgba(26,18,16,0.07)", backgroundColor: "var(--fond-blanc)" }}>
        <a href="/home" style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--bordeaux)", textDecoration: "none", fontSize: "14px", fontWeight: 500 }}>
          <ArrowLeft size={18} /> Mon espace
        </a>
      </div>
      <div style={{ padding: "20px" }}>
        <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "26px", fontWeight: 300, color: "var(--texte)", marginBottom: "6px" }}>Mes décisions</h1>
        <p style={{ color: "var(--texte-discret)", fontSize: "13px", marginBottom: "24px" }}>Remplies automatiquement par Téfi. Lecture seule.</p>
        {decisions.length === 0 ? (
          <p style={{ color: "var(--texte-discret)", fontSize: "14px", fontStyle: "italic", fontFamily: "Cormorant Garamond, serif" }}>
            Téfi notera ici les décisions importantes que tu mentionnes dans tes Dumps.
          </p>
        ) : decisions.map(d => (
          <div key={d.id} style={{ backgroundColor: "var(--fond-blanc)", borderRadius: "10px", padding: "14px 16px", marginBottom: "8px", border: "1px solid rgba(26,18,16,0.07)", borderLeft: "2px solid rgba(92,26,46,0.2)" }}>
            <p style={{ fontSize: "14px", color: "var(--texte)", lineHeight: "1.5", marginBottom: "6px" }}>{d.content}</p>
            <p style={{ fontSize: "11px", color: "var(--texte-discret)" }}>{fmt(d.created_at)}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
