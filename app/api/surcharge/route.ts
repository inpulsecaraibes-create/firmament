import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const STRESS_KEYWORDS = ["débordé", "épuisé", "impossible", "trop", "plus le temps", "saturé", "submergé", "à bout", "perdu", "chaos", "overwhelmed", "burnout", "burn-out"];

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    if (!userId) return NextResponse.json({ score: "vert" });

    const now = Date.now();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 3600000).toISOString();
    const sevenDaysAgo = new Date(now - 7 * 24 * 3600000).toISOString();
    const fortyEightHAgo = new Date(now - 48 * 3600000).toISOString();

    const [
      { count: activeTasks },
      { count: overdueUrgent },
      { data: recentConvs },
      { count: doneTasks30j },
      { count: createdTasks30j }
    ] = await Promise.all([
      admin.from("tasks").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("status", "active").eq("is_sleeping", false),
      admin.from("tasks").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("is_urgent", true).eq("status", "active").lt("updated_at", fortyEightHAgo),
      admin.from("conversations").select("content").eq("user_id", userId).gte("created_at", sevenDaysAgo),
      admin.from("tasks").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("status", "done").gte("updated_at", thirtyDaysAgo),
      admin.from("tasks").select("*", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", thirtyDaysAgo),
    ]);

    // Compter mots de stress
    const allText = (recentConvs || []).map(c => c.content.toLowerCase()).join(" ");
    const stressCount = STRESS_KEYWORDS.reduce((acc, kw) => acc + (allText.split(kw).length - 1), 0);

    // Taux de complétion
    const completionRate = createdTasks30j ? (doneTasks30j || 0) / createdTasks30j : 1;
    const clarityScore = Math.round(completionRate * 100);

    let score = "vert";
    if ((activeTasks || 0) > 25 || (overdueUrgent || 0) > 5 || stressCount > 10 || completionRate < 0.2) score = "rouge";
    else if ((activeTasks || 0) > 15 || (overdueUrgent || 0) > 2 || stressCount > 5 || completionRate < 0.4) score = "orange";

    await admin.from("profiles").update({
      surcharge_score: score,
      clarity_score: clarityScore,
      score_updated_at: new Date().toISOString(),
    }).eq("id", userId);

    // Score rouge → email alerte
    if (score === "rouge") {
      const { data: profile } = await admin.from("profiles").select("prenom,surcharge_score,score_updated_at").eq("id", userId).single();
      const lastAlert = profile?.score_updated_at ? new Date(profile.score_updated_at).getTime() : 0;
      const hoursSince = (now - lastAlert) / 3600000;
      if (hoursSince > 48) {
        // Email sera envoyé via le bouton "Alerter le Stratège" — pas automatiquement
        // (évite le spam si l'alerte est récente)
      }
    }

    return NextResponse.json({ score, clarityScore, activeTasks, overdueUrgent, stressCount });
  } catch (err) {
    console.error("[surcharge]", err);
    return NextResponse.json({ score: "vert" });
  }
}
