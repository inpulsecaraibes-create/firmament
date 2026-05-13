import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { besoin, urgence, message, prenom, entreprise } = await request.json();

    const html = `
<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:32px">
  <p style="color:#5C1A2E;font-size:11px;letter-spacing:0.14em;text-transform:uppercase">FIRMAMENT · Le Relais</p>
  <h2 style="color:#1A1210;font-weight:300;margin:8px 0 24px">Nouvelle demande ${urgence === "oui" ? "🔴 URGENTE" : ""}</h2>
  <table style="width:100%;border-collapse:collapse">
    <tr><td style="padding:10px 0;color:#7A6A60;font-size:13px;border-bottom:1px solid #eee">Prénom</td><td style="padding:10px 0;font-size:14px">${prenom || "N/A"}</td></tr>
    <tr><td style="padding:10px 0;color:#7A6A60;font-size:13px;border-bottom:1px solid #eee">Entreprise</td><td style="padding:10px 0;font-size:14px">${entreprise || "N/A"}</td></tr>
    <tr><td style="padding:10px 0;color:#7A6A60;font-size:13px;border-bottom:1px solid #eee">Urgence</td><td style="padding:10px 0;font-size:14px">${urgence === "oui" ? "🔴 Oui" : "Non urgent"}</td></tr>
    <tr><td style="padding:10px 0;color:#7A6A60;font-size:13px;border-bottom:1px solid #eee">Besoin</td><td style="padding:10px 0;font-size:14px">${besoin}</td></tr>
    ${message ? `<tr><td style="padding:10px 0;color:#7A6A60;font-size:13px" valign="top">Message</td><td style="padding:10px 0;font-size:14px">${message}</td></tr>` : ""}
  </table>
</div>`;

    await resend.emails.send({
      from: "FIRMAMENT Le Relais <terri@frmmnt.fr>",
      to: [
        process.env.RELAIS_EMAIL_1 || "admin@frmmnt.fr",
        process.env.RELAIS_EMAIL_2 || "admin@frmmnt.fr",
      ].filter((v, i, a) => a.indexOf(v) === i), // dédoublonner si même valeur
      subject: `Le Relais — ${urgence === "oui" ? "🔴 URGENT" : "Demande"} : ${besoin} — ${prenom || "Utilisateur"}`,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Relais]", err);
    return NextResponse.json({ error: "envoi échoué" }, { status: 500 });
  }
}
