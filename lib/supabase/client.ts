import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublishableOrAnonKey, getSupabaseUrl } from "./env";

export function createClient() {
  return createBrowserClient(
    getSupabaseUrl(),
    getSupabasePublishableOrAnonKey()
  );
}
