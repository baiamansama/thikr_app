"use server";

import { db } from "@/lib/db";
import { lessonProgress, userStreaks, enrollments, lessons } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "./auth";
import { checkAndAwardBadges } from "./badges";
import { revalidateLocalizedPath } from "@/lib/revalidate";

export async function markLessonComplete(lessonId: string, courseId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Must be logged in" };

  const lesson = await db.query.lessons.findFirst({
    where: and(eq(lessons.id, lessonId), eq(lessons.courseId, courseId)),
    columns: { id: true },
  });
  if (!lesson) return { error: "Invalid lesson for this course" };

  // Check enrollment
  const enrollment = await db.query.enrollments.findFirst({
    where: and(
      eq(enrollments.userId, user.id),
      eq(enrollments.courseId, courseId)
    ),
  });
  if (!enrollment) return { error: "Not enrolled in this course" };

  // Upsert lesson progress
  const existing = await db.query.lessonProgress.findFirst({
    where: and(
      eq(lessonProgress.userId, user.id),
      eq(lessonProgress.lessonId, lessonId)
    ),
  });

  if (existing) {
    if (existing.completed) return { data: existing };
    const [updated] = await db
      .update(lessonProgress)
      .set({ completed: true, completedAt: new Date() })
      .where(eq(lessonProgress.id, existing.id))
      .returning();

    await updateStreak(user.id);
    await checkAndAwardBadges(user.id);

    revalidateLocalizedPath(`/courses/${courseId}`);
    return { data: updated };
  }

  const [progress] = await db
    .insert(lessonProgress)
    .values({
      userId: user.id,
      lessonId,
      completed: true,
      completedAt: new Date(),
    })
    .returning();

  // Update enrollment lastAccessed
  await db
    .update(enrollments)
    .set({ lastAccessed: new Date() })
    .where(eq(enrollments.id, enrollment.id));

  await updateStreak(user.id);
  await checkAndAwardBadges(user.id);

  revalidateLocalizedPath(`/courses/${courseId}`);
  return { data: progress };
}

async function updateStreak(userId: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const streak = await db.query.userStreaks.findFirst({
    where: eq(userStreaks.userId, userId),
  });

  if (!streak) {
    await db.insert(userStreaks).values({
      userId,
      currentStreak: 1,
      longestStreak: 1,
      lastActivityDate: today,
    });
    return;
  }

  const lastActivity = streak.lastActivityDate
    ? new Date(streak.lastActivityDate)
    : null;

  if (!lastActivity) {
    const newStreak = Math.max(streak.currentStreak ?? 0, 1);
    await db
      .update(userStreaks)
      .set({
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, streak.longestStreak ?? 0),
        lastActivityDate: today,
      })
      .where(eq(userStreaks.id, streak.id));
    return;
  }

  if (lastActivity) {
    const lastDate = new Date(
      lastActivity.getFullYear(),
      lastActivity.getMonth(),
      lastActivity.getDate()
    );
    const diffDays = Math.floor(
      (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) {
      // Same day, no update needed
      return;
    } else if (diffDays === 1) {
      // Consecutive day
      const newStreak = streak.currentStreak + 1;
      await db
        .update(userStreaks)
        .set({
          currentStreak: newStreak,
          longestStreak: Math.max(newStreak, streak.longestStreak),
          lastActivityDate: today,
        })
        .where(eq(userStreaks.id, streak.id));
    } else {
      // Streak broken
      await db
        .update(userStreaks)
        .set({
          currentStreak: 1,
          lastActivityDate: today,
        })
        .where(eq(userStreaks.id, streak.id));
    }
  }
}
