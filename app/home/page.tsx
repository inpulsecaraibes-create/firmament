/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Settings, ClipboardList, Bookmark, Check, X } from "lucide-react";

function capitalize(s: string) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

// Composant tâche avec swipe gauche/droit
function SwipeableTaskRow({ task, isDone, onDone, onUpdate, borderBottom }: {
  task: Task; isDone: boolean;
  onDone: () => void;
  onUpdate: (id: string, u: { is_urgent?: boolean; is_priority?: boolean; is_sleeping?: boolean }) => void;
  borderBottom: boolean;
}) {
  const [swipeX, setSwipeX] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const dragging = useRef(false);

  function onTouchStart(e: React.TouchEvent) {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    dragging.current = false;
  }
  function onTouchMove(e: React.TouchEvent) {
    if (!touchStart.current) return;
    const dx = e.touches[0].clientX - touchStart.current.x;
    const dy = e.touches[0].clientY - touchStart.current.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
      dragging.current = true;
      setSwipeX(Math.max(-100, Math.min(100, dx)));
    }
  }
  function onTouchEnd() {
    if (!dragging.current) { touchStart.current = null; return; }
    if (swipeX < -60) {
      // Swipe gauche → ouvrir dump pour retravailler
      window.location.href = `/dump?rework=${encodeURIComponent(task.title)}`;
    } else if (swipeX > 60) {
      // Swipe droit → panneau statut
      setShowPanel(true);
      if (navigator.vibrate) navigator.vibrate(10);
    }
    setSwipeX(0);
    touchStart.current = null; dragging.current = false;
  }

  return (
    <>
      {showPanel && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "flex-end" }} onClick={() => setShowPanel(false)}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: "var(--fond-blanc)", borderLeft: "2px solid var(--bordeaux)", borderRadius: "16px 16px 0 0", width: "100%", padding: "20px 20px 40px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--texte)", flex: 1, lineHeight: "1.4", paddingRight: "12px" }}>{task.title}</p>
              <button onClick={() => setShowPanel(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--texte-discret)" }}><X size={18} /></button>
            </div>
            {[
              { field: "is_urgent" as const, emoji: "⚡", label: "Urgent", desc: "Remonte dans le top 3", value: task.is_urgent, disabled: task.is_sleeping },
              { field: "is_priority" as const, emoji: "↑", label: "Priorité haute", desc: "Monte d'un cran", value: task.is_priority, disabled: task.is_sleeping },
              { field: "is_sleeping" as const, emoji: "💤", label: "En sommeil", desc: "Retire de la vue", value: task.is_sleeping, disabled: false },
            ].map(({ field, emoji, label, desc, value, disabled }) => (
              <button key={field} disabled={disabled} onClick={() => {
                if (field === "is_sleeping" && !value) { onUpdate(task.id, { is_sleeping: true, is_urgent: false, is_priority: false }); }
                else if (field === "is_sleeping" && value) { onUpdate(task.id, { is_sleeping: false }); }
                else { onUpdate(task.id, { [field]: !value }); }
              }}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "13px 16px", background: "none", border: "1px solid rgba(26,18,16,0.08)", borderRadius: "10px", cursor: disabled ? "not-allowed" : "pointer", marginBottom: "8px", opacity: disabled ? 0.35 : 1, backgroundColor: value && !disabled ? "var(--fond-or)" : "transparent" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "18px" }}>{emoji}</span>
                  <div style={{ textAlign: "left" }}>
                    <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--texte)", marginBottom: "1px" }}>{label}</p>
                    <p style={{ fontSize: "11px", color: "var(--texte-discret)" }}>{desc}</p>
                  </div>
                </div>
                <div style={{ width: "42px", height: "24px", borderRadius: "12px", backgroundColor: value && !disabled ? "var(--bordeaux)" : "rgba(26,18,16,0.12)", position: "relative" }}>
                  <div style={{ width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "white", position: "absolute", top: "3px", left: value && !disabled ? "21px" : "3px", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "13px 16px", borderBottom: borderBottom ? "1px solid rgba(26,18,16,0.06)" : "none", transform: `translateX(${swipeX}px)`, transition: swipeX === 0 ? "transform 0.2s" : "none", backgroundColor: isDone ? "rgba(27,58,45,0.04)" : "transparent" }}>
        <button onClick={onDone}
          style={{ width: "22px", height: "22px", borderRadius: "50%", border: `1.5px solid ${isDone ? "var(--vert)" : "rgba(92,26,46,0.25)"}`, backgroundColor: isDone ? "var(--vert)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer", marginTop: "1px", transition: "all 0.3s" }}>
          {isDone && <Check size={12} color="white" strokeWidth={3} />}
        </button>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "14px", color: isDone ? "var(--texte-discret)" : "var(--texte)", lineHeight: "1.4", textDecoration: isDone ? "line-through" : "none", transition: "all 0.2s" }}>{task.title}</p>
          {task.subtitle && <p style={{ fontSize: "12px", color: "var(--texte-discret)", marginTop: "2px" }}>{task.subtitle}</p>}
          {task.deadline_text && <p style={{ fontSize: "11px", color: "var(--bordeaux)", marginTop: "2px" }}>⏰ {task.deadline_text}</p>}
        </div>
        {task.is_urgent && !isDone && <span style={{ backgroundColor: "rgba(92,26,46,0.08)", color: "var(--bordeaux)", fontSize: "10px", fontWeight: 600, padding: "2px 6px", borderRadius: "8px", flexShrink: 0 }}>!</span>}
        {task.is_priority && !task.is_urgent && !isDone && <span style={{ backgroundColor: "rgba(140,109,63,0.1)", color: "var(--or)", fontSize: "10px", padding: "2px 5px", borderRadius: "6px", flexShrink: 0 }}>↑</span>}
      </div>
    </>
  );
}
import { createClient } from "@/app/lib/supabase/client";
import { getCosmicLine } from "@/app/lib/cosmic";

interface Task { id: string; title: string; subtitle?: string; theme_id?: string; status: string; is_urgent: boolean; is_priority: boolean; is_sleeping: boolean; deadline_text?: string; position: number; }
interface Theme { id: string; title: string; tasks: Task[]; }
interface Profile { prenom: string; objectif_aimant: string; objectif_debut: string; objectif_horizon: number; trial_ends_at: string; dark_mode: boolean; font_size: number; }

const cosmicLine = getCosmicLine();

// Anneau SVG Objectif Aimant
function ObjAimantRing({ phrase, progress, onClick }: { phrase?: string; progress: number; onClick: () => void }) {
  const size = 100; const sw = 4; const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (progress / 100) * circ;
  const done = progress >= 100;

  return (
    <button onClick={onClick} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(92,26,46,0.1)" strokeWidth={sw} />
        {progress > 0 && (
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={done ? "#1B3A2D" : "#5C1A2E"}
            strokeWidth={sw} strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: "stroke-dashoffset 0.6s ease" }} />
        )}
        {done ? (
          <text x={size / 2} y={size / 2 + 6} textAnchor="middle" fontSize="22">✦</text>
        ) : phrase ? (
          <>
            <text x={size / 2} y={size / 2 - 4} textAnchor="middle" fontSize="14" fill="#5C1A2E" fontFamily="DM Sans" fontWeight="500">{progress}%</text>
            <text x={size / 2} y={size / 2 + 10} textAnchor="middle" fontSize="9" fill="#B0A098" fontFamily="DM Sans">du cap</text>
          </>
        ) : (
          <text x={size / 2} y={size / 2 + 5} textAnchor="middle" fontSize="20" fill="rgba(92,26,46,0.25)">◎</text>
        )}
      </svg>
      {!phrase && <p style={{ color: "var(--texte-discret)", fontSize: "12px", fontStyle: "italic", fontFamily: "Cormorant Garamond, serif" }}>Poser mon cap avec Téfi →</p>}
    </button>
  );
}

export default function HomePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [showPhrase, setShowPhrase] = useState(false);
  const [openThemes, setOpenThemes] = useState<Set<string>>(new Set());
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [tefiGreeting, setTefiGreeting] = useState<string>("");
  const greetingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const supabase = createClient();

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/auth/login"; return; }

    const { data: p } = await supabase.from("profiles").select("prenom,objectif_aimant,objectif_debut,objectif_horizon,trial_ends_at,dark_mode,font_size").eq("id", user.id).single();
    if (p) {
      setProfile(p as Profile);
      if (p.dark_mode) document.documentElement.setAttribute("data-theme", "dark");
      if (p.trial_ends_at) {
        const d = Math.ceil((new Date(p.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        setDaysLeft(d);
        setIsExpired(d <= 0);
      }

      // Bulle d'accueil Téfi — première ouverture de la journée
      const todayKey = `firmament_last_visit_${user.id}`;
      const lastVisit = localStorage.getItem(todayKey);
      const today = new Date().toISOString().split("T")[0];
      if (lastVisit !== today) {
        localStorage.setItem(todayKey, today);
        // Vérifier s'il y avait des priorités hier
        const { data: yesterdayTasks } = await supabase.from("tasks").select("title").eq("user_id", user.id).eq("status", "active").eq("is_priority", true).limit(1);
        const nom = capitalize(p.prenom || "");
        if (yesterdayTasks && yesterdayTasks.length > 0) {
          setTefiGreeting(`Bonjour${nom ? " " + nom : ""}. Tu avais "${yesterdayTasks[0].title}" comme priorité hier. Ça s'est passé comment ?`);
          greetingTimerRef.current = setTimeout(() => setTefiGreeting(""), 7000);
        }
      }
    }

    // Top 3 tasks
    const { data: t } = await supabase.from("tasks").select("*").eq("user_id", user.id).eq("status", "active").eq("is_sleeping", false).order("is_urgent", { ascending: false }).order("is_priority", { ascending: false }).order("position", { ascending: true }).limit(3);
    if (t) setTasks(t);

    // Themes avec tasks
    const { data: th } = await supabase.from("themes").select("*, tasks(*)").eq("user_id", user.id).order("position");
    if (th) setThemes(th.map(t => ({ ...t, tasks: (t.tasks || []).filter((tk: Task) => tk.status === "active" && !tk.is_sleeping).sort((a: Task, b: Task) => a.position - b.position) })));
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  // Animation : barrer → rester 3s → disparaître
  const [doneAnimating, setDoneAnimating] = useState<Set<string>>(new Set());

  async function toggleTask(id: string) {
    setDoneAnimating(prev => { const n = new Set(prev); n.add(id); return n; });
    await supabase.from("tasks").update({ status: "done" }).eq("id", id);
    if (navigator.vibrate) navigator.vibrate([5, 30, 5]);
    setTimeout(() => {
      setTasks(prev => prev.filter(t => t.id !== id));
      setDoneAnimating(prev => { const n = new Set(prev); n.delete(id); return n; });
    }, 3000);
  }

  // Mise à jour urgence/priorité/sommeil depuis le panneau swipe
  async function updateTaskStatus(id: string, updates: { is_urgent?: boolean; is_priority?: boolean; is_sleeping?: boolean }) {
    await supabase.from("tasks").update(updates).eq("id", id);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    if (updates.is_sleeping) setTasks(prev => prev.filter(t => t.id !== id));
    if (navigator.vibrate) navigator.vibrate(10);
  }

  function toggleTheme(id: string) {
    setOpenThemes(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }

  // Calcul progression objectif
  const objProgress = (() => {
    if (!profile?.objectif_debut || !profile?.objectif_aimant) return 0;
    const allTasks = themes.flatMap(t => t.tasks);
    if (allTasks.length === 0) return 0;
    const done = themes.flatMap(t => t.tasks).filter(t => t.status === "done").length;
    return Math.min(100, Math.round((done / allTasks.length) * 100));
  })();

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Bonjour" : h < 18 ? "Bonjour" : "Bonsoir";
  })();

  return (
    <main style={{ backgroundColor: "var(--fond)", minHeight: "100dvh", fontFamily: "DM Sans, sans-serif", paddingBottom: "80px" }}>

      {/* HEADER */}
      <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(26,18,16,0.06)" }}>
        <div>
          <p style={{ color: "var(--texte-discret)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase" }}>FIRMAMENT</p>
          <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "20px", fontWeight: 300, color: "var(--texte)", marginTop: "2px" }}>
            {greeting}{profile?.prenom ? `, ${capitalize(profile.prenom)}` : ""}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          {daysLeft !== null && daysLeft <= 10 && daysLeft > 0 && (
            <span style={{ fontSize: "11px", color: daysLeft <= 5 ? "var(--bordeaux)" : "var(--or)", fontWeight: 500 }}>{daysLeft}j</span>
          )}
          <a href="/point" title="Le Point" style={{ color: "var(--texte-discret)", textDecoration: "none" }}><Bookmark size={16} /></a>
          <a href="/decisions" title="Décisions" style={{ color: "var(--texte-discret)", textDecoration: "none" }}><ClipboardList size={16} /></a>
          <a href="/parametres" title="Paramètres" style={{ color: "var(--texte-discret)", textDecoration: "none" }}><Settings size={16} /></a>
        </div>
      </div>

      {/* Bulle d'accueil Téfi */}
      {tefiGreeting && (
        <a href="/dump" style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "12px 20px", backgroundColor: "var(--fond-or)", textDecoration: "none", cursor: "pointer", borderBottom: "1px solid rgba(26,18,16,0.06)" }}
          onClick={() => { if (greetingTimerRef.current) clearTimeout(greetingTimerRef.current); setTefiGreeting(""); }}>
          <div style={{ width: "26px", height: "26px", borderRadius: "50%", backgroundColor: "var(--bordeaux)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontFamily: "Cormorant Garamond, serif", color: "var(--fond-blanc)", fontSize: "14px", fontStyle: "italic" }}>t</span>
          </div>
          <p style={{ fontSize: "14px", color: "var(--texte-secondary)", lineHeight: "1.5", fontStyle: "italic", fontFamily: "Cormorant Garamond, serif" }}>{tefiGreeting}</p>
        </a>
      )}

      <div style={{ padding: "20px 20px 0", overflowY: "auto" }}>

        {/* OBJECTIF AIMANT */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "24px" }}>
          <ObjAimantRing
            phrase={profile?.objectif_aimant}
            progress={objProgress}
            onClick={() => profile?.objectif_aimant ? setShowPhrase(!showPhrase) : window.location.href = "/auth/objectif"}
          />
          {showPhrase && profile?.objectif_aimant && (
            <div style={{ marginTop: "8px", backgroundColor: "var(--fond-blanc)", border: "1px solid rgba(92,26,46,0.1)", borderRadius: "10px", padding: "12px 16px", maxWidth: "280px", textAlign: "center" }}>
              <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "15px", fontStyle: "italic", color: "var(--texte-secondary)", lineHeight: "1.5" }}>{profile.objectif_aimant}</p>
            </div>
          )}
        </div>

        {/* TOP 3 AUJOURD'HUI */}
        <div style={{ marginBottom: "8px" }}>
          <p style={{ color: "var(--texte-discret)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "10px" }}>Aujourd'hui</p>
          {tasks.length === 0 ? (
            <p style={{ color: "var(--texte-discret)", fontSize: "14px", fontStyle: "italic", fontFamily: "Cormorant Garamond, serif", padding: "12px 0" }}>
              Fais un Dump — Téfi identifiera tes priorités.
            </p>
          ) : (
            <div style={{ backgroundColor: "var(--fond-blanc)", borderRadius: "12px", border: "1px solid rgba(26,18,16,0.07)", overflow: "hidden" }}>
              <p style={{ fontSize: "10px", color: "var(--texte-discret)", padding: "6px 16px 0", fontStyle: "italic" }}>← glisse pour modifier · → pour les options</p>
              {tasks.map((task, i) => (
                <SwipeableTaskRow key={task.id} task={task} isDone={doneAnimating.has(task.id)} onDone={() => toggleTask(task.id)} onUpdate={updateTaskStatus} borderBottom={i < tasks.length - 1} />
              ))}
            </div>
          )}
        </div>

        {/* SÉPARATEUR */}
        <div style={{ height: "1px", backgroundColor: "rgba(26,18,16,0.07)", margin: "16px 0" }} />

        {/* THÉMATIQUES (HORIZON) */}
        <div style={{ marginBottom: "20px" }}>
          <p style={{ color: "var(--texte-discret)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "10px" }}>Thématiques</p>
          {themes.length === 0 ? (
            <p style={{ color: "var(--texte-discret)", fontSize: "13px", fontStyle: "italic", fontFamily: "Cormorant Garamond, serif" }}>Tes thématiques apparaîtront ici au fil de tes Dumps.</p>
          ) : (
            themes.map(th => (
              <div key={th.id} style={{ backgroundColor: "var(--fond-blanc)", border: "1px solid rgba(26,18,16,0.07)", borderRadius: "10px", marginBottom: "4px", overflow: "hidden" }}>
                <button onClick={() => toggleTheme(th.id)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "13px 16px", background: "none", border: "none", cursor: "pointer" }}>
                  <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--texte)" }}>{th.title}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "12px", color: "var(--texte-discret)" }}>{th.tasks.length}</span>
                    <span style={{ color: "var(--texte-discret)", fontSize: "12px" }}>{openThemes.has(th.id) ? "▾" : "▸"}</span>
                  </div>
                </button>
                {openThemes.has(th.id) && (
                  <div style={{ borderTop: "1px solid rgba(26,18,16,0.06)" }}>
                    {th.tasks.map((task, i) => {
                      // Blur tâches 6+ si trial expiré
                      const isBlurred = isExpired && i >= 5;
                      return (
                        <div key={task.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 16px", borderBottom: i < th.tasks.length - 1 ? "1px solid rgba(26,18,16,0.04)" : "none", filter: isBlurred ? "blur(4px)" : "none", pointerEvents: isBlurred ? "none" : "auto", position: "relative" }}>
                          {isBlurred && <span style={{ position: "absolute", right: "12px", fontSize: "14px" }}>🔒</span>}
                          <button onClick={async () => {
                            await supabase.from("tasks").update({ status: "done" }).eq("id", task.id);
                            setThemes(prev => prev.map(t => t.id === th.id ? { ...t, tasks: t.tasks.filter(tk => tk.id !== task.id) } : t));
                          }} style={{ width: "18px", height: "18px", borderRadius: "4px", border: "1.5px solid rgba(92,26,46,0.2)", backgroundColor: "transparent", cursor: "pointer", flexShrink: 0 }} />
                          <span style={{ fontSize: "13px", color: "var(--texte-secondary)", flex: 1, lineHeight: "1.4" }}>{task.title}</span>
                          {task.deadline_text && <span style={{ fontSize: "11px", color: "var(--texte-discret)" }}>{task.deadline_text}</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* TÉFI DISPONIBLE */}
        <a href="/dump" style={{ display: "block", textAlign: "center", color: "var(--texte-discret)", fontSize: "13px", fontStyle: "italic", fontFamily: "Cormorant Garamond, serif", padding: "12px 0", textDecoration: "none" }}>
          Téfi est disponible si tu veux parler.
        </a>
      </div>

      {/* LIGNE COSMIQUE */}
      <p style={{ position: "fixed", bottom: "62px", left: 0, right: 0, textAlign: "center", color: "var(--texte-discret)", fontSize: "10px", fontStyle: "italic", fontFamily: "DM Sans", pointerEvents: "none" }}>
        {cosmicLine}
      </p>

      {/* NAV BAS */}
      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, backgroundColor: "var(--fond-blanc)", borderTop: "1px solid rgba(26,18,16,0.08)", display: "flex", alignItems: "center", padding: "8px 16px 20px" }}>
        <a href="/dump" style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", backgroundColor: "var(--bordeaux)", color: "var(--fond-blanc)", borderRadius: "12px", padding: "12px 20px", textDecoration: "none", fontSize: "14px", fontFamily: "DM Sans", fontWeight: 500 }}>
          🧠 Le Dump
        </a>
        <a href="/horizon" style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", backgroundColor: "transparent", color: "var(--texte-secondary)", borderRadius: "12px", padding: "12px 16px", textDecoration: "none", fontSize: "14px", fontFamily: "DM Sans", fontWeight: 500, border: "1.5px solid rgba(26,18,16,0.1)", margin: "0 8px" }}>
          📅 Horizon
        </a>
        {/* Le Relais — plus petit, plus haut */}
        <a href="/relais" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "42px", height: "42px", borderRadius: "50%", backgroundColor: "transparent", color: "var(--texte-discret)", border: "1.5px solid rgba(26,18,16,0.12)", textDecoration: "none", fontSize: "18px", marginBottom: "8px", flexShrink: 0 }} title="Le Relais">
          💬
        </a>
      </nav>
    </main>
  );
}
