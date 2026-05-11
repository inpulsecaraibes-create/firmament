import { Resend } from "resend";
import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "non autorisé" }, { status: 401 });

    const { besoin, urgence, message } = await request.json();

    await resend.emails.send({
      from: "FIRMAMENT Relais <tefi@frmmnt.fr>",
      to: "inpulsecaraibes@gmail.com",
      subject: `Le Relais — ${urgence === "oui" ? "🔴 URGENT" : "Demande"} : ${besoin}`,
      html: `
<div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 32px;">
  <p style="color: #5C1A2E; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;">FIRMAMENT · Le Relais</p>
  <h2 style="color: #1A1210; font-weight: 300; margin: 8px 0 24px;">Nouvelle demande ${urgence === "oui" ? "urgente" : ""}</h2>
  <table style="width: 100%; border-collapse: collapse;">
    <tr><td style="padding: 10px 0; color: #7A6A60; font-size: 13px; border-bottom: 1px solid #eee;">Email</td><td style="padding: 10px 0; font-size: 14px;">${user.email}</td></tr>
    <tr><td style="padding: 10px 0; color: #7A6A60; font-size: 13px; border-bottom: 1px solid #eee;">Urgence</td><td style="padding: 10px 0; font-size: 14px;">${urgence === "oui" ? "🔴 Oui" : "Non urgent"}</td></tr>
    <tr><td style="padding: 10px 0; color: #7A6A60; font-size: 13px; border-bottom: 1px solid #eee;">Besoin</td><td style="padding: 10px 0; font-size: 14px;">${besoin}</td></tr>
    ${message ? `<tr><td style="padding: 10px 0; color: #7A6A60; font-size: 13px;" valign="top">Message</td><td style="padding: 10px 0; font-size: 14px;">${message}</td></tr>` : ""}
  </table>
</div>`,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "envoi échoué" }, { status: 500 });
  }
}
