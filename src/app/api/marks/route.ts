import {
  isNonEmptyString,
  isPositiveInt,
  isUuid,
  jsonError,
  jsonOk,
  parseJsonBody,
  userExists,
} from "@/lib/api";
import { listVerseMarks, upsertVerseMark } from "@/lib/marks";
import {
  isVerseMarkColor,
  isVerseMarkType,
  MAX_NOTE_LENGTH,
} from "@/lib/verse-marks";
import { getUserByUsername, isValidUsernameFormat } from "@/lib/users";

type MarkPostBody = {
  userId?: unknown;
  username?: unknown;
  book?: unknown;
  chapter?: unknown;
  verse?: unknown;
  type?: unknown;
  noteText?: unknown;
  color?: unknown;
};

async function resolveUserId(input: {
  userId?: unknown;
  username?: unknown;
}): Promise<string | null> {
  if (isUuid(input.userId)) {
    return input.userId;
  }

  if (
    typeof input.username === "string" &&
    isValidUsernameFormat(input.username)
  ) {
    const user = await getUserByUsername(input.username);
    return user?.id ?? null;
  }

  return null;
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const userIdParam = params.get("userId");
  const usernameParam = params.get("username") ?? params.get("user");
  const book = params.get("book");
  const chapterRaw = params.get("chapter");

  let userId: string | null = null;

  if (isUuid(userIdParam)) {
    userId = userIdParam;
  } else if (usernameParam && isValidUsernameFormat(usernameParam)) {
    const user = await getUserByUsername(usernameParam);
    userId = user?.id ?? null;
    if (!userId) {
      return jsonError("User not found", 404);
    }
  } else {
    return jsonError(
      "userId (UUID) or username query parameter is required",
      400,
    );
  }

  if (!(await userExists(userId))) {
    return jsonError("User not found", 404);
  }

  let chapter: number | undefined;
  if (chapterRaw != null && chapterRaw !== "") {
    const parsed = Number(chapterRaw);
    if (!isPositiveInt(parsed)) {
      return jsonError("chapter must be a positive integer", 400);
    }
    chapter = parsed;
  }

  if (chapter != null && !isNonEmptyString(book)) {
    return jsonError("book is required when chapter is provided", 400);
  }

  const marks = await listVerseMarks({
    userId,
    book: isNonEmptyString(book) ? book : undefined,
    chapter,
  });

  return jsonOk({ marks });
}

export async function POST(request: Request) {
  const parsed = await parseJsonBody<MarkPostBody>(request);
  if ("error" in parsed) {
    return parsed.error;
  }

  const { book, chapter, verse, type, noteText, color } = parsed.data;
  const userId = await resolveUserId(parsed.data);

  if (!userId) {
    return jsonError("userId (UUID) or username is required", 400);
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

  if (!isVerseMarkType(type)) {
    return jsonError("type must be highlight or note", 400);
  }

  if (!(await userExists(userId))) {
    return jsonError("User not found", 404);
  }

  if (type === "highlight") {
    if (!isVerseMarkColor(color)) {
      return jsonError("color must be yellow, green, or blue", 400);
    }

    const mark = await upsertVerseMark({
      userId,
      book,
      chapter,
      verse,
      type,
      color,
    });
    return jsonOk(mark, 201);
  }

  if (typeof noteText !== "string") {
    return jsonError("noteText must be a string", 400);
  }

  const trimmed = noteText.trim();
  if (trimmed.length === 0) {
    return jsonError("noteText must not be empty", 400);
  }
  if (trimmed.length > MAX_NOTE_LENGTH) {
    return jsonError(`noteText must be at most ${MAX_NOTE_LENGTH} characters`, 400);
  }

  const mark = await upsertVerseMark({
    userId,
    book,
    chapter,
    verse,
    type,
    noteText: trimmed,
  });

  return jsonOk(mark, 201);
}
