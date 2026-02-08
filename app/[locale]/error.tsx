"use client";

import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("Errors");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream-50 px-4">
      <h1 className="text-4xl font-bold text-brown-700 dark:text-foreground">
        {t("title")}
      </h1>
      <p className="mt-4 text-lg text-beige-400">{t("body")}</p>
      <Button
        onClick={reset}
        className="mt-8 bg-green-500 hover:bg-green-600 text-white"
      >
        {t("tryAgain")}
      </Button>
    </div>
  );
}

