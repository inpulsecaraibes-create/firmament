import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/app/lib/supabase/server";

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function GET() {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ plan: "free", daysLeft: 0, isExpired: true });

    const { data: profile } = await supabase.from("profiles").select("trial_ends_at,plan,created_at").eq("id", user.id).single();
    if (!profile) return NextResponse.json({ plan: "decouverte", daysLeft: 30, isExpired: false });

    const trialEnd = profile.trial_ends_at ? new Date(profile.trial_ends_at) : new Date(new Date(profile.created_at).getTime() + 30 * 24 * 60 * 60 * 1000);
    const daysLeft = Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const isExpired = daysLeft <= 0;

    // Compter les dumps du jour (pour limit 1/jour en mode expiré)
    let dumpsToday = 0;
    if (isExpired) {
      const today = new Date().toISOString().split("T")[0];
      const { count } = await admin.from("conversations").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("role", "user").eq("session_date", today);
      dumpsToday = count || 0;
    }

    return NextResponse.json({ plan: profile.plan || "decouverte", daysLeft, isExpired, dumpsToday });
  } catch (err) {
    console.error("[trial-check]", err);
    return NextResponse.json({ plan: "decouverte", daysLeft: 30, isExpired: false, dumpsToday: 0 });
  }
}
