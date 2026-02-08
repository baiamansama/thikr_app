"use client";

import { useActionState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { createCourse } from "@/lib/actions/courses";
import { COURSE_CATEGORIES, DIFFICULTIES } from "@/lib/constants";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

type CourseBuilderState =
  | { error?: string; errorKey?: string; courseId?: string }
  | null;

async function handleCreate(
  _prev: CourseBuilderState,
  formData: FormData
) {
  const title: Record<string, string> = {};
  const titleEn = formData.get("title_en") as string;
  const titleKy = formData.get("title_ky") as string;
  const titleAr = formData.get("title_ar") as string;
  if (titleEn) title.en = titleEn;
  if (titleKy) title.ky = titleKy;
  if (titleAr) title.ar = titleAr;

  if (Object.keys(title).length === 0) {
    return { errorKey: "builder.errors.titleRequired" };
  }

  const description: Record<string, string> = {};
  const descEn = formData.get("description_en") as string;
  const descKy = formData.get("description_ky") as string;
  const descAr = formData.get("description_ar") as string;
  if (descEn) description.en = descEn;
  if (descKy) description.ky = descKy;
  if (descAr) description.ar = descAr;

  const category = (formData.get("category") as string) || undefined;
  const difficulty = (formData.get("difficulty") as "beginner" | "intermediate" | "advanced") || undefined;

  const result = await createCourse({
    title,
    description: Object.keys(description).length > 0 ? description : undefined,
    category,
    difficulty,
  });

  if (result.error) return { error: result.error };
  if (result.data) {
    // Return courseId so we can redirect client-side
    return { courseId: result.data.id };
  }
  return null;
}

export function CourseBuilder() {
  const t = useTranslations("Create");
  const tCourses = useTranslations("Courses");
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    async (prev: CourseBuilderState, formData: FormData) => {
      const result = await handleCreate(prev, formData);
      if (result?.courseId) {
        router.push(`/create/${result.courseId}`);
        return null;
      }
      return result;
    },
    null
  );

  return (
    <div className="rounded-xl border border-cream-200 bg-cream-100 p-6">
      <h2 className="text-lg font-bold text-brown-700 flex items-center gap-2">
        <Plus className="h-5 w-5" />
        {t("builder.title")}
      </h2>

      <form action={formAction} className="mt-6 space-y-4">
        {(state?.error || state?.errorKey) && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {state?.errorKey
              ? t(state.errorKey as Parameters<typeof t>[0])
              : state?.error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-brown-600">
              {t("builder.titleEn")}
            </label>
            <input
              name="title_en"
              type="text"
              className="mt-1 w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-brown-700 placeholder:text-beige-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder={t("builder.titleEnPlaceholder")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brown-600">
              {t("builder.titleKy")}
            </label>
            <input
              name="title_ky"
              type="text"
              className="mt-1 w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-brown-700 placeholder:text-beige-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder={t("builder.titleKyPlaceholder")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brown-600">
              {t("builder.titleAr")}
            </label>
            <input
              name="title_ar"
              type="text"
              dir="rtl"
              className="mt-1 w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-brown-700 placeholder:text-beige-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder={t("builder.titleArPlaceholder")}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-brown-600">
              {t("builder.descEn")}
            </label>
            <textarea
              name="description_en"
              rows={3}
              className="mt-1 w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-brown-700 placeholder:text-beige-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder={t("builder.descEnPlaceholder")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brown-600">
              {t("builder.descKy")}
            </label>
            <textarea
              name="description_ky"
              rows={3}
              className="mt-1 w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-brown-700 placeholder:text-beige-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder={t("builder.descKyPlaceholder")}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-brown-600">
              {t("builder.descAr")}
            </label>
            <textarea
              name="description_ar"
              rows={3}
              dir="rtl"
              className="mt-1 w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-brown-700 placeholder:text-beige-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder={t("builder.descArPlaceholder")}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-brown-600">
              {t("builder.category")}
            </label>
            <select
              name="category"
              className="mt-1 w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-brown-700 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="">{t("builder.selectCategory")}</option>
              {COURSE_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {tCourses.has(
                    `categories.${cat.value}` as Parameters<typeof tCourses.has>[0]
                  )
                    ? tCourses(
                        `categories.${cat.value}` as Parameters<typeof tCourses>[0]
                      )
                    : cat.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-brown-600">
              {t("builder.difficulty")}
            </label>
            <select
              name="difficulty"
              className="mt-1 w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-brown-700 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="">{t("builder.selectDifficulty")}</option>
              {DIFFICULTIES.map((diff) => (
                <option key={diff.value} value={diff.value}>
                  {tCourses.has(
                    `difficulties.${diff.value}` as Parameters<
                      typeof tCourses.has
                    >[0]
                  )
                    ? tCourses(
                        `difficulties.${diff.value}` as Parameters<
                          typeof tCourses
                        >[0]
                      )
                    : diff.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="bg-green-500 hover:bg-green-600 text-white"
        >
          {isPending ? t("builder.creating") : t("builder.create")}
        </Button>
      </form>
    </div>
  );
}
