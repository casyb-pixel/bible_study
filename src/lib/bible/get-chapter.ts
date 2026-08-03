import {
  APIError,
  BuildIDError,
  type BookName,
} from "lsbible";

import { isValidChapter } from "./books";
import {
  getLsbibleClient,
  isBuildIdPinned,
  resetLsbibleClient,
} from "./client";
import {
  ChapterFetchError,
  logBibleError,
  toChapterFetchError,
} from "./errors";

export type ChapterVerse = {
  verse: number;
  text: string;
};

export type ChapterText = {
  translation: "LSB";
  book: BookName;
  chapter: number;
  verseCount: number;
  verses: ChapterVerse[];
  /** Full chapter plain text for later voice reading. */
  plainText: string;
};

const MAX_ATTEMPTS = 3;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isRateLimited(error: unknown): boolean {
  return (
    error instanceof Error &&
    /429|too many requests|rate limit/i.test(error.message)
  );
}

function shouldResetClient(error: unknown): boolean {
  // A pinned build ID cannot be repaired by recreating the client.
  if (isBuildIdPinned()) {
    return error instanceof APIError && /status 404|status 5\d\d/i.test(error.message);
  }

  if (error instanceof BuildIDError) {
    // Do not reset/retry-storm on 429; that worsens rate limits.
    return !isRateLimited(error);
  }

  if (error instanceof APIError) {
    return /status 404|status 429|status 5\d\d/i.test(error.message);
  }

  return false;
}

function shouldRetry(error: unknown, attempt: number): boolean {
  if (attempt >= MAX_ATTEMPTS) {
    return false;
  }

  // One attempt only when build-ID discovery is rate-limited.
  if (error instanceof BuildIDError && isRateLimited(error)) {
    return false;
  }

  return true;
}

export async function getChapter(
  book: BookName,
  chapter: number,
): Promise<ChapterText> {
  if (!isValidChapter(book, chapter)) {
    throw new ChapterFetchError(`Invalid chapter: ${book} ${chapter}`, {
      causeName: "InvalidChapter",
      retryable: false,
    });
  }

  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const client = getLsbibleClient();
      const passage = await client.getChapter(book, chapter);

      const verses: ChapterVerse[] = passage.verses.map((verse) => ({
        verse: verse.verseNumber,
        text: verse.plainText.trim(),
      }));

      if (verses.length === 0) {
        throw new ChapterFetchError(
          `No verses returned for ${book} ${chapter}.`,
          { causeName: "EmptyChapter", retryable: true },
        );
      }

      const plainText = verses
        .map((verse) => `${verse.verse}. ${verse.text}`)
        .join("\n");

      return {
        translation: "LSB",
        book,
        chapter,
        verseCount: verses.length,
        verses,
        plainText,
      };
    } catch (error) {
      lastError = error;
      logBibleError(
        "getChapter failed",
        { book, chapter, attempt, maxAttempts: MAX_ATTEMPTS },
        error,
      );

      if (shouldResetClient(error)) {
        resetLsbibleClient();
      }

      if (!shouldRetry(error, attempt)) {
        break;
      }

      await delay(isRateLimited(error) ? 1500 * attempt : 400 * attempt);
    }
  }

  throw toChapterFetchError(lastError);
}

export { ChapterFetchError };
