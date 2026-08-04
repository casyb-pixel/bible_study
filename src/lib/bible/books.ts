export type BookName = string;

type BookDefinition = {
  name: string;
  usfm: string;
  chapters: number;
};

/** Protestant canon, 66 books, with API.Bible / USFM book codes. */
const BOOKS: readonly BookDefinition[] = [
  { name: "Genesis", usfm: "GEN", chapters: 50 },
  { name: "Exodus", usfm: "EXO", chapters: 40 },
  { name: "Leviticus", usfm: "LEV", chapters: 27 },
  { name: "Numbers", usfm: "NUM", chapters: 36 },
  { name: "Deuteronomy", usfm: "DEU", chapters: 34 },
  { name: "Joshua", usfm: "JOS", chapters: 24 },
  { name: "Judges", usfm: "JDG", chapters: 21 },
  { name: "Ruth", usfm: "RUT", chapters: 4 },
  { name: "1 Samuel", usfm: "1SA", chapters: 31 },
  { name: "2 Samuel", usfm: "2SA", chapters: 24 },
  { name: "1 Kings", usfm: "1KI", chapters: 22 },
  { name: "2 Kings", usfm: "2KI", chapters: 25 },
  { name: "1 Chronicles", usfm: "1CH", chapters: 29 },
  { name: "2 Chronicles", usfm: "2CH", chapters: 36 },
  { name: "Ezra", usfm: "EZR", chapters: 10 },
  { name: "Nehemiah", usfm: "NEH", chapters: 13 },
  { name: "Esther", usfm: "EST", chapters: 10 },
  { name: "Job", usfm: "JOB", chapters: 42 },
  { name: "Psalms", usfm: "PSA", chapters: 150 },
  { name: "Proverbs", usfm: "PRO", chapters: 31 },
  { name: "Ecclesiastes", usfm: "ECC", chapters: 12 },
  { name: "Song of Songs", usfm: "SNG", chapters: 8 },
  { name: "Isaiah", usfm: "ISA", chapters: 66 },
  { name: "Jeremiah", usfm: "JER", chapters: 52 },
  { name: "Lamentations", usfm: "LAM", chapters: 5 },
  { name: "Ezekiel", usfm: "EZK", chapters: 48 },
  { name: "Daniel", usfm: "DAN", chapters: 12 },
  { name: "Hosea", usfm: "HOS", chapters: 14 },
  { name: "Joel", usfm: "JOL", chapters: 3 },
  { name: "Amos", usfm: "AMO", chapters: 9 },
  { name: "Obadiah", usfm: "OBA", chapters: 1 },
  { name: "Jonah", usfm: "JON", chapters: 4 },
  { name: "Micah", usfm: "MIC", chapters: 7 },
  { name: "Nahum", usfm: "NAM", chapters: 3 },
  { name: "Habakkuk", usfm: "HAB", chapters: 3 },
  { name: "Zephaniah", usfm: "ZEP", chapters: 3 },
  { name: "Haggai", usfm: "HAG", chapters: 2 },
  { name: "Zechariah", usfm: "ZEC", chapters: 14 },
  { name: "Malachi", usfm: "MAL", chapters: 4 },
  { name: "Matthew", usfm: "MAT", chapters: 28 },
  { name: "Mark", usfm: "MRK", chapters: 16 },
  { name: "Luke", usfm: "LUK", chapters: 24 },
  { name: "John", usfm: "JHN", chapters: 21 },
  { name: "Acts", usfm: "ACT", chapters: 28 },
  { name: "Romans", usfm: "ROM", chapters: 16 },
  { name: "1 Corinthians", usfm: "1CO", chapters: 16 },
  { name: "2 Corinthians", usfm: "2CO", chapters: 13 },
  { name: "Galatians", usfm: "GAL", chapters: 6 },
  { name: "Ephesians", usfm: "EPH", chapters: 6 },
  { name: "Philippians", usfm: "PHP", chapters: 4 },
  { name: "Colossians", usfm: "COL", chapters: 4 },
  { name: "1 Thessalonians", usfm: "1TH", chapters: 5 },
  { name: "2 Thessalonians", usfm: "2TH", chapters: 3 },
  { name: "1 Timothy", usfm: "1TI", chapters: 6 },
  { name: "2 Timothy", usfm: "2TI", chapters: 4 },
  { name: "Titus", usfm: "TIT", chapters: 3 },
  { name: "Philemon", usfm: "PHM", chapters: 1 },
  { name: "Hebrews", usfm: "HEB", chapters: 13 },
  { name: "James", usfm: "JAS", chapters: 5 },
  { name: "1 Peter", usfm: "1PE", chapters: 5 },
  { name: "2 Peter", usfm: "2PE", chapters: 3 },
  { name: "1 John", usfm: "1JN", chapters: 5 },
  { name: "2 John", usfm: "2JN", chapters: 1 },
  { name: "3 John", usfm: "3JN", chapters: 1 },
  { name: "Jude", usfm: "JUD", chapters: 1 },
  { name: "Revelation", usfm: "REV", chapters: 22 },
] as const;

export const CANONICAL_BOOK_NAMES: readonly string[] = BOOKS.map(
  (book) => book.name,
);

const BOOKS_BY_NAME = new Map(
  BOOKS.map((book) => [book.name.toLowerCase(), book]),
);

export function resolveBookName(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  const direct = BOOKS_BY_NAME.get(trimmed.toLowerCase());
  if (direct) {
    return direct.name;
  }

  return null;
}

export function getBookUsfm(book: string): string | null {
  const resolved = resolveBookName(book);
  if (!resolved) {
    return null;
  }
  return BOOKS_BY_NAME.get(resolved.toLowerCase())?.usfm ?? null;
}

export function getBookChapterCount(book: string): number {
  const resolved = resolveBookName(book);
  if (!resolved) {
    throw new Error(`Unknown book: ${book}`);
  }
  return BOOKS_BY_NAME.get(resolved.toLowerCase())!.chapters;
}

export function isValidChapter(book: string, chapter: number): boolean {
  const resolved = resolveBookName(book);
  if (!resolved) {
    return false;
  }
  return (
    Number.isInteger(chapter) &&
    chapter >= 1 &&
    chapter <= getBookChapterCount(resolved)
  );
}

export type ChapterRef = {
  book: string;
  chapter: number;
};

export function getPreviousChapter(
  book: string,
  chapter: number,
): ChapterRef | null {
  if (!isValidChapter(book, chapter)) {
    return null;
  }

  if (chapter > 1) {
    return { book, chapter: chapter - 1 };
  }

  const bookIndex = CANONICAL_BOOK_NAMES.indexOf(book);
  if (bookIndex <= 0) {
    return null;
  }

  const previousBook = CANONICAL_BOOK_NAMES[bookIndex - 1];
  return {
    book: previousBook,
    chapter: getBookChapterCount(previousBook),
  };
}

export function getNextChapter(
  book: string,
  chapter: number,
): ChapterRef | null {
  if (!isValidChapter(book, chapter)) {
    return null;
  }

  if (chapter < getBookChapterCount(book)) {
    return { book, chapter: chapter + 1 };
  }

  const bookIndex = CANONICAL_BOOK_NAMES.indexOf(book);
  if (bookIndex < 0 || bookIndex >= CANONICAL_BOOK_NAMES.length - 1) {
    return null;
  }

  return {
    book: CANONICAL_BOOK_NAMES[bookIndex + 1],
    chapter: 1,
  };
}

export function buildChapterId(book: string, chapter: number): string | null {
  const usfm = getBookUsfm(book);
  if (!usfm || !isValidChapter(book, chapter)) {
    return null;
  }
  return `${usfm}.${chapter}`;
}
