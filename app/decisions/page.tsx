/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Check, X } from "lucide-react";
import { createClient } from "@/app/lib/supabase/client";

interface Decision {
  id: string;
  titre: string;
  contexte?: string;
  implemented: boolean;
  created_at: string;
}

export default function Decisions() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [titre, setTitre] = useState("");
  const [contexte, setContexte] = useState("");
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/"; return; }
    const { data } = await supabase
      .from("decisions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setDecisions(data || []);
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!titre.trim()) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("decisions")
      .insert({ user_id: user.id, titre: titre.trim(), contexte: contexte.trim() || null, implemented: false })
      .select().single();
    if (data) setDecisions([data, ...decisions]);
    setTitre(""); setContexte("");
    setShowForm(false);
    setSaving(false);
  }

  async function toggleImpl(id: string, impl: boolean) {
    await supabase.from("decisions").update({ implemented: impl }).eq("id", id);
    setDecisions(decisions.map(d => d.id === id ? { ...d, implemented: impl } : d));
  }

  async function deleteDecision(id: string) {
    await supabase.from("decisions").delete().eq("id", id);
    setDecisions(decisions.filter(d => d.id !== id));
  }

  const fmt = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

  return (
    <main style={{ backgroundColor: "var(--fond)", minHeight: "100dvh", fontFamily: "DM Sans, sans-serif" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "0 0 100px" }}>

        <div style={{ padding: "20px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button onClick={() => window.history.back()} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--bordeaux)", padding: "4px" }}>
              <ArrowLeft size={20} />
            </button>
            <div>
              <p style={{ fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--texte-discret)" }}>FIRMAMENT</p>
              <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "24px", fontWeight: 300, color: "var(--texte)" }}>Mes décisions</h1>
            </div>
          </div>
          <button onClick={() => setShowForm(true)}
            style={{ backgroundColor: "var(--bordeaux)", color: "var(--fond-blanc)", borderRadius: "10px", padding: "8px 14px", border: "none", cursor: "pointer", fontSize: "13px", fontFamily: "DM Sans", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
            <Plus size={14} /> Ajouter
          </button>
        </div>

        <div style={{ padding: "0 20px" }}>

          {showForm && (
            <form onSubmit={handleSave} style={{ backgroundColor: "var(--fond-blanc)", borderRadius: "12px", padding: "16px", marginBottom: "20px", border: "1px solid rgba(92,26,46,0.12)" }}>
              <p style={{ fontSize: "13px", color: "var(--texte-discret)", marginBottom: "12px", fontStyle: "italic" }}>
                Quelle décision as-tu prise ?
              </p>
              <input
                value={titre}
                onChange={e => setTitre(e.target.value)}
                placeholder="La décision en une phrase"
                required
                style={{ width: "100%", backgroundColor: "transparent", color: "var(--texte)", borderBottom: "1.5px solid var(--texte-discret)", borderTop: "none", borderLeft: "none", borderRight: "none", fontSize: "15px", padding: "8px 4px", fontFamily: "DM Sans", marginBottom: "12px" }}
                onFocus={e => { e.target.style.borderBottomColor = "var(--bordeaux)"; }}
                onBlur={e => { e.target.style.borderBottomColor = "var(--texte-discret)"; }}
              />
              <textarea
                value={contexte}
                onChange={e => setContexte(e.target.value)}
                placeholder="Contexte ou raison (optionnel)"
                rows={2}
                style={{ width: "100%", backgroundColor: "transparent", color: "var(--texte)", borderBottom: "1.5px solid var(--texte-discret)", borderTop: "none", borderLeft: "none", borderRight: "none", fontSize: "14px", padding: "8px 4px", fontFamily: "DM Sans", resize: "none", marginBottom: "16px" }}
                onFocus={e => { e.target.style.borderBottomColor = "var(--bordeaux)"; }}
                onBlur={e => { e.target.style.borderBottomColor = "var(--texte-discret)"; }}
              />
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="submit" disabled={!titre.trim() || saving}
                  style={{ flex: 1, backgroundColor: titre.trim() ? "var(--bordeaux)" : "var(--texte-discret)", color: "var(--fond-blanc)", borderRadius: "10px", padding: "11px", border: "none", cursor: titre.trim() ? "pointer" : "not-allowed", fontSize: "14px", fontFamily: "DM Sans", fontWeight: 500 }}>
                  {saving ? "···" : "Enregistrer →"}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setTitre(""); setContexte(""); }}
                  style={{ backgroundColor: "transparent", border: "1px solid rgba(26,18,16,0.1)", borderRadius: "10px", padding: "11px 14px", cursor: "pointer", color: "var(--texte-discret)", fontSize: "14px" }}>
                  Annuler
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <p style={{ color: "var(--texte-discret)", fontSize: "14px", textAlign: "center", padding: "32px 0" }}>Chargement···</p>
          ) : decisions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 24px" }}>
              <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "20px", color: "var(--texte)", marginBottom: "8px" }}>
                Aucune décision encore enregistrée.
              </p>
              <p style={{ color: "var(--texte-discret)", fontSize: "14px", lineHeight: "1.5" }}>
                Chaque décision mérite d'être notée. Téfi peut t'aider à les prendre.
              </p>
            </div>
          ) : (
            <>
              {[false, true].map(impl => {
                const filtered = decisions.filter(d => d.implemented === impl);
                if (filtered.length === 0) return null;
                return (
                  <div key={String(impl)} style={{ marginBottom: "24px" }}>
                    <p style={{ fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: impl ? "var(--vert)" : "var(--texte-discret)", marginBottom: "10px", fontWeight: 600 }}>
                      {impl ? "Appliquées" : "En cours / prises"}
                    </p>
                    {filtered.map(d => (
                      <div key={d.id} style={{ backgroundColor: "var(--fond-blanc)", borderRadius: "10px", padding: "14px 16px", marginBottom: "8px", border: `1px solid ${impl ? "rgba(27,58,45,0.15)" : "rgba(26,18,16,0.08)"}`, opacity: impl ? 0.7 : 1 }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                          <button onClick={() => toggleImpl(d.id, !d.implemented)}
                            style={{ width: "20px", height: "20px", borderRadius: "50%", border: `1.5px solid ${impl ? "var(--vert)" : "rgba(92,26,46,0.2)"}`, backgroundColor: impl ? "var(--vert)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer", marginTop: "1px" }}>
                            {impl && <Check size={11} color="white" strokeWidth={3} />}
                          </button>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--texte)", textDecoration: impl ? "line-through" : "none", lineHeight: "1.4" }}>
                              {d.titre}
                            </p>
                            {d.contexte && <p style={{ fontSize: "12px", color: "var(--texte-discret)", marginTop: "4px", lineHeight: "1.5" }}>{d.contexte}</p>}
                            <p style={{ fontSize: "11px", color: "var(--texte-discret)", marginTop: "4px" }}>{fmt(d.created_at)}</p>
                          </div>
                          <button onClick={() => deleteDecision(d.id)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--texte-discret)", padding: "2px" }}>
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
