import { notFound } from "next/navigation";
import {
  getCourseOverviewById,
  isUserEnrolled,
  isCourseLikedByUser,
} from "@/lib/db/queries/courses";
import { getCompletedLessonIds } from "@/lib/db/queries/progress";
import { getCurrentUser } from "@/lib/actions/auth";
import { enrollInCourse } from "@/lib/actions/courses";
import { LessonList } from "@/components/features/courses/lesson-list";
import { LikeButton } from "@/components/features/courses/like-button";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, User } from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { pickLocalized } from "@/lib/i18n/text";

interface Props {
  params: Promise<{ courseId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { courseId } = await params;
  try {
    const course = await getCourseOverviewById(courseId);
    if (!course) return { title: "Course Not Found | Thikr" };
    if (!course.isPublished) return { title: "Course | Thikr" };
    const title = course.title.en || course.title.ky || course.title.ar || "Course";
    const description =
      course.description?.en || course.description?.ky || course.description?.ar || undefined;
    return {
      title: `${title} | Thikr`,
      description,
      openGraph: {
        title: `${title} | Thikr`,
        description: description || `Learn ${title} on Thikr`,
      },
    };
  } catch {
    return { title: "Course | Thikr" };
  }
}

export default async function CourseDetailPage({ params }: Props) {
  const t = await getTranslations("Courses");
  const tCommon = await getTranslations("Common");
  const locale = await getLocale();
  const { courseId } = await params;

  let course;
  try {
    course = await getCourseOverviewById(courseId);
  } catch {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-beige-400">{tCommon("dbNotConnected")}</p>
      </div>
    );
  }

  if (!course) notFound();

  const user = await getCurrentUser();
  if (!course.isPublished) {
    const canViewDraft = !!user && (user.role === "admin" || course.teacherId === user.id);
    if (!canViewDraft) notFound();
  }

  const isEnrolled = user ? await isUserEnrolled(user.id, courseId) : false;
  const isLiked = user ? await isCourseLikedByUser(user.id, courseId) : false;

  const completedLessonIds =
    user && isEnrolled
      ? await getCompletedLessonIds(
          user.id,
          course.lessons.map((l) => l.id)
        )
      : [];

  const displayTitle =
    pickLocalized(course.title as Record<string, string>, locale) ||
    tCommon("untitled");
  const displayDescription = pickLocalized(
    (course.description as Record<string, string> | null | undefined) ?? undefined,
    locale
  );
  const totalLessons = course.lessons.length;
  const completedCount = completedLessonIds.length;
  const progress = totalLessons > 0 ? completedCount / totalLessons : 0;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
      <div className="rounded-2xl border border-cream-200 bg-cream-100 p-6 md:p-8 dark:bg-card">
        <div className="flex items-start justify-between">
          <div>
            {course.category && (
              <span className="inline-block rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-600 capitalize mb-3">
                {t.has(
                  `categories.${course.category}` as Parameters<typeof t.has>[0]
                )
                  ? t(
                      `categories.${course.category}` as Parameters<
                        typeof t
                      >[0]
                    )
                  : course.category}
              </span>
            )}
            <h1 className="text-3xl font-bold text-brown-700 dark:text-foreground">
              {displayTitle}
            </h1>
            {displayDescription && (
              <p className="mt-3 text-beige-400 leading-relaxed">
                {displayDescription}
              </p>
            )}
          </div>
          {user && (
            <LikeButton
              courseId={courseId}
              initialLiked={isLiked}
              likeCount={course.likes.length}
            />
          )}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cream-200 dark:bg-muted">
            <User className="h-5 w-5 text-beige-400" />
          </div>
          <div>
            <p className="font-medium text-brown-700 dark:text-foreground">
              {course.teacher.name}
            </p>
            <p className="text-xs text-beige-400">{t("teacher")}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-6 text-sm text-beige-400">
          <span className="flex items-center gap-1.5">
            <BookOpen className="h-4 w-4" />
            {t("lessons", { count: totalLessons })}
          </span>
          {course.estimatedDuration && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {t("minutes", { count: course.estimatedDuration })}
            </span>
          )}
          {course.difficulty && (
            <span className="capitalize">
              {t.has(
                `difficulties.${course.difficulty}` as Parameters<
                  typeof t.has
                >[0]
              )
                ? t(
                    `difficulties.${course.difficulty}` as Parameters<
                      typeof t
                    >[0]
                  )
                : course.difficulty}
            </span>
          )}
        </div>

        {isEnrolled && totalLessons > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-beige-400">{t("progress")}</span>
              <span className="font-medium text-green-500">
                {t("completedFraction", {
                  completed: completedCount,
                  total: totalLessons,
                })}
              </span>
            </div>
            <div className="h-2 rounded-full bg-cream-200 dark:bg-muted">
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          </div>
        )}

        {!isEnrolled && user && course.isPublished && (
          <form
            action={async () => {
              "use server";
              await enrollInCourse(courseId);
            }}
          >
            <Button
              type="submit"
              size="lg"
              className="mt-6 w-full bg-green-500 hover:bg-green-600 text-white"
            >
              {t("enroll")}
            </Button>
          </form>
        )}

        {!user && (
          <Button
            asChild
            size="lg"
            className="mt-6 w-full bg-green-500 hover:bg-green-600 text-white"
          >
            <Link href="/login">{t("signInToEnroll")}</Link>
          </Button>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold text-brown-700 mb-4 dark:text-foreground">
          {t("lessonsHeading")}
        </h2>
        <LessonList
          courseId={courseId}
          lessons={course.lessons.map((l) => ({
            id: l.id,
            title: l.title,
            type: l.type,
            order: l.order,
            estimatedDuration: l.estimatedDuration,
          }))}
          completedLessonIds={completedLessonIds}
          isEnrolled={isEnrolled}
        />
      </div>
    </div>
  );
}
