/**
 * Applies small, incremental DB fixes without relying on drizzle-kit push/migrate.
 *
 * Safe to run repeatedly.
 */
import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";

function loadDotEnvLocal() {
  if (process.env.DATABASE_URL) return;
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

async function main() {
  loadDotEnvLocal();
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error("DATABASE_URL is required (env or .env.local).");
    process.exit(1);
  }

  const sql = postgres(DATABASE_URL, { prepare: false });
  try {
    // Ensure we can safely add unique index (no existing duplicates).
    const dupes = await sql<
      { user_id: string; c: number }[]
    >`select user_id, count(*)::int as c
      from teacher_applications
      group by user_id
      having count(*) > 1`;

    if (dupes.length > 0) {
      console.error(
        "Cannot create unique index teacher_applications(user_id): duplicates exist."
      );
      console.error(
        `Duplicate user_id count: ${dupes.length} (fix by deleting/merging duplicates first).`
      );
      process.exit(2);
    }

    await sql`create unique index if not exists teacher_applications_user_id_idx
      on teacher_applications (user_id)`;

    console.log("OK: ensured unique index teacher_applications_user_id_idx.");
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

