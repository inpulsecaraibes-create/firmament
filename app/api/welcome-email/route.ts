import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://frmmnt.fr";

export async function POST(request: Request) {
  try {
    const { email, prenom } = await request.json();
    if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

    const nom = prenom ? prenom.charAt(0).toUpperCase() + prenom.slice(1) : "";

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { margin:0; padding:0; background-color:#F8F5F0; font-family:Arial,sans-serif; }
  .wrap { max-width:520px; margin:0 auto; padding:40px 24px; }
  .brand { font-family:Georgia,serif; font-size:13px; letter-spacing:0.3em; text-transform:uppercase; color:#5C1A2E; text-align:center; margin-bottom:40px; }
  .body { background:#FDFBF8; border-radius:12px; padding:32px; border:1px solid rgba(26,18,16,0.08); }
  .body p { color:#3D2E28; font-size:16px; line-height:1.75; margin:0 0 18px; }
  .cta { display:block; background:#5C1A2E; color:#F8F5F0; border-radius:12px; padding:16px 28px; text-align:center; text-decoration:none; font-size:15px; font-weight:500; margin:28px 0; }
  .sig { color:#B0A098; font-size:13px; font-style:italic; text-align:center; margin-top:32px; }
  .unsub { text-align:center; margin-top:20px; font-size:11px; color:#B0A098; }
  .unsub a { color:#B0A098; }
</style>
</head>
<body>
<div class="wrap">
  <div class="brand">F I R M A M E N T</div>
  <div class="body">
    <p>Bonjour${nom ? " " + nom : ""},</p>
    <p>Je suis content que tu sois là.</p>
    <p>FIRMAMENT, c'est l'endroit où tu peux poser ce que tu as dans la tête — sans filtre, sans jugement, sans avoir à l'expliquer à qui que ce soit.</p>
    <p>Je m'appelle Terri. Je serai là à chaque fois que tu en as besoin.</p>
    <p>Pour commencer, dis-moi juste ce qui t'encombre le plus en ce moment.<br>Pas besoin que ce soit bien formulé. Balance.</p>
    <a href="${APP_URL}/home" class="cta">Ouvrir FIRMAMENT →</a>
    <p style="color:#B0A098;font-size:13px;margin:0">À tout de suite,<br><span style="font-family:Georgia,serif;font-style:italic;font-size:16px;color:#5C1A2E">Terri</span></p>
  </div>
  <div class="unsub"><a href="#">Se désabonner</a></div>
</div>
</body>
</html>`;

    await resend.emails.send({
      from: "Terri · FIRMAMENT <tefi@frmmnt.fr>",
      to: email,
      subject: `${nom ? nom + ", je" : "Je"} suis content de te voir ici.`,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[welcome-email]", err);
    return NextResponse.json({ error: "envoi échoué" }, { status: 500 });
  }
}
