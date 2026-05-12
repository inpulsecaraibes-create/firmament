/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowLeft, ArrowRight, Send } from "lucide-react";
import { createClient } from "@/app/lib/supabase/client";
import { getCosmicLine } from "@/app/lib/cosmic";

const cosmicLine = getCosmicLine();

interface Msg { role: "user" | "assistant"; content: string; tasks?: TaskItem[]; }
interface TaskItem {
  title: string;
  subtitle?: string;
  subtasks?: string[];
  is_urgent?: boolean;
  deadline_text?: string;
  suggest_block?: boolean;
  suggested_duration?: number;
}

function capitalize(s: string) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

export default function DumpPage() {
  const [screen, setScreen] = useState<"dump" | "chat">("dump");
  const [dump, setDump] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [prenom, setPrenom] = useState<string>("");
  const [listening, setListening] = useState(false);
  const [etincelles, setEtincelles] = useState<string[]>([]);
  const [, setPointMode] = useState(false); // Le Point intégré
  const [gate5Email, setGate5Email] = useState(""); // Email gate au 5ème échange
  const [gate5Sent, setGate5Sent] = useState(false); // Email capturé
  // tempId pour tracking non-connecté
  useState<string>(() => {
    if (typeof window === "undefined") return "";
    const existing = localStorage.getItem("firmament_temp_id");
    if (existing) return existing;
    const newId = crypto.randomUUID();
    localStorage.setItem("firmament_temp_id", newId);
    return newId;
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const loadUser = useCallback(async () => {
    // Correction 4 : si arrivée depuis email avec tempId → forcer migration
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const emailTempId = params.get("tempId");
      const fromEmail = params.get("from") === "email";
      if (fromEmail && emailTempId) {
        localStorage.setItem("firmament_temp_id", emailTempId);
      }
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      const { data: p } = await supabase.from("profiles").select("prenom,entreprise,etat_moment").eq("id", user.id).single();
      if (p?.prenom) setPrenom(capitalize(p.prenom));

      // Étincelles contextuelles basées sur le profil et les patterns
      const { data: patterns } = await supabase.from("patterns").select("keyword").eq("user_id", user.id).eq("resolved", false).order("count", { ascending: false }).limit(3);
      const { data: pendingTasks } = await supabase.from("tasks").select("title").eq("user_id", user.id).eq("status", "active").limit(3);

      const suggestions: string[] = [];
      if (patterns?.length) suggestions.push(`Revenir sur "${patterns[0].keyword}"`);
      if (pendingTasks?.length) suggestions.push(`Avancer sur : ${pendingTasks[0].title.slice(0, 40)}`);
      if (p?.etat_moment === "surcharge") suggestions.push("Je suis surchargé, aide-moi à trier");
      else if (p?.etat_moment === "flou") suggestions.push("J'ai besoin de clarté sur ma direction");
      else suggestions.push("Je ne sais plus par où commencer");
      if (suggestions.length < 3) suggestions.push("J'ai plusieurs choses en cours que je n'avance pas");

      setEtincelles(suggestions.slice(0, 3));

      // Vérifier si c'est le 1er accès (0 tâches) → cycle d'extraction complet
      const { count: taskCount } = await supabase.from("tasks").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "active");
      if ((taskCount || 0) === 0) {
        // Premier accès → Téfi démarre le cycle de 5 questions
        const firstMsg: Msg = { role: "assistant", content: "Avant qu'on organise ton espace, j'ai besoin de savoir où tu en es.\n\nDis-moi tout ce que tu as à faire en ce moment — maintenant, demain, dans 6 mois. Balance tout, dans l'ordre que tu veux." };
        setMessages([firstMsg]);
        setScreen("chat");
        return;
      }

      // Vérifier si Le Point doit s'ouvrir (7 jours depuis inscription ou dernier point)
      const { data: profileData } = await supabase.from("profiles").select("created_at").eq("id", user.id).single();
      const { data: lastPoint } = await supabase.from("points").select("created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).single();
      const ref = lastPoint?.created_at || profileData?.created_at;
      if (ref) {
        const daysSince = Math.floor((Date.now() - new Date(ref).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSince >= 7) {
          setPointMode(true);
          const pointMsg: Msg = { role: "assistant", content: "Ça fait une semaine. Avant qu'on parle de la suite, dis-moi : qu'est-ce que tu as accompli ?" };
          setMessages([pointMsg]);
          setScreen("chat");
        }
      }
    } else {
      // Étincelles génériques pour non-connectés
      setEtincelles([
        "Je ne sais plus par où commencer…",
        "J'ai plusieurs projets en cours mais rien n'avance",
        "Mon équipe me prend trop d'énergie",
      ]);
    }
  }, [supabase]);

  useEffect(() => { loadUser(); }, [loadUser]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function savePendingTask(tasks: TaskItem[], themeName: string) {
    const pending = JSON.parse(localStorage.getItem("firmament_pending_tasks") || "[]");
    localStorage.setItem("firmament_pending_tasks", JSON.stringify([...pending, { theme: themeName, tasks }]));
  }

  async function saveTasksToSupabase(tasks: TaskItem[], themeName: string) {
    if (!userId) { await savePendingTask(tasks, themeName); return; }
    try {
      const res = await fetch("/api/migrate-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, pendingTasks: [{ theme: themeName, tasks }] }),
      });
      if (!res.ok) throw new Error("migration failed");
    } catch (e) {
      console.error("saveTasks error:", e);
      await savePendingTask(tasks, themeName);
    }
  }

  async function handleClarify() {
    if (dump.trim().length < 5 || loading) return;
    setLoading(true);

    // Sauvegarder le dump + tracker le parrainage
    if (userId) {
      await supabase.from("conversations").insert({ user_id: userId, role: "user", content: dump, session_date: new Date().toISOString().split("T")[0] });
      // Parrainage tracking (non bloquant)
      fetch("/api/track-dump", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) }).catch(() => {});
    }

    try {
      const res = await fetch("/api/tefi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brainDump: dump, userId }),
      });
      const d = await res.json();

      if (d.observation) {
        // Inclure la formulation AIMANT+ si disponible
        const aimantBlock = d.aimant ? `\n\n${d.aimant}` : "";
        const tefiContent = `${d.observation}\n\n${aimantBlock}\n\n${d.actions.map((a: string, i: number) => `${i + 1}. ${a}`).join("\n")}\n\n${d.question}`.trim();

        // Créer les tâches depuis les actions
        const taskItems: TaskItem[] = d.actions.map((a: string) => ({ title: a }));

        // Sauvegarder tâches sous le nom de la priorité (= le projet/thème)
        await saveTasksToSupabase(taskItems, d.priority?.slice(0, 60) || "Priorité");

        const msgs: Msg[] = [
          { role: "user", content: dump },
          { role: "assistant", content: tefiContent, tasks: taskItems },
        ];
        setMessages(msgs);

        if (userId) {
          await supabase.from("conversations").insert({ user_id: userId, role: "assistant", content: tefiContent, session_date: new Date().toISOString().split("T")[0] });
        }
        setScreen("chat");
      } else {
        throw new Error("no observation");
      }
    } catch {
      setMessages([
        { role: "user", content: dump },
        { role: "assistant", content: "J'ai du mal à te répondre là — une petite pause technique. Tu veux réessayer dans quelques secondes ?" },
      ]);
      setScreen("chat");
    }
    setLoading(false);
  }

  async function handleSend() {
    if (!input.trim() || chatLoading) return;
    // Gate au 5ème échange pour non-connectés — email obligatoire
    const userMsgCount = messages.filter(m => m.role === "user").length;
    if (!userId && userMsgCount >= 5 && !gate5Sent) return;
    const userMsg: Msg = { role: "user", content: input };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    const sent = input;
    setInput("");
    setChatLoading(true);

    if (userId) await supabase.from("conversations").insert({ user_id: userId, role: "user", content: sent, session_date: new Date().toISOString().split("T")[0] });

    try {
      const res = await fetch("/api/tefi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMsgs.slice(-20).map(m => ({ role: m.role, content: m.content })), userId }),
      });
      const d = await res.json();

      let displayText = d.text || "";
      let msgTasks: TaskItem[] | undefined;

      // Intercepter les tâches JSON — ne jamais afficher dans les bulles
      if (d.tasks?.items?.length) {
        msgTasks = d.tasks.items;
        await saveTasksToSupabase(d.tasks.items, d.tasks.items[0]?.theme || "Nouvelles tâches");
        if (!displayText.includes("organisé")) {
          displayText = (displayText || "J'ai organisé tout ça dans ton espace.").trim();
        }
      }

      // Intercepter les décisions
      if (d.decision?.content && userId) {
        await supabase.from("decisions").insert({ user_id: userId, content: d.decision.content, detected_from: "dump" });
      }

      const assistantMsg: Msg = { role: "assistant", content: displayText, tasks: msgTasks };
      setMessages([...newMsgs, assistantMsg]);

      if (userId) await supabase.from("conversations").insert({ user_id: userId, role: "assistant", content: displayText, session_date: new Date().toISOString().split("T")[0] });
    } catch {
      setMessages([...newMsgs, { role: "assistant", content: "J'ai du mal à te répondre là — une petite pause technique. Tu veux réessayer ?" }]);
    }
    setChatLoading(false);
  }

  // Whisper (haute qualité) avec fallback sur browser Speech API
  async function toggleVoice(targetSetter: (v: string) => void) {
    if (listening) {
      // Arrêter — si on est en mode Whisper, déclencher la transcription
      if (recRef.current?.mediaRecorder) {
        recRef.current.mediaRecorder.stop();
      } else {
        recRef.current?.stop();
      }
      setListening(false);
      return;
    }

    // Essayer Whisper d'abord via MediaRecorder
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/ogg";
        const recorder = new MediaRecorder(stream, { mimeType });
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
        recorder.onstop = async () => {
          stream.getTracks().forEach(t => t.stop());
          const blob = new Blob(chunks, { type: mimeType });
          const form = new FormData();
          form.append("audio", blob, "audio.webm");
          form.append("language", "fr");

          setListening(false);
          // Indicateur de traitement
          // Ajouter indicateur visuel
          const existingVal = document.querySelector("textarea")?.value || "";
          targetSetter(existingVal + " [transcription en cours...]");

          try {
            const res = await fetch("/api/transcribe", { method: "POST", body: form });
            const d = await res.json();
            if (d.transcript) {
              // Remplacer l'indicateur par la transcription réelle
              const currentVal = document.querySelector("textarea")?.value || "";
              targetSetter(currentVal.replace(" [transcription en cours...]", "") + " " + d.transcript.trim());
              return;
            }
          } catch { /* fallback */ }

          // Si Whisper échoue → supprimer l'indicateur
          const currentVal2 = document.querySelector("textarea")?.value || "";
          targetSetter(currentVal2.replace(" [transcription en cours...]", ""));
        };

        recRef.current = { mediaRecorder: recorder };
        recorder.start();
        setListening(true);
        return;
      } catch { /* fallback vers browser API */ }
    }

    // Fallback : browser Speech Recognition API
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.lang = "fr-FR"; r.continuous = true; r.interimResults = true;
    r.onresult = (ev: { results: SpeechRecognitionResultList }) => {
      targetSetter(Array.from(ev.results).map((x) => (x as SpeechRecognitionResult)[0].transcript).join(""));
    };
    r.onend = () => setListening(false);
    r.start(); recRef.current = r; setListening(true);
  }

  // ── ÉCRAN DUMP ─────────────────────────────────────────────────────────
  if (screen === "dump") {
    return (
      <main style={{ backgroundColor: "var(--fond)", minHeight: "100dvh", fontFamily: "DM Sans, sans-serif" }}>
        <div style={{ maxWidth: "560px", margin: "0 auto", padding: "32px 24px", display: "flex", flexDirection: "column", minHeight: "100dvh" }}>

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
            <a href={userId ? "/home" : "/"} style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--bordeaux)", textDecoration: "none", fontSize: "14px", fontWeight: 500 }}>
              <ArrowLeft size={18} /> {userId ? "Mon espace" : "Accueil"}
            </a>
            {!userId && (
              <a href="/auth/login" style={{ color: "var(--texte-discret)", fontSize: "12px", textDecoration: "none" }}>
                On se connaît déjà →
              </a>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "clamp(24px,4vw,36px)", fontWeight: 300, color: "var(--texte)", lineHeight: "1.3", marginBottom: "28px", fontStyle: "italic", textAlign: "center" }}>
              Qu'est-ce qui occupe tout l'espace dans ton esprit aujourd'hui ?
            </h1>

            {/* Zone de texte */}
            <textarea
              value={dump}
              onChange={e => setDump(e.target.value)}
              placeholder="Je t'écoute."
              rows={8}
              style={{ width: "100%", backgroundColor: "var(--fond-blanc)", color: "var(--texte)", borderBottom: "2px solid var(--texte-discret)", borderTop: "none", borderLeft: "none", borderRight: "none", resize: "none", fontSize: "17px", lineHeight: "1.7", padding: "16px 4px", fontFamily: "DM Sans", marginBottom: "20px" }}
              onFocus={e => { e.target.style.borderBottomColor = "var(--bordeaux)"; }}
              onBlur={e => { e.target.style.borderBottomColor = "var(--texte-discret)"; }}
            />

            {dump.length > 20 && (
              <p style={{ fontSize: "11px", color: "var(--texte-discret)", textAlign: "right", marginTop: "-16px", marginBottom: "8px" }}>{dump.length} car.</p>
            )}

            {/* Étincelles — s'affichent si le dump est vide */}
            {dump.trim().length === 0 && etincelles.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                {etincelles.map((e, i) => (
                  <button key={i} onClick={() => setDump(e)}
                    style={{ background: "none", border: "1.5px solid rgba(92,26,46,0.15)", borderRadius: "20px", padding: "9px 16px", fontSize: "13px", fontFamily: "DM Sans", color: "var(--texte-tertiary)", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--bordeaux)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--bordeaux)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(92,26,46,0.15)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--texte-tertiary)"; }}>
                    {e}
                  </button>
                ))}
              </div>
            )}

            {/* BOUTON VOIX — icône seule, mode principal */}
            <button
              onClick={() => toggleVoice(setDump)}
              title={listening ? "Arrêter la dictée" : "Dicter"}
              style={{
                width: "100%",
                backgroundColor: listening ? "var(--bordeaux)" : "var(--fond-blanc)",
                color: listening ? "var(--fond-blanc)" : "var(--bordeaux)",
                border: `2px solid ${listening ? "var(--bordeaux)" : "rgba(92,26,46,0.25)"}`,
                borderRadius: "12px",
                padding: "16px",
                fontSize: "28px",
                cursor: "pointer",
                marginBottom: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
                position: "relative",
              }}
            >
              {listening ? "⏹" : "🎤"}
              {listening && (
                <span style={{ position: "absolute", bottom: "6px", right: "10px", fontSize: "10px", color: "rgba(248,245,240,0.7)", fontFamily: "DM Sans" }}>
                  ●  en cours
                </span>
              )}
            </button>

            {/* Bouton Clarifier */}
            <button
              onClick={handleClarify}
              disabled={dump.trim().length < 5 || loading}
              style={{ backgroundColor: dump.trim().length >= 5 && !loading ? "var(--bordeaux)" : "var(--texte-discret)", color: "var(--fond-blanc)", borderRadius: "12px", padding: "16px", fontSize: "15px", fontFamily: "DM Sans", fontWeight: 500, border: "none", width: "100%", cursor: dump.trim().length >= 5 && !loading ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              {loading ? "···" : <><span>Clarifier</span><ArrowRight size={16} /></>}
            </button>

            <p style={{ fontSize: "11px", color: "var(--texte-discret)", fontStyle: "italic", marginTop: "16px", textAlign: "center" }}>
              Tes pensées sont chiffrées et ne quittent pas FIRMAMENT.
            </p>
          </div>

          <p style={{ color: "var(--texte-discret)", fontSize: "11px", fontStyle: "italic", textAlign: "center", marginTop: "24px" }}>{cosmicLine}</p>
        </div>
      </main>
    );
  }

  // ── ÉCRAN CHAT ─────────────────────────────────────────────────────────
  return (
    <main style={{ backgroundColor: "var(--fond)", minHeight: "100dvh", display: "flex", flexDirection: "column", fontFamily: "DM Sans, sans-serif" }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(26,18,16,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "var(--fond-blanc)", position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={() => { if (userId) window.location.href = "/home"; else setScreen("dump"); }}
          style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", cursor: "pointer", color: "var(--bordeaux)", fontFamily: "DM Sans", fontSize: "14px", fontWeight: 500 }}>
          <ArrowLeft size={18} /> {userId ? "Mon espace" : "Retour"}
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "var(--bordeaux)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: "Cormorant Garamond, serif", color: "var(--fond-blanc)", fontSize: "16px", fontStyle: "italic" }}>t</span>
          </div>
          <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--texte)" }}>Téfi</span>
        </div>
        <a href="/parametres" style={{ color: "var(--texte-discret)", textDecoration: "none", fontSize: "16px" }}>⚙</a>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", gap: "10px", alignItems: "flex-end" }}>
              {msg.role === "assistant" && (
                <div style={{ width: "26px", height: "26px", borderRadius: "50%", backgroundColor: "var(--bordeaux)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontFamily: "Cormorant Garamond, serif", color: "var(--fond-blanc)", fontSize: "14px", fontStyle: "italic" }}>t</span>
                </div>
              )}
              <div style={{ maxWidth: "78%", backgroundColor: msg.role === "user" ? "var(--bordeaux)" : "var(--fond-blanc)", color: msg.role === "user" ? "var(--fond-blanc)" : "var(--texte-secondary)", borderRadius: msg.role === "user" ? "16px 0 16px 16px" : "0 16px 16px 16px", padding: "12px 15px", borderLeft: msg.role === "assistant" ? "2px solid rgba(92,26,46,0.15)" : "none", fontSize: "15px", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                {msg.content}
              </div>
            </div>

            {/* Tâches dans les bulles — interactives */}
            {msg.tasks && msg.tasks.length > 0 && msg.role === "assistant" && (
              <TaskBubble tasks={msg.tasks} isLoggedIn={!!userId} onRebond={(title) => {
                const rebondMsg = `On part sur : ${title}`;
                const newMsgs = [...messages, { role: "user" as const, content: rebondMsg }];
                setMessages(newMsgs);
                setChatLoading(true);
                fetch("/api/tefi", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: newMsgs.slice(-20).map(m => ({ role: m.role, content: m.content })), userId }) })
                  .then(r => r.json())
                  .then(d => { setChatLoading(false); setMessages([...newMsgs, { role: "assistant", content: d.text || "..." }]); })
                  .catch(() => { setChatLoading(false); setMessages([...newMsgs, { role: "assistant", content: "J'ai du mal à te répondre là. Tu veux réessayer ?" }]); });
              }} />
            )}

            {/* CTA discret après 1er échange (non bloquant) */}
            {msg.role === "assistant" && !userId && i === 1 && messages.length <= 3 && (
              <div style={{ marginLeft: "36px", padding: "8px 0" }}>
                <a href="/auth/register" style={{ fontSize: "12px", color: "var(--texte-discret)", textDecoration: "none", borderBottom: "1px solid rgba(176,160,152,0.3)" }}>
                  Créer mon espace pour garder tout ça →
                </a>
              </div>
            )}

            {/* CTA complet à partir du 3ème échange Téfi */}
            {msg.role === "assistant" && !userId && i >= 3 && i === messages.length - 1 && (
              <div style={{ marginLeft: "36px", backgroundColor: "var(--fond-blanc)", border: "1px solid rgba(92,26,46,0.12)", borderRadius: "12px", padding: "16px" }}>
                <a href="/auth/register" style={{ display: "block", backgroundColor: "var(--bordeaux)", color: "var(--fond-blanc)", borderRadius: "10px", padding: "13px", fontSize: "14px", fontFamily: "DM Sans", fontWeight: 500, textDecoration: "none", textAlign: "center", marginBottom: "8px" }}>
                  Créer mon espace →
                </a>
                <a href="/auth/login" style={{ display: "block", border: "1.5px solid rgba(92,26,46,0.2)", color: "var(--bordeaux)", borderRadius: "10px", padding: "11px", fontSize: "13px", fontFamily: "DM Sans", fontWeight: 500, textDecoration: "none", textAlign: "center", marginBottom: "8px" }}>
                  On se connaît déjà →
                </a>
                <EmailCapture brainDump={dump} priority={messages[1]?.content?.split("\n")[2] || ""} actions={messages[1]?.content?.split("\n").slice(3, 6).map(s => s.replace(/^\d+\.\s*/, "")) || []} />
              </div>
            )}
          </div>
        ))}
        {chatLoading && (
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
            <div style={{ width: "26px", height: "26px", borderRadius: "50%", backgroundColor: "var(--bordeaux)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: "Cormorant Garamond, serif", color: "var(--fond-blanc)", fontSize: "14px", fontStyle: "italic" }}>t</span>
            </div>
            <div style={{ backgroundColor: "var(--fond-blanc)", borderLeft: "2px solid rgba(92,26,46,0.15)", borderRadius: "0 16px 16px 16px", padding: "12px 16px" }}>
              <span style={{ color: "var(--texte-discret)", letterSpacing: "0.2em" }}>···</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Gate email au 5ème échange (non connecté) */}
      {!userId && !gate5Sent && messages.filter(m => m.role === "user").length >= 5 && (
        <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(26,18,16,0.08)", backgroundColor: "var(--fond-or)" }}>
          <p style={{ fontSize: "13px", color: "var(--texte-secondary)", fontStyle: "italic", marginBottom: "10px" }}>
            Pour continuer, laisse-moi ton email — je garde tout ça pour toi.
          </p>
          <form onSubmit={async (e) => { e.preventDefault(); if (!gate5Email.trim()) return; await fetch("/api/resume-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: gate5Email, priority: "", actions: [], brainDump: dump }) }); setGate5Sent(true); }} style={{ display: "flex", gap: "8px" }}>
            <input type="email" value={gate5Email} onChange={e => setGate5Email(e.target.value)} placeholder="ton@email.com" required
              style={{ flex: 1, backgroundColor: "transparent", color: "var(--texte)", borderBottom: "1.5px solid var(--or)", borderTop: "none", borderLeft: "none", borderRight: "none", fontSize: "15px", padding: "6px 4px", fontFamily: "DM Sans" }} />
            <button type="submit" style={{ backgroundColor: "var(--bordeaux)", color: "var(--fond-blanc)", borderRadius: "8px", padding: "8px 16px", border: "none", cursor: "pointer", fontSize: "13px", fontFamily: "DM Sans", fontWeight: 500 }}>
              Continuer
            </button>
          </form>
        </div>
      )}

      {/* Input */}
      <div style={{ padding: "10px 16px 24px", borderTop: "1px solid rgba(26,18,16,0.08)", backgroundColor: "var(--fond-blanc)", display: "flex", gap: "8px", alignItems: "flex-end" }}>
        <button onClick={() => toggleVoice(setInput)}
          style={{ background: "none", border: "none", cursor: "pointer", color: listening ? "var(--bordeaux)" : "var(--texte-discret)", fontSize: "20px", flexShrink: 0, paddingBottom: "8px" }}>
          🎤
        </button>
        <textarea value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder={prenom ? `${prenom}, dis-moi…` : "Réponds…"} rows={1}
          style={{ flex: 1, resize: "none", border: "none", borderBottom: "1.5px solid var(--texte-discret)", backgroundColor: "transparent", fontSize: "15px", fontFamily: "DM Sans", color: "var(--texte)", padding: "8px 4px", lineHeight: "1.5" }}
          onFocus={e => { e.target.style.borderBottomColor = "var(--bordeaux)"; }}
          onBlur={e => { e.target.style.borderBottomColor = "var(--texte-discret)"; }}
        />
        <button onClick={handleSend} disabled={!input.trim() || chatLoading}
          style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: input.trim() ? "var(--bordeaux)" : "var(--texte-discret)", border: "none", cursor: input.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Send size={15} color="white" />
        </button>
      </div>
    </main>
  );
}

// Deep Work Slot — propose un créneau agenda pour les tâches complexes
function DeepWorkSlot({ task }: { task: TaskItem }) {
  const [duration, setDuration] = useState<number | null>(null);
  const [when, setWhen] = useState("");
  const [step, setStep] = useState<"duration" | "when" | "ready">("duration");

  function downloadICS() {
    if (!duration) return;
    // Parse "demain matin", "jeudi 9h", etc. → approximate date
    const start = new Date();
    start.setDate(start.getDate() + 1); // default: demain
    start.setHours(9, 0, 0, 0);
    if (when.toLowerCase().includes("après")) start.setHours(14, 0, 0, 0);
    if (when.toLowerCase().includes("soir")) start.setHours(18, 0, 0, 0);
    if (when.toLowerCase().includes("lundi")) { start.setDate(start.getDate() + ((1 - start.getDay() + 7) % 7 || 7)); }
    if (when.toLowerCase().includes("mardi")) { start.setDate(start.getDate() + ((2 - start.getDay() + 7) % 7 || 7)); }
    if (when.toLowerCase().includes("mercredi")) { start.setDate(start.getDate() + ((3 - start.getDay() + 7) % 7 || 7)); }
    if (when.toLowerCase().includes("jeudi")) { start.setDate(start.getDate() + ((4 - start.getDay() + 7) % 7 || 7)); }

    const end = new Date(start.getTime() + duration * 60000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const subtasksText = task.subtasks?.map((s, i) => `${i + 1}. ${s}`).join("\\n") || "";

    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//FIRMAMENT//FR",
      "BEGIN:VEVENT",
      `UID:${Date.now()}@frmmnt.fr`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:🎯 ${task.title}`,
      `DESCRIPTION:${subtasksText}`,
      "BEGIN:VALARM", "TRIGGER:-PT15M", "ACTION:DISPLAY", "DESCRIPTION:Rappel FIRMAMENT", "END:VALARM",
      "END:VEVENT", "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${task.title.replace(/\s+/g, "_").slice(0, 40)}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ backgroundColor: "var(--fond-or)", borderRadius: "10px", padding: "12px 14px", marginTop: "8px", border: "1px solid rgba(196,164,107,0.2)" }}>
      {step === "duration" && (
        <>
          <p style={{ fontSize: "13px", color: "var(--texte-secondary)", marginBottom: "10px" }}>
            Ça mérite un vrai créneau. Je te bloque combien de temps ?
          </p>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {[[30, "30 min"], [60, "1h"], [120, "2h"], [240, "Demi-journée"]].map(([min, label]) => (
              <button key={min} onClick={() => { setDuration(Number(min)); setStep("when"); }}
                style={{ padding: "7px 12px", borderRadius: "20px", border: "1.5px solid rgba(92,26,46,0.2)", backgroundColor: "var(--fond-blanc)", color: "var(--bordeaux)", fontSize: "13px", cursor: "pointer", fontFamily: "DM Sans", fontWeight: 500 }}>
                {label}
              </button>
            ))}
          </div>
        </>
      )}
      {step === "when" && (
        <>
          <p style={{ fontSize: "13px", color: "var(--texte-secondary)", marginBottom: "10px" }}>
            {duration}min bloqué. C'est pour quand ?
          </p>
          <input value={when} onChange={e => setWhen(e.target.value)} placeholder="demain matin, jeudi 9h, lundi après-midi..."
            style={{ width: "100%", backgroundColor: "transparent", color: "var(--texte)", borderBottom: "1.5px solid var(--or)", borderTop: "none", borderLeft: "none", borderRight: "none", fontSize: "14px", padding: "6px 4px", fontFamily: "DM Sans", marginBottom: "10px" }}
            onKeyDown={e => { if (e.key === "Enter" && when.trim()) setStep("ready"); }} />
          <button onClick={() => when.trim() && setStep("ready")} disabled={!when.trim()}
            style={{ backgroundColor: when.trim() ? "var(--bordeaux)" : "var(--texte-discret)", color: "var(--fond-blanc)", borderRadius: "10px", padding: "8px 16px", border: "none", cursor: "pointer", fontSize: "13px", fontFamily: "DM Sans" }}>
            Valider
          </button>
        </>
      )}
      {step === "ready" && (
        <button onClick={downloadICS}
          style={{ width: "100%", backgroundColor: "var(--bordeaux)", color: "var(--fond-blanc)", borderRadius: "10px", padding: "12px 16px", border: "none", cursor: "pointer", fontSize: "14px", fontFamily: "DM Sans", fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          📅 Ajouter à mon agenda →
        </button>
      )}
    </div>
  );
}

// Tâches dans les bulles — interactives pour tous (connecté ou non)
function TaskBubble({ tasks, isLoggedIn, onRebond }: {
  tasks: TaskItem[];
  isLoggedIn: boolean;
  onRebond: (title: string) => void;
}) {
  const [done, setDone] = useState<Set<number>>(new Set());

  return (
    <div style={{ marginLeft: "36px", backgroundColor: "var(--fond-blanc)", borderRadius: "12px", padding: "12px 16px", border: "1px solid rgba(92,26,46,0.1)" }}>
      {tasks.map((t, j) => (
        <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "8px 0", borderBottom: j < tasks.length - 1 ? "1px solid rgba(26,18,16,0.06)" : "none" }}>
          {/* Case à cocher — clic = barré */}
          <button onClick={() => {
            setDone(prev => { const n = new Set(prev); if (n.has(j)) { n.delete(j); } else { n.add(j); } return n; });
          }}
            style={{
              width: "20px", height: "20px", borderRadius: "5px",
              border: `1.5px solid ${done.has(j) ? "var(--vert)" : "rgba(92,26,46,0.2)"}`,
              backgroundColor: done.has(j) ? "var(--vert)" : "transparent",
              flexShrink: 0, marginTop: "2px", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s",
            }}>
            {done.has(j) && <span style={{ color: "white", fontSize: "11px", lineHeight: 1 }}>✓</span>}
          </button>
          {/* Titre — clic = Téfi rebondit */}
          <div style={{ flex: 1 }}>
            <button onClick={() => !done.has(j) && onRebond(t.title)}
              style={{ background: "none", border: "none", cursor: done.has(j) ? "default" : "pointer", textAlign: "left", padding: 0, width: "100%" }}>
              <p style={{ fontSize: "14px", color: done.has(j) ? "var(--texte-discret)" : "var(--texte)", lineHeight: "1.4", textDecoration: done.has(j) ? "line-through" : "none", transition: "all 0.2s" }}>
                {t.title}
                {t.is_urgent && <span style={{ marginLeft: "6px", backgroundColor: "rgba(92,26,46,0.1)", color: "var(--bordeaux)", fontSize: "10px", fontWeight: 600, padding: "1px 5px", borderRadius: "6px" }}>!</span>}
              </p>
              {t.subtitle && <p style={{ fontSize: "12px", color: "var(--texte-discret)", marginTop: "2px" }}>{t.subtitle}</p>}
              {t.deadline_text && <p style={{ fontSize: "11px", color: "var(--bordeaux)", marginTop: "2px" }}>⏰ {t.deadline_text}</p>}
            </button>
          </div>
          {/* Deep Work slot si suggest_block */}
          {t.suggest_block && !done.has(j) && <DeepWorkSlot task={t} />}
        </div>
      ))}
      {isLoggedIn && (
        <a href="/home" style={{ display: "block", textAlign: "center", marginTop: "10px", fontSize: "13px", color: "var(--bordeaux)", textDecoration: "none", fontWeight: 500 }}>
          Voir mon espace →
        </a>
      )}
    </div>
  );
}

// Composant capture email en bas de conversation
function EmailCapture({ brainDump, priority, actions }: { brainDump: string; priority: string; actions: string[] }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    const tempId = typeof window !== "undefined" ? localStorage.getItem("firmament_temp_id") : null;
    await fetch("/api/resume-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, priority, actions, brainDump, tempId }),
    });
    setSent(true);
  }

  if (sent) return <p style={{ textAlign: "center", fontSize: "13px", color: "var(--texte-discret)", fontStyle: "italic" }}>C'est envoyé. Tu peux revenir quand tu veux.</p>;

  return (
    <form onSubmit={handleSend} style={{ display: "flex", gap: "8px" }}>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Recevoir par mail" required
        style={{ flex: 1, backgroundColor: "transparent", color: "var(--texte)", borderBottom: "1.5px solid var(--texte-discret)", borderTop: "none", borderLeft: "none", borderRight: "none", fontSize: "14px", padding: "7px 4px", fontFamily: "DM Sans" }}
        onFocus={e => { (e.target as HTMLInputElement).style.borderBottomColor = "var(--bordeaux)"; }}
        onBlur={e => { (e.target as HTMLInputElement).style.borderBottomColor = "var(--texte-discret)"; }}
      />
      <button type="submit" style={{ backgroundColor: "transparent", border: "1px solid rgba(92,26,46,0.2)", borderRadius: "8px", padding: "6px 12px", fontSize: "12px", color: "var(--texte-discret)", cursor: "pointer", fontFamily: "DM Sans" }}>
        Envoyer
      </button>
    </form>
  );
}
