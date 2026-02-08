import { db } from "@/lib/db";
import { lessonProgress, userStreaks } from "@/lib/db/schema";
import { eq, and, count } from "drizzle-orm";

export async function getLessonProgressForUser(
  userId: string,
  lessonId: string
) {
  return db.query.lessonProgress.findFirst({
    where: and(
      eq(lessonProgress.userId, userId),
      eq(lessonProgress.lessonId, lessonId)
    ),
  });
}

export async function getCompletedLessonsCount(userId: string) {
  const result = await db
    .select({ count: count() })
    .from(lessonProgress)
    .where(
      and(
        eq(lessonProgress.userId, userId),
        eq(lessonProgress.completed, true)
      )
    );
  return result[0]?.count ?? 0;
}

export async function getUserStreak(userId: string) {
  return db.query.userStreaks.findFirst({
    where: eq(userStreaks.userId, userId),
  });
}

export async function getCompletedLessonIds(
  userId: string,
  lessonIds: string[]
) {
  if (lessonIds.length === 0) return [];

  const completed = await db.query.lessonProgress.findMany({
    where: and(
      eq(lessonProgress.userId, userId),
      eq(lessonProgress.completed, true)
    ),
    columns: { lessonId: true },
  });

  return completed
    .map((p) => p.lessonId)
    .filter((id) => lessonIds.includes(id));
}
