"use client";

import { useActionState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { addLesson } from "@/lib/actions/courses";
import { Plus, BookOpen, FileText, Music } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { pickLocalized } from "@/lib/i18n/text";

interface ExistingLesson {
  id: string;
  title: Record<string, string>;
  type: "azkar" | "text" | "audio";
  order: number;
  contentCount: number;
}

interface LessonEditorProps {
  courseId: string;
  existingLessons: ExistingLesson[];
}

const typeIcons = {
  azkar: BookOpen,
  text: FileText,
  audio: Music,
};

async function handleAddLesson(
  _prev: { error?: string } | null,
  formData: FormData
) {
  const courseId = formData.get("courseId") as string;
  const titleEn = formData.get("title_en") as string;
  const titleKy = formData.get("title_ky") as string;
  const titleAr = formData.get("title_ar") as string;
  const type = (formData.get("type") as "azkar" | "text" | "audio") || "azkar";
  const order = parseInt(formData.get("order") as string, 10);

  const title: Record<string, string> = {};
  if (titleEn) title.en = titleEn;
  if (titleKy) title.ky = titleKy;
  if (titleAr) title.ar = titleAr;

  if (Object.keys(title).length === 0) {
    return { error: "lessonEditor.errors.titleRequired" };
  }

  const result = await addLesson({
    courseId,
    title,
    type,
    order,
  });

  if (result.error) return { error: result.error };
  return null;
}

export function LessonEditor({ courseId, existingLessons }: LessonEditorProps) {
  const t = useTranslations("Create");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    async (prev: { error?: string } | null, formData: FormData) => {
      const result = await handleAddLesson(prev, formData);
      if (!result?.error) {
        router.refresh();
      }
      return result;
    },
    null
  );

  const nextOrder = existingLessons.length + 1;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-brown-700 dark:text-foreground">
        {t("lessonEditor.title")}
      </h2>

      {/* Existing lessons */}
      {existingLessons.length > 0 ? (
        <div className="space-y-2">
          {existingLessons.map((lesson) => {
            const TypeIcon = typeIcons[lesson.type];
            const displayTitle =
              pickLocalized(lesson.title, locale) || tCommon("untitled");

            return (
              <div
                key={lesson.id}
                className="flex items-center gap-4 rounded-xl border border-cream-200 bg-cream-100 p-4"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cream-200 text-sm font-medium text-brown-600">
                  {lesson.order}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-brown-700">{displayTitle}</p>
                  <p className="text-xs text-beige-400">
                    {t(
                      `lessonEditor.types.${lesson.type}` as Parameters<
                        typeof t
                      >[0]
                    )}{" "}
                    &middot;{" "}
                    {t("lessonEditor.items", { count: lesson.contentCount })}
                  </p>
                </div>
                <TypeIcon className="h-4 w-4 text-beige-400" />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-cream-200 bg-cream-100 p-8 text-center">
          <p className="text-beige-400">{t("lessonEditor.empty")}</p>
        </div>
      )}

      {/* Add lesson form */}
      <div className="rounded-xl border border-cream-200 bg-cream-100 p-6">
        <h3 className="font-medium text-brown-700 flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {t("lessonEditor.addTitle")}
        </h3>

        <form action={formAction} className="mt-4 space-y-4">
          <input type="hidden" name="courseId" value={courseId} />
          <input type="hidden" name="order" value={nextOrder} />

          {state?.error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {state.error.startsWith("lessonEditor.")
                ? t(state.error as Parameters<typeof t>[0])
                : state.error}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-brown-600">
                {t("lessonEditor.titleEn")}
              </label>
              <input
                name="title_en"
                type="text"
                className="mt-1 w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-brown-700 placeholder:text-beige-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder={t("lessonEditor.titleEnPlaceholder")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brown-600">
                {t("lessonEditor.type")}
              </label>
              <select
                name="type"
                className="mt-1 w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-brown-700 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="azkar">{t("lessonEditor.types.azkar")}</option>
                <option value="text">{t("lessonEditor.types.text")}</option>
                <option value="audio">{t("lessonEditor.types.audio")}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-brown-600">
                {t("lessonEditor.titleKy")}
              </label>
              <input
                name="title_ky"
                type="text"
                className="mt-1 w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-brown-700 placeholder:text-beige-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder={t("lessonEditor.titleKyPlaceholder")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brown-600">
                {t("lessonEditor.titleAr")}
              </label>
              <input
                name="title_ar"
                type="text"
                dir="rtl"
                className="mt-1 w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-brown-700 placeholder:text-beige-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder={t("lessonEditor.titleArPlaceholder")}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            {isPending ? t("lessonEditor.adding") : t("lessonEditor.add")}
          </Button>
        </form>
      </div>
    </div>
  );
}
