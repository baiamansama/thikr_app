/**
 * Uploads `public/audio/*` to a public Supabase Storage bucket.
 *
 * Usage:
 *   npm run assets:upload-audio
 *
 * Requires:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   NEXT_PUBLIC_SUPABASE_ASSETS_BUCKET (optional; default "thikr-assets")
 */

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadDotEnvLocal() {
  // Minimal .env.local loader for scripts (avoids adding a dependency).
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

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

function contentTypeFor(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  switch (ext) {
    case ".mp3":
      return "audio/mpeg";
    case ".m4a":
      // M4A is MP4 container with AAC audio.
      return "audio/mp4";
    default:
      return "application/octet-stream";
  }
}

async function ensurePublicBucket(supabase: any, bucket: string) {
  const existing = await supabase.storage.getBucket(bucket);
  if (!existing.error) return;

  const created = await supabase.storage.createBucket(bucket, {
    public: true,
    fileSizeLimit: undefined,
  });
  if (created.error) {
    // If it was created concurrently, follow up with a get.
    const again = await supabase.storage.getBucket(bucket);
    if (again.error) throw created.error;
  }
}

async function main() {
  loadDotEnvLocal();

  const supabaseUrl = required("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = required("SUPABASE_SERVICE_ROLE_KEY");
  const bucket = process.env.NEXT_PUBLIC_SUPABASE_ASSETS_BUCKET || "thikr-assets";

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  await ensurePublicBucket(supabase, bucket);

  const audioDir = path.join(process.cwd(), "public", "audio");
  if (!fs.existsSync(audioDir)) {
    throw new Error(`Missing directory: ${audioDir}`);
  }

  const files = fs
    .readdirSync(audioDir)
    .filter((f) => !f.startsWith("."))
    .sort();

  if (files.length === 0) {
    console.log("No files found in public/audio.");
    return;
  }

  console.log(`Uploading ${files.length} files to bucket "${bucket}"...`);

  let ok = 0;
  for (const file of files) {
    const localPath = path.join(audioDir, file);
    const key = `audio/${file}`;
    const body = fs.readFileSync(localPath);
    const contentType = contentTypeFor(file);

    const { error } = await supabase.storage.from(bucket).upload(key, body, {
      upsert: true,
      contentType,
      cacheControl: "31536000", // 1y, these files are content-addressed by name
    });

    if (error) {
      console.error(`FAIL ${file}: ${error.message}`);
      continue;
    }
    ok++;
    if (ok % 10 === 0 || ok === files.length) {
      console.log(`Uploaded ${ok}/${files.length}`);
    }
  }

  console.log(`Done. Uploaded ${ok}/${files.length} files.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
