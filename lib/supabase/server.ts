import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublishableOrAnonKey, getSupabaseUrl } from "./env";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    getSupabaseUrl(),
    getSupabasePublishableOrAnonKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (e) {
            // Next.js throws when trying to mutate cookies from Server Components.
            // In that case, ignore (middleware refresh will handle it). Otherwise, surface the error.
            const msg = e instanceof Error ? e.message : String(e);
            if (msg.includes("Cookies can only be modified")) return;
            if (msg.toLowerCase().includes("readonly")) return;
            throw e;
          }
        },
      },
    }
  );
}
