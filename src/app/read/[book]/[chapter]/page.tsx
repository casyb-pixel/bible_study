import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import {
  getNextChapter,
  getPreviousChapter,
  isValidChapter,
  resolveBookName,
} from "@/lib/bible/books";
import { ChapterReadingView } from "@/components/ChapterReadingView";
import { RelatedHistoricalTexts } from "@/components/RelatedHistoricalTexts";
import { ChapterFetchError, getChapter } from "@/lib/bible/get-chapter";
import { getHistoricalTextsForChapter } from "@/lib/historical";
import { listVerseMarks } from "@/lib/marks";
import { openChapterProgress } from "@/lib/progress";
import { buildUserQuery, firstSearchParam, resolveAppUser } from "@/lib/users";
import type { VerseMarkRecord } from "@/lib/verse-marks";

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
    autostart?: string | string[];
  }>;
};

function buildChapterHref(
  book: string,
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
  const autoStartReading = firstSearchParam(query.autostart) === "1";

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
    chapterText = await getChapter(
      book,
      chapter,
      appUser.preferredTranslation,
    );
  } catch (error) {
    const message =
      error instanceof ChapterFetchError
        ? error.message
        : "The chapter text could not be loaded from the Scripture source.";

    return (
      <PageShell title={`${book} ${chapter}`}>
        <p className="text-base leading-7 text-neutral-700">{message}</p>
        <p className="mt-4 text-sm text-neutral-500">
          If this continues, wait a moment and open the chapter again.
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
    savedPosition = await openChapterProgress({
      userId: appUser.id,
      book: chapterText.book,
      chapter: chapterText.chapter,
    });
  } catch {
    progressError = true;
  }

  const resumeVerse =
    savedPosition &&
    savedPosition.currentBook === chapterText.book &&
    savedPosition.currentChapter === chapterText.chapter
      ? Math.max(1, savedPosition.currentVerse)
      : 1;

  const previous = getPreviousChapter(chapterText.book, chapterText.chapter);
  const next = getNextChapter(chapterText.book, chapterText.chapter);
  const relatedHistorical = getHistoricalTextsForChapter(
    chapterText.book,
    chapterText.chapter,
  );

  let initialMarks: VerseMarkRecord[] = [];
  try {
    initialMarks = await listVerseMarks({
      userId: appUser.id,
      book: chapterText.book,
      chapter: chapterText.chapter,
    });
  } catch {
    initialMarks = [];
  }

  return (
    <main className="mx-auto min-h-screen max-w-xl px-6 py-14 sm:px-8 sm:py-16">
      <ChapterReadingView
        book={chapterText.book}
        chapter={chapterText.chapter}
        translation={chapterText.translation}
        verses={chapterText.verses}
        preferredTtsVoice={appUser.preferredTtsVoice}
        userId={appUser.id}
        username={appUser.username}
        initialVerse={resumeVerse}
        autoStart={autoStartReading}
        initialMarks={initialMarks}
        nextChapter={
          next
            ? {
                book: next.book,
                chapter: next.chapter,
                href: buildChapterHref(
                  next.book,
                  next.chapter,
                  appUser.username,
                ),
              }
            : null
        }
        previousChapter={
          previous
            ? {
                book: previous.book,
                chapter: previous.chapter,
                href: buildChapterHref(
                  previous.book,
                  previous.chapter,
                  appUser.username,
                ),
              }
            : null
        }
        header={
          <>
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
              {chapterText.book} {chapterText.chapter} –{" "}
              {chapterText.translation}
            </h1>
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
          </>
        }
      />

      {chapterText.copyright ? (
        <p className="mt-10 text-xs leading-5 text-neutral-500">
          {chapterText.copyright}
        </p>
      ) : null}

      <RelatedHistoricalTexts
        texts={relatedHistorical}
        username={appUser.username}
        book={chapterText.book}
        chapter={chapterText.chapter}
      />

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
