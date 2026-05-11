import { Resend } from "resend";
import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "non autorisé" }, { status: 401 });

    const { summary, actions_done, actions_remaining, decisions } = await request.json();

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const fmt = (d: Date) => d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { margin: 0; padding: 0; background-color: #F8F5F0; font-family: 'DM Sans', -apple-system, sans-serif; }
  .container { max-width: 560px; margin: 0 auto; padding: 40px 24px; }
  .header { text-align: center; margin-bottom: 32px; }
  .logo-text { color: #5C1A2E; font-size: 28px; font-weight: 300; letter-spacing: 0.12em; }
  .week { color: #B0A098; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; margin-top: 6px; }
  .card { background: #FDFBF8; border-radius: 12px; padding: 20px 24px; margin-bottom: 16px; border: 1px solid rgba(26,18,16,0.08); }
  .label { color: #B0A098; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 10px; }
  .summary { color: #3D2E28; font-size: 15px; line-height: 1.65; font-style: italic; }
  .action-done { color: #1B3A2D; font-size: 14px; padding: 6px 0; border-bottom: 1px solid rgba(26,18,16,0.06); }
  .action-done::before { content: "✓ "; }
  .action-remaining { color: #7A6A60; font-size: 14px; padding: 6px 0; border-bottom: 1px solid rgba(26,18,16,0.06); }
  .action-remaining::before { content: "○ "; }
  .bordeaux-line { height: 2px; background: #5C1A2E; margin: 24px 0; opacity: 0.12; }
  .footer { text-align: center; color: #B0A098; font-size: 11px; font-style: italic; margin-top: 32px; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <div class="logo-text">FIRMAMENT</div>
    <div class="week">Ton Point · semaine du ${fmt(weekStart)}</div>
  </div>

  <div class="card">
    <div class="label">Ce que Téfi retient de ta semaine</div>
    <div class="summary">${summary || "Une semaine de progression. Continue."}</div>
  </div>

  ${actions_done?.length > 0 ? `
  <div class="card">
    <div class="label">Accompli cette semaine</div>
    ${actions_done.map((a: string) => `<div class="action-done">${a}</div>`).join("")}
  </div>` : ""}

  ${actions_remaining?.length > 0 ? `
  <div class="card">
    <div class="label">Ce qui reste</div>
    ${actions_remaining.map((a: string) => `<div class="action-remaining">${a}</div>`).join("")}
  </div>` : ""}

  ${decisions?.length > 0 ? `
  <div class="card">
    <div class="label">Décisions prises</div>
    ${decisions.map((d: string) => `<div class="action-done">${d}</div>`).join("")}
  </div>` : ""}

  <div class="bordeaux-line"></div>
  <div class="footer">FIRMAMENT par Duleme & Cie · frmmnt.fr</div>
</div>
</body>
</html>`;

    const { error } = await resend.emails.send({
      from: "Téfi · FIRMAMENT <tefi@frmmnt.fr>",
      to: user.email!,
      subject: `Ton Point FIRMAMENT — semaine du ${fmt(weekStart)}`,
      html,
    });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "envoi échoué" }, { status: 500 });
  }
}
