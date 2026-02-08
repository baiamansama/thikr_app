import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

export async function Footer() {
  const headerT = await getTranslations("Header");
  const applyT = await getTranslations("ApplyTeacher");
  return (
    <footer className="border-t border-cream-200 bg-cream-50 py-8 hidden md:block">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-brown-700 dark:text-foreground">
              {headerT("brand")}
            </span>
            <span className="text-sm text-beige-400">
              Islamic Learning Platform
            </span>
          </div>
          <nav className="flex gap-6 text-sm text-beige-400">
            <Link href="/courses" className="hover:text-brown-600 transition-colors">
              {headerT("courses")}
            </Link>
            <Link href="/apply-teacher" className="hover:text-brown-600 transition-colors">
              {applyT("title")}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
