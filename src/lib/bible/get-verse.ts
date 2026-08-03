import type { BookName } from "lsbible";

import { isValidChapter } from "./books";
import { getLsbibleClient } from "./client";
import { ChapterFetchError } from "./errors";

export type VerseText = {
  translation: "LSB";
  book: BookName;
  chapter: number;
  verse: number;
  text: string;
};

export async function getVerse(
  book: BookName,
  chapter: number,
  verse: number,
): Promise<VerseText> {
  if (!isValidChapter(book, chapter)) {
    throw new ChapterFetchError(`Invalid chapter: ${book} ${chapter}`, {
      causeName: "InvalidChapter",
      retryable: false,
    });
  }

  if (!Number.isInteger(verse) || verse < 1) {
    throw new ChapterFetchError(`Invalid verse: ${verse}`, {
      causeName: "InvalidVerse",
      retryable: false,
    });
  }

  const passage = await getLsbibleClient().getVerse(book, chapter, verse);
  const content = passage.verses[0];

  if (!content) {
    throw new ChapterFetchError(`Verse not found: ${book} ${chapter}:${verse}`, {
      causeName: "VerseNotFound",
      retryable: false,
    });
  }

  return {
    translation: "LSB",
    book,
    chapter,
    verse: content.verseNumber,
    text: content.plainText.trim(),
  };
}
