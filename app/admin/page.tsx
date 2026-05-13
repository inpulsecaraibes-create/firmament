/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/app/lib/supabase/client";

interface UserRow {
  id: string; prenom: string; email: string;
  surcharge_score: string; clarity_score: number;
  ai_mode: string; trial_ends_at: string; created_at: string;
  task_count?: number;
}

export default function AdminPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/auth/login"; return; }

      // Accès admin : par email autorisé OU par colonne role
      const ADMIN_EMAILS = ["inpulsecaraibes@gmail.com", "admin@frmmnt.fr"];
      const isAdminByEmail = ADMIN_EMAILS.includes(user.email || "");

      if (!isAdminByEmail) {
        // Fallback : vérifier colonne role si elle existe
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        if (!profile || profile?.role !== "admin") {
          window.location.href = "/home"; return;
        }
      }

      const { data } = await supabase.from("profiles")
        .select("id,prenom,email,surcharge_score,clarity_score,ai_mode,trial_ends_at,created_at")
        .order("created_at", { ascending: false });
      setUsers(data || []);
      setLoading(false);
    })();
  }, [supabase]);

  const scoreColor = (s: string) => s === "rouge" ? "#B00020" : s === "orange" ? "#C4A46B" : "#1B3A2D";
  const scoreEmoji = (s: string) => s === "rouge" ? "🔴" : s === "orange" ? "🟡" : "🟢";
  const daysLeft = (t: string) => t ? Math.ceil((new Date(t).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

  if (loading) return <div style={{ padding: "40px", fontFamily: "DM Sans", color: "var(--texte-discret)", textAlign: "center" }}>Chargement···</div>;
  return (
    <main style={{ backgroundColor: "var(--fond)", minHeight: "100dvh", fontFamily: "DM Sans, sans-serif", padding: "24px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
          <div>
            <p style={{ color: "var(--texte-discret)", fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase" }}>FIRMAMENT</p>
            <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "28px", fontWeight: 300, color: "var(--texte)", marginTop: "4px" }}>Dashboard Admin</h1>
          </div>
          <div style={{ display: "flex", gap: "20px", fontSize: "13px", color: "var(--texte-discret)" }}>
            <span>🟢 {users.filter(u => u.surcharge_score === "vert").length} sereins</span>
            <span>🟡 {users.filter(u => u.surcharge_score === "orange").length} vigilance</span>
            <span>🔴 {users.filter(u => u.surcharge_score === "rouge").length} urgents</span>
            <span style={{ color: "var(--texte-secondary)" }}>{users.length} utilisateurs total</span>
          </div>
        </div>

        <p style={{ fontSize: "12px", color: "var(--texte-discret)", marginBottom: "20px", fontStyle: "italic" }}>
          Confidentialité totale : zéro contenu de Dump ou conversation visible. Indicateurs uniquement.
        </p>

        <div style={{ backgroundColor: "var(--fond-blanc)", borderRadius: "12px", border: "1px solid rgba(26,18,16,0.08)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "var(--fond)", borderBottom: "1px solid rgba(26,18,16,0.08)" }}>
                {["Utilisateur", "Mode", "Surcharge", "Clarté", "Jours restants", "Depuis", "Action"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--texte-discret)", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => {
                const dl = daysLeft(u.trial_ends_at);
                return (
                  <tr key={u.id} style={{ borderBottom: i < users.length - 1 ? "1px solid rgba(26,18,16,0.06)" : "none" }}>
                    <td style={{ padding: "14px 16px" }}>
                      <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--texte)" }}>{u.prenom || "—"}</p>
                      <p style={{ fontSize: "12px", color: "var(--texte-discret)" }}>{u.email}</p>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ fontSize: "12px", backgroundColor: u.ai_mode === "stefi" ? "rgba(92,26,46,0.08)" : "rgba(26,18,16,0.06)", color: u.ai_mode === "stefi" ? "var(--bordeaux)" : "var(--texte-secondary)", padding: "3px 8px", borderRadius: "10px" }}>
                        {u.ai_mode === "stefi" ? "Stefi" : "Terri"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ color: scoreColor(u.surcharge_score), fontWeight: 600, fontSize: "13px" }}>
                        {scoreEmoji(u.surcharge_score)} {u.surcharge_score || "vert"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ fontSize: "13px", color: (u.clarity_score || 0) < 30 ? "#B00020" : "var(--texte-secondary)" }}>
                        {u.clarity_score ?? "—"}%
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ fontSize: "13px", color: dl !== null && dl <= 5 ? "var(--bordeaux)" : "var(--texte-secondary)" }}>
                        {dl !== null ? (dl <= 0 ? "Expiré" : `${dl}j`) : "—"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: "12px", color: "var(--texte-discret)" }}>
                      {new Date(u.created_at).toLocaleDateString("fr-FR")}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <a href={`mailto:${u.email}?subject=FIRMAMENT — Un message de l'équipe Duleme & Cie`}
                        style={{ backgroundColor: "var(--bordeaux)", color: "var(--fond-blanc)", borderRadius: "8px", padding: "6px 12px", fontSize: "12px", textDecoration: "none", fontFamily: "DM Sans", fontWeight: 500 }}>
                        Contacter
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
