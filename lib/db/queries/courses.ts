import { db } from "@/lib/db";
import {
  courses,
  enrollments,
  courseLikes,
  lessons,
  lessonProgress,
} from "@/lib/db/schema";
import { eq, desc, and, sql, count } from "drizzle-orm";

export async function getPublishedCourses(options?: {
  category?: string;
  language?: string;
  difficulty?: string;
  limit?: number;
  offset?: number;
}) {
  const conditions = [eq(courses.isPublished, true)];

  if (options?.category) {
    conditions.push(eq(courses.category, options.category));
  }
  if (options?.difficulty) {
    conditions.push(
      eq(courses.difficulty, options.difficulty as "beginner" | "intermediate" | "advanced")
    );
  }

  return db.query.courses.findMany({
    where: and(...conditions),
    with: {
      teacher: {
        columns: { id: true, name: true, avatarUrl: true },
      },
      lessons: {
        columns: { id: true },
      },
      likes: {
        columns: { id: true },
      },
    },
    orderBy: [desc(courses.createdAt)],
    limit: options?.limit ?? 20,
    offset: options?.offset ?? 0,
  });
}

export async function getCourseById(courseId: string) {
  return db.query.courses.findFirst({
    where: eq(courses.id, courseId),
    with: {
      teacher: {
        columns: { id: true, name: true, avatarUrl: true, bio: true },
      },
      lessons: {
        orderBy: (lessons, { asc }) => [asc(lessons.order)],
        with: {
          content: {
            orderBy: (content, { asc }) => [asc(content.order)],
          },
        },
      },
      likes: {
        columns: { userId: true },
      },
    },
  });
}

export async function getCoursesByTeacher(teacherId: string) {
  return db.query.courses.findMany({
    where: eq(courses.teacherId, teacherId),
    with: {
      lessons: { columns: { id: true } },
      enrollments: { columns: { id: true } },
    },
    orderBy: [desc(courses.updatedAt)],
  });
}

export async function getFeaturedCourses(limit = 4) {
  return db.query.courses.findMany({
    where: eq(courses.isPublished, true),
    with: {
      teacher: {
        columns: { id: true, name: true, avatarUrl: true },
      },
      lessons: { columns: { id: true } },
      likes: { columns: { id: true } },
    },
    orderBy: [desc(courses.createdAt)],
    limit,
  });
}

export async function getCourseLikeCount(courseId: string) {
  const result = await db
    .select({ count: count() })
    .from(courseLikes)
    .where(eq(courseLikes.courseId, courseId));
  return result[0]?.count ?? 0;
}

export async function isCourseLikedByUser(userId: string, courseId: string) {
  const result = await db.query.courseLikes.findFirst({
    where: and(
      eq(courseLikes.userId, userId),
      eq(courseLikes.courseId, courseId)
    ),
  });
  return !!result;
}

export async function isUserEnrolled(userId: string, courseId: string) {
  const result = await db.query.enrollments.findFirst({
    where: and(
      eq(enrollments.userId, userId),
      eq(enrollments.courseId, courseId)
    ),
  });
  return !!result;
}

export async function getCourseProgress(userId: string, courseId: string) {
  const courseLessons = await db.query.lessons.findMany({
    where: eq(lessons.courseId, courseId),
    columns: { id: true },
  });

  if (courseLessons.length === 0) return 0;

  const lessonIds = courseLessons.map((l) => l.id);
  const completedCount = await db
    .select({ count: count() })
    .from(lessonProgress)
    .where(
      and(
        eq(lessonProgress.userId, userId),
        eq(lessonProgress.completed, true),
        sql`${lessonProgress.lessonId} = ANY(${lessonIds})`
      )
    );

  return (completedCount[0]?.count ?? 0) / courseLessons.length;
}
