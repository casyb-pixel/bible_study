import { eq } from "drizzle-orm";

import { db } from "@/db";
import { progress, users } from "@/db/schema";
import { isUuid } from "@/lib/api";

/** Temporary test user until authentication is added. */
export const DEFAULT_TEST_USER_ID =
  "00000000-0000-4000-8000-000000000001";

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

export function resolveUserId(userIdParam?: string | string[]): string | null {
  const value = Array.isArray(userIdParam) ? userIdParam[0] : userIdParam;

  if (!value || value.trim().length === 0) {
    return DEFAULT_TEST_USER_ID;
  }

  if (!isUuid(value)) {
    return null;
  }

  return value;
}

async function ensureUser(userId: string): Promise<void> {
  await db.insert(users).values({ id: userId }).onConflictDoNothing({
    target: users.id,
  });
}

export async function upsertProgress(input: {
  userId: string;
  book: string;
  chapter: number;
  verse: number;
}): Promise<ProgressRecord> {
  await ensureUser(input.userId);

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
