export function getSupabaseUrl(): string {
  // Must be accessed via a static property for Next to inline it into client bundles.
  const v = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!v) throw new Error("Missing required env var: NEXT_PUBLIC_SUPABASE_URL");
  return v;
}

/**
 * Supabase docs have transitioned from ANON key naming to PUBLISHABLE key naming.
 * Support both to keep local/dev/prod envs working.
 */
export function getSupabasePublishableOrAnonKey(): string {
  // Must be accessed via static properties for Next to inline into client bundles.
  const v =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!v) {
    throw new Error(
      "Missing required env var: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or *_ANON_KEY)"
    );
  }

  return v;
}
