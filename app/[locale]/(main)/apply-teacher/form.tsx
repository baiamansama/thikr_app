"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { submitTeacherApplication } from "@/lib/actions/teacher";
import { CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";

interface TeacherApplicationFormProps {
  userId: string;
}

export function TeacherApplicationForm({ userId }: TeacherApplicationFormProps) {
  const t = useTranslations("ApplyTeacher");
  const [state, formAction, isPending] = useActionState(
    submitTeacherApplication,
    null
  );

  if (state?.success) {
    return (
      <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-8 text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
        <h2 className="mt-4 text-xl font-bold text-brown-700 dark:text-foreground">
          {t("successTitle")}
        </h2>
        <p className="mt-2 text-beige-400">{t("successBody")}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      {/* userId is derived server-side; keep prop to avoid breaking callers */}
      <input type="hidden" name="userId" value={userId} />

      {state?.error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="reason" className="block text-sm font-medium text-brown-600 dark:text-foreground">
          {t("reasonLabel")} <span className="text-red-400">*</span>
        </label>
        <textarea
          id="reason"
          name="reason"
          required
          rows={4}
          className="mt-1 w-full rounded-lg border border-cream-200 bg-cream-100 px-3 py-2 text-brown-700 placeholder:text-beige-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:bg-card dark:text-foreground"
          placeholder={t("reasonPlaceholder")}
        />
      </div>

      <div>
        <label htmlFor="qualifications" className="block text-sm font-medium text-brown-600 dark:text-foreground">
          {t("qualLabel")}
        </label>
        <textarea
          id="qualifications"
          name="qualifications"
          rows={3}
          className="mt-1 w-full rounded-lg border border-cream-200 bg-cream-100 px-3 py-2 text-brown-700 placeholder:text-beige-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:bg-card dark:text-foreground"
          placeholder={t("qualPlaceholder")}
        />
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full bg-green-500 hover:bg-green-600 text-white"
      >
        {isPending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}

