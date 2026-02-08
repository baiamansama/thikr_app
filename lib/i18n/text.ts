export function pickLocalized(
  map: Record<string, string> | null | undefined,
  locale: string,
  fallbacks: string[] = ["en", "ky", "ar"]
): string | null {
  if (!map) return null;
  if (map[locale]) return map[locale]!;
  for (const fb of fallbacks) {
    if (map[fb]) return map[fb]!;
  }
  const any = Object.values(map)[0];
  return any ?? null;
}

