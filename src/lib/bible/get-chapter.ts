import { buildChapterId, isValidChapter } from "./books";
import { getCachedChapter, saveChapterCache } from "./chapter-cache";
import { fetchChapterFromApiBible } from "./client";
import {
  ChapterFetchError,
  logBibleError,
  toChapterFetchError,
} from "./errors";
import {
  DEFAULT_TRANSLATION,
  resolveTranslation,
  type TranslationCode,
} from "./translations";

export type ChapterVerse = {
  verse: number;
  text: string;
};

export type ChapterText = {
  translation: TranslationCode;
  book: string;
  chapter: number;
  verseCount: number;
  verses: ChapterVerse[];
  plainText: string;
  copyright?: string;
};

function parseVersesFromTextContent(content: string): ChapterVerse[] {
  const parts = content.split(/\[(\d+)\]\s*/);
  const verses: ChapterVerse[] = [];

  for (let index = 1; index < parts.length; index += 2) {
    const verseNumber = Number(parts[index]);
    const text = (parts[index + 1] ?? "").replace(/\s+/g, " ").trim();

    if (!Number.isInteger(verseNumber) || verseNumber < 1 || !text) {
      continue;
    }

    verses.push({
      verse: verseNumber,
      text,
    });
  }

  return verses;
}

async function fetchChapterFromUpstream(
  book: string,
  chapter: number,
  translation: TranslationCode,
): Promise<ChapterText> {
  const chapterId = buildChapterId(book, chapter);
  if (!chapterId) {
    throw new ChapterFetchError(`Invalid chapter: ${book} ${chapter}`, {
      causeName: "InvalidChapter",
      retryable: false,
    });
  }

  try {
    const response = await fetchChapterFromApiBible({
      translation,
      chapterId,
    });

    const verses = parseVersesFromTextContent(response.data.content ?? "");
    if (verses.length === 0) {
      throw new ChapterFetchError(
        `No verses returned for ${book} ${chapter} (${translation}).`,
        { causeName: "EmptyChapter", retryable: true },
      );
    }

    const plainText = verses
      .map((verse) => `${verse.verse}. ${verse.text}`)
      .join("\n");

    return {
      translation,
      book,
      chapter,
      verseCount: verses.length,
      verses,
      plainText,
      copyright: response.data.copyright,
    };
  } catch (error) {
    logBibleError(
      "upstream getChapter failed",
      { book, chapter, translation, chapterId },
      error,
    );
    throw toChapterFetchError(error);
  }
}

export async function getChapter(
  book: string,
  chapter: number,
  translation: TranslationCode | string = DEFAULT_TRANSLATION,
): Promise<ChapterText> {
  const resolvedTranslation = resolveTranslation(translation);

  if (!isValidChapter(book, chapter)) {
    throw new ChapterFetchError(`Invalid chapter: ${book} ${chapter}`, {
      causeName: "InvalidChapter",
      retryable: false,
    });
  }

  try {
    const cached = await getCachedChapter(book, chapter, resolvedTranslation);
    if (cached) {
      return {
        translation: resolvedTranslation,
        book,
        chapter,
        verseCount: cached.verses.length,
        verses: cached.verses,
        plainText: cached.plainText,
      };
    }
  } catch (error) {
    logBibleError(
      "chapter cache read failed; continuing with upstream fetch",
      { book, chapter, translation: resolvedTranslation },
      error,
    );
  }

  const chapterText = await fetchChapterFromUpstream(
    book,
    chapter,
    resolvedTranslation,
  );

  try {
    await saveChapterCache({
      book: chapterText.book,
      chapter: chapterText.chapter,
      translation: chapterText.translation,
      plainText: chapterText.plainText,
      verses: chapterText.verses,
    });
  } catch (error) {
    logBibleError(
      "chapter cache write failed; returning fetched chapter",
      { book, chapter, translation: resolvedTranslation },
      error,
    );
  }

  return chapterText;
}

export { ChapterFetchError };
