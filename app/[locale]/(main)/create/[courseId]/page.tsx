import { redirect } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import { getCourseById } from "@/lib/db/queries/courses";
import { LessonEditor } from "@/components/features/create/lesson-editor";
import { updateCourse, deleteCourse } from "@/lib/actions/courses";
import { Button } from "@/components/ui/button";
import { Globe, Trash2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { pickLocalized } from "@/lib/i18n/text";

interface Props {
  params: Promise<{ courseId: string }>;
}

export default async function EditCoursePage({ params }: Props) {
  const { courseId } = await params;

  const t = await getTranslations("Create");
  const tCourses = await getTranslations("Courses");
  const tCommon = await getTranslations("Common");
  const locale = await getLocale();

  let user;
  try {
    user = await getCurrentUser();
  } catch {
    redirect({ href: "/login", locale });
  }
  if (!user) redirect({ href: "/login", locale });
  const currentUser = user!;

  let course;
  try {
    course = await getCourseById(courseId);
  } catch {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-beige-400">{tCommon("dbNotConnectedShort")}</p>
      </div>
    );
  }

  if (!course) notFound();
  if (course.teacherId !== currentUser.id && currentUser.role !== "admin") {
    redirect({ href: "/create", locale });
  }

  const displayTitle =
    pickLocalized(course.title as Record<string, string>, locale) ||
    tCommon("untitled");

  async function handlePublish() {
    "use server";
    await updateCourse(courseId, { isPublished: true });
  }

  async function handleUnpublish() {
    "use server";
    await updateCourse(courseId, { isPublished: false });
  }

  async function handleDelete() {
    "use server";
    await deleteCourse(courseId);
    redirect({ href: "/create", locale });
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/create"
            className="text-sm text-beige-400 hover:text-brown-600 transition-colors"
          >
            &larr; {t("backToCourses")}
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-brown-700 dark:text-foreground">
            {displayTitle}
          </h1>
          <p className="mt-1 text-sm text-beige-400">
            {course.isPublished ? t("published") : t("draft")} &middot;{" "}
            {tCourses("lessons", { count: course.lessons.length })}
          </p>
        </div>

        <div className="flex gap-2">
          {course.isPublished ? (
            <form action={handleUnpublish}>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="border-cream-200 text-beige-400 dark:text-foreground"
              >
                {t("unpublish")}
              </Button>
            </form>
          ) : (
            <form action={handlePublish}>
              <Button
                type="submit"
                size="sm"
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                <Globe className="mr-1 h-4 w-4" />
                {t("publish")}
              </Button>
            </form>
          )}
          <form action={handleDelete}>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="border-cream-200 text-red-400 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      <div className="mt-8">
        <LessonEditor
          courseId={courseId}
          existingLessons={course.lessons.map((l) => ({
            id: l.id,
            title: l.title as Record<string, string>,
            type: l.type,
            order: l.order,
            contentCount: l.content.length,
          }))}
        />
      </div>
    </div>
  );
}
