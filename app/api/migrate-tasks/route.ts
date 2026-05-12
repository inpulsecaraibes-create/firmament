import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Utilise le service role pour bypasser RLS lors de la migration
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { userId, pendingTasks } = await request.json();

    if (!userId || !pendingTasks?.length) {
      return NextResponse.json({ success: true, migrated: 0 });
    }

    let migrated = 0;

    for (const { theme, tasks } of pendingTasks) {
      if (!tasks?.length) continue;

      // Créer ou récupérer la thématique
      const { data: existing } = await adminClient
        .from("themes")
        .select("id")
        .eq("user_id", userId)
        .eq("title", theme)
        .single();

      let themeId: string;

      if (existing) {
        themeId = existing.id;
      } else {
        const { data: newTheme, error: themeErr } = await adminClient
          .from("themes")
          .insert({ user_id: userId, title: theme || "Priorités", position: Date.now() })
          .select()
          .single();

        if (themeErr || !newTheme) {
          console.error("[migrate] theme insert error:", themeErr);
          continue;
        }
        themeId = newTheme.id;
      }

      // Insérer les tâches
      const { error: tasksErr } = await adminClient.from("tasks").insert(
        tasks.map((t: { title: string; subtitle?: string; is_urgent?: boolean }, i: number) => ({
          user_id: userId,
          theme_id: themeId,
          title: t.title,
          subtitle: t.subtitle || null,
          is_urgent: t.is_urgent || false,
          position: i,
          status: "active",
        }))
      );

      if (tasksErr) {
        console.error("[migrate] tasks insert error:", tasksErr);
      } else {
        migrated += tasks.length;
      }
    }

    return NextResponse.json({ success: true, migrated });
  } catch (err) {
    console.error("[migrate-tasks]", err);
    return NextResponse.json({ error: "migration failed" }, { status: 500 });
  }
}
