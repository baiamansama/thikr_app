import { getCurrentUser } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { BookOpen, Home, User, LogIn } from "lucide-react";
import { MobileNav } from "./mobile-nav";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleSwitcher } from "@/components/locale-switcher";

export async function Header() {
  const t = await getTranslations("Header");

  // Use app-level user so OAuth logins also get a DB user record created.
  let dbUser = null;
  try {
    dbUser = await getCurrentUser();
  } catch {
    dbUser = null;
  }

  return (
    <>
      {/* Desktop header */}
      <header className="sticky top-0 z-50 border-b border-cream-200 bg-cream-50/80 backdrop-blur-md hidden md:block">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-brown-700 dark:text-foreground">
              {t("brand")}
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            <Button variant="ghost" asChild className="text-brown-600 hover:text-brown-700 hover:bg-cream-100">
              <Link href="/" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                {t("home")}
              </Link>
            </Button>
            <Button variant="ghost" asChild className="text-brown-600 hover:text-brown-700 hover:bg-cream-100">
              <Link href="/courses" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                {t("courses")}
              </Link>
            </Button>
          </nav>

          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <ThemeToggle />
            {dbUser ? (
              <Button variant="ghost" asChild className="text-brown-600 hover:text-brown-700 hover:bg-cream-100">
                <Link href="/profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {dbUser.name}
                </Link>
              </Button>
            ) : (
              <Button asChild className="bg-green-500 hover:bg-green-600 text-white">
                <Link href="/login" className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  {t("signIn")}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <MobileNav isLoggedIn={!!dbUser} />
    </>
  );
}
