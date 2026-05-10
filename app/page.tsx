"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowRight, ArrowLeft, Check, Send, Eye, EyeOff } from "lucide-react";
import { getCosmicLine } from "./lib/cosmic";
import { createClient } from "./lib/supabase/client";
import SmartTodo, { TodoTask } from "./components/SmartTodo";

type Screen = "braindump" | "loading" | "response" | "register" | "chat";

interface TefiResponse {
  observation: string;
  priority: string;
  actions: string[];
  question: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  todo?: { context: string; tasks: TodoTask[] } | null;
}

const cosmicLine = getCosmicLine();

export default function Firmament() {
  const [screen, setScreen] = useState<Screen>("braindump");
  const [brainDump, setBrainDump] = useState("");
  const [tefiResponse, setTefiResponse] = useState<TefiResponse | null>(null);
  const [checkedActions, setCheckedActions] = useState<boolean[]>([false, false, false]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginMode, setLoginMode] = useState(false);

  // Inscription
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
    });
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  async function saveConversation(dump: string, msgs: ChatMessage[]) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: conv } = await supabase
      .from("conversations")
      .insert({ user_id: user.id, brain_dump: dump })
      .select().single();
    if (!conv) return;
    setConversationId(conv.id);
    await supabase.from("messages").insert(
      msgs.map((m) => ({ conversation_id: conv.id, role: m.role, content: m.content }))
    );
  }

  async function saveMessage(role: "user" | "assistant", content: string) {
    if (!conversationId) return;
    await supabase.from("messages").insert({ conversation_id: conversationId, role, content });
  }

  async function handleClarify() {
    if (brainDump.trim().length < 10) return;
    setScreen("loading");
    setError(false);
    try {
      const res = await fetch("/api/tefi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brainDump }),
      });
      const data = await res.json();
      if (data.error || !data.observation) {
        setError(true);
        setScreen("braindump");
        return;
      }
      setTefiResponse(data);
      setCheckedActions([false, false, false]);
      const msgs: ChatMessage[] = [
        { role: "user", content: brainDump },
        {
          role: "assistant",
          content: `${data.observation}\n\n**${data.priority}**\n\n1. ${data.actions[0]}\n2. ${data.actions[1]}\n3. ${data.actions[2]}\n\n${data.question}`,
        },
      ];
      setChatMessages(msgs);

      // Si connecté → sauvegarder directement, sinon → inscription
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        saveConversation(brainDump, msgs);
        setScreen("response");
      } else {
        setScreen("response"); // Afficher la réponse, puis proposer inscription après
      }
    } catch {
      setError(true);
      setScreen("braindump");
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!regEmail.trim() || !regPassword) return;
    setRegLoading(true);
    setRegError("");

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: regEmail.trim().toLowerCase(),
      password: regPassword,
    });

    if (signUpError) {
      setRegError("Une erreur est survenue. Vérifie ton adresse email.");
      setRegLoading(false);
      return;
    }

    if (data.user) {
      setIsLoggedIn(true);
      // Sauvegarder la conversation de l'utilisateur nouvellement inscrit
      const msgs: ChatMessage[] = chatMessages;
      await saveConversation(brainDump, msgs);
      setScreen("chat");
    }
    setRegLoading(false);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!regEmail.trim() || !regPassword) return;
    setRegLoading(true);
    setRegError("");

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: regEmail.trim().toLowerCase(),
      password: regPassword,
    });

    if (loginError) {
      setRegError("Email ou mot de passe incorrect.");
      setRegLoading(false);
      return;
    }

    setIsLoggedIn(true);
    saveConversation(brainDump, chatMessages);
    setScreen("chat");
    setRegLoading(false);
  }

  async function handleChatSend() {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg: ChatMessage = { role: "user", content: chatInput };
    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    const sentInput = chatInput;
    setChatInput("");
    setChatLoading(true);
    try {
      const res = await fetch("/api/tefi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: data.text,
        todo: data.todo || null,
      };
      setChatMessages([...newMessages, assistantMsg]);
      saveMessage("user", sentInput);
      saveMessage("assistant", data.text);
    } catch {
      setChatMessages([...newMessages, {
        role: "assistant",
        content: "J'ai besoin d'un moment. Reviens dans quelques minutes — je serai là.",
      }]);
    } finally {
      setChatLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    backgroundColor: "transparent",
    color: "var(--texte)",
    borderBottom: "2px solid var(--texte-discret)",
    borderTop: "none", borderLeft: "none", borderRight: "none",
    fontSize: "16px",
    padding: "12px 4px",
    fontFamily: "DM Sans, sans-serif",
    transition: "border-color 0.2s",
    marginBottom: "20px",
  };

  // ─── ÉCRAN 1 — BRAIN DUMP ────────────────────────────────────────────────
  if (screen === "braindump" || screen === "loading") {
    return (
      <main
        style={{ backgroundColor: "var(--fond)", minHeight: "100dvh", position: "relative" }}
        className="flex flex-col items-center justify-center px-6 py-12"
      >
        {/* Lien connexion discret pour utilisateurs existants */}
        {!isLoggedIn && (
          <a
            href="/auth/login"
            style={{
              position: "absolute", top: "16px", right: "16px",
              color: "var(--texte-discret)", fontSize: "12px",
              fontFamily: "DM Sans, sans-serif", textDecoration: "none",
            }}
          >
            Déjà un espace ?
          </a>
        )}

        <div className="mb-12 text-center">
          <p style={{ color: "var(--texte-discret)", fontSize: "11px", letterSpacing: "0.2em" }} className="uppercase">
            Duleme & Cie
          </p>
          <h1 style={{ color: "var(--bordeaux)", fontFamily: "Cormorant Garamond, serif", fontSize: "42px", fontWeight: 300, letterSpacing: "0.12em" }}>
            FIRMAMENT
          </h1>
        </div>

        <div className="w-full max-w-lg text-center mb-8">
          <h2 style={{ fontFamily: "Cormorant Garamond, serif", color: "var(--texte)", fontSize: "28px", fontWeight: 300, lineHeight: "1.3" }}>
            {`Qu'est-ce qui occupe tout l'espace`}
            <br />
            {`dans ton esprit aujourd'hui ?`}
          </h2>
          <p style={{ color: "var(--texte-discret)", fontSize: "14px", marginTop: "12px" }}>
            {`Vide ta tête. Téfi s'occupe du reste.`}
          </p>
        </div>

        <div className="w-full max-w-lg">
          {error && (
            <p style={{ color: "#B00020", fontSize: "13px", marginBottom: "12px", textAlign: "center" }}>
              {`J'ai besoin d'un moment. Réessaie dans quelques secondes.`}
            </p>
          )}
          <textarea
            value={brainDump}
            onChange={(e) => setBrainDump(e.target.value)}
            disabled={screen === "loading"}
            placeholder={`Écris tout ce qui tourne dans ta tête — sans filtre, sans structure. Téfi fera le tri.`}
            rows={8}
            style={{
              width: "100%",
              backgroundColor: "var(--fond-blanc)",
              color: "var(--texte)",
              borderBottom: "2px solid var(--texte-discret)",
              borderTop: "none", borderLeft: "none", borderRight: "none",
              resize: "none", fontSize: "16px", lineHeight: "1.7",
              padding: "16px 4px", fontFamily: "DM Sans, sans-serif",
              transition: "border-color 0.2s",
              opacity: screen === "loading" ? 0.5 : 1,
            }}
            onFocus={(e) => { e.target.style.borderBottomColor = "var(--bordeaux)"; }}
            onBlur={(e) => { e.target.style.borderBottomColor = "var(--texte-discret)"; }}
          />
          <button
            onClick={handleClarify}
            disabled={brainDump.trim().length < 10 || screen === "loading"}
            style={{
              backgroundColor: brainDump.trim().length >= 10 && screen !== "loading" ? "var(--bordeaux)" : "var(--texte-discret)",
              color: "var(--fond-blanc)", borderRadius: "12px",
              padding: "16px 28px", fontSize: "15px",
              fontFamily: "DM Sans, sans-serif", fontWeight: 500,
              cursor: brainDump.trim().length >= 10 && screen !== "loading" ? "pointer" : "not-allowed",
              transition: "background-color 0.2s", border: "none",
              width: "100%", marginTop: "20px",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            }}
          >
            {screen === "loading" ? (
              <><span style={{ opacity: 0.8 }}>Téfi réfléchit</span><span style={{ letterSpacing: "0.2em", opacity: 0.6 }}>···</span></>
            ) : (
              <>Clarifier <ArrowRight size={16} /></>
            )}
          </button>
        </div>

        <p style={{ color: "var(--texte-discret)", fontSize: "11px", fontStyle: "italic", marginTop: "48px" }}>
          {cosmicLine}
        </p>
      </main>
    );
  }

  // ─── ÉCRAN 2 — TÉFI RÉPOND ───────────────────────────────────────────────
  if (screen === "response" && tefiResponse) {
    return (
      <main style={{ backgroundColor: "var(--fond)", minHeight: "100dvh" }} className="flex flex-col px-6 py-10 max-w-lg mx-auto">

        <div className="flex items-start gap-3 mb-8">
          <div style={{ width: "38px", height: "38px", borderRadius: "50%", backgroundColor: "var(--bordeaux)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" }}>
            <span style={{ fontFamily: "Cormorant Garamond, serif", color: "var(--fond-blanc)", fontSize: "20px", fontStyle: "italic" }}>t</span>
          </div>
          <div style={{ backgroundColor: "var(--fond-blanc)", borderLeft: "2px solid rgba(92,26,46,0.15)", borderRadius: "0 12px 12px 12px", padding: "16px 18px", flex: 1 }}>
            <p style={{ color: "var(--texte-secondary)", fontSize: "15px", lineHeight: "1.65", fontFamily: "DM Sans, sans-serif" }}>
              {tefiResponse.observation}
            </p>
          </div>
        </div>

        <div style={{ backgroundColor: "var(--bordeaux)", borderRadius: "12px", padding: "20px 22px", marginBottom: "24px" }}>
          <p style={{ color: "rgba(248,245,240,0.6)", fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: "8px", fontFamily: "DM Sans, sans-serif" }}>
            Priorité absolue
          </p>
          <p style={{ color: "var(--fond-blanc)", fontSize: "17px", fontFamily: "Cormorant Garamond, serif", fontWeight: 500, lineHeight: "1.4" }}>
            {tefiResponse.priority}
          </p>
        </div>

        <div style={{ marginBottom: "28px" }}>
          <p style={{ color: "var(--texte-discret)", fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "14px", fontFamily: "DM Sans, sans-serif" }}>
            3 actions
          </p>
          {tefiResponse.actions.map((action, i) => (
            <button key={i} onClick={() => { const next = [...checkedActions]; next[i] = !next[i]; setCheckedActions(next); }}
              style={{ display: "flex", alignItems: "flex-start", gap: "12px", width: "100%", background: "none", border: "none", padding: "10px 0", cursor: "pointer", textAlign: "left", borderBottom: i < 2 ? "1px solid rgba(26,18,16,0.08)" : "none" }}>
              <div style={{ width: "22px", height: "22px", borderRadius: "50%", border: `1.5px solid ${checkedActions[i] ? "var(--vert)" : "var(--texte-discret)"}`, backgroundColor: checkedActions[i] ? "var(--vert)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px", transition: "all 0.15s" }}>
                {checkedActions[i] && <Check size={12} color="white" strokeWidth={2.5} />}
              </div>
              <span style={{ fontSize: "15px", lineHeight: "1.5", fontFamily: "DM Sans, sans-serif", color: checkedActions[i] ? "var(--texte-discret)" : "var(--texte-secondary)", textDecoration: checkedActions[i] ? "line-through" : "none", transition: "all 0.15s" }}>
                <span style={{ color: "var(--or)", fontWeight: 500, marginRight: "6px" }}>{i + 1}.</span>{action}
              </span>
            </button>
          ))}
        </div>

        <div style={{ backgroundColor: "var(--fond-or)", borderRadius: "12px", padding: "16px 18px", marginBottom: "28px" }}>
          <p style={{ color: "var(--texte-secondary)", fontSize: "15px", lineHeight: "1.6", fontFamily: "Cormorant Garamond, serif", fontStyle: "italic" }}>
            {tefiResponse.question}
          </p>
        </div>

        {/* Message de Téfi vers l'inscription — seulement si non connecté */}
        {!isLoggedIn && (
          <div style={{ backgroundColor: "var(--fond-blanc)", border: "1px solid rgba(92,26,46,0.12)", borderRadius: "12px", padding: "20px 22px", marginBottom: "20px" }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "16px" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "var(--bordeaux)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontFamily: "Cormorant Garamond, serif", color: "var(--fond-blanc)", fontSize: "16px", fontStyle: "italic" }}>t</span>
              </div>
              <p style={{ color: "var(--texte-secondary)", fontSize: "14px", lineHeight: "1.65", fontFamily: "DM Sans, sans-serif", fontStyle: "italic" }}>
                {`Ce début de clarté est précieux. Pour que nous puissions continuer et garder cette conversation en sécurité, crée ton espace au sein de FIRMAMENT.`}
              </p>
            </div>
            <button
              onClick={() => setScreen("register")}
              style={{ backgroundColor: "var(--bordeaux)", color: "var(--fond-blanc)", borderRadius: "12px", padding: "14px 20px", fontSize: "14px", fontFamily: "DM Sans, sans-serif", fontWeight: 500, border: "none", width: "100%", cursor: "pointer" }}
            >
              Créer mon espace →
            </button>
          </div>
        )}

        <div style={{ display: "flex", gap: "12px", marginBottom: "32px" }}>
          <button
            onClick={() => { setScreen("braindump"); setBrainDump(""); setTefiResponse(null); }}
            style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "1.5px solid rgba(92,26,46,0.2)", background: "transparent", color: "var(--bordeaux)", fontSize: "14px", fontFamily: "DM Sans, sans-serif", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
          >
            <ArrowLeft size={15} /> Réécrire
          </button>
          <button
            onClick={() => isLoggedIn ? setScreen("chat") : setScreen("register")}
            style={{ flex: 2, padding: "14px", borderRadius: "12px", backgroundColor: "var(--bordeaux)", border: "none", color: "var(--fond-blanc)", fontSize: "14px", fontFamily: "DM Sans, sans-serif", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
          >
            Continuer avec Téfi <ArrowRight size={15} />
          </button>
        </div>

        <p style={{ color: "var(--texte-discret)", fontSize: "11px", fontStyle: "italic", textAlign: "center" }}>
          {cosmicLine}
        </p>
      </main>
    );
  }

  // ─── ÉCRAN INSCRIPTION ───────────────────────────────────────────────────
  if (screen === "register") {
    return (
      <main style={{ backgroundColor: "var(--fond)", minHeight: "100dvh" }} className="flex flex-col items-center justify-center px-6 py-12">
        <div className="mb-10 text-center">
          <div style={{ width: "44px", height: "44px", borderRadius: "50%", backgroundColor: "var(--bordeaux)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <span style={{ fontFamily: "Cormorant Garamond, serif", color: "var(--fond-blanc)", fontSize: "24px", fontStyle: "italic" }}>t</span>
          </div>
          <h2 style={{ fontFamily: "Cormorant Garamond, serif", color: "var(--texte)", fontSize: "26px", fontWeight: 300, lineHeight: "1.3", marginBottom: "10px" }}>
            {loginMode ? "Content de te retrouver." : "Crée ton espace FIRMAMENT"}
          </h2>
          <p style={{ color: "var(--texte-discret)", fontSize: "14px", lineHeight: "1.5" }}>
            {loginMode
              ? "Reconnecte-toi pour retrouver ta clarté."
              : "Tes pensées, ta structure, ton espace. Sécurisé."}
          </p>
        </div>

        <div className="w-full max-w-sm">
          <form onSubmit={loginMode ? handleLogin : handleRegister}>
            <input
              type="email"
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              placeholder="ton@email.com"
              required
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderBottomColor = "var(--bordeaux)"; }}
              onBlur={(e) => { e.target.style.borderBottomColor = "var(--texte-discret)"; }}
            />
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder={loginMode ? "Mot de passe" : "Choisis un mot de passe"}
                required
                style={{ ...inputStyle, paddingRight: "40px" }}
                onFocus={(e) => { e.target.style.borderBottomColor = "var(--bordeaux)"; }}
                onBlur={(e) => { e.target.style.borderBottomColor = "var(--texte-discret)"; }}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: "4px", top: "12px", background: "none", border: "none", cursor: "pointer", color: "var(--texte-discret)" }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {regError && (
              <p style={{ color: "#B00020", fontSize: "13px", marginBottom: "12px", textAlign: "center" }}>{regError}</p>
            )}

            <button type="submit" disabled={!regEmail.trim() || !regPassword || regLoading}
              style={{ backgroundColor: regEmail.trim() && regPassword && !regLoading ? "var(--bordeaux)" : "var(--texte-discret)", color: "var(--fond-blanc)", borderRadius: "12px", padding: "16px 28px", fontSize: "15px", fontFamily: "DM Sans, sans-serif", fontWeight: 500, border: "none", width: "100%", cursor: regEmail.trim() && regPassword && !regLoading ? "pointer" : "not-allowed", marginBottom: "16px" }}>
              {regLoading ? "···" : loginMode ? "Se connecter →" : "Créer mon espace →"}
            </button>

            <p style={{ textAlign: "center" }}>
              <button type="button" onClick={() => { setLoginMode(!loginMode); setRegError(""); }}
                style={{ background: "none", border: "none", color: "var(--texte-discret)", fontSize: "13px", cursor: "pointer", textDecoration: "underline", fontFamily: "DM Sans, sans-serif" }}>
                {loginMode ? "Créer un nouvel espace" : "J'ai déjà un espace"}
              </button>
            </p>
          </form>
        </div>

        <button onClick={() => setScreen("response")}
          style={{ marginTop: "24px", background: "none", border: "none", color: "var(--texte-discret)", fontSize: "12px", cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}>
          ← Retour à ma clarté
        </button>
      </main>
    );
  }

  // ─── ÉCRAN 3 — CONVERSATION CONTINUE ─────────────────────────────────────
  if (screen === "chat") {
    return (
      <main style={{ backgroundColor: "var(--fond)", minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(26,18,16,0.08)", display: "flex", alignItems: "center", gap: "12px", backgroundColor: "var(--fond-blanc)", position: "sticky", top: 0 }}>
          <button onClick={() => setScreen("response")} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: "var(--bordeaux)" }}>
            <ArrowLeft size={20} />
          </button>
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "var(--bordeaux)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: "Cormorant Garamond, serif", color: "var(--fond-blanc)", fontSize: "18px", fontStyle: "italic" }}>t</span>
          </div>
          <div>
            <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "14px", fontWeight: 500, color: "var(--texte)" }}>Téfi</p>
            <p style={{ fontSize: "11px", color: "var(--texte-discret)" }}>ton compagnon stratégique</p>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {chatMessages.map((msg, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", gap: "10px", alignItems: "flex-end", width: "100%" }}>
                {msg.role === "assistant" && (
                  <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "var(--bordeaux)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontFamily: "Cormorant Garamond, serif", color: "var(--fond-blanc)", fontSize: "16px", fontStyle: "italic" }}>t</span>
                  </div>
                )}
                <div style={{ maxWidth: "78%", backgroundColor: msg.role === "user" ? "var(--bordeaux)" : "var(--fond-blanc)", color: msg.role === "user" ? "var(--fond-blanc)" : "var(--texte-secondary)", borderRadius: msg.role === "user" ? "16px 0 16px 16px" : "0 16px 16px 16px", padding: "12px 16px", borderLeft: msg.role === "assistant" ? "2px solid rgba(92,26,46,0.15)" : "none", fontSize: "15px", lineHeight: "1.6", fontFamily: "DM Sans, sans-serif", whiteSpace: "pre-wrap" }}>
                  {msg.content}
                </div>
              </div>
              {msg.todo && msg.role === "assistant" && (
                <div style={{ width: "100%", paddingLeft: "38px" }}>
                  <SmartTodo context={msg.todo.context} tasks={msg.todo.tasks} />
                </div>
              )}
            </div>
          ))}
          {chatLoading && (
            <div style={{ display: "flex", alignItems: "flex-end", gap: "10px" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "var(--bordeaux)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: "Cormorant Garamond, serif", color: "var(--fond-blanc)", fontSize: "16px", fontStyle: "italic" }}>t</span>
              </div>
              <div style={{ backgroundColor: "var(--fond-blanc)", borderLeft: "2px solid rgba(92,26,46,0.15)", borderRadius: "0 16px 16px 16px", padding: "14px 18px" }}>
                <span style={{ color: "var(--texte-discret)", letterSpacing: "0.2em" }}>···</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div style={{ padding: "12px 16px 24px", borderTop: "1px solid rgba(26,18,16,0.08)", backgroundColor: "var(--fond-blanc)", display: "flex", gap: "10px", alignItems: "flex-end" }}>
          <textarea
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChatSend(); } }}
            placeholder={`Dis à Téfi ce qui se passe…`}
            rows={1}
            style={{ flex: 1, resize: "none", border: "none", borderBottom: "1.5px solid var(--texte-discret)", backgroundColor: "transparent", fontSize: "15px", fontFamily: "DM Sans, sans-serif", color: "var(--texte)", padding: "8px 4px", lineHeight: "1.5", transition: "border-color 0.2s" }}
            onFocus={(e) => { e.target.style.borderBottomColor = "var(--bordeaux)"; }}
            onBlur={(e) => { e.target.style.borderBottomColor = "var(--texte-discret)"; }}
          />
          <button onClick={handleChatSend} disabled={!chatInput.trim() || chatLoading}
            style={{ width: "38px", height: "38px", borderRadius: "50%", backgroundColor: chatInput.trim() ? "var(--bordeaux)" : "var(--texte-discret)", border: "none", cursor: chatInput.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", transition: "background-color 0.2s", flexShrink: 0 }}>
            <Send size={16} color="white" />
          </button>
        </div>
      </main>
    );
  }

  return null;
}
