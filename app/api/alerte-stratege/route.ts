import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/app/lib/supabase/server";

const resend = new Resend(process.env.RESEND_API_KEY);
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST() {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "non autorisé" }, { status: 401 });

    const { data: profile } = await admin.from("profiles")
      .select("prenom,surcharge_score,clarity_score,score_updated_at")
      .eq("id", user.id).single();

    if (!profile || profile.surcharge_score !== "rouge") {
      return NextResponse.json({ error: "score non rouge" }, { status: 400 });
    }

    // Vérifier qu'on n'a pas déjà alerté dans les 48h
    const lastAlert = profile.score_updated_at ? new Date(profile.score_updated_at).getTime() : 0;
    if ((Date.now() - lastAlert) < 48 * 3600000) {
      return NextResponse.json({ error: "alerte déjà envoyée récemment" }, { status: 429 });
    }

    const { count: activeTasks } = await admin.from("tasks").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "active");
    const { count: overdueUrgent } = await admin.from("tasks").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("is_urgent", true).eq("status", "active");

    const html = `
<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:32px">
  <h2 style="color:#5C1A2E;margin:0 0 16px">🔴 Alerte surcharge — ${profile.prenom || "Utilisateur"}</h2>
  <table style="width:100%;border-collapse:collapse">
    <tr><td style="padding:8px 0;color:#7A6A60;border-bottom:1px solid #eee">Utilisateur</td><td style="padding:8px 0">${profile.prenom || ""} · ${user.email}</td></tr>
    <tr><td style="padding:8px 0;color:#7A6A60;border-bottom:1px solid #eee">Score surcharge</td><td style="padding:8px 0;color:#B00020;font-weight:bold">🔴 ROUGE</td></tr>
    <tr><td style="padding:8px 0;color:#7A6A60;border-bottom:1px solid #eee">Tâches actives</td><td style="padding:8px 0">${activeTasks || "?"}</td></tr>
    <tr><td style="padding:8px 0;color:#7A6A60;border-bottom:1px solid #eee">Tâches urgentes en retard</td><td style="padding:8px 0">${overdueUrgent || "0"}</td></tr>
    <tr><td style="padding:8px 0;color:#7A6A60">Score de clarté</td><td style="padding:8px 0">${profile.clarity_score || "?"}%</td></tr>
  </table>
  <p style="margin-top:24px;color:#3D2E28">→ Proposer une intervention.</p>
</div>`;

    await resend.emails.send({
      from: "FIRMAMENT Alerte <terri@frmmnt.fr>",
      to: [process.env.RELAIS_EMAIL_1 || "admin@frmmnt.fr", process.env.RELAIS_EMAIL_2 || "admin@frmmnt.fr"].filter((v,i,a)=>a.indexOf(v)===i),
      subject: `🔴 Alerte surcharge — ${profile.prenom || "Utilisateur"} · frmmnt.fr`,
      html,
    });

    // Marquer l'alerte (updated_at = maintenant pour éviter le spam 48h)
    await admin.from("profiles").update({ score_updated_at: new Date().toISOString() }).eq("id", user.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[alerte-stratege]", err);
    return NextResponse.json({ error: "envoi échoué" }, { status: 500 });
  }
}
