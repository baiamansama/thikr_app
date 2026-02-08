import { db } from "@/lib/db";
import { users, teacherApplications } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getUserByAuthId(authId: string) {
  return db.query.users.findFirst({
    where: eq(users.authId, authId),
  });
}

export async function getUserById(userId: string) {
  return db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      streak: true,
      userBadges: {
        with: { badge: true },
      },
    },
  });
}

export async function getUserProfile(userId: string) {
  return db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      streak: true,
      userBadges: {
        with: { badge: true },
      },
      enrollments: {
        with: {
          course: {
            with: {
              teacher: { columns: { id: true, name: true, avatarUrl: true } },
              lessons: { columns: { id: true } },
              likes: { columns: { id: true } },
            },
          },
        },
      },
      courses: {
        with: {
          lessons: { columns: { id: true } },
          enrollments: { columns: { id: true } },
        },
      },
      courseLikes: {
        with: {
          course: {
            with: {
              teacher: { columns: { id: true, name: true, avatarUrl: true } },
              lessons: { columns: { id: true } },
              likes: { columns: { id: true } },
            },
          },
        },
      },
    },
  });
}

export async function createUser(data: {
  authId: string;
  name: string;
  avatarUrl?: string;
  role?: "student" | "teacher" | "admin";
}) {
  const [user] = await db
    .insert(users)
    .values({
      authId: data.authId,
      name: data.name,
      avatarUrl: data.avatarUrl,
      role: data.role ?? "student",
    })
    .returning();
  return user;
}

export async function getPendingTeacherApplications() {
  return db.query.teacherApplications.findMany({
    where: eq(teacherApplications.status, "pending"),
    with: {
      user: {
        columns: { id: true, name: true, avatarUrl: true },
      },
    },
    orderBy: (app, { asc }) => [asc(app.createdAt)],
  });
}
