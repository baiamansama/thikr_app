import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublishableOrAnonKey, getSupabaseUrl } from "./env";
import { hasSupabaseAuthCookieFromNames } from "./auth-cookie";

export async function updateSession(
  request: NextRequest,
  response?: NextResponse
) {
  const supabaseResponse =
    response ??
    NextResponse.next({
      request,
    });

  const cookieNames = request.cookies.getAll().map((c) => c.name);
  // If there's no Supabase auth cookie, skip the network roundtrip entirely.
  if (!hasSupabaseAuthCookieFromNames(cookieNames)) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabasePublishableOrAnonKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session - important for Server Components.
  // Supabase recommends `getClaims()` for SSR auth; it also avoids trusting `getSession()`.
  await supabase.auth.getClaims();

  return supabaseResponse;
}
