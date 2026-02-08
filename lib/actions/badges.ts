"use server";

import { db } from "@/lib/db";
import {
  userBadges,
  lessonProgress,
  enrollments,
  userStreaks,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "./auth";

export async function checkAndAwardBadges(userId: string) {
  const actor = await getCurrentUser();
  if (!actor) return [];
  if (actor.role !== "admin" && actor.id !== userId) return [];

  const allBadges = await db.query.badges.findMany();
  const earnedBadgeIds = (
    await db.query.userBadges.findMany({
      where: eq(userBadges.userId, userId),
      columns: { badgeId: true },
    })
  ).map((ub) => ub.badgeId);

  const unearnedBadges = allBadges.filter(
    (b) => !earnedBadgeIds.includes(b.id)
  );

  const newlyEarned: string[] = [];

  const completed = await db.query.lessonProgress.findMany({
    where: and(eq(lessonProgress.userId, userId), eq(lessonProgress.completed, true)),
    columns: { lessonId: true },
  });
  const completedLessonIds = new Set(completed.map((p) => p.lessonId));

  const needsEnrollmentCourses = unearnedBadges.some((b) => {
    if (b.criteriaType === "course_completion") return true;
    if (b.criteriaType !== "milestone") return false;
    const c = b.criteriaValue as Record<string, unknown> | null;
    const requiredCourses = (c?.coursesCompleted as number) ?? 0;
    return requiredCourses > 0;
  });

  const userEnrollments = needsEnrollmentCourses
    ? await db.query.enrollments.findMany({
        where: eq(enrollments.userId, userId),
        with: {
          course: {
            columns: { id: true, category: true },
            with: { lessons: { columns: { id: true } } },
          },
        },
      })
    : [];

  const isCourseCompleted = (courseLessons: { id: string }[]) => {
    if (courseLessons.length === 0) return false;
    return courseLessons.every((l) => completedLessonIds.has(l.id));
  };

  for (const badge of unearnedBadges) {
    const criteria = badge.criteriaValue as Record<string, unknown> | null;
    let shouldAward = false;

    switch (badge.criteriaType) {
      case "milestone": {
        const requiredLessons = (criteria?.lessonsCompleted as number) ?? 0;
        if (requiredLessons > 0) {
          shouldAward = completedLessonIds.size >= requiredLessons;
        }

        const requiredCourses = (criteria?.coursesCompleted as number) ?? 0;
        if (requiredCourses > 0 && !shouldAward) {
          const completedCourses = userEnrollments.reduce((acc, e) => {
            return acc + (isCourseCompleted(e.course.lessons) ? 1 : 0);
          }, 0);
          shouldAward = completedCourses >= requiredCourses;
        }
        break;
      }

      case "course_completion": {
        const courseCategory = criteria?.category as string | undefined;
        if (courseCategory) {
          shouldAward = userEnrollments.some((e) => {
            if (e.course.category !== courseCategory) return false;
            return isCourseCompleted(e.course.lessons);
          });
        }
        break;
      }

      case "streak": {
        const requiredDays = (criteria?.days as number) ?? 0;
        if (requiredDays > 0) {
          const streak = await db.query.userStreaks.findFirst({
            where: eq(userStreaks.userId, userId),
          });
          shouldAward = (streak?.currentStreak ?? 0) >= requiredDays;
        }
        break;
      }
    }

    if (shouldAward) {
      try {
        await db.insert(userBadges).values({ userId, badgeId: badge.id });
        newlyEarned.push(badge.id);
      } catch {
        // Ignore unique violations from races / repeated calls.
      }
    }
  }

  return newlyEarned;
}
