import { isValidChapter, resolveBookName } from "@/lib/bible/books";
import { ChapterFetchError, getChapter } from "@/lib/bible/get-chapter";
import { jsonError, jsonOk } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bookParam = searchParams.get("book");
  const chapterParam = searchParams.get("chapter");

  if (!bookParam || bookParam.trim().length === 0) {
    return jsonError("book query parameter is required", 400);
  }

  if (!chapterParam || chapterParam.trim().length === 0) {
    return jsonError("chapter query parameter is required", 400);
  }

  const book = resolveBookName(bookParam);
  if (!book) {
    return jsonError("Unknown book name", 400);
  }

  const chapter = Number(chapterParam);
  if (!Number.isInteger(chapter) || chapter < 1) {
    return jsonError("chapter must be a positive integer", 400);
  }

  if (!isValidChapter(book, chapter)) {
    return jsonError(`Chapter ${chapter} is not valid for ${book}`, 400);
  }

  try {
    const chapterText = await getChapter(book, chapter);

    return jsonOk({
      translation: chapterText.translation,
      book: chapterText.book,
      chapter: chapterText.chapter,
      verseCount: chapterText.verseCount,
      verses: chapterText.verses,
      plainText: chapterText.plainText,
    });
  } catch (error) {
    if (error instanceof ChapterFetchError) {
      return jsonError(error.message, error.retryable ? 502 : 400);
    }

    return jsonError("Unexpected error fetching chapter text", 500);
  }
}
