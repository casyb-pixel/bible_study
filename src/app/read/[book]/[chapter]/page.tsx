import { notFound } from "next/navigation";

import { isValidChapter, resolveBookName } from "@/lib/bible/books";
import { getChapter } from "@/lib/bible/get-chapter";

type ReadChapterPageProps = {
  params: Promise<{
    book: string;
    chapter: string;
  }>;
};

export default async function ReadChapterPage({
  params,
}: ReadChapterPageProps) {
  const { book: bookParam, chapter: chapterParam } = await params;
  const book = resolveBookName(decodeURIComponent(bookParam));
  const chapter = Number(chapterParam);

  if (
    !book ||
    !Number.isInteger(chapter) ||
    !isValidChapter(book, chapter)
  ) {
    notFound();
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

  return (
    <main className="mx-auto min-h-screen max-w-xl px-6 py-16">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          {chapterText.book} {chapterText.chapter}
        </h1>
        <p className="mt-2 text-sm text-neutral-500">Legacy Standard Bible</p>
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
