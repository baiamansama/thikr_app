import { getPublishedCourses } from "@/lib/db/queries/courses";
import { CourseGrid } from "@/components/features/courses/course-grid";
import { COURSE_CATEGORIES, DIFFICULTIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Courses");
  return {
    title: `${t("title")} | Thikr`,
    description: t("subtitle"),
    openGraph: {
      title: `${t("title")} | Thikr`,
      description: t("subtitle"),
    },
  };
}

interface Props {
  searchParams: Promise<{
    category?: string;
    difficulty?: string;
    q?: string;
  }>;
}

export default async function CoursesPage({ searchParams }: Props) {
  const t = await getTranslations("Courses");
  const params = await searchParams;

  let courses: Awaited<ReturnType<typeof getPublishedCourses>> = [];
  try {
    courses = await getPublishedCourses({
      category: params.category,
      difficulty: params.difficulty,
    });
  } catch {
    // DB not connected yet
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-bold text-brown-700 dark:text-foreground">
        {t("title")}
      </h1>
      <p className="mt-2 text-beige-400">{t("subtitle")}</p>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/courses"
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            !params.category
              ? "bg-green-500 text-white"
              : "bg-cream-100 text-brown-600 hover:bg-cream-200 dark:bg-card dark:text-foreground"
          )}
        >
          {t("all")}
        </Link>
        {COURSE_CATEGORIES.map((cat) => (
          <Link
            key={cat.value}
            href={`/courses?category=${cat.value}${
              params.difficulty ? `&difficulty=${params.difficulty}` : ""
            }`}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              params.category === cat.value
                ? "bg-green-500 text-white"
                : "bg-cream-100 text-brown-600 hover:bg-cream-200 dark:bg-card dark:text-foreground"
            )}
          >
            {t(`categories.${cat.value}` as const)}
          </Link>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {DIFFICULTIES.map((diff) => (
          <Link
            key={diff.value}
            href={`/courses?difficulty=${diff.value}${
              params.category ? `&category=${params.category}` : ""
            }`}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              params.difficulty === diff.value
                ? "bg-brown-600 text-white"
                : "bg-cream-100 text-beige-400 hover:bg-cream-200 dark:bg-card"
            )}
          >
            {t(`difficulties.${diff.value}` as const)}
          </Link>
        ))}
      </div>

      {/* Course Grid */}
      <div className="mt-8">
        <CourseGrid courses={courses} emptyMessage={t("empty")} />
      </div>
    </div>
  );
}
