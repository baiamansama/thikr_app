import { redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import { getPendingTeacherApplications } from "@/lib/db/queries/users";
import { Button } from "@/components/ui/button";
import { Check, X, User } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("Admin");
  return { title: t("title") };
}

async function approveApplication(formData: FormData) {
  "use server";
  const { db } = await import("@/lib/db");
  const { teacherApplications, users } = await import("@/lib/db/schema");
  const { eq } = await import("drizzle-orm");
  const { revalidatePath } = await import("next/cache");
  const { getCurrentUser } = await import("@/lib/actions/auth");

  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") return;

  const applicationId = formData.get("applicationId") as string;
  const userId = formData.get("userId") as string;

  await db
    .update(teacherApplications)
    .set({
      status: "approved",
      reviewedBy: admin.id,
      reviewedAt: new Date(),
    })
    .where(eq(teacherApplications.id, applicationId));

  await db
    .update(users)
    .set({ role: "teacher", isTeacherApproved: true })
    .where(eq(users.id, userId));

  // Locale-prefixed routes
  revalidatePath("/en/admin");
  revalidatePath("/ky/admin");
}

async function rejectApplication(formData: FormData) {
  "use server";
  const { db } = await import("@/lib/db");
  const { teacherApplications } = await import("@/lib/db/schema");
  const { eq } = await import("drizzle-orm");
  const { revalidatePath } = await import("next/cache");
  const { getCurrentUser } = await import("@/lib/actions/auth");

  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") return;

  const applicationId = formData.get("applicationId") as string;

  await db
    .update(teacherApplications)
    .set({
      status: "rejected",
      reviewedBy: admin.id,
      reviewedAt: new Date(),
    })
    .where(eq(teacherApplications.id, applicationId));

  // Locale-prefixed routes
  revalidatePath("/en/admin");
  revalidatePath("/ky/admin");
}

export default async function AdminPage() {
  const t = await getTranslations("Admin");
  const locale = await getLocale();

  let user;
  try {
    user = await getCurrentUser();
  } catch {
    redirect({ href: "/login", locale });
  }

  if (!user || user.role !== "admin") {
    redirect({ href: "/", locale });
  }

  const applications = await getPendingTeacherApplications();

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-bold text-brown-700 dark:text-foreground">
        {t("title")}
      </h1>
      <p className="mt-2 text-beige-400">
        {t("subtitle")}
      </p>

      <div className="mt-8">
        <h2 className="text-xl font-bold text-brown-700 mb-4 dark:text-foreground">
          {t("pending", { count: applications.length })}
        </h2>

        {applications.length === 0 ? (
          <div className="rounded-xl border border-cream-200 bg-cream-100 p-8 text-center dark:bg-card">
            <p className="text-beige-400">{t("empty")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div
                key={app.id}
                className="rounded-xl border border-cream-200 bg-cream-100 p-6 dark:bg-card"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cream-200 dark:bg-muted">
                    <User className="h-5 w-5 text-beige-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-brown-700 dark:text-foreground">
                      {app.user.name}
                    </p>
                    <p className="mt-2 text-sm text-brown-600 dark:text-foreground">
                      <strong>{t("reason")}:</strong> {app.reason}
                    </p>
                    {app.qualifications && (
                      <p className="mt-1 text-sm text-beige-400">
                        <strong>{t("qualifications")}:</strong>{" "}
                        {app.qualifications}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-beige-400">
                      {t("applied")}:{" "}
                      {new Date(app.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <form action={approveApplication}>
                    <input type="hidden" name="applicationId" value={app.id} />
                    <input type="hidden" name="userId" value={app.userId} />
                    <Button
                      type="submit"
                      size="sm"
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      <Check className="mr-1 h-4 w-4" />
                      {t("approve")}
                    </Button>
                  </form>
                  <form action={rejectApplication}>
                    <input type="hidden" name="applicationId" value={app.id} />
                    <Button
                      type="submit"
                      size="sm"
                      variant="outline"
                      className="border-cream-200 text-beige-400 hover:bg-red-50 hover:text-red-500 dark:text-foreground"
                    >
                      <X className="mr-1 h-4 w-4" />
                      {t("reject")}
                    </Button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
