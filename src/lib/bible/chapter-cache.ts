import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { chapterCache, type CachedChapterVerse } from "@/db/schema";
import type { TranslationCode } from "@/lib/bible/translations";

export async function getCachedChapter(
  book: string,
  chapter: number,
  translation: TranslationCode,
): Promise<{
  book: string;
  chapter: number;
  translation: string;
  plainText: string;
  verses: CachedChapterVerse[];
  fetchedAt: Date;
} | null> {
  const rows = await db
    .select({
      book: chapterCache.book,
      chapter: chapterCache.chapter,
      translation: chapterCache.translation,
      plainText: chapterCache.plainText,
      verses: chapterCache.verses,
      fetchedAt: chapterCache.fetchedAt,
    })
    .from(chapterCache)
    .where(
      and(
        eq(chapterCache.book, book),
        eq(chapterCache.chapter, chapter),
        eq(chapterCache.translation, translation),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function saveChapterCache(input: {
  book: string;
  chapter: number;
  translation: TranslationCode;
  plainText: string;
  verses: CachedChapterVerse[];
}): Promise<void> {
  const fetchedAt = new Date();

  await db
    .insert(chapterCache)
    .values({
      book: input.book,
      chapter: input.chapter,
      translation: input.translation,
      plainText: input.plainText,
      verses: input.verses,
      fetchedAt,
    })
    .onConflictDoUpdate({
      target: [
        chapterCache.book,
        chapterCache.chapter,
        chapterCache.translation,
      ],
      set: {
        plainText: input.plainText,
        verses: input.verses,
        fetchedAt,
      },
    });
}
