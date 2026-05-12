import { NextResponse } from "next/server";

// Transcription via OpenAI Whisper — qualité supérieure au browser API
// Gère les accents, la vitesse, le bruit ambiant
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as Blob;
    const language = (formData.get("language") as string) || "fr";

    if (!audioFile) return NextResponse.json({ error: "no audio" }, { status: 400 });

    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_KEY) {
      // Fallback : retourner une erreur gracieuse si pas de clé OpenAI
      return NextResponse.json({ error: "whisper_unavailable", fallback: true }, { status: 503 });
    }

    // Préparer le fichier pour Whisper
    const whisperForm = new FormData();
    whisperForm.append("file", audioFile, "audio.webm");
    whisperForm.append("model", "whisper-1");
    whisperForm.append("language", language);
    whisperForm.append("response_format", "json");

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_KEY}` },
      body: whisperForm,
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[Whisper]", err);
      return NextResponse.json({ error: "whisper_error", fallback: true }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json({ transcript: data.text });
  } catch (err) {
    console.error("[Transcribe]", err);
    return NextResponse.json({ error: "transcription_failed", fallback: true }, { status: 500 });
  }
}
