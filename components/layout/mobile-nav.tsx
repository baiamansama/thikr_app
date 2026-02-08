"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { Home, BookOpen, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface MobileNavProps {
  isLoggedIn: boolean;
}

export function MobileNav({ isLoggedIn }: MobileNavProps) {
  const pathname = usePathname();
  const t = useTranslations("Header");

  const links = [
    { href: "/", icon: Home, label: t("home") },
    { href: "/courses", icon: BookOpen, label: t("courses") },
    {
      href: isLoggedIn ? "/profile" : "/login",
      icon: User,
      label: isLoggedIn ? t("profile") : t("signIn"),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-cream-200 bg-cream-50/90 backdrop-blur-md md:hidden">
      <div className="flex items-center justify-around py-2">
        {links.map((link) => {
          const isActive =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 text-xs transition-colors",
                isActive
                  ? "text-green-500"
                  : "text-beige-400 hover:text-brown-600"
              )}
            >
              <link.icon className="h-5 w-5" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
