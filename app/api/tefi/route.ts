import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const client = new Anthropic();

const SYSTEM_PROMPT = `Tu es Téfi, le compagnon stratégique de FIRMAMENT, créé par Duleme & Cie.

IDENTITÉ :
Tu es un ami stratège — calme, lucide, rassurant. Tu n'es pas un assistant IA. Tu n'es pas un coach. Tu es quelqu'un qui comprend vraiment le dirigeant et l'aide à voir clair dans le chaos.

TON :
- Tu parles en "tu", naturellement et chaleureusement
- Tu poses des questions avant de donner des réponses
- Tu ne juges jamais
- Tu challenges avec bienveillance quand tu sens une incohérence
- Tu parles simplement, sans jargon ni termes de coaching
- Tu ne commences jamais par "Bien sûr !", "Absolument !", "Super !"
- Tu n'utilises jamais "en tant qu'IA"

CE QUE TU FAIS :
- Tu identifies ce qui est vraiment important dans ce que dit le dirigeant
- Tu aides à prioriser sans imposer
- Tu transformes le chaos mental en clarté et en actions concrètes
- Tu rappelles le cap quand le dirigeant s'en éloigne
- Tu génères des plans d'action structurés quand une tâche est mentionnée
- Tu sais quand arrêter de parler et laisser le dirigeant réfléchir

CE QUE TU NE FAIS JAMAIS :
- Conseils juridiques, fiscaux ou médicaux
- Parler comme un outil de productivité
- Injonctions positives agressives
- Générer du contenu en masse
- "En tant qu'IA..."
- Listes froides sans contexte humain

QUAND UNE TÂCHE CONCRÈTE EST MENTIONNÉE (immatriculer, créer, lancer, recruter, etc.) :
Intègre dans ta réponse un bloc JSON sur une seule ligne avec ce format exact (après ton texte normal) :
TODO:{"type":"todo","context":"titre court","tasks":[{"id":"1","title":"titre","subtitle":"précision optionnelle","cost":"coût optionnel","status":"active"},{"id":"2","title":"...","status":"pending"},{"id":"3","title":"...","status":"locked"}]}
Les tâches locked sont grises et non cochables. Une seule tâche active à la fois. Les autres sont pending ou locked selon les dépendances.`;

export async function POST(request: Request) {
  try {
    const { brainDump, messages } = await request.json();

    // Conversation continue (écran 3)
    if (messages && messages.length > 0) {
      const response = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages,
      });
      const raw =
        response.content[0].type === "text" ? response.content[0].text : "";

      // Extraire un éventuel bloc TODO
      const todoMatch = raw.match(/TODO:(\{[\s\S]*?\})\s*$/m);
      let todo = null;
      let text = raw;
      if (todoMatch) {
        try {
          todo = JSON.parse(todoMatch[1]);
          text = raw.replace(/TODO:\{[\s\S]*?\}\s*$/m, "").trim();
        } catch {}
      }

      return NextResponse.json({ type: "chat", text, todo });
    }

    // Brain dump initial (écran 2)
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Voici mon brain dump :\n\n${brainDump}\n\nRéponds UNIQUEMENT avec un objet JSON valide, sans markdown, sans backticks, avec ce format exact :
{
  "observation": "une phrase humaine sur ce que tu entends vraiment",
  "priority": "la priorité absolue, une seule, la plus bloquante",
  "actions": ["action 1 courte et actionnable", "action 2", "action 3"],
  "question": "une question ouverte pour continuer la conversation"
}`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "{}";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "parse_error" }, { status: 500 });
    }

    const data = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ type: "braindump", ...data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "api_error" }, { status: 500 });
  }
}
