import { db } from "@/db";
import { chapterCompletions } from "@/db/schema";
import {
  isNonEmptyString,
  isPositiveInt,
  isUuid,
  jsonError,
  jsonOk,
  parseJsonBody,
  userExists,
} from "@/lib/api";

type CompletionPostBody = {
  userId?: unknown;
  book?: unknown;
  chapter?: unknown;
  understandingConfirmed?: unknown;
};

export async function POST(request: Request) {
  const parsed = await parseJsonBody<CompletionPostBody>(request);
  if ("error" in parsed) {
    return parsed.error;
  }

  const { userId, book, chapter, understandingConfirmed } = parsed.data;

  if (!isUuid(userId)) {
    return jsonError("userId must be a valid UUID", 400);
  }

  if (!isNonEmptyString(book)) {
    return jsonError("book must be a non-empty string", 400);
  }

  if (!isPositiveInt(chapter)) {
    return jsonError("chapter must be a positive integer", 400);
  }

  if (typeof understandingConfirmed !== "boolean") {
    return jsonError("understandingConfirmed must be a boolean", 400);
  }

  if (!(await userExists(userId))) {
    return jsonError("User not found", 404);
  }

  const [created] = await db
    .insert(chapterCompletions)
    .values({
      userId,
      book: book.trim(),
      chapter,
      understandingConfirmed,
      completedAt: new Date(),
    })
    .returning({
      id: chapterCompletions.id,
      userId: chapterCompletions.userId,
      book: chapterCompletions.book,
      chapter: chapterCompletions.chapter,
      completedAt: chapterCompletions.completedAt,
      understandingConfirmed: chapterCompletions.understandingConfirmed,
    });

  return jsonOk(created, 201);
}
