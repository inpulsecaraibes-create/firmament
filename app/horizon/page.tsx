"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/app/lib/supabase/client";

interface Task { id: string; title: string; subtitle?: string; deadline_text?: string; is_urgent: boolean; status: string; }
interface Theme { id: string; title: string; tasks: Task[]; }

export default function HorizonPage() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const supabase = createClient();

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("themes").select("*, tasks(*)").eq("user_id", user.id).order("position");
    if (data) setThemes(data.map(t => ({ ...t, tasks: (t.tasks || []).filter((tk: Task) => tk.status === "active").sort((a: Task, b: Task) => (a.deadline_text ? -1 : 1) - (b.deadline_text ? -1 : 1)) })).filter(t => t.tasks.length > 0));
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  function toggle(id: string) { setOpen(p => { const n = new Set(p); if (n.has(id)) { n.delete(id); } else { n.add(id); } return n; }); }

  return (
    <main style={{ backgroundColor: "var(--fond)", minHeight: "100dvh", fontFamily: "DM Sans, sans-serif", paddingBottom: "40px" }}>
      <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid rgba(26,18,16,0.07)", backgroundColor: "var(--fond-blanc)" }}>
        <a href="/home" style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--bordeaux)", textDecoration: "none", fontSize: "14px", fontWeight: 500 }}>
          <ArrowLeft size={18} /> Mon espace
        </a>
      </div>
      <div style={{ padding: "20px" }}>
        <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "26px", fontWeight: 300, color: "var(--texte)", marginBottom: "20px" }}>Horizon</h1>
        {themes.length === 0 ? (
          <p style={{ color: "var(--texte-discret)", fontSize: "14px", fontStyle: "italic", fontFamily: "Cormorant Garamond, serif" }}>
            Tes tâches planifiées apparaîtront ici au fil de tes Dumps.
          </p>
        ) : themes.map(th => (
          <div key={th.id} style={{ backgroundColor: "var(--fond-blanc)", border: "1px solid rgba(26,18,16,0.07)", borderRadius: "10px", marginBottom: "6px", overflow: "hidden" }}>
            <button onClick={() => toggle(th.id)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "13px 16px", background: "none", border: "none", cursor: "pointer" }}>
              <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--texte)" }}>{th.title}</span>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "var(--texte-discret)" }}>{th.tasks.length}</span>
                <span style={{ color: "var(--texte-discret)" }}>{open.has(th.id) ? "▾" : "▸"}</span>
              </div>
            </button>
            {open.has(th.id) && th.tasks.map((t) => (
              <div key={t.id} style={{ padding: "10px 16px", borderTop: "1px solid rgba(26,18,16,0.05)", display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "13px", color: "var(--texte-secondary)", lineHeight: "1.4" }}>{t.title}</p>
                  {t.subtitle && <p style={{ fontSize: "11px", color: "var(--texte-discret)", marginTop: "2px" }}>{t.subtitle}</p>}
                </div>
                {t.deadline_text && <span style={{ fontSize: "11px", color: "var(--bordeaux)", flexShrink: 0 }}>{t.deadline_text}</span>}
                {t.is_urgent && <span style={{ fontSize: "10px", backgroundColor: "rgba(92,26,46,0.08)", color: "var(--bordeaux)", padding: "2px 5px", borderRadius: "6px", flexShrink: 0 }}>!</span>}
              </div>
            ))}
          </div>
        ))}
      </div>
    </main>
  );
}
