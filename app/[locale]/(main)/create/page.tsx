import { redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import { getCoursesByTeacher } from "@/lib/db/queries/courses";
import { CourseBuilder } from "@/components/features/create/course-builder";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { getLocale, getTranslations } from "next-intl/server";
import { pickLocalized } from "@/lib/i18n/text";

export async function generateMetadata() {
  const t = await getTranslations("Create");
  return { title: t("title") };
}

export default async function CreatePage() {
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

  if (currentUser.role !== "teacher" && currentUser.role !== "admin") {
    redirect({ href: "/apply-teacher", locale });
  }

  let courses: Awaited<ReturnType<typeof getCoursesByTeacher>> = [];
  try {
    courses = await getCoursesByTeacher(currentUser.id);
  } catch {
    // DB not connected
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-brown-700 dark:text-foreground">
            {t("title")}
          </h1>
          <p className="mt-2 text-beige-400">
            {t("subtitle")}
          </p>
        </div>
        <Button asChild className="bg-green-500 hover:bg-green-600 text-white">
          <Link href="/courses">{t("viewCourses")}</Link>
        </Button>
      </div>

      <CourseBuilder />

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-brown-700 dark:text-foreground">
          {t("yourCourses")}
        </h2>

        {courses.length === 0 ? (
          <div className="rounded-xl border border-cream-200 bg-cream-100 p-8 text-center dark:bg-card">
            <p className="text-beige-400">{t("noCoursesYet")}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {courses.map((course) => {
              const title =
                pickLocalized(course.title as Record<string, string>, locale) ||
                tCommon("untitled");
              return (
                <Link
                  key={course.id}
                  href={`/create/${course.id}`}
                  className="rounded-xl border border-cream-200 bg-cream-100 p-5 hover:bg-cream-200 transition-colors dark:bg-card"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-brown-700 dark:text-foreground">
                        {title}
                      </p>
                      <p className="mt-1 text-xs text-beige-400">
                        {course.isPublished ? t("published") : t("draft")}{" "}
                        &middot; {tCourses("lessons", { count: course.lessons.length })}
                      </p>
                    </div>
                    <span className="text-sm text-green-500">{t("edit")}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
