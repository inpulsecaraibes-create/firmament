import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // Routes publiques — toujours accessibles
  const publicPaths = ["/auth/login", "/auth/register", "/auth/callback", "/rgpd", "/cgu", "/mentions-legales"];
  if (publicPaths.some(p => path.startsWith(p))) return response;
  if (path.startsWith("/api/") || path.startsWith("/_next/") || path.match(/\.(png|svg|ico|jpg|webp|css|js|woff)$/)) return response;

  // Non connecté → landing (/)
  if (!user) {
    if (path === "/") return response;
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Connecté : vérifier onboarding
  if (path === "/" || path === "/auth/login" || path === "/auth/register") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_complete, onboarding_step")
      .eq("id", user.id)
      .single();

    if (!profile?.onboarding_complete) {
      const step = profile?.onboarding_step || "not_started";
      if (step === "not_started" || step === "q1" || step === "q2" || step === "q3") {
        return NextResponse.redirect(new URL("/auth/onboarding", request.url));
      }
      if (step === "questions_done") {
        return NextResponse.redirect(new URL("/auth/objectif", request.url));
      }
    }
    return NextResponse.redirect(new URL("/home", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg|ico|webp)$).*)"],
};
