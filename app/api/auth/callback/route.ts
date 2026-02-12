import { NextResponse, type NextRequest } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/route";
import { getCanonicalSiteUrl, safeRedirectPath } from "@/lib/url";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams, origin, hostname, protocol } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeRedirectPath(searchParams.get("next"), "/");
  const isLocalEnv = process.env.NODE_ENV === "development";
  const canonical = getCanonicalSiteUrl();
  const base = isLocalEnv ? origin : (canonical ?? origin);

  // Enforce canonical host before exchanging auth codes so cookies land on the right domain.
  if (!isLocalEnv && canonical) {
    const c = new URL(canonical);
    if (hostname !== c.hostname || protocol !== c.protocol) {
      return NextResponse.redirect(new URL(`${c.origin}/api/auth/callback${searchParams.toString() ? `?${searchParams.toString()}` : ""}`));
    }
  }

  if (code) {
    const response = NextResponse.redirect(new URL(next, base));
    const supabase = createRouteHandlerClient(request, response);
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Ensure the app DB user exists for OAuth flows.
      try {
        const authUser = data.user;
        if (authUser) {
          const { getUserByAuthId, createUser } = await import("@/lib/db/queries/users");
          const existing = await getUserByAuthId(authUser.id);
          if (!existing) {
            const name =
              (authUser.user_metadata?.full_name as string | undefined) ??
              (authUser.email?.split("@")[0] ?? "User");
            await createUser({
              authId: authUser.id,
              name,
              avatarUrl: authUser.user_metadata?.avatar_url as string | undefined,
            });
          }
        }
      } catch {
        // Don't block login if DB isn't available locally.
      }
      return response;
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth", base));
}
