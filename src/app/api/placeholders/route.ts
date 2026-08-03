import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { placeholders } from "@/db/schema";
import {
  isNonEmptyString,
  isOptionalString,
  isPositiveInt,
  isUuid,
  jsonError,
  jsonOk,
  parseJsonBody,
  userExists,
} from "@/lib/api";

type PlaceholderPostBody = {
  userId?: unknown;
  book?: unknown;
  chapter?: unknown;
  verse?: unknown;
  positionNote?: unknown;
  note?: unknown;
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
      id: placeholders.id,
      userId: placeholders.userId,
      book: placeholders.book,
      chapter: placeholders.chapter,
      verse: placeholders.verse,
      positionNote: placeholders.positionNote,
      note: placeholders.note,
      createdAt: placeholders.createdAt,
    })
    .from(placeholders)
    .where(eq(placeholders.userId, userId))
    .orderBy(desc(placeholders.createdAt));

  return jsonOk({ placeholders: rows });
}

export async function POST(request: Request) {
  const parsed = await parseJsonBody<PlaceholderPostBody>(request);
  if ("error" in parsed) {
    return parsed.error;
  }

  const { userId, book, chapter, verse, positionNote, note } = parsed.data;

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

  if (!isOptionalString(positionNote)) {
    return jsonError("positionNote must be a string when provided", 400);
  }

  if (!isOptionalString(note)) {
    return jsonError("note must be a string when provided", 400);
  }

  if (!(await userExists(userId))) {
    return jsonError("User not found", 404);
  }

  const [created] = await db
    .insert(placeholders)
    .values({
      userId,
      book: book.trim(),
      chapter,
      verse,
      positionNote:
        typeof positionNote === "string" ? positionNote.trim() || null : null,
      note: typeof note === "string" ? note.trim() || null : null,
    })
    .returning({
      id: placeholders.id,
      userId: placeholders.userId,
      book: placeholders.book,
      chapter: placeholders.chapter,
      verse: placeholders.verse,
      positionNote: placeholders.positionNote,
      note: placeholders.note,
      createdAt: placeholders.createdAt,
    });

  return jsonOk(created, 201);
}
