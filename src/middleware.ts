import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Protect /dashboard routes - redirect to login
  if (pathname.startsWith("/dashboard") && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // Protect /api routes - return 401.
  // /api/v1/*, /api/mcp, /api/cron/*, /api/integrations/* handle their own auth
  // (Bearer token or HMAC signature) inside each route.
  if (
    pathname.startsWith("/api") &&
    !pathname.startsWith("/api/v1") &&
    !pathname.startsWith("/api/mcp") &&
    !pathname.startsWith("/api/cron") &&
    !pathname.startsWith("/api/integrations") &&
    !user
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Redirect logged-in users away from login page
  if (pathname === "/login" && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Check if user has completed profile setup (skip for setup page itself)
  // Uses a cookie flag to avoid hitting the DB on every request
  if (user && pathname.startsWith("/dashboard") && pathname !== "/dashboard/setup") {
    const profileCheckedCookie = request.cookies.get("lp_profile_ok")?.value;
    const cookieUserId = profileCheckedCookie?.split(":")[0];

    if (cookieUserId !== user.id) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("user_id")
        .eq("user_id", user.id)
        .single();

      if (!profile) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard/setup";
        return NextResponse.redirect(url);
      }

      // Cache for 1 hour. Bound to user.id so a different user must re-verify.
      supabaseResponse.cookies.set("lp_profile_ok", `${user.id}:1`, {
        maxAge: 60 * 60,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/api/:path*"],
};
