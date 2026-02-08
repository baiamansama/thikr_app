import { revalidatePath } from "next/cache";
import { routing } from "@/i18n/routing";

function normalizePath(path: string): string {
  if (!path.startsWith("/")) return `/${path}`;
  return path;
}

function isAlreadyLocalePrefixed(path: string): boolean {
  for (const locale of routing.locales) {
    if (path === `/${locale}` || path.startsWith(`/${locale}/`)) return true;
  }
  return false;
}

/**
 * Revalidate a route in all supported locales (because `next-intl` is configured
 * with `localePrefix: "always"`).
 *
 * Pass non-locale-prefixed paths like `/courses` or `/courses/123`.
 */
export function revalidateLocalizedPath(path: string): void {
  const p = normalizePath(path);
  if (isAlreadyLocalePrefixed(p)) {
    revalidatePath(p);
    return;
  }

  for (const locale of routing.locales) {
    revalidatePath(p === "/" ? `/${locale}` : `/${locale}${p}`);
  }
}

