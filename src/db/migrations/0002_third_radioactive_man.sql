CREATE TABLE "chapter_cache" (
	"book" text NOT NULL,
	"chapter" integer NOT NULL,
	"plain_text" text NOT NULL,
	"verses" jsonb NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chapter_cache_book_chapter_pk" PRIMARY KEY("book","chapter")
);
