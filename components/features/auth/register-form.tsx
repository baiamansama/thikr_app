"use client";

import { useActionState } from "react";
import { signUp } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { SocialAuth } from "./social-auth";
import { useTranslations } from "next-intl";

export function RegisterForm() {
  const t = useTranslations("Auth");
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = await signUp(formData);
      return result ?? null;
    },
    null
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-brown-700 dark:text-foreground">
          {t("registerTitle")}
        </h1>
        <p className="mt-2 text-sm text-beige-400">
          {t("registerSubtitle")}
        </p>
      </div>

      <SocialAuth />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-cream-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-cream-50 px-2 text-beige-400">
            {t("orSignUpEmail")}
          </span>
        </div>
      </div>

      <form action={formAction} className="space-y-4">
        {state?.error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {state.error}
          </div>
        )}

        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-brown-600"
          >
            {t("fullName")}
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="mt-1 w-full rounded-lg border border-cream-200 bg-cream-100 px-3 py-2 text-brown-700 placeholder:text-beige-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            placeholder={t("placeholderName")}
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-brown-600"
          >
            {t("email")}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-lg border border-cream-200 bg-cream-100 px-3 py-2 text-brown-700 placeholder:text-beige-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            placeholder={t("placeholderEmail")}
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-brown-600"
          >
            {t("password")}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            className="mt-1 w-full rounded-lg border border-cream-200 bg-cream-100 px-3 py-2 text-brown-700 placeholder:text-beige-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            placeholder={t("placeholderPasswordMin")}
          />
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="w-full bg-green-500 hover:bg-green-600 text-white"
      >
        {isPending ? t("creatingAccount") : t("createAccount")}
      </Button>
    </form>

    <p className="text-center text-sm text-beige-400">
      {t("haveAccount")}{" "}
      <Link
        href="/login"
        className="font-medium text-green-500 hover:text-green-600"
      >
        {t("signIn")}
      </Link>
    </p>
  </div>
  );
}
