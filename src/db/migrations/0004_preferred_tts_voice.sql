ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "preferred_tts_voice" text DEFAULT 'leo' NOT NULL;
