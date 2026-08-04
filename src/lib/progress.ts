import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { progress } from "@/db/schema";

export type ProgressRecord = {
  id: string;
  userId: string;
  currentBook: string;
  currentChapter: number;
  currentVerse: number;
  lastReadAt: Date;
};

const progressColumns = {
  id: progress.id,
  userId: progress.userId,
  currentBook: progress.currentBook,
  currentChapter: progress.currentChapter,
  currentVerse: progress.currentVerse,
  lastReadAt: progress.lastReadAt,
} as const;

export async function getProgress(
  userId: string,
): Promise<ProgressRecord | null> {
  const rows = await db
    .select(progressColumns)
    .from(progress)
    .where(eq(progress.userId, userId))
    .limit(1);

  return rows[0] ?? null;
}

export async function upsertProgress(input: {
  userId: string;
  book: string;
  chapter: number;
  verse: number;
}): Promise<ProgressRecord> {
  const now = new Date();
  const existing = await db
    .select({ id: progress.id })
    .from(progress)
    .where(eq(progress.userId, input.userId))
    .limit(1);

  if (existing.length > 0) {
    const [updated] = await db
      .update(progress)
      .set({
        currentBook: input.book.trim(),
        currentChapter: input.chapter,
        currentVerse: input.verse,
        lastReadAt: now,
      })
      .where(eq(progress.id, existing[0].id))
      .returning(progressColumns);

    return updated;
  }

  const [created] = await db
    .insert(progress)
    .values({
      userId: input.userId,
      currentBook: input.book.trim(),
      currentChapter: input.chapter,
      currentVerse: input.verse,
      lastReadAt: now,
    })
    .returning(progressColumns);

  return created;
}

/**
 * Open a canonical chapter without wiping the saved verse when the user
 * returns to the same book + chapter.
 */
export async function openChapterProgress(input: {
  userId: string;
  book: string;
  chapter: number;
}): Promise<ProgressRecord> {
  const book = input.book.trim();
  const existing = await getProgress(input.userId);
  const sameChapter =
    existing != null &&
    existing.currentBook === book &&
    existing.currentChapter === input.chapter;

  const verse =
    sameChapter && existing.currentVerse > 0 ? existing.currentVerse : 1;

  return upsertProgress({
    userId: input.userId,
    book,
    chapter: input.chapter,
    verse,
  });
}
