import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import type { BookName } from "lsbible";

import {
  getNextChapter,
  getPreviousChapter,
  isValidChapter,
  resolveBookName,
} from "@/lib/bible/books";
import { ChapterFetchError, getChapter } from "@/lib/bible/get-chapter";
import { upsertProgress } from "@/lib/progress";
import { buildUserQuery, resolveAppUser } from "@/lib/users";

export const dynamic = "force-dynamic";

type ReadChapterPageProps = {
  params: Promise<{
    book: string;
    chapter: string;
  }>;
  searchParams: Promise<{
    user?: string | string[];
    username?: string | string[];
    userId?: string | string[];
  }>;
};

function buildChapterHref(
  book: BookName,
  chapter: number,
  username: string,
): string {
  return `/read/${encodeURIComponent(book)}/${chapter}?${buildUserQuery(username)}`;
}

function PageShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto min-h-screen max-w-xl px-6 py-14 sm:px-8 sm:py-16">
      <header className="border-b border-neutral-200 pb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
          {title}
        </h1>
      </header>
      <div className="mt-8">{children}</div>
    </main>
  );
}

export default async function ReadChapterPage({
  params,
  searchParams,
}: ReadChapterPageProps) {
  const { book: bookParam, chapter: chapterParam } = await params;
  const query = await searchParams;

  const book = resolveBookName(decodeURIComponent(bookParam));
  const chapter = Number(chapterParam);
  const appUser = await resolveAppUser(query);

  if (
    !book ||
    !Number.isInteger(chapter) ||
    !isValidChapter(book, chapter)
  ) {
    notFound();
  }

  if (!appUser) {
    return (
      <PageShell title={`${book} ${chapter}`}>
        <p className="text-base leading-7 text-neutral-700">
          Choose a user from the home page before reading. Use a username such
          as <span className="font-medium">casyb</span>.
        </p>
        <p className="mt-8">
          <Link
            href="/"
            className="text-sm text-neutral-800 underline underline-offset-4 hover:text-neutral-950"
          >
            Return home
          </Link>
        </p>
      </PageShell>
    );
  }

  let chapterText;
  try {
    chapterText = await getChapter(book, chapter);
  } catch (error) {
    const message =
      error instanceof ChapterFetchError
        ? error.message
        : "The chapter text could not be loaded from the Scripture source.";

    return (
      <PageShell title={`${book} ${chapter}`}>
        <p className="text-base leading-7 text-neutral-700">{message}</p>
        <p className="mt-4 text-sm text-neutral-500">
          {error instanceof ChapterFetchError &&
          /429|rate-limiting|build ID/i.test(error.message)
            ? "This is usually a temporary limit from the Scripture source. After LSB_BUILD_ID is set on the server, chapter loading should be stable."
            : "If this continues, wait a moment and open the chapter again."}
        </p>
        <p className="mt-8">
          <Link
            href={buildChapterHref(book, chapter, appUser.username)}
            className="text-sm text-neutral-800 underline underline-offset-4 hover:text-neutral-950"
          >
            Try again
          </Link>
        </p>
      </PageShell>
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
      userId: appUser.id,
      book: chapterText.book,
      chapter: chapterText.chapter,
      verse: 1,
    });
  } catch {
    progressError = true;
  }

  const previous = getPreviousChapter(chapterText.book, chapterText.chapter);
  const next = getNextChapter(chapterText.book, chapterText.chapter);

  return (
    <main className="mx-auto min-h-screen max-w-xl px-6 py-14 sm:px-8 sm:py-16">
      <header className="border-b border-neutral-200 pb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
          {chapterText.book} {chapterText.chapter}
        </h1>
        <p className="mt-3 text-sm tracking-wide text-neutral-500">
          Legacy Standard Bible
        </p>
        <p className="mt-2 text-sm text-neutral-500">
          Reading as {appUser.username}
        </p>
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

      <div className="mt-10 space-y-6 text-[1.05rem] leading-8 text-neutral-800">
        {chapterText.verses.map((verse) => (
          <p key={verse.verse}>
            <span className="mr-2 align-super text-xs text-neutral-500">
              {verse.verse}
            </span>
            {verse.text}
          </p>
        ))}
      </div>

      <nav className="mt-16 flex items-center justify-between gap-6 border-t border-neutral-200 pt-8 text-sm text-neutral-700">
        {previous ? (
          <Link
            href={buildChapterHref(
              previous.book,
              previous.chapter,
              appUser.username,
            )}
            className="hover:text-neutral-900"
          >
            Previous chapter
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={buildChapterHref(next.book, next.chapter, appUser.username)}
            className="hover:text-neutral-900"
          >
            Next chapter
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </main>
  );
}
