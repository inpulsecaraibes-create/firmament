import { Resend } from "resend";
import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

const resend = new Resend(process.env.RESEND_API_KEY);

// RESEND_API_KEY check
const resendKeyExists = !!process.env.RESEND_API_KEY;
const resendKeyPrefix = process.env.RESEND_API_KEY?.slice(0, 10) || 'MISSING';
console.log('[Resend] Key present:', resendKeyExists, '| Prefix:', resendKeyPrefix);

export async function POST(request: Request) {
  try {
    const { email, priority, actions, brainDump, tempId } = await request.json();
    if (!email) return NextResponse.json({ error: "données manquantes" }, { status: 400 });
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://frmmnt.fr";
    const ctaUrl = tempId ? `${APP_URL}/dump?from=email&tempId=${tempId}` : `${APP_URL}/home`;

    // Sauvegarder dans leads
    const supabase = createClient();
    await supabase.from("leads").insert({
      email: email.trim().toLowerCase(),
      source: "resume_dump",
      brain_dump: brainDump,
    });

    // Envoyer l'email
    const actionsHtml = actions
      .map((a: string, i: number) => `<div style="display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid rgba(26,18,16,0.07)"><span style="color:#8C6D3F;font-weight:600;font-size:13px;min-width:18px">${i + 1}.</span><span style="color:#3D2E28;font-size:14px;line-height:1.5">${a}</span></div>`)
      .join("");

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>body{margin:0;padding:0;background:#F8F5F0;font-family:-apple-system,sans-serif}</style>
</head>
<body>
<div style="max-width:520px;margin:0 auto;padding:40px 24px">
  <div style="text-align:center;margin-bottom:32px">
    <p style="color:#B0A098;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 6px">Duleme & Cie</p>
    <h1 style="color:#5C1A2E;font-size:28px;font-weight:300;letter-spacing:0.1em;margin:0">FIRMAMENT</h1>
  </div>
  <div style="background:#FDFBF8;border-radius:12px;padding:24px;margin-bottom:16px;border:1px solid rgba(26,18,16,0.08)">
    <p style="color:#B0A098;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;margin:0 0 12px">Ce que Terri a retenu</p>
    <p style="color:#5C1A2E;font-size:17px;font-weight:500;line-height:1.4;margin:0;font-style:italic">${priority}</p>
  </div>
  <div style="background:#FDFBF8;border-radius:12px;padding:20px 24px;margin-bottom:24px;border:1px solid rgba(26,18,16,0.08)">
    <p style="color:#B0A098;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;margin:0 0 4px">3 actions</p>
    ${actionsHtml}
  </div>
  <div style="background:#F0E8D8;border-radius:12px;padding:18px 20px;margin-bottom:28px">
    <p style="color:#3D2E28;font-size:14px;line-height:1.65;margin:0;font-style:italic">"Cette clarté est à toi. Si tu veux aller plus loin, ton espace t'attend."</p>
  </div>
  <div style="text-align:center">
    <a href="${ctaUrl}" style="display:inline-block;background:#5C1A2E;color:#F8F5F0;border-radius:12px;padding:14px 28px;font-size:14px;font-weight:500;text-decoration:none">
      Ouvrir FIRMAMENT →
    </a>
  </div>
  <p style="text-align:center;color:#B0A098;font-size:11px;font-style:italic;margin-top:32px">frmmnt.fr · Duleme & Cie</p>
</div>
</body>
</html>`;

    await resend.emails.send({
      from: "Terri · FIRMAMENT <terri@frmmnt.fr>",
      to: email,
      subject: "Terri a structuré ta tête — voilà ce qui compte",
      html,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "envoi échoué" }, { status: 500 });
  }
}
