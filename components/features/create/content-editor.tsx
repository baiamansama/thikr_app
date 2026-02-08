"use client";

import { useActionState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { addLessonContent } from "@/lib/actions/courses";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

interface ContentEditorProps {
  lessonId: string;
  nextOrder: number;
}

async function handleAddContent(
  _prev: { error?: string } | null,
  formData: FormData
) {
  const lessonId = formData.get("lessonId") as string;
  const order = parseInt(formData.get("order") as string, 10);
  const arabic = formData.get("arabic") as string;
  const translationEn = formData.get("translation_en") as string;
  const translationKy = formData.get("translation_ky") as string;
  const transcriptionLatin = formData.get("transcription_latin") as string;
  const transcriptionCyrillic = formData.get("transcription_cyrillic") as string;
  const repeatCount = parseInt(formData.get("repeat_count") as string, 10) || 1;

  const translations: Record<string, string> = {};
  if (translationEn) translations.en = translationEn;
  if (translationKy) translations.ky = translationKy;

  const result = await addLessonContent({
    lessonId,
    order,
    arabic: arabic || undefined,
    translations: Object.keys(translations).length > 0 ? translations : undefined,
    transcriptionLatin: transcriptionLatin || undefined,
    transcriptionCyrillic: transcriptionCyrillic || undefined,
    repeatCount,
  });

  if (result.error) return { error: result.error };
  return null;
}

export function ContentEditor({ lessonId, nextOrder }: ContentEditorProps) {
  const t = useTranslations("Create");
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    async (prev: { error?: string } | null, formData: FormData) => {
      const result = await handleAddContent(prev, formData);
      if (!result?.error) {
        router.refresh();
      }
      return result;
    },
    null
  );

  return (
    <div className="rounded-xl border border-cream-200 bg-cream-100 p-6">
      <h3 className="font-medium text-brown-700 flex items-center gap-2">
        <Plus className="h-4 w-4" />
        {t("contentEditor.title")}
      </h3>

      <form action={formAction} className="mt-4 space-y-4">
        <input type="hidden" name="lessonId" value={lessonId} />
        <input type="hidden" name="order" value={nextOrder} />

        {state?.error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {state.error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-brown-600">
            {t("contentEditor.arabic")}
          </label>
          <textarea
            name="arabic"
            dir="rtl"
            rows={2}
            className="mt-1 w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-brown-700 quran-font placeholder:text-beige-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            placeholder={t("contentEditor.arabicPlaceholder")}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-brown-600">
              {t("contentEditor.translationEn")}
            </label>
            <textarea
              name="translation_en"
              rows={2}
              className="mt-1 w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-brown-700 placeholder:text-beige-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder={t("contentEditor.translationEnPlaceholder")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brown-600">
              {t("contentEditor.translationKy")}
            </label>
            <textarea
              name="translation_ky"
              rows={2}
              className="mt-1 w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-brown-700 placeholder:text-beige-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder={t("contentEditor.translationKyPlaceholder")}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-brown-600">
              {t("contentEditor.transcriptionLatin")}
            </label>
            <input
              name="transcription_latin"
              type="text"
              className="mt-1 w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-brown-700 placeholder:text-beige-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder={t("contentEditor.transcriptionLatinPlaceholder")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brown-600">
              {t("contentEditor.transcriptionCyrillic")}
            </label>
            <input
              name="transcription_cyrillic"
              type="text"
              className="mt-1 w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-brown-700 placeholder:text-beige-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder={t("contentEditor.transcriptionCyrillicPlaceholder")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brown-600">
              {t("contentEditor.repeatCount")}
            </label>
            <input
              name="repeat_count"
              type="number"
              min={1}
              defaultValue={1}
              className="mt-1 w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-brown-700 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="bg-green-500 hover:bg-green-600 text-white"
        >
          {isPending ? t("contentEditor.adding") : t("contentEditor.add")}
        </Button>
      </form>
    </div>
  );
}
