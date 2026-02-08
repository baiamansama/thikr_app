/**
 * Migration script to import existing azkar/duas/surahs data into the database.
 *
 * Usage: npm run migrate:azkars
 *
 * Requires DATABASE_URL to be set in environment.
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../lib/db/schema";
import { readFileSync } from "fs";
import { join } from "path";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const client = postgres(DATABASE_URL, { prepare: false });
const db = drizzle(client, { schema });

interface AzkarRaw {
  azkar_id: string;
  lineNumber: string;
  count?: string;
  arabic: string;
  english: string;
  кыргыз: string;
  русский: string;
  timestamp?: string;
  transcription_cyrillic?: string;
  transcription_latin?: string;
}

interface Category {
  id: string;
  translations: Record<string, string>;
  azkars: AzkarRaw[];
  virtues: Array<{
    azkar_id: string;
    arabic: string;
    english: string;
    кыргыз: string;
    русский: string;
  }>;
}

interface AzkarsData {
  metadata: { version: string; lastUpdated: string; supportedLanguages: string[] };
  categories: Category[];
}

async function main() {
  console.log("Starting migration...");

  // Read source data
  const azkarsPath = join(process.cwd(), "public/data/azkars.json");
  const azkarsData: AzkarsData = JSON.parse(readFileSync(azkarsPath, "utf-8"));

  // 1. Create system teacher user
  console.log("Creating system teacher...");
  const [systemTeacher] = await db
    .insert(schema.users)
    .values({
      name: "Thikr Team",
      role: "teacher",
      isTeacherApproved: true,
    })
    .onConflictDoNothing()
    .returning();

  const teacherId = systemTeacher?.id;
  if (!teacherId) {
    console.log("System teacher may already exist. Looking up...");
    const existing = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.name, "Thikr Team"),
    });
    if (!existing) {
      console.error("Failed to create or find system teacher");
      process.exit(1);
    }
  }

  const finalTeacherId = teacherId || (await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.name, "Thikr Team"),
  }))!.id;

  // 2. Migrate each category as a course
  for (const category of azkarsData.categories) {
    console.log(`\nMigrating category: ${category.id}`);

    const categoryLabel = {
      morning: "Morning Azkar",
      evening: "Evening Azkar",
      duas: "Duas & Supplications",
      surahs: "Quran Surahs",
    }[category.id] || category.id;

    // Create course
    const [course] = await db
      .insert(schema.courses)
      .values({
        title: {
          en: categoryLabel,
          ar: category.translations["عربي"] || categoryLabel,
          ky: category.translations["кыргыз"] || categoryLabel,
          ru: category.translations["русский"] || categoryLabel,
        },
        description: {
          en: `Collection of ${categoryLabel.toLowerCase()} with audio and translations.`,
        },
        category: category.id === "surahs" ? "quran" : category.id === "duas" ? "duas" : "azkar",
        difficulty: "beginner",
        teacherId: finalTeacherId,
        isPublished: true,
      })
      .returning();

    console.log(`  Created course: ${course.id} - ${categoryLabel}`);

    // Group azkars by azkar_id
    const azkarGroups = new Map<string, AzkarRaw[]>();
    for (const azkar of category.azkars) {
      const existing = azkarGroups.get(azkar.azkar_id) || [];
      existing.push(azkar);
      azkarGroups.set(azkar.azkar_id, existing);
    }

    // Create a lesson for each azkar group
    let lessonOrder = 1;
    for (const [azkarId, lines] of azkarGroups) {
      // Sort lines by lineNumber
      lines.sort((a, b) => parseInt(a.lineNumber) - parseInt(b.lineNumber));

      const firstLine = lines[0];
      const repeatCount = category.id === "duas" ? 1 : parseInt(firstLine.count || "1");

      // Determine audio extension
      const audioExt = category.id === "surahs" ? "mp3" : "m4a";
      const audioUrl = `/audio/${azkarId}.${audioExt}`;

      // Create lesson
      const [lesson] = await db
        .insert(schema.lessons)
        .values({
          courseId: course.id,
          title: {
            en: `${categoryLabel} #${lessonOrder}`,
            ar: firstLine.arabic.substring(0, 50) + (firstLine.arabic.length > 50 ? "..." : ""),
          },
          order: lessonOrder,
          type: "azkar" as const,
        })
        .returning();

      // Create content lines
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        await db.insert(schema.lessonContent).values({
          lessonId: lesson.id,
          order: i + 1,
          arabic: line.arabic,
          translations: {
            english: line.english || "",
            кыргыз: line.кыргыз || "",
            русский: line.русский || "",
          },
          transcriptionLatin: line.transcription_latin || null,
          transcriptionCyrillic: line.transcription_cyrillic || null,
          audioUrl: i === 0 ? audioUrl : null,
          timestamp: line.timestamp ? parseInt(line.timestamp) : null,
          repeatCount: i === 0 ? repeatCount : null,
        });
      }

      console.log(`  Lesson ${lessonOrder}: ${azkarId} (${lines.length} lines)`);
      lessonOrder++;
    }
  }

  // 3. Create initial badges
  console.log("\nCreating initial badges...");

  const badgeData = [
    {
      name: { en: "First Steps", ar: "الخطوات الأولى" },
      description: { en: "Complete your first lesson" },
      criteriaType: "milestone" as const,
      criteriaValue: { lessonsCompleted: 1 },
    },
    {
      name: { en: "Dedicated Learner", ar: "طالب مجتهد" },
      description: { en: "Complete 10 lessons" },
      criteriaType: "milestone" as const,
      criteriaValue: { lessonsCompleted: 10 },
    },
    {
      name: { en: "Knowledge Seeker", ar: "طالب العلم" },
      description: { en: "Complete 50 lessons" },
      criteriaType: "milestone" as const,
      criteriaValue: { lessonsCompleted: 50 },
    },
    {
      name: { en: "Azkar Master", ar: "أستاذ الأذكار" },
      description: { en: "Complete an azkar course" },
      criteriaType: "course_completion" as const,
      criteriaValue: { category: "azkar" },
    },
    {
      name: { en: "Dua Scholar", ar: "عالم الدعاء" },
      description: { en: "Complete a duas course" },
      criteriaType: "course_completion" as const,
      criteriaValue: { category: "duas" },
    },
    {
      name: { en: "Quran Student", ar: "طالب القرآن" },
      description: { en: "Complete a Quran course" },
      criteriaType: "course_completion" as const,
      criteriaValue: { category: "quran" },
    },
    {
      name: { en: "7-Day Streak", ar: "سلسلة ٧ أيام" },
      description: { en: "Maintain a 7-day learning streak" },
      criteriaType: "streak" as const,
      criteriaValue: { days: 7 },
    },
    {
      name: { en: "30-Day Streak", ar: "سلسلة ٣٠ يوم" },
      description: { en: "Maintain a 30-day learning streak" },
      criteriaType: "streak" as const,
      criteriaValue: { days: 30 },
    },
    {
      name: { en: "100-Day Streak", ar: "سلسلة ١٠٠ يوم" },
      description: { en: "Maintain a 100-day learning streak" },
      criteriaType: "streak" as const,
      criteriaValue: { days: 100 },
    },
  ];

  for (const badge of badgeData) {
    await db.insert(schema.badges).values(badge);
    console.log(`  Badge: ${badge.name.en}`);
  }

  console.log("\nMigration complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
