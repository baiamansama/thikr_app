import { RegisterForm } from "@/components/features/auth/register-form";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Auth");
  return { title: t("createAccount") };
}

export default function RegisterPage() {
  return (
    <div className="rounded-xl border border-cream-200 bg-cream-50 p-8 shadow-sm dark:bg-card">
      <RegisterForm />
    </div>
  );
}

