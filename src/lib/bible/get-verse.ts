import type { BookName } from "lsbible";

import { isValidChapter } from "./books";
import { lsbibleClient } from "./client";

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
    throw new Error(`Invalid chapter: ${book} ${chapter}`);
  }

  if (!Number.isInteger(verse) || verse < 1) {
    throw new Error(`Invalid verse: ${verse}`);
  }

  const passage = await lsbibleClient.getVerse(book, chapter, verse);
  const content = passage.verses[0];

  if (!content) {
    throw new Error(`Verse not found: ${book} ${chapter}:${verse}`);
  }

  return {
    translation: "LSB",
    book,
    chapter,
    verse: content.verseNumber,
    text: content.plainText.trim(),
  };
}
