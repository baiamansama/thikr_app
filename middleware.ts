import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/middleware";

function getCanonicalFromEnv(): URL | null {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? null;
  if (!raw) return null;
  try {
    const u = new URL(raw);
    // normalize away any trailing slashes
    u.pathname = "";
    u.search = "";
    u.hash = "";
    return u;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  // Canonical host redirect prevents auth cookies being set on one host (e.g. www)
  // then navigating to another (e.g. apex) and "losing" the session.
  if (process.env.NODE_ENV === "production") {
    const canonical = getCanonicalFromEnv();
    if (canonical) {
      const url = request.nextUrl.clone();
      if (url.hostname !== canonical.hostname || url.protocol !== canonical.protocol) {
        url.hostname = canonical.hostname;
        url.protocol = canonical.protocol;
        url.port = canonical.port;
        return NextResponse.redirect(url, 308);
      }
    }
  }

  const handleI18nRouting = createIntlMiddleware(routing);
  const response = handleI18nRouting(request);
  return await updateSession(request, response);
}

export const config = {
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};
