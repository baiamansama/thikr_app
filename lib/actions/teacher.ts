"use server";

import { db } from "@/lib/db";
import { teacherApplications } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/actions/auth";
import { eq } from "drizzle-orm";

export async function submitTeacherApplication(
  _prev: { success?: boolean; error?: string } | null,
  formData: FormData
) {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be logged in." };
  if (user.role === "teacher" || user.role === "admin") {
    return { error: "You already have teacher access." };
  }

  const reason = (formData.get("reason") as string | null)?.trim() ?? "";
  const qualifications =
    ((formData.get("qualifications") as string | null) ?? "").trim() || null;

  if (!reason) {
    return { error: "Please fill in all required fields." };
  }

  try {
    const existing = await db.query.teacherApplications.findFirst({
      where: eq(teacherApplications.userId, user.id),
      columns: { id: true },
    });
    if (existing) {
      return { error: "You have already submitted an application." };
    }

    await db.insert(teacherApplications).values({
      userId: user.id,
      reason,
      qualifications,
    });
    return { success: true };
  } catch {
    return { error: "Failed to submit application." };
  }
}
