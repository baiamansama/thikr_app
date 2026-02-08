"use client";

import Image from "next/image";
import { User, Shield, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

interface ProfileHeaderProps {
  name: string;
  avatarUrl?: string | null;
  bio?: string | null;
  role: "student" | "teacher" | "admin";
  isOwnProfile?: boolean;
}

const roleConfig = {
  student: { icon: User, color: "text-beige-400" },
  teacher: { icon: GraduationCap, color: "text-green-500" },
  admin: { icon: Shield, color: "text-gold" },
} as const;

export function ProfileHeader({
  name,
  avatarUrl,
  bio,
  role,
  isOwnProfile,
}: ProfileHeaderProps) {
  const t = useTranslations("Profile");
  const { icon: RoleIcon, color } = roleConfig[role];
  const label = t(`roles.${role}` as const);

  return (
    <div className="rounded-2xl border border-cream-200 bg-cream-100 p-6 md:p-8 dark:bg-card">
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-cream-200 dark:bg-muted">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={name}
              width={64}
              height={64}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <User className="h-8 w-8 text-beige-400" />
          )}
        </div>

        <div className="flex-1">
          <h1 className="text-2xl font-bold text-brown-700 dark:text-foreground">{name}</h1>
          <div className={cn("mt-1 flex items-center gap-1 text-sm", color)}>
            <RoleIcon className="h-4 w-4" />
            <span>{label}</span>
          </div>
          {bio && (
            <p className="mt-3 text-sm text-beige-400 leading-relaxed">
              {bio}
            </p>
          )}
        </div>

        {isOwnProfile && (
          <Link
            href="/profile/edit"
            className="rounded-lg border border-cream-200 px-3 py-1.5 text-sm text-beige-400 hover:bg-cream-200 transition-colors"
          >
            {t("edit")}
          </Link>
        )}
      </div>
    </div>
  );
}
