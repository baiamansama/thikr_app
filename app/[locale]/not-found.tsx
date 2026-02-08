import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("NotFound");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream-50 px-4">
      <h1 className="text-6xl font-bold text-brown-700 dark:text-foreground">
        404
      </h1>
      <p className="mt-4 text-lg text-beige-400">{t("title")}</p>
      <Button
        asChild
        className="mt-8 bg-green-500 hover:bg-green-600 text-white"
      >
        <Link href="/">{t("goHome")}</Link>
      </Button>
    </div>
  );
}

