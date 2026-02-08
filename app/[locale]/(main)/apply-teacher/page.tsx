import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import { TeacherApplicationForm } from "./form";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ApplyTeacher");
  return { title: t("title") };
}

export default async function ApplyTeacherPage() {
  const t = await getTranslations("ApplyTeacher");
  let user;
  try {
    user = await getCurrentUser();
  } catch {
    redirect("/login");
  }

  if (!user) redirect("/login");

  if (user.role === "teacher" || user.role === "admin") {
    redirect("/create");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-bold text-brown-700 dark:text-foreground">
        {t("title")}
      </h1>
      <p className="mt-2 text-beige-400">{t("subtitle")}</p>

      <div className="mt-8">
        <TeacherApplicationForm userId={user.id} />
      </div>
    </div>
  );
}

