import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSupabasePublishableOrAnonKey, getSupabaseUrl } from "./env";

/**
 * Route handlers must write auth cookies onto the NextResponse.
 * Using `cookies().set()` here is unreliable and can be blocked by Next.
 */
export function createRouteHandlerClient(request: NextRequest, response: NextResponse) {
  return createServerClient(getSupabaseUrl(), getSupabasePublishableOrAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });
}
