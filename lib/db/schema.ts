import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  uniqueIndex,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum("user_role", [
  "student",
  "teacher",
  "admin",
]);

export const applicationStatusEnum = pgEnum("application_status", [
  "pending",
  "approved",
  "rejected",
]);

export const difficultyEnum = pgEnum("difficulty", [
  "beginner",
  "intermediate",
  "advanced",
]);

export const lessonTypeEnum = pgEnum("lesson_type", [
  "azkar",
  "text",
  "audio",
]);

export const badgeCriteriaEnum = pgEnum("badge_criteria", [
  "course_completion",
  "streak",
  "milestone",
]);

// Tables
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  authId: uuid("auth_id").unique(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  role: userRoleEnum("role").default("student").notNull(),
  isTeacherApproved: boolean("is_teacher_approved").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const teacherApplications = pgTable(
  "teacher_applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reason: text("reason").notNull(),
    qualifications: text("qualifications"),
    status: applicationStatusEnum("status").default("pending").notNull(),
    reviewedBy: uuid("reviewed_by").references(() => users.id),
    reviewedAt: timestamp("reviewed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("teacher_applications_user_id_idx").on(table.userId)]
);

export const courses = pgTable(
  "courses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: jsonb("title").notNull().$type<Record<string, string>>(),
    description: jsonb("description").$type<Record<string, string>>(),
    category: text("category"),
    language: text("language"),
    difficulty: difficultyEnum("difficulty").default("beginner"),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    thumbnailUrl: text("thumbnail_url"),
    isPublished: boolean("is_published").default(false).notNull(),
    estimatedDuration: integer("estimated_duration"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("courses_teacher_id_idx").on(table.teacherId),
    index("courses_category_idx").on(table.category),
  ]
);

export const lessons = pgTable("lessons", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  title: jsonb("title").notNull().$type<Record<string, string>>(),
  description: jsonb("description").$type<Record<string, string>>(),
  order: integer("order").notNull(),
  type: lessonTypeEnum("type").default("azkar").notNull(),
  estimatedDuration: integer("estimated_duration"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const lessonContent = pgTable("lesson_content", {
  id: uuid("id").primaryKey().defaultRandom(),
  lessonId: uuid("lesson_id")
    .notNull()
    .references(() => lessons.id, { onDelete: "cascade" }),
  order: integer("order").notNull(),
  arabic: text("arabic"),
  translations: jsonb("translations").$type<Record<string, string>>(),
  transcriptionLatin: text("transcription_latin"),
  transcriptionCyrillic: text("transcription_cyrillic"),
  audioUrl: text("audio_url"),
  timestamp: integer("timestamp"),
  repeatCount: integer("repeat_count").default(1),
});

export const enrollments = pgTable(
  "enrollments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
    lastAccessed: timestamp("last_accessed"),
  },
  (table) => [
    uniqueIndex("enrollments_user_course_idx").on(
      table.userId,
      table.courseId
    ),
    index("enrollments_user_id_idx").on(table.userId),
  ]
);

export const lessonProgress = pgTable(
  "lesson_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    completed: boolean("completed").default(false).notNull(),
    completedAt: timestamp("completed_at"),
  },
  (table) => [
    uniqueIndex("lesson_progress_user_lesson_idx").on(
      table.userId,
      table.lessonId
    ),
    index("lesson_progress_user_id_idx").on(table.userId),
  ]
);

export const badges = pgTable("badges", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: jsonb("name").notNull().$type<Record<string, string>>(),
  description: jsonb("description").$type<Record<string, string>>(),
  iconUrl: text("icon_url"),
  criteriaType: badgeCriteriaEnum("criteria_type").notNull(),
  criteriaValue: jsonb("criteria_value").$type<Record<string, unknown>>(),
});

export const userBadges = pgTable(
  "user_badges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    badgeId: uuid("badge_id")
      .notNull()
      .references(() => badges.id, { onDelete: "cascade" }),
    earnedAt: timestamp("earned_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("user_badges_user_badge_idx").on(table.userId, table.badgeId),
  ]
);

export const courseLikes = pgTable(
  "course_likes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("course_likes_user_course_idx").on(
      table.userId,
      table.courseId
    ),
  ]
);

export const userStreaks = pgTable(
  "user_streaks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    currentStreak: integer("current_streak").default(0).notNull(),
    longestStreak: integer("longest_streak").default(0).notNull(),
    lastActivityDate: timestamp("last_activity_date"),
  },
  (table) => [uniqueIndex("user_streaks_user_id_idx").on(table.userId)]
);

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  courses: many(courses),
  enrollments: many(enrollments),
  lessonProgress: many(lessonProgress),
  userBadges: many(userBadges),
  courseLikes: many(courseLikes),
  streak: one(userStreaks),
  teacherApplications: many(teacherApplications),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  teacher: one(users, {
    fields: [courses.teacherId],
    references: [users.id],
  }),
  lessons: many(lessons),
  enrollments: many(enrollments),
  likes: many(courseLikes),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  course: one(courses, {
    fields: [lessons.courseId],
    references: [courses.id],
  }),
  content: many(lessonContent),
  progress: many(lessonProgress),
}));

export const lessonContentRelations = relations(lessonContent, ({ one }) => ({
  lesson: one(lessons, {
    fields: [lessonContent.lessonId],
    references: [lessons.id],
  }),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  user: one(users, {
    fields: [enrollments.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [enrollments.courseId],
    references: [courses.id],
  }),
}));

export const lessonProgressRelations = relations(
  lessonProgress,
  ({ one }) => ({
    user: one(users, {
      fields: [lessonProgress.userId],
      references: [users.id],
    }),
    lesson: one(lessons, {
      fields: [lessonProgress.lessonId],
      references: [lessons.id],
    }),
  })
);

export const badgesRelations = relations(badges, ({ many }) => ({
  userBadges: many(userBadges),
}));

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, {
    fields: [userBadges.userId],
    references: [users.id],
  }),
  badge: one(badges, {
    fields: [userBadges.badgeId],
    references: [badges.id],
  }),
}));

export const courseLikesRelations = relations(courseLikes, ({ one }) => ({
  user: one(users, {
    fields: [courseLikes.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [courseLikes.courseId],
    references: [courses.id],
  }),
}));

export const userStreaksRelations = relations(userStreaks, ({ one }) => ({
  user: one(users, {
    fields: [userStreaks.userId],
    references: [users.id],
  }),
}));

export const teacherApplicationsRelations = relations(
  teacherApplications,
  ({ one }) => ({
    user: one(users, {
      fields: [teacherApplications.userId],
      references: [users.id],
    }),
    reviewer: one(users, {
      fields: [teacherApplications.reviewedBy],
      references: [users.id],
    }),
  })
);
