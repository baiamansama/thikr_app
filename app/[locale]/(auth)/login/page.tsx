import { LoginForm } from "@/components/features/auth/login-form";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Header");
  return { title: t("signIn") };
}

export default function LoginPage() {
  return (
    <div className="rounded-xl border border-cream-200 bg-cream-50 p-8 shadow-sm dark:bg-card">
      <LoginForm />
    </div>
  );
}

