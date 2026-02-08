"use server";

import { db } from "@/lib/db";
import { courses, enrollments, courseLikes, lessons, lessonContent } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./auth";

export async function createCourse(data: {
  title: Record<string, string>;
  description?: Record<string, string>;
  category?: string;
  language?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  thumbnailUrl?: string;
  estimatedDuration?: number;
}) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "teacher" && user.role !== "admin")) {
    return { error: "Unauthorized" };
  }

  const [course] = await db
    .insert(courses)
    .values({
      ...data,
      teacherId: user.id,
    })
    .returning();

  return { data: course };
}

export async function updateCourse(
  courseId: string,
  data: {
    title?: Record<string, string>;
    description?: Record<string, string>;
    category?: string;
    language?: string;
    difficulty?: "beginner" | "intermediate" | "advanced";
    thumbnailUrl?: string;
    estimatedDuration?: number;
    isPublished?: boolean;
  }
) {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  const course = await db.query.courses.findFirst({
    where: eq(courses.id, courseId),
  });

  if (!course || (course.teacherId !== user.id && user.role !== "admin")) {
    return { error: "Unauthorized" };
  }

  const [updated] = await db
    .update(courses)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(courses.id, courseId))
    .returning();

  revalidatePath(`/courses/${courseId}`);
  return { data: updated };
}

export async function deleteCourse(courseId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  const course = await db.query.courses.findFirst({
    where: eq(courses.id, courseId),
  });

  if (!course || (course.teacherId !== user.id && user.role !== "admin")) {
    return { error: "Unauthorized" };
  }

  await db.delete(courses).where(eq(courses.id, courseId));
  revalidatePath("/courses");
  return { success: true };
}

export async function enrollInCourse(courseId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Must be logged in to enroll" };

  const course = await db.query.courses.findFirst({
    where: eq(courses.id, courseId),
    columns: { id: true, isPublished: true },
  });
  if (!course) return { error: "Course not found" };
  if (!course.isPublished) return { error: "Course is not available to enroll" };

  const existing = await db.query.enrollments.findFirst({
    where: and(
      eq(enrollments.userId, user.id),
      eq(enrollments.courseId, courseId)
    ),
  });

  if (existing) return { data: existing };

  const [enrollment] = await db
    .insert(enrollments)
    .values({ userId: user.id, courseId })
    .returning();

  revalidatePath(`/courses/${courseId}`);
  return { data: enrollment };
}

export async function toggleCourseLike(courseId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Must be logged in to like" };

  const existing = await db.query.courseLikes.findFirst({
    where: and(
      eq(courseLikes.userId, user.id),
      eq(courseLikes.courseId, courseId)
    ),
  });

  if (existing) {
    await db.delete(courseLikes).where(eq(courseLikes.id, existing.id));
    revalidatePath(`/courses/${courseId}`);
    return { liked: false };
  }

  await db.insert(courseLikes).values({ userId: user.id, courseId });
  revalidatePath(`/courses/${courseId}`);
  return { liked: true };
}

export async function addLesson(data: {
  courseId: string;
  title: Record<string, string>;
  description?: Record<string, string>;
  order: number;
  type?: "azkar" | "text" | "audio";
  estimatedDuration?: number;
}) {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  const course = await db.query.courses.findFirst({
    where: eq(courses.id, data.courseId),
  });

  if (!course || (course.teacherId !== user.id && user.role !== "admin")) {
    return { error: "Unauthorized" };
  }

  const [lesson] = await db.insert(lessons).values(data).returning();
  revalidatePath(`/create/${data.courseId}`);
  return { data: lesson };
}

export async function addLessonContent(data: {
  lessonId: string;
  order: number;
  arabic?: string;
  translations?: Record<string, string>;
  transcriptionLatin?: string;
  transcriptionCyrillic?: string;
  audioUrl?: string;
  timestamp?: number;
  repeatCount?: number;
}) {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  if (user.role !== "teacher" && user.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const lesson = await db.query.lessons.findFirst({
    where: eq(lessons.id, data.lessonId),
    columns: { id: true },
    with: { course: { columns: { teacherId: true } } },
  });
  if (!lesson) return { error: "Lesson not found" };
  if (user.role !== "admin" && lesson.course.teacherId !== user.id) {
    return { error: "Unauthorized" };
  }

  const [content] = await db.insert(lessonContent).values(data).returning();
  return { data: content };
}
