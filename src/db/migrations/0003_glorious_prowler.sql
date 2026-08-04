DO $$ BEGIN
  CREATE TYPE "public"."preferred_translation" AS ENUM('NKJV', 'NIV', 'NLT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DELETE FROM "chapter_cache";--> statement-breakpoint
ALTER TABLE "chapter_cache" ADD COLUMN IF NOT EXISTS "translation" text;--> statement-breakpoint
UPDATE "chapter_cache" SET "translation" = 'NKJV' WHERE "translation" IS NULL OR btrim("translation") = '';--> statement-breakpoint
ALTER TABLE "chapter_cache" ALTER COLUMN "translation" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "chapter_cache" DROP CONSTRAINT IF EXISTS "chapter_cache_book_chapter_pk";--> statement-breakpoint
ALTER TABLE "chapter_cache" DROP CONSTRAINT IF EXISTS "chapter_cache_book_chapter_translation_pk";--> statement-breakpoint
ALTER TABLE "chapter_cache" ADD CONSTRAINT "chapter_cache_book_chapter_translation_pk" PRIMARY KEY("book","chapter","translation");--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "preferred_translation" "preferred_translation" DEFAULT 'NKJV' NOT NULL;
