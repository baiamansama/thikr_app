import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { getSupabasePublishableOrAnonKey, getSupabaseUrl } from "./env";

/**
 * Route handlers must write auth cookies onto the NextResponse.
 * Using `cookies().set()` here is unreliable and can be blocked by Next.
 */
export function createRouteHandlerClient(response: NextResponse) {
  // In Next 15+, `cookies()` may be async depending on runtime.
  // Keep this helper async-safe for both typings.
  const cookieStorePromise = cookies();

  return (async () =>
    createServerClient(getSupabaseUrl(), getSupabasePublishableOrAnonKey(), {
    cookies: {
      async getAll() {
        const cookieStore = await cookieStorePromise;
        return cookieStore.getAll();
      },
      async setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        // We don't need the current cookies to set new ones, but awaiting keeps types consistent.
        await cookieStorePromise;
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  }))();
}
