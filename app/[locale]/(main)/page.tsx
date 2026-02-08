import { Button } from "@/components/ui/button";
import { BookOpen, Award, GraduationCap } from "lucide-react";
import { CourseGrid } from "@/components/features/courses/course-grid";
import { getFeaturedCourses } from "@/lib/db/queries/courses";
import { FadeIn, FadeInChild } from "@/components/ui/motion-wrappers";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Home");
  return {
    title: t("metaTitle"),
    description: t("heroBody"),
    openGraph: {
      title: t("metaTitle"),
      description: t("heroBody"),
    },
  };
}

export default async function HomePage() {
  const t = await getTranslations("Home");

  let featuredCourses: Awaited<ReturnType<typeof getFeaturedCourses>> = [];
  try {
    featuredCourses = await getFeaturedCourses(6);
  } catch {
    // DB not connected yet — show empty state
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      {/* Hero Section */}
      <section className="py-16 md:py-24 text-center">
        <FadeIn>
          <h1 className="text-4xl md:text-5xl font-bold text-brown-700 leading-tight dark:text-foreground">
            {t("heroTitleLine1")}
            <br />
            <span className="text-green-500">{t("heroTitleHighlight")}</span>
          </h1>
        </FadeIn>
        <FadeIn delay={0.15}>
          <p className="mt-6 text-lg text-beige-400 max-w-2xl mx-auto">
            {t("heroBody")}
          </p>
        </FadeIn>
        <FadeIn delay={0.3}>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-green-500 hover:bg-green-600 text-white text-lg px-8"
            >
              <Link href="/courses">{t("browseCourses")}</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-cream-200 text-brown-600 hover:bg-cream-100 text-lg px-8 dark:text-foreground"
            >
              <Link href="/register">{t("getStarted")}</Link>
            </Button>
          </div>
        </FadeIn>
      </section>

      {/* Features */}
      <section className="py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <FadeInChild index={0} className="text-center p-6">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
            <BookOpen className="h-6 w-6 text-green-500" />
          </div>
          <h3 className="font-semibold text-brown-700 dark:text-foreground">
            {t("feature1Title")}
          </h3>
          <p className="mt-2 text-sm text-beige-400">{t("feature1Body")}</p>
        </FadeInChild>
        <FadeInChild index={1} className="text-center p-6">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold/10">
            <Award className="h-6 w-6 text-gold" />
          </div>
          <h3 className="font-semibold text-brown-700 dark:text-foreground">
            {t("feature2Title")}
          </h3>
          <p className="mt-2 text-sm text-beige-400">{t("feature2Body")}</p>
        </FadeInChild>
        <FadeInChild index={2} className="text-center p-6">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
            <GraduationCap className="h-6 w-6 text-green-500" />
          </div>
          <h3 className="font-semibold text-brown-700 dark:text-foreground">
            {t("feature3Title")}
          </h3>
          <p className="mt-2 text-sm text-beige-400">{t("feature3Body")}</p>
        </FadeInChild>
      </section>

      {/* Featured Courses */}
      {featuredCourses.length > 0 && (
        <section className="py-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-brown-700 dark:text-foreground">
              {t("featuredTitle")}
            </h2>
            <Button
              asChild
              variant="ghost"
              className="text-green-500 hover:text-green-600"
            >
              <Link href="/courses">{t("viewAll")}</Link>
            </Button>
          </div>
          <CourseGrid courses={featuredCourses} />
        </section>
      )}

      {/* CTA: Become a Teacher */}
      <section className="py-12 mb-8">
        <div className="rounded-2xl bg-gradient-to-br from-green-500 to-green-600 p-8 md:p-12 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-bold">{t("ctaTitle")}</h2>
          <p className="mt-4 text-green-100 max-w-lg mx-auto">{t("ctaBody")}</p>
          <Button
            asChild
            size="lg"
            className="mt-6 bg-white text-green-600 hover:bg-cream-50"
          >
            <Link href="/apply-teacher">{t("ctaButton")}</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

