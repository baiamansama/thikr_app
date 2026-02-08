"use client";

import { useMemo } from "react";

interface UseCourseProgressProps {
  totalLessons: number;
  completedLessonIds: string[];
}

export function useCourseProgress({
  totalLessons,
  completedLessonIds,
}: UseCourseProgressProps) {
  const progress = useMemo(() => {
    if (totalLessons === 0) return 0;
    return completedLessonIds.length / totalLessons;
  }, [totalLessons, completedLessonIds]);

  const isComplete = progress >= 1;
  const completedCount = completedLessonIds.length;
  const percentComplete = Math.round(progress * 100);

  return {
    progress,
    isComplete,
    completedCount,
    totalLessons,
    percentComplete,
  };
}
