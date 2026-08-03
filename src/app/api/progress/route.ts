import { eq } from "drizzle-orm";

import { db } from "@/db";
import { progress } from "@/db/schema";
import {
  isNonEmptyString,
  isPositiveInt,
  isUuid,
  jsonError,
  jsonOk,
  parseJsonBody,
  userExists,
} from "@/lib/api";

const DEFAULT_PROGRESS = {
  currentBook: "Genesis",
  currentChapter: 1,
  currentVerse: 1,
} as const;

type ProgressPostBody = {
  userId?: unknown;
  book?: unknown;
  chapter?: unknown;
  verse?: unknown;
};

export async function GET(request: Request) {
  const userId = new URL(request.url).searchParams.get("userId");

  if (!isUuid(userId)) {
    return jsonError("userId query parameter must be a valid UUID", 400);
  }

  if (!(await userExists(userId))) {
    return jsonError("User not found", 404);
  }

  const rows = await db
    .select({
      id: progress.id,
      userId: progress.userId,
      currentBook: progress.currentBook,
      currentChapter: progress.currentChapter,
      currentVerse: progress.currentVerse,
      lastReadAt: progress.lastReadAt,
    })
    .from(progress)
    .where(eq(progress.userId, userId))
    .limit(1);

  if (rows.length === 0) {
    return jsonOk({
      userId,
      ...DEFAULT_PROGRESS,
      lastReadAt: null,
      isDefault: true,
    });
  }

  return jsonOk({
    ...rows[0],
    isDefault: false,
  });
}

export async function POST(request: Request) {
  const parsed = await parseJsonBody<ProgressPostBody>(request);
  if ("error" in parsed) {
    return parsed.error;
  }

  const { userId, book, chapter, verse } = parsed.data;

  if (!isUuid(userId)) {
    return jsonError("userId must be a valid UUID", 400);
  }

  if (!isNonEmptyString(book)) {
    return jsonError("book must be a non-empty string", 400);
  }

  if (!isPositiveInt(chapter)) {
    return jsonError("chapter must be a positive integer", 400);
  }

  if (!isPositiveInt(verse)) {
    return jsonError("verse must be a positive integer", 400);
  }

  if (!(await userExists(userId))) {
    return jsonError("User not found", 404);
  }

  const now = new Date();
  const existing = await db
    .select({ id: progress.id })
    .from(progress)
    .where(eq(progress.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    const [updated] = await db
      .update(progress)
      .set({
        currentBook: book.trim(),
        currentChapter: chapter,
        currentVerse: verse,
        lastReadAt: now,
      })
      .where(eq(progress.id, existing[0].id))
      .returning({
        id: progress.id,
        userId: progress.userId,
        currentBook: progress.currentBook,
        currentChapter: progress.currentChapter,
        currentVerse: progress.currentVerse,
        lastReadAt: progress.lastReadAt,
      });

    return jsonOk(updated);
  }

  const [created] = await db
    .insert(progress)
    .values({
      userId,
      currentBook: book.trim(),
      currentChapter: chapter,
      currentVerse: verse,
      lastReadAt: now,
    })
    .returning({
      id: progress.id,
      userId: progress.userId,
      currentBook: progress.currentBook,
      currentChapter: progress.currentChapter,
      currentVerse: progress.currentVerse,
      lastReadAt: progress.lastReadAt,
    });

  return jsonOk(created, 201);
}
