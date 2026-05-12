import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    if (!userId) return NextResponse.json({ ok: true });

    // Vérifier si l'utilisateur est un filleul
    const { data: referral } = await admin.from("referrals").select("id,parrain_id,filleul_dumps,validated").eq("filleul_id", userId).single();
    if (!referral || referral.validated) return NextResponse.json({ ok: true });

    const newCount = (referral.filleul_dumps || 0) + 1;
    await admin.from("referrals").update({ filleul_dumps: newCount }).eq("id", referral.id);

    // 3ème dump → valider le parrainage
    if (newCount >= 3) {
      await admin.from("referrals").update({ validated: true }).eq("id", referral.id);

      // Vérifier si le parrain a 3 referrals validés
      const { count } = await admin.from("referrals").select("*", { count: "exact", head: true }).eq("parrain_id", referral.parrain_id).eq("validated", true);

      if ((count || 0) >= 3) {
        // Offrir 1 mois au parrain
        const { data: parrinProfile } = await admin.from("profiles").select("trial_ends_at").eq("id", referral.parrain_id).single();
        const currentEnd = parrinProfile?.trial_ends_at ? new Date(parrinProfile.trial_ends_at) : new Date();
        const newEnd = new Date(Math.max(currentEnd.getTime(), Date.now()) + 30 * 24 * 60 * 60 * 1000);
        await admin.from("profiles").update({ trial_ends_at: newEnd.toISOString() }).eq("id", referral.parrain_id);
      }
    }

    return NextResponse.json({ ok: true, dumpCount: newCount });
  } catch (err) {
    console.error("[track-dump]", err);
    return NextResponse.json({ ok: true });
  }
}
