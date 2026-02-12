import { db } from "@/lib/db";
import { lessons } from "@/lib/db/schema";
import { eq, and, lt, gt, asc, desc } from "drizzle-orm";

export async function getLessonById(lessonId: string) {
  return db.query.lessons.findFirst({
    where: eq(lessons.id, lessonId),
    with: {
      content: {
        orderBy: (content, { asc }) => [asc(content.order)],
      },
      course: {
        columns: { id: true, title: true, teacherId: true, isPublished: true },
      },
    },
  });
}

export async function getLessonsByCourse(courseId: string) {
  return db.query.lessons.findMany({
    where: eq(lessons.courseId, courseId),
    orderBy: (lessons, { asc }) => [asc(lessons.order)],
    with: {
      content: {
        orderBy: (content, { asc }) => [asc(content.order)],
      },
    },
  });
}

export async function getAdjacentLessons(courseId: string, currentOrder: number) {
  const [previous, next] = await Promise.all([
    db.query.lessons.findFirst({
      where: and(eq(lessons.courseId, courseId), lt(lessons.order, currentOrder)),
      orderBy: [desc(lessons.order)],
      columns: { id: true, order: true, title: true },
    }),
    db.query.lessons.findFirst({
      where: and(eq(lessons.courseId, courseId), gt(lessons.order, currentOrder)),
      orderBy: [asc(lessons.order)],
      columns: { id: true, order: true, title: true },
    }),
  ]);

  return { previous: previous ?? null, next: next ?? null };
}
