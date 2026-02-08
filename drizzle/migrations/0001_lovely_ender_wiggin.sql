ALTER TABLE "badges" ADD COLUMN "code" text;--> statement-breakpoint
UPDATE "badges" SET "code" = "id"::text WHERE "code" IS NULL;--> statement-breakpoint
ALTER TABLE "badges" ALTER COLUMN "code" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_system" boolean DEFAULT false NOT NULL;--> statement-breakpoint
-- Backfill legacy "system" users created without auth_id.
UPDATE "users" SET "is_system" = true WHERE "auth_id" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "badges_code_idx" ON "badges" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "lesson_content_lesson_order_idx" ON "lesson_content" USING btree ("lesson_id","order");--> statement-breakpoint
CREATE UNIQUE INDEX "lessons_course_order_idx" ON "lessons" USING btree ("course_id","order");--> statement-breakpoint
CREATE UNIQUE INDEX "users_system_name_idx" ON "users" USING btree ("name") WHERE "users"."is_system" = true;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_auth_id_or_system_chk" CHECK ("users"."is_system" OR "users"."auth_id" IS NOT NULL);
