"use server";

import { db } from "@/lib/db";
import { lessons, lessonContent } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "./auth";
import { revalidateLocalizedPath } from "@/lib/revalidate";

export async function updateLesson(
  lessonId: string,
  data: {
    title?: Record<string, string>;
    description?: Record<string, string>;
    order?: number;
    type?: "azkar" | "text" | "audio";
    estimatedDuration?: number;
  }
) {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  const lesson = await db.query.lessons.findFirst({
    where: eq(lessons.id, lessonId),
    with: { course: { columns: { teacherId: true, id: true } } },
  });

  if (
    !lesson ||
    (lesson.course.teacherId !== user.id && user.role !== "admin")
  ) {
    return { error: "Unauthorized" };
  }

  const [updated] = await db
    .update(lessons)
    .set(data)
    .where(eq(lessons.id, lessonId))
    .returning();

  revalidateLocalizedPath(`/create/${lesson.course.id}`);
  return { data: updated };
}

export async function deleteLesson(lessonId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  const lesson = await db.query.lessons.findFirst({
    where: eq(lessons.id, lessonId),
    with: { course: { columns: { teacherId: true, id: true } } },
  });

  if (
    !lesson ||
    (lesson.course.teacherId !== user.id && user.role !== "admin")
  ) {
    return { error: "Unauthorized" };
  }

  await db.delete(lessons).where(eq(lessons.id, lessonId));
  revalidateLocalizedPath(`/create/${lesson.course.id}`);
  return { success: true };
}

export async function updateLessonContent(
  contentId: string,
  data: {
    arabic?: string;
    translations?: Record<string, string>;
    transcriptionLatin?: string;
    transcriptionCyrillic?: string;
    audioUrl?: string;
    timestamp?: number;
    repeatCount?: number;
    order?: number;
  }
) {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  if (user.role !== "teacher" && user.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const existing = await db.query.lessonContent.findFirst({
    where: eq(lessonContent.id, contentId),
    columns: { id: true },
    with: { lesson: { with: { course: { columns: { teacherId: true } } } } },
  });
  if (!existing) return { error: "Content not found" };
  if (user.role !== "admin" && existing.lesson.course.teacherId !== user.id) {
    return { error: "Unauthorized" };
  }

  const [updated] = await db
    .update(lessonContent)
    .set(data)
    .where(eq(lessonContent.id, contentId))
    .returning();

  return { data: updated };
}

export async function deleteLessonContent(contentId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  if (user.role !== "teacher" && user.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const existing = await db.query.lessonContent.findFirst({
    where: eq(lessonContent.id, contentId),
    columns: { id: true },
    with: { lesson: { with: { course: { columns: { teacherId: true } } } } },
  });
  if (!existing) return { error: "Content not found" };
  if (user.role !== "admin" && existing.lesson.course.teacherId !== user.id) {
    return { error: "Unauthorized" };
  }

  await db.delete(lessonContent).where(eq(lessonContent.id, contentId));
  return { success: true };
}
