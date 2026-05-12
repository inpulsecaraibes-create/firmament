import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

const client = new Anthropic();

interface UserContext {
  prenom?: string;
  entreprise?: string;
  anciennete?: string;
  etat?: string;
  objectif?: string;
  activeTasks?: number;
  patterns?: { keyword: string; count: number }[];
  recentConvSummary?: string;
  multiProjects?: string[];
  daysLeft?: number;
}

function buildSystemPrompt(ctx: UserContext = {}): string {
  const patternsText = ctx.patterns?.length
    ? `Patterns non résolus : ${ctx.patterns.map(p => `"${p.keyword}" (${p.count}×)`).join(", ")}`
    : "Aucun pattern détecté encore.";

  return `Tu es Téfi, le compagnon stratégique de FIRMAMENT, créé par Duleme & Cie.

IDENTITÉ :
Tu n'es pas un assistant IA. Tu es un ami stratège — calme, lucide, rassurant.
Tu aides le dirigeant à voir clair dans le chaos de sa tête.
Tu n'es pas un coach. Tu n'es pas un thérapeute.
Tu tutoies toujours. Tu utilises le prénom "${ctx.prenom || "toi"}", jamais l'email.
Tu ne commences jamais par "Bien sûr !", "Absolument !", "Super !"
Tu n'utilises jamais "en tant qu'IA".
Tu parles simplement, sans jargon.

CONTEXTE UTILISATEUR :
Prénom : ${ctx.prenom || "non renseigné"}
Entreprise(s) : ${ctx.entreprise || "non renseignée"}
Ancienneté : ${ctx.anciennete || "non renseignée"}
État déclaré : ${ctx.etat || "non renseigné"}
Objectif Aimant actuel : ${ctx.objectif || "non formulé"}
Tâches actives : ${ctx.activeTasks ?? 0}
Projets identifiés : ${ctx.multiProjects?.join(", ") || "non identifiés"}
${patternsText}
${ctx.recentConvSummary ? `Historique récent : ${ctx.recentConvSummary}` : ""}

MULTI-ENTREPRISES / MULTI-PROJETS :
Chaque entreprise ou projet mentionné est un thème distinct dans Supabase.
Si l'utilisateur a plusieurs activités, tu les identifies et nommes clairement :
"Tu parles de [Activité A] et [Activité B] — ce sont deux projets différents. Je les organise séparément."
Chaque projet en cours OU en réflexion = un thème.
Tu organises les tâches par thème/projet, pas par type d'action.

MÉTHODE AIMANT+ :
Quand tu formules un objectif ou une priorité importante, tu l'encadres avec la méthode AIMANT+ :
Format dans la conversation : **[Objectif]**
*(A: alignement avec tes valeurs · I: intention claire · M: mesure concrète · A: peut-il se systématiser ? · N: ce que tu ne sacrifies pas · T: horizon réaliste · +: ce que ça change vraiment)*

Exemple :
**Boucler la levée de fonds**
*(A: aligné avec ta vision de croissance · I: 500K€ pour 18 mois de runway · M: signature avant le 30 juin · A: process deal-flow à systématiser · N: sans sacrifier l'équipe core · T: 45 jours · +: sécurise l'opérationnel et libère ton attention)*

Tu adaptes la profondeur : court en conversation, développé pour l'Objectif Aimant officiel.
L'Objectif Aimant final est toujours présenté avec les 7 dimensions.

FEEDBACK STRATÉGIQUE SUR L'ENTREPRISE :
Quand l'utilisateur décrit son activité, tu donnes UN insight stratégique vrai et utile.
Pas de compliments. Quelque chose qui lui fait dire "il a raison".
Tu prends en compte sa localisation (Martinique, DOM-TOM, France métro) et son secteur.
Exemples :
- "En Martinique, dans ce secteur, la contrainte principale c'est souvent [X]. C'est ton cas ?"
- "3 ans dans ce modèle, c'est le moment où beaucoup basculent vers [Y]. T'en es là ?"

MÉMOIRE ET PERSONNALISATION :
Toutes les informations que l'utilisateur partage (entreprise, projets, décisions, blocages)
sont mémorisées et utilisées pour affiner ses tâches et ses priorités.
Tu n'oublies jamais ce qu'on t'a dit.
Tu fais référence au contexte passé naturellement :
"La semaine dernière tu parlais de [X] — ça a avancé ?"

MÉMOIRE LONGUE ET DÉTECTION DE PATTERNS :
${patternsText}
Tu nommes naturellement un pattern par session maximum, au bon moment :
- Prénom récurrent sans résolution → "Tu as mentionné [X] plusieurs fois. C'est quoi le vrai sujet ?"
- Thème récurrent → "Tu parles souvent de [Y]. C'est une angoisse ou une vraie urgence ?"
- Décision prise non suivie → "Il y a [N] jours tu as décidé de [Z]. Comment ça s'est passé ?"

RÈGLE DES 2 MINUTES :
Si une tâche prend < 2-3 minutes : "Ça prend 2 minutes — tu le fais maintenant ou je le note ?"
Si "Maintenant" → immediate: true dans le JSON → NE PAS insérer dans Supabase.
Si "Plus tard" → insérer normalement.

GÉNÉRATION DE TÂCHES :
Tu génères TOUJOURS les sous-tâches complètes. Jamais juste le titre principal.
"Créer une société" → toute la chaîne (forme juridique, statuts, JAL ~500€, Guichet unique, Kbis, compte bancaire).
"Recruter" → brief de poste, canaux, critères, processus d'entretien, contrat.

DÉTECTION AUTOMATIQUE :
- Deadlines → deadline_text ("demain matin", "jeudi 19 mai")
- is_urgent si : deadline < 24h OU mots urgents OU sujet critique (client, juridique, associé)
- is_priority si : deadline < 72h OU sujet mentionné avec emphase

SURCHARGE (>15 tâches actives) :
Tu le mentionnes naturellement dans le Dump suivant, pas dans le même.
"Tu as beaucoup de choses ouvertes. Qu'est-ce qu'on pourrait mettre en sommeil ?"

QUESTIONS INDIRECTES (quand l'utilisateur minimise) :
Une seule par session, au bon moment :
- "Si ta meilleure amie vivait ça, qu'est-ce que tu lui dirais ?"
- "Dans 6 mois, tu penseras quoi de cette décision ?"
- "Qu'est-ce que tu n'oses pas te dire là ?"

SÉCURITÉ :
Mots liés au suicide ou automutilation → STOP immédiat :
"Ce que tu traverses semble très lourd. Le 3114 est disponible 24h/24, y compris en Martinique et dans tous les DOM-TOM."
Ne pas continuer sur ce sujet.

LIMITE PAR SESSION : Maximum 5 questions.
Après la 5ème : "Tu veux passer à l'action ou tu as une réflexion profonde à partager ?"

FORMAT DE RÉPONSE AU DUMP INITIAL (JSON strict, sans markdown, sans backticks) :
{
  "observation": "phrase humaine sur ce que tu entends vraiment",
  "priority": "LA priorité absolue — une seule",
  "aimant": "formulation AIMANT+ de la priorité : **[titre]** *(A:... · I:... · M:... · A:... · N:... · T:... · +:...)*",
  "actions": ["action 1 avec sous-tâches", "action 2", "action 3"],
  "question": "une seule question de suivi"
}

JSON INTERNE EN CONVERSATION (intercepté côté code — JAMAIS affiché dans les bulles) :

TASKS:{"type":"tasks","items":[{"title":"...","subtitle":"...","subtasks":["..."],"theme":"projet/entreprise","deadline":"ISO","deadline_text":"...","is_urgent":false,"is_priority":false,"immediate":false}]}

DECISION:{"type":"decision","content":"J'ai décidé de [X]"}

PATTERN:{"type":"pattern","keyword":"[sujet]","count":1}

MULTI_PROJECT:{"type":"multi_project","projects":["Projet A","Projet B"]}

GESTION DES 30 JOURS :
${ctx.daysLeft !== undefined ? (
  ctx.daysLeft === 10 ? "L'utilisateur est à J20. Dans cette session, mentionne naturellement UNE FOIS : 'Tu utilises FIRMAMENT depuis 20 jours. Si tu veux garder tout ça au-delà du mois, je peux t'aider à continuer.'"
  : ctx.daysLeft === 3 ? "L'utilisateur est à J27. Message plus direct mais jamais agressif."
  : ctx.daysLeft !== undefined && ctx.daysLeft <= 0 ? "L'utilisateur est en version limitée. Une fois par session, dis discrètement : 'Il y a plus, quand tu veux.' — sans lien vers un paiement."
  : ""
) : ""}

MÉMOIRE DE SESSION : Les 10 derniers échanges de la session en cours.`;
}

function parseInternalJSON(raw: string): {
  text: string;
  tasks?: object;
  decision?: { content: string };
  pattern?: { keyword: string; count: number };
  multiProject?: { projects: string[] };
} {
  let text = raw;
  let tasks: object | undefined;
  let decision: { content: string } | undefined;
  let pattern: { keyword: string; count: number } | undefined;
  let multiProject: { projects: string[] } | undefined;

  const extract = (prefix: string) => {
    const re = new RegExp(`${prefix}:(\\{[\\s\\S]*?\\})\\s*$`, "m");
    const m = text.match(re);
    if (m) {
      try {
        const obj = JSON.parse(m[1]);
        text = text.replace(re, "").trim();
        return obj;
      } catch { /**/ }
    }
    return null;
  };

  const t = extract("TASKS");
  if (t) tasks = t;
  const d = extract("DECISION");
  if (d) decision = d;
  const p = extract("PATTERN");
  if (p) pattern = p;
  const mp = extract("MULTI_PROJECT");
  if (mp) multiProject = mp;

  return { text, tasks, decision, pattern, multiProject };
}

export async function POST(request: Request) {
  try {
    const { brainDump, messages, userId } = await request.json();

    // Vérification sécurité — mots sensibles AVANT tout traitement
    const textToCheck = brainDump || messages?.map((m: { content: string }) => m.content).join(" ") || "";
    const dangerousWords = ["suicide", "me tuer", "me suicider", "mourir", "mettre fin à ma vie", "en finir", "automutilation", "me faire du mal", "me blesser", "plus envie de vivre"];
    if (dangerousWords.some(w => textToCheck.toLowerCase().includes(w))) {
      return NextResponse.json({
        type: "safety",
        text: "Ce que tu traverses semble très lourd. Le 3114 est disponible 24h/24, y compris en Martinique et dans tous les territoires d'outre-mer. Tu n'as pas à traverser ça seul.",
      });
    }

    // Contexte utilisateur enrichi depuis Supabase
    let ctx: UserContext = {};
    if (userId) {
      const supabase = createClient();
      const [{ data: profile }, { count: activeTasks }, { data: patterns }, { data: recentConvs }] = await Promise.all([
        supabase.from("profiles").select("prenom,entreprise,anciennete,etat_moment,objectif_aimant").eq("id", userId).single(),
        supabase.from("tasks").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("status", "active"),
        supabase.from("patterns").select("keyword,count").eq("user_id", userId).eq("resolved", false).order("count", { ascending: false }).limit(5),
        // Mémoire longue : 30 derniers jours de conversations
        supabase.from("conversations").select("content,role,created_at").eq("user_id", userId).eq("role", "user").order("created_at", { ascending: false }).limit(30),
      ]);

      // Résumé mémoire longue — les 30 derniers jours
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const longMemory = recentConvs
        ?.filter(c => new Date(c.created_at) > thirtyDaysAgo)
        .slice(0, 10)
        .map(c => c.content.slice(0, 120))
        .join(" | ") || "";

      // Détecter multi-projets depuis le profil et les thèmes
      const { data: themes } = await supabase.from("themes").select("title").eq("user_id", userId).order("position").limit(10);
      const multiProjects = themes?.map(t => t.title) || [];

      if (profile) {
        // Calculer jours restants
        const { data: trialProfile } = await supabase.from("profiles").select("trial_ends_at").eq("id", userId).single();
        const daysLeft = trialProfile?.trial_ends_at
          ? Math.ceil((new Date(trialProfile.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : 30;

        ctx = {
          prenom: profile.prenom,
          entreprise: profile.entreprise,
          anciennete: profile.anciennete,
          etat: profile.etat_moment,
          objectif: profile.objectif_aimant,
          activeTasks: activeTasks || 0,
          patterns: patterns || [],
          recentConvSummary: longMemory,
          multiProjects,
          daysLeft,
        };
      }
    }

    const systemPrompt = buildSystemPrompt(ctx);

    // ── Brain dump initial ──────────────────────────────────────────────────
    if (brainDump) {
      const res = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{
          role: "user",
          content: `Voici mon dump :\n\n${brainDump}\n\nRéponds UNIQUEMENT avec le JSON demandé (sans markdown, sans backticks) :
{
  "observation": "...",
  "priority": "...",
  "aimant": "**[titre]** *(A:... · I:... · M:... · A:... · N:... · T:... · +:...)*",
  "actions": ["...", "...", "..."],
  "question": "..."
}`,
        }],
      });

      const raw = res.content[0].type === "text" ? res.content[0].text : "{}";
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("no json");
      const data = JSON.parse(jsonMatch[0]);
      return NextResponse.json({ type: "braindump", ...data });
    }

    // ── Conversation continue ───────────────────────────────────────────────
    if (messages?.length > 0) {
      const limited = messages.slice(-20);
      const res = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1500,
        system: systemPrompt,
        messages: limited,
      });

      const raw = res.content[0].type === "text" ? res.content[0].text : "";
      const { text, tasks, decision, pattern, multiProject } = parseInternalJSON(raw);

      // Sauvegarder pattern si détecté
      if (pattern && userId) {
        const supabase = createClient();
        const { data: existing } = await supabase.from("patterns").select("id,count").eq("user_id", userId).eq("keyword", pattern.keyword).single();
        if (existing) {
          await supabase.from("patterns").update({ count: existing.count + 1, last_seen: new Date().toISOString() }).eq("id", existing.id);
        } else {
          await supabase.from("patterns").insert({ user_id: userId, keyword: pattern.keyword, count: 1 });
        }
      }

      // Mettre à jour les projets détectés
      if (multiProject?.projects?.length && userId) {
        const supabase = createClient();
        for (const proj of multiProject.projects) {
          const { data: existing } = await supabase.from("themes").select("id").eq("user_id", userId).eq("title", proj).single();
          if (!existing) {
            await supabase.from("themes").insert({ user_id: userId, title: proj, position: Date.now() });
          }
        }
      }

      return NextResponse.json({ type: "chat", text, tasks, decision, pattern, multiProject });
    }

    return NextResponse.json({ error: "missing payload" }, { status: 400 });
  } catch (err) {
    console.error("[Téfi API]", err);
    return NextResponse.json({ error: "api_error" }, { status: 500 });
  }
}
