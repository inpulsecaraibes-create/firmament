import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/app/lib/supabase/server";

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(request: Request) {
  try {
    const { code } = await request.json();
    if (!code) return NextResponse.json({ error: "code requis" }, { status: 400 });

    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "non connecté" }, { status: 401 });

    // Vérifier que le code existe et n'est pas utilisé
    const { data: sesame } = await admin.from("sesames").select("id,used_by").eq("code", code.trim().toUpperCase()).single();

    if (!sesame) return NextResponse.json({ error: "Code invalide" }, { status: 404 });
    if (sesame.used_by) return NextResponse.json({ error: "Ce code a déjà été utilisé" }, { status: 409 });

    // Appliquer le code : prolonger trial_ends_at de 30 jours
    const { data: profile } = await admin.from("profiles").select("trial_ends_at").eq("id", user.id).single();
    const currentEnd = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : new Date();
    const newEnd = new Date(Math.max(currentEnd.getTime(), Date.now()) + 30 * 24 * 60 * 60 * 1000);

    await admin.from("profiles").update({ trial_ends_at: newEnd.toISOString() }).eq("id", user.id);
    await admin.from("sesames").update({ used_by: user.id, used_at: new Date().toISOString() }).eq("id", sesame.id);

    const days = Math.ceil((newEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return NextResponse.json({ success: true, newDaysLeft: days });
  } catch (err) {
    console.error("[sesame]", err);
    return NextResponse.json({ error: "erreur serveur" }, { status: 500 });
  }
}
