import { BIBLE_STRUCTURE, BOOK_NUMBERS, BookName } from "lsbible";

/** Canonical book names in LSB order (66 books), aligned with BookName. */
export const CANONICAL_BOOK_NAMES: readonly BookName[] = Object.values(
  BookName,
) as BookName[];

export function resolveBookName(input: string): BookName | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  const direct = CANONICAL_BOOK_NAMES.find(
    (name) => name.toLowerCase() === trimmed.toLowerCase(),
  );
  if (direct) {
    return direct;
  }

  const bookNumber = BOOK_NUMBERS[trimmed.toLowerCase()];
  if (bookNumber === undefined) {
    return null;
  }

  const info = BIBLE_STRUCTURE[bookNumber];
  if (!info) {
    return null;
  }

  return (
    CANONICAL_BOOK_NAMES.find(
      (name) => name.toLowerCase() === info.name.toLowerCase(),
    ) ?? null
  );
}

export function getBookChapterCount(book: BookName): number {
  const bookNumber = BOOK_NUMBERS[book.toLowerCase()];
  if (bookNumber === undefined) {
    throw new Error(`Unknown book: ${book}`);
  }

  return BIBLE_STRUCTURE[bookNumber].chapters;
}

export function isValidChapter(book: BookName, chapter: number): boolean {
  return (
    Number.isInteger(chapter) &&
    chapter >= 1 &&
    chapter <= getBookChapterCount(book)
  );
}
