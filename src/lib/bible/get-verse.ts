import { getChapter } from "./get-chapter";
import { ChapterFetchError } from "./errors";
import {
  DEFAULT_TRANSLATION,
  type TranslationCode,
} from "./translations";

export type VerseText = {
  translation: TranslationCode;
  book: string;
  chapter: number;
  verse: number;
  text: string;
};

export async function getVerse(
  book: string,
  chapter: number,
  verse: number,
  translation: TranslationCode | string = DEFAULT_TRANSLATION,
): Promise<VerseText> {
  if (!Number.isInteger(verse) || verse < 1) {
    throw new ChapterFetchError(`Invalid verse: ${verse}`, {
      causeName: "InvalidVerse",
      retryable: false,
    });
  }

  const chapterText = await getChapter(book, chapter, translation);
  const content = chapterText.verses.find((item) => item.verse === verse);

  if (!content) {
    throw new ChapterFetchError(
      `Verse not found: ${book} ${chapter}:${verse}`,
      { causeName: "VerseNotFound", retryable: false },
    );
  }

  return {
    translation: chapterText.translation,
    book,
    chapter,
    verse: content.verse,
    text: content.text,
  };
}
