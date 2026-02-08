"use client";

import { Link } from "@/i18n/navigation";
import { motion } from "motion/react";
import { BookOpen, Heart, Clock } from "lucide-react";
import { useTranslations } from "next-intl";

interface CourseCardProps {
  id: string;
  title: Record<string, string>;
  description?: Record<string, string> | null;
  category?: string | null;
  thumbnailUrl?: string | null;
  difficulty?: string | null;
  teacher: { id: string; name: string; avatarUrl?: string | null };
  lessonCount: number;
  likeCount: number;
  estimatedDuration?: number | null;
  progress?: number;
}

export function CourseCard({
  id,
  title,
  category,
  difficulty,
  teacher,
  lessonCount,
  likeCount,
  estimatedDuration,
  progress,
}: CourseCardProps) {
  const t = useTranslations("Courses");
  const displayTitle = title.en || title.ar || Object.values(title)[0] || "Untitled";

  return (
    <Link href={`/courses/${id}`} className="group block">
      <motion.div
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="overflow-hidden rounded-xl border border-cream-200 bg-cream-100 shadow-sm transition-shadow hover:shadow-md"
      >
        {/* Thumbnail placeholder */}
        <div className="relative h-40 bg-gradient-to-br from-green-500/20 to-green-600/10 flex items-center justify-center">
          <BookOpen className="h-12 w-12 text-green-500/40" />
          {difficulty && (
            <span className="absolute top-3 left-3 rounded-full bg-cream-50/90 px-2.5 py-0.5 text-xs font-medium text-brown-600 capitalize">
              {difficulty}
            </span>
          )}
          {category && (
            <span className="absolute top-3 right-3 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-600 capitalize">
              {category}
            </span>
          )}
          {progress !== undefined && progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-cream-200">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-brown-700 line-clamp-2 group-hover:text-green-600 transition-colors">
            {displayTitle}
          </h3>

          <p className="mt-1 text-sm text-beige-400">
            {teacher.name}
          </p>

          <div className="mt-3 flex items-center gap-4 text-xs text-beige-400">
            <span className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              {t("lessons", { count: lessonCount })}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />
              {likeCount}
            </span>
            {estimatedDuration && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {t("minutes", { count: estimatedDuration })}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
