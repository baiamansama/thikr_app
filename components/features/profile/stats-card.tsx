"use client";

import { Flame, BookOpen, Award, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";

interface StatsCardProps {
  currentStreak: number;
  longestStreak: number;
  lessonsCompleted: number;
  badgesEarned: number;
}

export function StatsCard({
  currentStreak,
  longestStreak,
  lessonsCompleted,
  badgesEarned,
}: StatsCardProps) {
  const t = useTranslations("Profile");
  const stats = [
    {
      icon: Flame,
      label: t("stats.currentStreak"),
      value: t("stats.days", { count: currentStreak }),
      color: "text-orange-500",
    },
    {
      icon: Trophy,
      label: t("stats.bestStreak"),
      value: t("stats.days", { count: longestStreak }),
      color: "text-gold",
    },
    {
      icon: BookOpen,
      label: t("stats.lessonsDone"),
      value: lessonsCompleted,
      color: "text-green-500",
    },
    {
      icon: Award,
      label: t("stats.badges"),
      value: badgesEarned,
      color: "text-gold",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-cream-200 bg-cream-100 p-4 text-center dark:bg-card"
        >
          <stat.icon className={`mx-auto h-6 w-6 ${stat.color}`} />
          <p className="mt-2 text-2xl font-bold text-brown-700 dark:text-foreground">
            {stat.value}
          </p>
          <p className="mt-1 text-xs text-beige-400">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
