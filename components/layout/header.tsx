"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, Home, User, LogIn } from "lucide-react";
import { MobileNav } from "./mobile-nav";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";

type HeaderUser = {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

function displayName(u: HeaderUser): string {
  const metaName = (u.user_metadata?.["full_name"] as string | undefined) ?? undefined;
  if (metaName) return metaName;
  const email = u.email ?? "";
  if (email.includes("@")) return email.split("@")[0] || "Profile";
  return "Profile";
}

export function Header() {
  const t = useTranslations("Header");
  const [user, setUser] = React.useState<HeaderUser | null>(null);

  React.useEffect(() => {
    let supabase: ReturnType<typeof createSupabaseClient> | null = null;
    try {
      supabase = createSupabaseClient();
    } catch {
      // Allow the website to load without Supabase env configured.
      setUser(null);
      return;
    }

    let mounted = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setUser((data.session?.user as unknown as HeaderUser) ?? null);
      })
      .catch(() => {
        if (!mounted) return;
        setUser(null);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser((session?.user as unknown as HeaderUser) ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const isLoggedIn = !!user;

  return (
    <>
      {/* Desktop header */}
      <header className="sticky top-0 z-50 border-b border-cream-200 bg-cream-50/80 backdrop-blur-md hidden md:block dark:bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-brown-700 dark:text-foreground">
              {t("brand")}
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            <Button
              variant="ghost"
              asChild
              className="text-brown-600 hover:text-brown-700 hover:bg-cream-100"
            >
              <Link href="/" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                {t("home")}
              </Link>
            </Button>
            <Button
              variant="ghost"
              asChild
              className="text-brown-600 hover:text-brown-700 hover:bg-cream-100"
            >
              <Link href="/courses" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                {t("courses")}
              </Link>
            </Button>
          </nav>

          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <ThemeToggle />
            {isLoggedIn ? (
              <Button
                variant="ghost"
                asChild
                className="text-brown-600 hover:text-brown-700 hover:bg-cream-100"
              >
                <Link href="/profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {user ? displayName(user) : t("profile")}
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
      <MobileNav isLoggedIn={isLoggedIn} />
    </>
  );
}
