/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowLeft, ArrowRight, Send } from "lucide-react";
import { createClient } from "@/app/lib/supabase/client";
import { getCosmicLine } from "@/app/lib/cosmic";

const cosmicLine = getCosmicLine();

interface Msg { role: "user" | "assistant"; content: string; }

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) { setUserId(user.id); }
    });
    supabase.from("profiles").select("prenom").then(({ data }) => {
      if (data?.[0]?.prenom) setPrenom(data[0].prenom);
    });
  }, [supabase]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function handleClarify() {
    if (dump.trim().length < 10 || loading) return;
    setLoading(true);

    // Sauvegarder le dump dans conversations
    if (userId) {
      await supabase.from("conversations").insert({ user_id: userId, role: "user", content: dump });
    } else {
      const pending = JSON.parse(localStorage.getItem("firmament_dump_history") || "[]");
      localStorage.setItem("firmament_dump_history", JSON.stringify([...pending, { role: "user", content: dump, ts: Date.now() }]));
    }

    try {
      const res = await fetch("/api/tefi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brainDump: dump, userId }),
      });
      const d = await res.json();
      if (d.observation) {
        const tefiContent = `${d.observation}\n\n**${d.priority}**\n\n${d.actions.map((a: string, i: number) => `${i + 1}. ${a}`).join("\n")}\n\n${d.question}`;
        const msgs: Msg[] = [{ role: "user", content: dump }, { role: "assistant", content: tefiContent }];
        setMessages(msgs);

        // Sauvegarder réponse Téfi
        if (userId) await supabase.from("conversations").insert({ user_id: userId, role: "assistant", content: tefiContent });

        // Sauvegarder les 3 actions comme tâches dans Supabase
        if (userId && d.actions?.length) {
          await saveTasks(userId, d.actions.map((a: string) => ({ title: a })), d.priority?.slice(0, 50) || "Priorité");
        } else if (!userId && d.actions?.length) {
          const pending = JSON.parse(localStorage.getItem("firmament_pending_tasks") || "[]");
          localStorage.setItem("firmament_pending_tasks", JSON.stringify([...pending, { theme: d.priority?.slice(0, 50) || "Priorité", tasks: d.actions.map((a: string) => ({ title: a })) }]));
        }

        setScreen("chat");
      }
    } catch {
      setMessages([{ role: "user", content: dump }, { role: "assistant", content: "J'ai du mal à te répondre là — une petite pause technique. Tu veux réessayer dans quelques secondes ?" }]);
      setScreen("chat");
    }
    setLoading(false);
  }

  async function saveTasks(uid: string, tasks: { title: string; subtitle?: string; is_urgent?: boolean }[], themeName: string) {
    let themeId: string | null = null;
    const { data: existing } = await supabase.from("themes").select("id").eq("user_id", uid).eq("title", themeName).single();
    if (existing) { themeId = existing.id; } else {
      const { data: newTheme } = await supabase.from("themes").insert({ user_id: uid, title: themeName, position: Date.now() }).select().single();
      themeId = newTheme?.id || null;
    }
    if (!themeId) return;
    await supabase.from("tasks").insert(tasks.map((t, i) => ({ user_id: uid, theme_id: themeId, title: t.title, subtitle: t.subtitle, is_urgent: t.is_urgent || false, position: i })));
  }

  async function handleSend() {
    if (!input.trim() || chatLoading) return;
    const userMsg: Msg = { role: "user", content: input };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    const sent = input;
    setInput("");
    setChatLoading(true);

    // Sauvegarder
    if (userId) await supabase.from("conversations").insert({ user_id: userId, role: "user", content: sent });

    try {
      const res = await fetch("/api/tefi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMsgs.slice(-20), userId }),
      });
      const d = await res.json();

      // Intercepter les tâches JSON — ne jamais afficher dans le chat
      let displayText = d.text || "";
      if (d.tasks?.items?.length && userId) {
        await saveTasks(userId, d.tasks.items, d.tasks.items[0]?.theme || "Nouvelles tâches");
        if (!displayText.includes("J'ai organisé")) displayText += "\n\nJ'ai organisé tout ça dans ton espace.";
      }

      // Intercepter les décisions
      if (d.decision?.content && userId) {
        await supabase.from("decisions").insert({ user_id: userId, content: d.decision.content, detected_from: "dump" });
      }

      const assistantMsg: Msg = { role: "assistant", content: displayText || "..." };
      setMessages([...newMsgs, assistantMsg]);
      if (userId) await supabase.from("conversations").insert({ user_id: userId, role: "assistant", content: displayText });
    } catch {
      setMessages([...newMsgs, { role: "assistant", content: "J'ai du mal à te répondre là — une petite pause technique. Tu veux réessayer ?" }]);
    }
    setChatLoading(false);
  }

  function toggleVoice() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    if (listening) { recRef.current?.stop(); setListening(false); return; }
    const r = new SR(); r.lang = "fr-FR"; r.continuous = true; r.interimResults = true;
    r.onresult = (ev: { results: SpeechRecognitionResultList }) => {
      const target = screen === "dump" ? setDump : setInput;
      target(Array.from(ev.results).map((x) => (x as SpeechRecognitionResult)[0].transcript).join(""));
    };
    r.onend = () => setListening(false);
    r.start(); recRef.current = r; setListening(true);
  }

  // ── ÉCRAN DUMP ──────────────────────────────────────────────────────────
  if (screen === "dump") {
    return (
      <main style={{ backgroundColor: "var(--fond)", minHeight: "100dvh", fontFamily: "DM Sans, sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px" }}>
        <div style={{ width: "100%", maxWidth: "560px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
            <a href="/home" style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--bordeaux)", textDecoration: "none", fontSize: "14px", fontWeight: 500 }}>
              <ArrowLeft size={18} /> Mon espace
            </a>
            <p style={{ color: "var(--texte-discret)", fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase" }}>Le Dump</p>
          </div>

          <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "clamp(24px,4vw,36px)", fontWeight: 300, color: "var(--texte)", lineHeight: "1.3", marginBottom: "8px", fontStyle: "italic", textAlign: "center" }}>
            Dis-moi tout ce que tu as à faire en ce moment.
          </h1>
          <p style={{ color: "var(--texte-discret)", fontSize: "14px", marginBottom: "28px", textAlign: "center" }}>
            Balance tout en vrac. Téfi s'occupe de trier.
          </p>

          <textarea value={dump} onChange={e => setDump(e.target.value)} placeholder={`${prenom ? prenom + ", t" : "T"}out ce qui tourne dans ta tête — projets, deadlines, doutes, urgences...`} rows={9}
            style={{ width: "100%", backgroundColor: "var(--fond-blanc)", color: "var(--texte)", borderBottom: "2px solid var(--texte-discret)", borderTop: "none", borderLeft: "none", borderRight: "none", resize: "none", fontSize: "16px", lineHeight: "1.7", padding: "16px 4px", fontFamily: "DM Sans", marginBottom: "12px" }}
            onFocus={e => { e.target.style.borderBottomColor = "var(--bordeaux)"; }} onBlur={e => { e.target.style.borderBottomColor = "var(--texte-discret)"; }} />

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
            <button onClick={toggleVoice} style={{ background: "none", border: "none", cursor: "pointer", color: listening ? "var(--bordeaux)" : "var(--texte-discret)", fontSize: "13px", fontFamily: "DM Sans" }}>
              🎤 {listening ? "Arrêter" : "Dicter"}
            </button>
            {dump.length > 20 && <span style={{ fontSize: "11px", color: "var(--texte-discret)" }}>{dump.length} car.</span>}
          </div>

          <p style={{ fontSize: "11px", color: "var(--texte-discret)", fontStyle: "italic", marginBottom: "16px", textAlign: "center" }}>
            Tes pensées sont chiffrées et ne quittent pas FIRMAMENT.
          </p>

          <button onClick={handleClarify} disabled={dump.trim().length < 10 || loading}
            style={{ backgroundColor: dump.trim().length >= 10 && !loading ? "var(--bordeaux)" : "var(--texte-discret)", color: "var(--fond-blanc)", borderRadius: "12px", padding: "16px", fontSize: "15px", fontFamily: "DM Sans", fontWeight: 500, border: "none", width: "100%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            {loading ? "Téfi réfléchit···" : <><span>Clarifier</span><ArrowRight size={16} /></>}
          </button>

          <p style={{ color: "var(--texte-discret)", fontSize: "11px", fontStyle: "italic", marginTop: "24px", textAlign: "center" }}>{cosmicLine}</p>
        </div>
      </main>
    );
  }

  // ── ÉCRAN CHAT ──────────────────────────────────────────────────────────
  return (
    <main style={{ backgroundColor: "var(--fond)", minHeight: "100dvh", display: "flex", flexDirection: "column", fontFamily: "DM Sans, sans-serif" }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(26,18,16,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "var(--fond-blanc)", position: "sticky", top: 0 }}>
        <button onClick={() => { window.location.href = "/home"; }} style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", cursor: "pointer", color: "var(--bordeaux)", fontFamily: "DM Sans", fontSize: "14px", fontWeight: 500 }}>
          <ArrowLeft size={18} /> Mon espace
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
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", gap: "10px", alignItems: "flex-end" }}>
            {msg.role === "assistant" && (
              <div style={{ width: "26px", height: "26px", borderRadius: "50%", backgroundColor: "var(--bordeaux)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontFamily: "Cormorant Garamond, serif", color: "var(--fond-blanc)", fontSize: "14px", fontStyle: "italic" }}>t</span>
              </div>
            )}
            <div style={{
              maxWidth: "78%",
              backgroundColor: msg.role === "user" ? "var(--bordeaux)" : "var(--fond-blanc)",
              color: msg.role === "user" ? "var(--fond-blanc)" : "var(--texte-secondary)",
              borderRadius: msg.role === "user" ? "16px 0 16px 16px" : "0 16px 16px 16px",
              padding: "12px 15px",
              borderLeft: msg.role === "assistant" ? "2px solid rgba(92,26,46,0.15)" : "none",
              fontSize: "15px", lineHeight: "1.6", whiteSpace: "pre-wrap",
            }}>
              {msg.content === "J'ai organisé tout ça dans ton espace." ? (
                <div>
                  <p style={{ marginBottom: "10px", fontStyle: "italic" }}>J'ai organisé tout ça dans ton espace.</p>
                  <a href="/home" style={{ display: "inline-block", backgroundColor: "rgba(248,245,240,0.15)", color: "var(--fond-blanc)", border: "1px solid rgba(248,245,240,0.3)", borderRadius: "8px", padding: "6px 14px", fontSize: "13px", textDecoration: "none", fontFamily: "DM Sans", fontWeight: 500 }}>
                    Voir mon espace →
                  </a>
                </div>
              ) : msg.content}
            </div>
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

      {/* Bouton passer à l'action */}
      <div style={{ padding: "8px 16px 0", display: "flex", justifyContent: "center" }}>
        <a href="/home" style={{ fontSize: "13px", color: "var(--bordeaux)", textDecoration: "none", fontWeight: 500, fontFamily: "DM Sans" }}>
          Voir mon espace →
        </a>
      </div>

      {/* Input */}
      <div style={{ padding: "10px 16px 24px", borderTop: "1px solid rgba(26,18,16,0.08)", backgroundColor: "var(--fond-blanc)", display: "flex", gap: "10px", alignItems: "flex-end" }}>
        <button onClick={toggleVoice} style={{ background: "none", border: "none", cursor: "pointer", color: listening ? "var(--bordeaux)" : "var(--texte-discret)", fontSize: "18px", flexShrink: 0, paddingBottom: "8px" }}>🎤</button>
        <textarea value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Dis à Téfi ce qui se passe…" rows={1}
          style={{ flex: 1, resize: "none", border: "none", borderBottom: "1.5px solid var(--texte-discret)", backgroundColor: "transparent", fontSize: "15px", fontFamily: "DM Sans", color: "var(--texte)", padding: "8px 4px", lineHeight: "1.5" }}
          onFocus={e => { e.target.style.borderBottomColor = "var(--bordeaux)"; }} onBlur={e => { e.target.style.borderBottomColor = "var(--texte-discret)"; }} />
        <button onClick={handleSend} disabled={!input.trim() || chatLoading}
          style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: input.trim() ? "var(--bordeaux)" : "var(--texte-discret)", border: "none", cursor: input.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Send size={15} color="white" />
        </button>
      </div>
    </main>
  );
}
