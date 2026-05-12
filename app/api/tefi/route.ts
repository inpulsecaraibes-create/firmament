import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

const client = new Anthropic();

function buildSystemPrompt(ctx: { prenom?: string; entreprise?: string; anciennete?: string; etat?: string; objectif?: string; activeTasks?: number } = {}) {
  return `Tu es Téfi, le compagnon stratégique de FIRMAMENT, créé par Duleme & Cie.

IDENTITÉ :
Tu n'es pas un assistant IA. Tu n'es pas un coach. Tu es un ami stratège — calme, lucide, rassurant. Tu aides le dirigeant à voir clair dans le chaos de sa tête.

TON :
- Tu tutoies toujours. Tu utilises le prénom "${ctx.prenom || "toi"}", jamais l'email.
- Tu poses des questions avant de donner des réponses.
- Tu ne juges jamais.
- Tu challenges avec bienveillance.
- Tu parles simplement, sans jargon.
- Tu ne commences jamais par "Bien sûr !", "Absolument !", "Super !"
- Tu n'utilises jamais "en tant qu'IA"

LIMITES PAR SESSION :
- Maximum 5 questions par session.
- Après la 5ème : "Tu veux passer à l'action ou tu as une idée ou une réflexion profonde à partager ?"
- "Passer à l'action" → tu génères les tâches JSON et tu dis que l'espace est mis à jour.
- "Une réflexion profonde" → nouveau cycle de 5 questions maximum.

SÉCURITÉ :
Si tu détectes des mots liés au suicide, à l'automutilation, à des pensées de violence grave — tu STOP et tu dis :
"Ce que tu traverses semble très lourd. Je t'invite à parler à quelqu'un qui peut vraiment t'aider — le 3114 est disponible 24h/24, y compris en Martinique et dans tous les territoires d'outre-mer."
Tu ne continues pas sur ce sujet après ça.

CONTEXTE UTILISATEUR :
- Prénom : ${ctx.prenom || "non renseigné"}
- Entreprise : ${ctx.entreprise || "non renseignée"}
- Ancienneté : ${ctx.anciennete || "non renseignée"}
- État déclaré : ${ctx.etat || "non renseigné"}
- Objectif Aimant : ${ctx.objectif || "non formulé"}
- Tâches actives : ${ctx.activeTasks ?? "?"}

FORMAT DE RÉPONSE AU DUMP (brain dump initial) :
Réponds UNIQUEMENT avec un objet JSON valide, sans markdown, sans backticks :
{
  "observation": "une phrase humaine sur ce que tu entends vraiment",
  "priority": "la priorité absolue — une seule, la plus bloquante",
  "actions": ["action 1 courte", "action 2", "action 3"],
  "question": "une seule question ouverte pour continuer"
}

QUAND TU GÉNÈRES DES TÂCHES (en conversation) :
Intègre dans ta réponse textuelle NORMALE un bloc JSON marqué sur une seule ligne, APRÈS ton texte :
TASKS:{"type":"tasks","items":[{"title":"...","subtitle":"...","theme":"...","is_urgent":false,"deadline_text":"..."}]}
Ce JSON est intercepté côté serveur — il ne s'affiche JAMAIS dans la conversation.
Dans ta réponse textuelle, dis simplement : "C'est fait. J'ai organisé tout ça dans ton espace."

QUAND TU DÉTECTES UNE DÉCISION :
Intègre : DECISION:{"type":"decision","content":"J'ai décidé de [X]"}

QUAND TU DÉTECTES UN RDV :
Intègre : AGENDA:{"type":"agenda","title":"RDV avec [X]","datetime":"ISO string","message":"Tu as mentionné un rendez-vous. Veux-tu que je l'ajoute à ton agenda ?"}

MÉMOIRE : Tu te souviens des 10 derniers échanges. Le dirigeant doit se sentir vraiment connu.`;
}

// Extraire et retirer les blocs JSON internes de la réponse de Téfi
function parseTefiResponse(raw: string): { text: string; tasks?: object; decision?: object; agenda?: object } {
  let text = raw;
  let tasks: object | undefined;
  let decision: object | undefined;
  let agenda: object | undefined;

  const tasksMatch = text.match(/TASKS:(\{[\s\S]*?\})\s*$/m);
  if (tasksMatch) {
    try { tasks = JSON.parse(tasksMatch[1]); } catch { /**/ }
    text = text.replace(/TASKS:\{[\s\S]*?\}\s*$/m, "").trim();
  }

  const decisionMatch = text.match(/DECISION:(\{[\s\S]*?\})/);
  if (decisionMatch) {
    try { decision = JSON.parse(decisionMatch[1]); } catch { /**/ }
    text = text.replace(/DECISION:\{[\s\S]*?\}/g, "").trim();
  }

  const agendaMatch = text.match(/AGENDA:(\{[\s\S]*?\})/);
  if (agendaMatch) {
    try { agenda = JSON.parse(agendaMatch[1]); } catch { /**/ }
    text = text.replace(/AGENDA:\{[\s\S]*?\}/g, "").trim();
  }

  return { text, tasks, decision, agenda };
}

export async function POST(request: Request) {
  try {
    const { brainDump, messages, userId } = await request.json();

    // Récupérer le contexte utilisateur si connecté
    let ctx = {};
    if (userId) {
      const supabase = createClient();
      const { data } = await supabase.from("profiles").select("prenom,entreprise,anciennete,etat_moment,objectif_aimant").eq("id", userId).single();
      const { count } = await supabase.from("tasks").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("status", "active");
      if (data) ctx = { prenom: data.prenom, entreprise: data.entreprise, anciennete: data.anciennete, etat: data.etat_moment, objectif: data.objectif_aimant, activeTasks: count || 0 };
    }

    const systemPrompt = buildSystemPrompt(ctx);

    // ── Brain dump initial → réponse JSON structurée ──────────────────────
    if (brainDump) {
      const res = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: `Voici mon dump :\n\n${brainDump}\n\nRéponds uniquement avec le JSON demandé.` }],
      });
      const raw = res.content[0].type === "text" ? res.content[0].text : "{}";
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("no json");
      const data = JSON.parse(jsonMatch[0]);
      return NextResponse.json({ type: "braindump", ...data });
    }

    // ── Conversation continue ────────────────────────────────────────────
    if (messages && messages.length > 0) {
      // Limiter aux 20 derniers messages (10 échanges)
      const limited = messages.slice(-20);
      const res = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: systemPrompt,
        messages: limited,
      });
      const raw = res.content[0].type === "text" ? res.content[0].text : "";
      const { text, tasks, decision, agenda } = parseTefiResponse(raw);
      return NextResponse.json({ type: "chat", text, tasks, decision, agenda });
    }

    return NextResponse.json({ error: "missing payload" }, { status: 400 });
  } catch (err) {
    console.error("[Téfi API]", err);
    return NextResponse.json({ error: "api_error" }, { status: 500 });
  }
}
