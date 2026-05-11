"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowRight, ArrowLeft, Send, Eye, EyeOff, Mic, MicOff } from "lucide-react";
import { getCosmicLine } from "./lib/cosmic";
import { createClient } from "./lib/supabase/client";
import SmartTodo, { TodoTask } from "./components/SmartTodo";
import ActionList from "./components/ActionList";
import Logo from "./components/Logo";
import AccueilConnecte from "./components/AccueilConnecte";
import Onboarding from "./components/Onboarding";

type Screen = "home" | "onboarding" | "braindump" | "loading" | "response" | "register" | "chat";

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

// Composant conclusion — une seule porte claire
function ResumeEmailBlock({ brainDump, priority, actions, onRegister, onLogin }: {
  brainDump: string; priority: string; actions: string[]; onRegister: () => void; onLogin: () => void;
}) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [state, setState] = useState<"idle" | "sent" | "exists">("idle");
  const supabase = createClient();

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);

    // Vérifier si l'email existe déjà dans profiles
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email.trim().toLowerCase())
      .single();

    if (data) {
      setSending(false);
      setState("exists");
      return;
    }

    await fetch("/api/resume-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, priority, actions, brainDump }),
    });
    setSending(false);
    setState("sent");
  }

  if (state === "sent") {
    return (
      <div style={{ backgroundColor: "var(--fond-blanc)", border: "1px solid rgba(92,26,46,0.12)", borderRadius: "12px", padding: "24px", marginBottom: "20px", textAlign: "center" }}>
        <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "20px", color: "var(--texte)", marginBottom: "8px" }}>
          {`C'est envoyé.`}
        </p>
        <p style={{ color: "var(--texte-discret)", fontSize: "13px", lineHeight: "1.5" }}>
          {`Vérifie ta boîte mail. Tu peux revenir quand tu veux.`}
        </p>
      </div>
    );
  }

  if (state === "exists") {
    return (
      <div style={{ backgroundColor: "var(--fond-blanc)", border: "1px solid rgba(92,26,46,0.12)", borderRadius: "12px", padding: "24px", marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "16px" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "var(--bordeaux)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontFamily: "Cormorant Garamond, serif", color: "var(--fond-blanc)", fontSize: "16px", fontStyle: "italic" }}>t</span>
          </div>
          <p style={{ color: "var(--texte-secondary)", fontSize: "14px", lineHeight: "1.65", fontFamily: "DM Sans, sans-serif", fontStyle: "italic" }}>
            {`Cet email a déjà un espace. Tu veux te connecter ?`}
          </p>
        </div>
        <button onClick={onLogin}
          style={{ backgroundColor: "var(--bordeaux)", color: "var(--fond-blanc)", borderRadius: "12px", padding: "14px 20px", fontSize: "14px", fontFamily: "DM Sans", fontWeight: 500, border: "none", width: "100%", cursor: "pointer", marginBottom: "10px" }}>
          On se connaît déjà →
        </button>
        <button onClick={() => setState("idle")}
          style={{ background: "none", border: "none", color: "var(--texte-discret)", fontSize: "13px", cursor: "pointer", fontFamily: "DM Sans", width: "100%", textAlign: "center" }}>
          Utiliser un autre email
        </button>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "var(--fond-blanc)", border: "1px solid rgba(92,26,46,0.12)", borderRadius: "12px", padding: "20px 22px", marginBottom: "20px" }}>
      {/* Téfi */}
      <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "20px" }}>
        <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "var(--bordeaux)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontFamily: "Cormorant Garamond, serif", color: "var(--fond-blanc)", fontSize: "16px", fontStyle: "italic" }}>t</span>
        </div>
        <p style={{ color: "var(--texte-secondary)", fontSize: "14px", lineHeight: "1.65", fontFamily: "DM Sans, sans-serif", fontStyle: "italic" }}>
          {`Ce début de clarté est précieux. Tu veux le garder ?`}
        </p>
      </div>

      {/* Option A — Créer le compte */}
      <button onClick={onRegister}
        style={{ backgroundColor: "var(--bordeaux)", color: "var(--fond-blanc)", borderRadius: "12px", padding: "15px 20px", fontSize: "15px", fontFamily: "DM Sans, sans-serif", fontWeight: 500, border: "none", width: "100%", cursor: "pointer" }}>
        Créer mon espace FIRMAMENT →
      </button>

      {/* Séparateur */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "16px 0" }}>
        <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(26,18,16,0.08)" }} />
        <span style={{ color: "var(--texte-discret)", fontSize: "12px", fontFamily: "DM Sans", whiteSpace: "nowrap" }}>ou reçois ce résumé par mail</span>
        <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(26,18,16,0.08)" }} />
      </div>

      {/* Option B — Email visible directement */}
      <form onSubmit={handleSend} style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="ton@email.com" required
          style={{
            flex: 1, backgroundColor: "transparent", color: "var(--texte)",
            borderBottom: "1.5px solid var(--texte-discret)",
            borderTop: "none", borderLeft: "none", borderRight: "none",
            fontSize: "15px", padding: "10px 4px", fontFamily: "DM Sans",
            transition: "border-color 0.2s",
          }}
          onFocus={e => { e.target.style.borderBottomColor = "var(--bordeaux)"; }}
          onBlur={e => { e.target.style.borderBottomColor = "var(--texte-discret)"; }}
        />
        <button type="submit" disabled={!email.trim() || sending}
          style={{
            backgroundColor: email.trim() && !sending ? "var(--bordeaux)" : "var(--texte-discret)",
            color: "var(--fond-blanc)", borderRadius: "10px", padding: "10px 16px",
            fontSize: "13px", fontFamily: "DM Sans", fontWeight: 500,
            border: "none", cursor: email.trim() && !sending ? "pointer" : "not-allowed",
            flexShrink: 0,
          }}>
          {sending ? "···" : "Envoyer"}
        </button>
      </form>
    </div>
  );
}

const ETINCELLES = [
  "Je ne sais plus par où commencer…",
  "J'ai un doute sur mon business model",
  "Mon équipe m'épuise en ce moment",
];

export default function Firmament() {
  const [screen, setScreen] = useState<Screen>("braindump");
  const [brainDump, setBrainDump] = useState("");
  const [tefiResponse, setTefiResponse] = useState<TefiResponse | null>(null);
  const [, setCheckedActions] = useState<boolean[]>([false, false, false]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [emailVerified, setEmailVerified] = useState(true);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [userName, setUserName] = useState("");
  const [loginMode, setLoginMode] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Inscription
  const [regPrenom, setRegPrenom] = useState("");
  const [regTelephone, setRegTelephone] = useState("");
  const [regLocalisation, setRegLocalisation] = useState("");
  const [regEntreprise, setRegEntreprise] = useState("");
  const [regParrain, setRegParrain] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setIsLoggedIn(true);
        setEmailVerified(user.email_confirmed_at !== null);
        // Bug C fix : ne JAMAIS utiliser l'email comme prénom
        const { data: profileData } = await supabase.from("profiles").select("prenom").eq("id", user.id).single();
        const name = profileData?.prenom || user.user_metadata?.prenom || "";
        setUserName(name);
        // Bug D fix : routing fiable basé sur onboarding_done
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_done, prenom")
          .eq("id", user.id)
          .single();
        // Mettre à jour le prénom si disponible dans le profil
        if (profile?.prenom) setUserName(profile.prenom);
        if (profile?.onboarding_done) {
          setScreen("home");
        } else {
          setScreen("onboarding");
        }
      } else {
        setScreen("braindump"); // Non connecté → directement le Dump
      }
    });
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  function startVoice() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = "fr-FR";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => {
      const transcript = Array.from(Object.values(event.results))
        .map((r) => (r as { [key: number]: { transcript: string } })[0].transcript)
        .join("");
      setBrainDump(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  }

  function stopVoice() {
    recognitionRef.current?.stop();
    setIsListening(false);
  }

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
      options: { data: { prenom: regPrenom.trim() } },
    });

    if (signUpError) {
      const msg = signUpError.message.toLowerCase();
      if (msg.includes("already") || msg.includes("registered") || msg.includes("exist")) {
        setRegError("__exists__"); // Signal spécial → affiche bouton connexion
      } else if (msg.includes("password") || msg.includes("weak")) {
        setRegError("Le mot de passe doit faire au moins 8 caractères.");
      } else {
        setRegError("Une erreur est survenue. Réessaie ou contacte-nous.");
      }
      setRegLoading(false);
      return;
    }

    if (data.user) {
      // Sauvegarder les infos du profil
      await supabase.from("profiles").upsert({
        id: data.user.id,
        email: regEmail.trim().toLowerCase(),
        prenom: regPrenom.trim(),
        telephone: regTelephone.trim(),
        localisation: regLocalisation,
        entreprise: regEntreprise.trim(),
      });
      if (regParrain.trim()) {
        await supabase.from("leads").insert({
          email: regEmail.trim().toLowerCase(),
          source: "inscription",
          brain_dump: JSON.stringify({ parrain: regParrain.trim() }),
        });
      }
      setUserName(regPrenom.trim());
      setIsLoggedIn(true);
      setNeedsConfirmation(true);
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

  // Bug B fix : appel API avec try/catch + limite historique 20 messages
  async function callTefi(messages: ChatMessage[], onSuccess: (data: { text: string; todo?: { context: string; tasks: import("./components/SmartTodo").TodoTask[] } | null }) => void) {
    // Limiter aux 20 derniers messages pour éviter les timeouts
    const limited = messages.slice(-20);
    try {
      const res = await fetch("/api/tefi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: limited }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      onSuccess(data);
    } catch (err) {
      console.error("Téfi API error:", err);
      throw err;
    }
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
      await callTefi(newMessages, (data) => {
        const assistantMsg: ChatMessage = { role: "assistant", content: data.text, todo: data.todo || null };
        setChatMessages([...newMessages, assistantMsg]);
        saveMessage("user", sentInput);
        saveMessage("assistant", data.text);
      });
    } catch {
      // Bug B : message d'erreur avec bouton retry
      setChatMessages([...newMessages, {
        role: "assistant",
        content: "__error__",
      }]);
    } finally {
      setChatLoading(false);
    }
  }

  async function handleActionClick(title: string) {
    // Bug A fix : afficher titre propre, envoyer JSON silencieusement à l'API
    const visibleMsg: ChatMessage = { role: "user", content: title }; // titre propre visible
    const apiMessages = [
      ...chatMessages,
      { role: "user" as const, content: JSON.stringify({ action_clicked: title }) }, // JSON pour l'API seulement
    ];
    const displayMessages = [...chatMessages, visibleMsg];
    setChatMessages(displayMessages);
    setScreen("chat");
    setChatLoading(true);
    try {
      await callTefi(apiMessages, (data) => {
        setChatMessages([...displayMessages, { role: "assistant", content: data.text, todo: data.todo || null }]);
      });
    } catch {
      setChatMessages([...displayMessages, { role: "assistant", content: "__error__" }]);
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

  // ─── ONBOARDING ──────────────────────────────────────────────────────────
  if (screen === "onboarding") {
    return <Onboarding onComplete={() => setScreen("home")} />;
  }

  // ─── ÉCRAN ACCUEIL CONNECTÉ ──────────────────────────────────────────────
  if (screen === "home") {
    return (
      <AccueilConnecte
        userName={userName}
        emailVerified={emailVerified}
        onDump={() => setScreen("braindump")}
        onSetObjectif={() => setScreen("braindump")}
      />
    );
  }

  // ─── ÉCRAN 1 — BRAIN DUMP ────────────────────────────────────────────────
  if (screen === "braindump" || screen === "loading") {
    return (
      <main
        style={{ backgroundColor: "var(--fond)", minHeight: "100dvh", position: "relative" }}
        className="flex flex-col items-center justify-center px-6 py-12"
      >
        {/* Lien connexion / déconnexion discret */}
        {isLoggedIn ? (
          <button onClick={async () => { await supabase.auth.signOut(); setIsLoggedIn(false); setUserName(""); }}
            style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", color: "var(--texte-discret)", fontSize: "12px", fontFamily: "DM Sans, sans-serif", cursor: "pointer" }}>
            Se déconnecter
          </button>
        ) : (
          <a href="/auth/login" style={{ position: "absolute", top: "16px", right: "16px", color: "var(--texte-discret)", fontSize: "12px", fontFamily: "DM Sans, sans-serif", textDecoration: "none" }}>
            On se connaît déjà →
          </a>
        )}

        <div className="mb-10 text-center">
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px" }}>
            <Logo size={72} variant="bordeaux" />
          </div>
          <p style={{ color: "var(--texte-discret)", fontSize: "11px", letterSpacing: "0.2em" }} className="uppercase">
            Duleme & Cie
          </p>
          <h1 style={{ color: "var(--bordeaux)", fontFamily: "Cormorant Garamond, serif", fontSize: "38px", fontWeight: 300, letterSpacing: "0.12em" }}>
            FIRMAMENT
          </h1>
        </div>

        <div className="w-full max-w-lg text-center mb-8">
          {isLoggedIn && userName && (
            <p style={{ color: "var(--or)", fontSize: "13px", fontStyle: "italic", marginBottom: "10px", fontFamily: "Cormorant Garamond, serif" }}>
              Content de te revoir, {userName}.
            </p>
          )}
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
          {/* Compteur discret */}
          {brainDump.trim().length > 20 && (
            <p style={{ textAlign: "right", fontSize: "11px", color: "var(--texte-discret)", marginTop: "4px" }}>
              {brainDump.length} caractères
            </p>
          )}

          {/* Étincelles */}
          {brainDump.trim().length === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
              {ETINCELLES.map((e) => (
                <button key={e} onClick={() => setBrainDump(e)}
                  style={{ background: "none", border: "1px solid rgba(92,26,46,0.15)", borderRadius: "20px", padding: "8px 14px", fontSize: "13px", fontFamily: "DM Sans, sans-serif", color: "var(--texte-tertiary)", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}
                  onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.borderColor = "var(--bordeaux)"; (e.target as HTMLButtonElement).style.color = "var(--bordeaux)"; }}
                  onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.borderColor = "rgba(92,26,46,0.15)"; (e.target as HTMLButtonElement).style.color = "var(--texte-tertiary)"; }}
                >
                  {e}
                </button>
              ))}
            </div>
          )}

          {/* Mention RGPD discrète */}
          <p style={{ color: "var(--texte-discret)", fontSize: "11px", fontStyle: "italic", marginTop: "10px", lineHeight: "1.5" }}>
            Tes pensées sont chiffrées et ne quittent pas FIRMAMENT. Téfi est un confident muet.
          </p>

          {/* Bouton dictée vocale */}
          <button
            onClick={isListening ? stopVoice : startVoice}
            style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", cursor: "pointer", color: isListening ? "var(--bordeaux)" : "var(--texte-discret)", fontSize: "12px", fontFamily: "DM Sans, sans-serif", padding: "8px 0", marginTop: "4px" }}
          >
            {isListening ? <MicOff size={14} /> : <Mic size={14} />}
            {isListening ? "Arrêter la dictée" : "Dicter à Téfi"}
          </button>

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

        <div style={{ marginBottom: "28px", backgroundColor: "var(--fond-blanc)", borderRadius: "12px", padding: "16px 18px" }}>
          <p style={{ color: "var(--texte-discret)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "12px", fontFamily: "DM Sans, sans-serif" }}>
            Actions prioritaires
          </p>
          <ActionList
            actions={tefiResponse.actions}
            isLoggedIn={isLoggedIn}
            onRegister={() => setScreen("register")}
            onActionClick={(title) => {
              if (isLoggedIn) {
                handleActionClick(title);
              }
              // Bug F : non connecté → géré dans ActionList (bulle Téfi)
            }}
          />
        </div>

        <div style={{ backgroundColor: "var(--fond-or)", borderRadius: "12px", padding: "16px 18px", marginBottom: "28px" }}>
          <p style={{ color: "var(--texte-secondary)", fontSize: "15px", lineHeight: "1.6", fontFamily: "Cormorant Garamond, serif", fontStyle: "italic" }}>
            {tefiResponse.question}
          </p>
        </div>

        {/* Message de Téfi vers l'inscription — seulement si non connecté */}
        {!isLoggedIn && (
          <ResumeEmailBlock
            brainDump={brainDump}
            priority={tefiResponse.priority}
            actions={tefiResponse.actions}
            onRegister={() => setScreen("register")}
            onLogin={() => setScreen("register")}
          />
        )}

        {/* "Continuer avec Téfi" seulement pour les utilisateurs connectés */}
        {isLoggedIn && (
          <div style={{ marginBottom: "32px" }}>
            <button
              onClick={() => setScreen("chat")}
              style={{ width: "100%", padding: "16px", borderRadius: "12px", backgroundColor: "var(--bordeaux)", border: "none", color: "var(--fond-blanc)", fontSize: "15px", fontFamily: "DM Sans, sans-serif", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            >
              Continuer avec Téfi <ArrowRight size={16} />
            </button>
          </div>
        )}

        <p style={{ color: "var(--texte-discret)", fontSize: "11px", fontStyle: "italic", textAlign: "center" }}>
          {cosmicLine}
        </p>
      </main>
    );
  }

  // ─── ÉCRAN INSCRIPTION ───────────────────────────────────────────────────
  if (screen === "register") {

    // Écran confirmation email
    if (needsConfirmation) {
      return (
        <main style={{ backgroundColor: "var(--fond)", minHeight: "100dvh" }} className="flex flex-col items-center justify-center px-6 py-12">
          <div style={{ textAlign: "center", maxWidth: "360px" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "var(--bordeaux-light)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
              <span style={{ fontSize: "28px" }}>✉️</span>
            </div>
            <h2 style={{ fontFamily: "Cormorant Garamond, serif", color: "var(--texte)", fontSize: "26px", fontWeight: 300, marginBottom: "14px", lineHeight: "1.3" }}>
              Confirme ton adresse email
            </h2>
            <p style={{ color: "var(--texte-secondary)", fontSize: "15px", lineHeight: "1.65", marginBottom: "8px" }}>
              Un email a été envoyé à
            </p>
            <p style={{ color: "var(--bordeaux)", fontSize: "15px", fontWeight: 500, marginBottom: "20px" }}>
              {regEmail}
            </p>
            <p style={{ color: "var(--texte-discret)", fontSize: "14px", lineHeight: "1.6", marginBottom: "28px" }}>
              Clique sur le lien dans cet email pour activer ton espace FIRMAMENT. Le lien est valable 24 heures.
            </p>
            <div style={{ backgroundColor: "var(--fond-or)", borderRadius: "12px", padding: "16px 18px", marginBottom: "28px" }}>
              <p style={{ color: "var(--texte-secondary)", fontSize: "13px", lineHeight: "1.6", fontStyle: "italic", fontFamily: "Cormorant Garamond, serif" }}>
                {`Ta clarté du jour est préservée. Tu la retrouveras dès que tu auras confirmé ton email.`}
              </p>
            </div>
            <p style={{ color: "var(--texte-discret)", fontSize: "12px" }}>
              Pas reçu ? Vérifie tes spams.
            </p>
            <button onClick={() => { setNeedsConfirmation(false); setScreen("response"); }}
              style={{ marginTop: "20px", background: "none", border: "none", color: "var(--texte-discret)", fontSize: "13px", cursor: "pointer", textDecoration: "underline", fontFamily: "DM Sans, sans-serif" }}>
              ← Retour à ma clarté en attendant
            </button>
          </div>
        </main>
      );
    }

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
            {!loginMode && (
              <>
                <input value={regPrenom} onChange={e => setRegPrenom(e.target.value)} placeholder="Prénom *" required
                  style={inputStyle} onFocus={e => { e.target.style.borderBottomColor = "var(--bordeaux)"; }} onBlur={e => { e.target.style.borderBottomColor = "var(--texte-discret)"; }} />
                <input value={regEntreprise} onChange={e => setRegEntreprise(e.target.value)} placeholder="Nom de l'entreprise *" required
                  style={inputStyle} onFocus={e => { e.target.style.borderBottomColor = "var(--bordeaux)"; }} onBlur={e => { e.target.style.borderBottomColor = "var(--texte-discret)"; }} />
                <input value={regTelephone} onChange={e => setRegTelephone(e.target.value)} placeholder="Téléphone (ex: +596 696 00 00 00)"
                  style={inputStyle} onFocus={e => { e.target.style.borderBottomColor = "var(--bordeaux)"; }} onBlur={e => { e.target.style.borderBottomColor = "var(--texte-discret)"; }} />
                <select value={regLocalisation} onChange={e => setRegLocalisation(e.target.value)}
                  style={{ ...inputStyle, appearance: "none" as const }}>
                  <option value="">Localisation</option>
                  {["Martinique", "Guadeloupe", "Réunion", "Guyane", "Mayotte", "France métropolitaine", "Autre"].map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </>
            )}
            <input
              type="email"
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              placeholder="Email *"
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
                placeholder={loginMode ? "Mot de passe" : "Mot de passe (min. 8 caractères)"}
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
            {!loginMode && (
              <input value={regParrain} onChange={e => setRegParrain(e.target.value)} placeholder="Je viens de la part de… (optionnel)"
                style={{ ...inputStyle, fontSize: "13px", color: "var(--texte-discret)" }}
                onFocus={e => { e.target.style.borderBottomColor = "var(--bordeaux)"; }} onBlur={e => { e.target.style.borderBottomColor = "var(--texte-discret)"; }} />
            )}

            {regError && regError !== "__exists__" && (
              <p style={{ color: "#B00020", fontSize: "13px", marginBottom: "12px", textAlign: "center" }}>{regError}</p>
            )}
            {regError === "__exists__" && (
              <div style={{ backgroundColor: "var(--fond-or)", borderRadius: "10px", padding: "12px 16px", marginBottom: "12px", textAlign: "center" }}>
                <p style={{ fontSize: "13px", color: "var(--texte-secondary)", marginBottom: "10px", lineHeight: "1.5" }}>
                  Cet email a déjà un espace FIRMAMENT.
                </p>
                <button type="button" onClick={() => { setLoginMode(true); setRegError(""); }}
                  style={{ backgroundColor: "var(--bordeaux)", color: "var(--fond-blanc)", borderRadius: "8px", padding: "8px 16px", border: "none", cursor: "pointer", fontSize: "13px", fontFamily: "DM Sans", fontWeight: 500 }}>
                  On se connaît déjà →
                </button>
              </div>
            )}

            <button type="submit" disabled={!regEmail.trim() || !regPassword || regLoading}
              style={{ backgroundColor: regEmail.trim() && regPassword && !regLoading ? "var(--bordeaux)" : "var(--texte-discret)", color: "var(--fond-blanc)", borderRadius: "12px", padding: "16px 28px", fontSize: "15px", fontFamily: "DM Sans, sans-serif", fontWeight: 500, border: "none", width: "100%", cursor: regEmail.trim() && regPassword && !regLoading ? "pointer" : "not-allowed", marginBottom: "16px" }}>
              {regLoading ? "···" : loginMode ? "On se connaît déjà →" : "Créer mon espace →"}
            </button>

            <p style={{ textAlign: "center" }}>
              <button type="button" onClick={() => { setLoginMode(!loginMode); setRegError(""); }}
                style={{ background: "none", border: "none", color: "var(--texte-discret)", fontSize: "13px", cursor: "pointer", textDecoration: "underline", fontFamily: "DM Sans, sans-serif" }}>
                {loginMode ? "Créer un nouvel espace" : "On se connaît déjà →"}
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
                  {msg.content === "__error__" ? (
                    <div>
                      <p style={{ marginBottom: "10px" }}>{`J'ai du mal à te répondre là. Tu veux réessayer ?`}</p>
                      <button onClick={() => {
                        const msgs = chatMessages.filter(m => m.content !== "__error__");
                        setChatMessages(msgs);
                        setChatLoading(true);
                        callTefi(msgs, (data) => {
                          setChatMessages([...msgs, { role: "assistant", content: data.text }]);
                        }).catch(() => {
                          setChatMessages([...msgs, { role: "assistant", content: "__error__" }]);
                        }).finally(() => setChatLoading(false));
                      }}
                        style={{ backgroundColor: "var(--bordeaux)", color: "var(--fond-blanc)", border: "none", borderRadius: "8px", padding: "6px 12px", fontSize: "12px", cursor: "pointer", fontFamily: "DM Sans" }}>
                        Réessayer
                      </button>
                    </div>
                  ) : msg.content}
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
