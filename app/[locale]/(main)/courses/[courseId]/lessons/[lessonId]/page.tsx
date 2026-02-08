import { notFound } from "next/navigation";
import { getLessonById, getAdjacentLessons } from "@/lib/db/queries/lessons";
import { isUserEnrolled } from "@/lib/db/queries/courses";
import { getLessonProgressForUser } from "@/lib/db/queries/progress";
import { getCurrentUser } from "@/lib/actions/auth";
import { LessonContent } from "@/components/features/lessons/lesson-content";
import { LessonNav } from "@/components/features/lessons/lesson-nav";
import { Link } from "@/i18n/navigation";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { pickLocalized } from "@/lib/i18n/text";

interface Props {
  params: Promise<{ locale: string; courseId: string; lessonId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lessonId } = await params;
  try {
    const lesson = await getLessonById(lessonId);
    if (!lesson) return { title: "Lesson Not Found | Thikr" };
    if (!lesson.course?.isPublished) return { title: "Lesson | Thikr" };
    const title =
      lesson.title.en || lesson.title.ky || lesson.title.ar || "Lesson";
    const courseTitle =
      lesson.course?.title?.en || lesson.course?.title?.ky || lesson.course?.title?.ar || "";
    const description = courseTitle
      ? `${title} — part of ${courseTitle} on Thikr`
      : `${title} on Thikr`;
    return {
      title: `${title} | Thikr`,
      description,
      openGraph: {
        title: `${title} | Thikr`,
        description,
      },
    };
  } catch {
    return { title: "Lesson | Thikr" };
  }
}

export default async function LessonPage({ params }: Props) {
  const t = await getTranslations("Lesson");
  const tCommon = await getTranslations("Common");
  const locale = await getLocale();
  const { courseId, lessonId } = await params;

  let lesson;
  try {
    lesson = await getLessonById(lessonId);
  } catch {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-beige-400">{tCommon("dbNotConnectedShort")}</p>
      </div>
    );
  }

  if (!lesson || lesson.course.id !== courseId) notFound();

  const user = await getCurrentUser();
  const isTeacherOrAdmin =
    !!user && (user.role === "admin" || lesson.course.teacherId === user.id);

  if (!lesson.course.isPublished && !isTeacherOrAdmin) {
    notFound();
  }

  const isEnrolled = user ? await isUserEnrolled(user.id, courseId) : false;

  if (!isEnrolled && !isTeacherOrAdmin) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-beige-400">{t("needEnroll")}</p>
        <Link
          href={`/courses/${courseId}`}
          className="mt-4 inline-block text-green-500 hover:text-green-600"
        >
          {t("goToCourse")}
        </Link>
      </div>
    );
  }

  const progress = user ? await getLessonProgressForUser(user.id, lessonId) : null;
  const isCompleted = progress?.completed ?? false;

  const adjacent = await getAdjacentLessons(courseId, lesson.order);

  const displayTitle =
    pickLocalized(lesson.title as Record<string, string>, locale) ||
    tCommon("untitled");

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
      <Link
        href={`/courses/${courseId}`}
        className="inline-flex items-center gap-1 text-sm text-beige-400 hover:text-brown-600 transition-colors mb-6"
      >
        <ChevronLeft className="h-4 w-4" />
        {t("backToCourse")}
      </Link>

      <h1 className="text-2xl font-bold text-brown-700 mb-6 dark:text-foreground">
        {displayTitle}
      </h1>

      <LessonContent
        type={lesson.type}
        content={lesson.content}
        language={locale}
      />

      <LessonNav
        courseId={courseId}
        lessonId={lessonId}
        previous={adjacent.previous}
        next={adjacent.next}
        isCompleted={isCompleted}
        isEnrolled={isEnrolled}
      />
    </div>
  );
}
