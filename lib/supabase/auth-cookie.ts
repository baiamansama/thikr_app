export function hasSupabaseAuthCookieFromNames(cookieNames: string[]): boolean {
  // Supabase SSR cookies are typically named like:
  // - sb-<project-ref>-auth-token
  // They may also be prefixed by cookie prefixes:
  // - __Secure-sb-<project-ref>-auth-token
  // - __Host-sb-<project-ref>-auth-token
  // Some setups may use other variants; keep it permissive but specific.
  for (const name of cookieNames) {
    const n = name.toLowerCase();
    const stripped = n.replace(/^(__secure-|__host-)/, "");
    if (n === "supabase-auth-token") return true;
    // Broad match: Supabase SSR cookie storage keys are typically `sb-<project-ref>-...`.
    // If we see any `sb-` cookie at all, assume Supabase auth is in play.
    if (stripped.startsWith("sb-")) return true;
    // Most common cookie-chunk naming. Allow chunk suffixes like `.0`.
    if (stripped.includes("sb-") && stripped.includes("auth-token")) return true;
    if (stripped.includes("sb-") && stripped.includes("access-token")) return true;
    if (stripped.includes("sb-") && stripped.includes("refresh-token")) return true;
    // Fall back: any sb-* token-like cookie likely belongs to Supabase.
    if (stripped.includes("sb-") && stripped.includes("token")) return true;
  }
  return false;
}
