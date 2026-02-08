import { db } from "@/lib/db";
import { lessons } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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
  const allLessons = await db.query.lessons.findMany({
    where: eq(lessons.courseId, courseId),
    orderBy: (lessons, { asc }) => [asc(lessons.order)],
    columns: { id: true, order: true, title: true },
  });

  const currentIndex = allLessons.findIndex((l) => l.order === currentOrder);

  return {
    previous: currentIndex > 0 ? allLessons[currentIndex - 1] : null,
    next:
      currentIndex < allLessons.length - 1
        ? allLessons[currentIndex + 1]
        : null,
  };
}
