function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export function getSupabaseUrl(): string {
  return required("NEXT_PUBLIC_SUPABASE_URL");
}

/**
 * Supabase docs have transitioned from ANON key naming to PUBLISHABLE key naming.
 * Support both to keep local/dev/prod envs working.
 */
export function getSupabasePublishableOrAnonKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
  );
}

