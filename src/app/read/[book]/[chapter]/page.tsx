import { notFound } from "next/navigation";

import { isValidChapter, resolveBookName } from "@/lib/bible/books";
import { getChapter } from "@/lib/bible/get-chapter";
import { resolveUserId, upsertProgress } from "@/lib/progress";

type ReadChapterPageProps = {
  params: Promise<{
    book: string;
    chapter: string;
  }>;
  searchParams: Promise<{
    userId?: string | string[];
  }>;
};

export default async function ReadChapterPage({
  params,
  searchParams,
}: ReadChapterPageProps) {
  const { book: bookParam, chapter: chapterParam } = await params;
  const { userId: userIdParam } = await searchParams;

  const book = resolveBookName(decodeURIComponent(bookParam));
  const chapter = Number(chapterParam);
  const userId = resolveUserId(userIdParam);

  if (
    !book ||
    !Number.isInteger(chapter) ||
    !isValidChapter(book, chapter)
  ) {
    notFound();
  }

  if (!userId) {
    return (
      <main className="mx-auto min-h-screen max-w-xl px-6 py-16">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          {book} {chapter}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-neutral-700">
          userId must be a valid UUID when provided.
        </p>
      </main>
    );
  }

  let chapterText;
  try {
    chapterText = await getChapter(book, chapter);
  } catch {
    return (
      <main className="mx-auto min-h-screen max-w-xl px-6 py-16">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          {book} {chapter}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-neutral-700">
          The chapter text could not be loaded.
        </p>
      </main>
    );
  }

  let savedPosition: {
    currentBook: string;
    currentChapter: number;
    currentVerse: number;
  } | null = null;
  let progressError = false;

  try {
    savedPosition = await upsertProgress({
      userId,
      book: chapterText.book,
      chapter: chapterText.chapter,
      verse: 1,
    });
  } catch {
    progressError = true;
  }

  return (
    <main className="mx-auto min-h-screen max-w-xl px-6 py-16">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          {chapterText.book} {chapterText.chapter}
        </h1>
        <p className="mt-2 text-sm text-neutral-500">Legacy Standard Bible</p>
        {savedPosition ? (
          <p className="mt-2 text-sm text-neutral-500">
            Saved position: {savedPosition.currentBook}{" "}
            {savedPosition.currentChapter}:{savedPosition.currentVerse}
          </p>
        ) : null}
        {progressError ? (
          <p className="mt-2 text-sm text-neutral-500">
            Position could not be saved.
          </p>
        ) : null}
      </header>

      <div className="mt-10 space-y-5 text-base leading-relaxed text-neutral-800">
        {chapterText.verses.map((verse) => (
          <p key={verse.verse}>
            <span className="mr-2 text-sm text-neutral-500">{verse.verse}</span>
            {verse.text}
          </p>
        ))}
      </div>
    </main>
  );
}
