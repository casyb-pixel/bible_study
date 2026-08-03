import Link from "next/link";

import { getProgress, resolveUserId } from "@/lib/progress";

type HomePageProps = {
  searchParams: Promise<{
    userId?: string | string[];
  }>;
};

function buildReadHref(
  book: string,
  chapter: number,
  userIdParam?: string | string[],
): string {
  const path = `/read/${encodeURIComponent(book)}/${chapter}`;
  const value = Array.isArray(userIdParam) ? userIdParam[0] : userIdParam;

  if (value && value.trim().length > 0) {
    return `${path}?userId=${encodeURIComponent(value)}`;
  }

  return path;
}

export default async function Home({ searchParams }: HomePageProps) {
  const { userId: userIdParam } = await searchParams;
  const userId = resolveUserId(userIdParam);

  let progress = null;
  if (userId) {
    try {
      progress = await getProgress(userId);
    } catch {
      progress = null;
    }
  }

  const resumeHref = progress
    ? buildReadHref(
        progress.currentBook,
        progress.currentChapter,
        userIdParam,
      )
    : buildReadHref("Genesis", 1, userIdParam);

  const resumeLabel = progress
    ? `Resume ${progress.currentBook} ${progress.currentChapter}:${progress.currentVerse}`
    : "Begin at Genesis 1";

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
        Bible Study
      </h1>
      <p className="mt-4 text-base leading-relaxed text-neutral-700">
        A hands-free study application for reading the Legacy Standard Bible
        and the writings the Bible itself references. Progress is tracked so
        study can pause and resume at a precise place.
      </p>
      <p className="mt-4 text-base leading-relaxed text-neutral-700">
        This is a private family study tool. Scripture alone is authoritative.
        Non-canonical writings, when present, are labeled as historical only.
      </p>

      {!userId ? (
        <p className="mt-8 text-sm text-neutral-500">
          userId must be a valid UUID when provided.
        </p>
      ) : (
        <p className="mt-8">
          <Link
            href={resumeHref}
            className="text-base text-neutral-800 underline underline-offset-4 hover:text-neutral-950"
          >
            {resumeLabel}
          </Link>
        </p>
      )}
    </main>
  );
}
