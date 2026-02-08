"use client";

import { Check, Lock, BookOpen, Music, FileText } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import { pickLocalized } from "@/lib/i18n/text";

interface Lesson {
  id: string;
  title: Record<string, string>;
  type: "azkar" | "text" | "audio";
  order: number;
  estimatedDuration: number | null;
}

interface LessonListProps {
  courseId: string;
  lessons: Lesson[];
  completedLessonIds?: string[];
  isEnrolled: boolean;
}

const typeIcons = {
  azkar: BookOpen,
  text: FileText,
  audio: Music,
};

export function LessonList({
  courseId,
  lessons,
  completedLessonIds = [],
  isEnrolled,
}: LessonListProps) {
  const t = useTranslations("Courses");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  return (
    <div className="space-y-2">
      {lessons.map((lesson, index) => {
        const isCompleted = completedLessonIds.includes(lesson.id);
        const TypeIcon = typeIcons[lesson.type] || BookOpen;
        const displayTitle =
          pickLocalized(lesson.title, locale) || tCommon("untitled");

        const content = (
          <div
            className={cn(
              "flex items-center gap-4 rounded-lg border p-4 transition-colors",
              isCompleted
                ? "border-green-500/20 bg-green-500/5"
                : "border-cream-200 bg-cream-100",
              isEnrolled && "hover:border-green-500/40 cursor-pointer"
            )}
          >
            <div
              className={cn(
                "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-medium",
                isCompleted
                  ? "bg-green-500 text-white"
                  : "bg-cream-200 text-brown-600"
              )}
            >
              {isCompleted ? (
                <Check className="h-4 w-4" />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "font-medium truncate",
                  isCompleted ? "text-green-600" : "text-brown-700"
                )}
              >
                {displayTitle}
              </p>
              {lesson.estimatedDuration && (
                <p className="text-xs text-beige-400">
                  {t("minutes", { count: lesson.estimatedDuration })}
                </p>
              )}
            </div>

            <TypeIcon className="h-4 w-4 flex-shrink-0 text-beige-400" />

            {!isEnrolled && (
              <Lock className="h-4 w-4 flex-shrink-0 text-beige-400" />
            )}
          </div>
        );

        if (isEnrolled) {
          return (
            <Link
              key={lesson.id}
              href={`/courses/${courseId}/lessons/${lesson.id}`}
            >
              {content}
            </Link>
          );
        }

        return <div key={lesson.id}>{content}</div>;
      })}
    </div>
  );
}
