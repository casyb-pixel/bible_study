import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { chapterCache, type CachedChapterVerse } from "@/db/schema";

export async function getCachedChapter(
  book: string,
  chapter: number,
): Promise<{
  book: string;
  chapter: number;
  plainText: string;
  verses: CachedChapterVerse[];
  fetchedAt: Date;
} | null> {
  const rows = await db
    .select({
      book: chapterCache.book,
      chapter: chapterCache.chapter,
      plainText: chapterCache.plainText,
      verses: chapterCache.verses,
      fetchedAt: chapterCache.fetchedAt,
    })
    .from(chapterCache)
    .where(
      and(eq(chapterCache.book, book), eq(chapterCache.chapter, chapter)),
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function saveChapterCache(input: {
  book: string;
  chapter: number;
  plainText: string;
  verses: CachedChapterVerse[];
}): Promise<void> {
  const fetchedAt = new Date();

  await db
    .insert(chapterCache)
    .values({
      book: input.book,
      chapter: input.chapter,
      plainText: input.plainText,
      verses: input.verses,
      fetchedAt,
    })
    .onConflictDoUpdate({
      target: [chapterCache.book, chapterCache.chapter],
      set: {
        plainText: input.plainText,
        verses: input.verses,
        fetchedAt,
      },
    });
}
