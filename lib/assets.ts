function getRequiredPublicEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return v;
}

function getSupabasePublicBucket(): string {
  // Keep this configurable so we can move assets without DB rewrites.
  return process.env.NEXT_PUBLIC_SUPABASE_ASSETS_BUCKET || "thikr-assets";
}

export function getSupabasePublicObjectUrl(key: string): string {
  const baseUrl = getRequiredPublicEnv("NEXT_PUBLIC_SUPABASE_URL").replace(/\/$/, "");
  const bucket = getSupabasePublicBucket();
  const normalizedKey = key.replace(/^\/+/, "");
  return `${baseUrl}/storage/v1/object/public/${bucket}/${normalizedKey}`;
}

/**
 * Back-compat: legacy DB rows store audio as `/audio/<file>`.
 * We now serve audio from Supabase Storage (public bucket) under `audio/<file>`.
 */
export function resolveAudioUrl(audioUrl: string | null | undefined): string | undefined {
  if (!audioUrl) return undefined;
  if (/^https?:\/\//i.test(audioUrl)) return audioUrl;
  if (audioUrl.startsWith("/audio/")) {
    return getSupabasePublicObjectUrl(audioUrl.slice(1)); // "audio/<file>"
  }
  return audioUrl;
}

