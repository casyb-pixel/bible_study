DO $$ BEGIN
  CREATE TYPE "public"."verse_mark_color" AS ENUM('yellow', 'green', 'blue');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."verse_mark_type" AS ENUM('highlight', 'note');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verse_marks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"book" text NOT NULL,
	"chapter" integer NOT NULL,
	"verse" integer NOT NULL,
	"type" "verse_mark_type" NOT NULL,
	"note_text" text,
	"color" "verse_mark_color",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "preferred_tts_voice" text DEFAULT 'leo' NOT NULL;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "verse_marks" ADD CONSTRAINT "verse_marks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "verse_marks_user_ref_type_idx" ON "verse_marks" USING btree ("user_id","book","chapter","verse","type");
