"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const t = useTranslations("ThemeToggle");

  // next-themes can't know the real theme during SSR; avoid hydration mismatch.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const current =
    mounted ? ((theme === "system" ? resolvedTheme : theme) ?? "light") : "light";
  const isDark = current === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={mounted ? (isDark ? t("light") : t("dark")) : t("dark")}
      title={mounted ? (isDark ? t("light") : t("dark")) : t("dark")}
      className="text-brown-600 hover:text-brown-700 hover:bg-cream-100 dark:text-foreground"
    >
      {mounted ? (
        isDark ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )
      ) : (
        // Stable SSR output; swapped post-mount.
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
}
