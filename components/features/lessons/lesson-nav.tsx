"use client";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProgressButton } from "./progress-button";
import { useTranslations } from "next-intl";

interface LessonNavProps {
  courseId: string;
  lessonId: string;
  previous: { id: string; title: Record<string, string> } | null;
  next: { id: string; title: Record<string, string> } | null;
  isCompleted: boolean;
  isEnrolled: boolean;
}

export function LessonNav({
  courseId,
  lessonId,
  previous,
  next,
  isCompleted,
  isEnrolled,
}: LessonNavProps) {
  const t = useTranslations("Lesson");
  return (
    <div className="flex items-center justify-between gap-4 py-6">
      {previous ? (
        <Button asChild variant="outline" className="border-cream-200 text-brown-600 hover:bg-cream-100">
          <Link href={`/courses/${courseId}/lessons/${previous.id}`}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            {t("previous")}
          </Link>
        </Button>
      ) : (
        <div />
      )}

      {isEnrolled && (
        <ProgressButton
          lessonId={lessonId}
          courseId={courseId}
          isCompleted={isCompleted}
        />
      )}

      {next ? (
        <Button asChild className="bg-green-500 hover:bg-green-600 text-white">
          <Link href={`/courses/${courseId}/lessons/${next.id}`}>
            {t("next")}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      ) : (
        <Button asChild variant="outline" className="border-cream-200 text-brown-600 hover:bg-cream-100">
          <Link href={`/courses/${courseId}`}>{t("backToCourse")}</Link>
        </Button>
      )}
    </div>
  );
}
