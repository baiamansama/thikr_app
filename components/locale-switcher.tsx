"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export function LocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslations("LocaleSwitcher");
  const router = useRouter();
  const pathname = usePathname();

  function set(nextLocale: "en" | "ky") {
    router.replace(pathname, { locale: nextLocale });
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        size="sm"
        variant={locale === "en" ? "default" : "ghost"}
        onClick={() => set("en")}
        aria-label={t("en")}
        className={
          locale === "en"
            ? "bg-green-500 hover:bg-green-600 text-white"
            : "text-brown-600 hover:text-brown-700 hover:bg-cream-100 dark:text-foreground"
        }
      >
        EN
      </Button>
      <Button
        type="button"
        size="sm"
        variant={locale === "ky" ? "default" : "ghost"}
        onClick={() => set("ky")}
        aria-label={t("ky")}
        className={
          locale === "ky"
            ? "bg-green-500 hover:bg-green-600 text-white"
            : "text-brown-600 hover:text-brown-700 hover:bg-cream-100 dark:text-foreground"
        }
      >
        KG
      </Button>
    </div>
  );
}

