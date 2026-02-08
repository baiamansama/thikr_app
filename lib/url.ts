import { headers } from "next/headers";

export function getCanonicalSiteUrl(): string | null {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);

  if (!raw) return null;

  try {
    return new URL(raw).toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export async function getRequestOrigin(): Promise<string | null> {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (!host) return null;
    const proto =
      h.get("x-forwarded-proto") ??
      (process.env.NODE_ENV === "production" ? "https" : "http");
    return `${proto}://${host}`;
  } catch {
    return null;
  }
}

// Only allow app-internal redirects.
export function safeRedirectPath(nextPath: string | null, fallback = "/"): string {
  if (!nextPath) return fallback;
  if (!nextPath.startsWith("/")) return fallback;
  if (nextPath.startsWith("//")) return fallback;
  if (nextPath.includes("://")) return fallback;
  if (nextPath.includes("\\") || nextPath.includes("\0")) return fallback;
  return nextPath;
}
