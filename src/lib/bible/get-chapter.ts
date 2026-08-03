import type { BookName } from "lsbible";

import { isValidChapter } from "./books";
import { lsbibleClient } from "./client";

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

export async function getChapter(
  book: BookName,
  chapter: number,
): Promise<ChapterText> {
  if (!isValidChapter(book, chapter)) {
    throw new Error(`Invalid chapter: ${book} ${chapter}`);
  }

  const passage = await lsbibleClient.getChapter(book, chapter);

  const verses: ChapterVerse[] = passage.verses.map((verse) => ({
    verse: verse.verseNumber,
    text: verse.plainText.trim(),
  }));

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
}
