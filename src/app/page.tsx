import Link from "next/link";

import { ExistingUserForm } from "@/components/ExistingUserForm";
import { getProgress, resolveUserId } from "@/lib/progress";
import { isUuid } from "@/lib/api";

type HomePageProps = {
  searchParams: Promise<{
    userId?: string | string[];
  }>;
};

function firstParam(value?: string | string[]): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function buildReadHref(
  book: string,
  chapter: number,
  userId: string,
): string {
  return `/read/${encodeURIComponent(book)}/${chapter}?userId=${encodeURIComponent(userId)}`;
}

export default async function Home({ searchParams }: HomePageProps) {
  const { userId: userIdParam } = await searchParams;
  const rawUserId = firstParam(userIdParam)?.trim();
  const hasExplicitUserId = Boolean(rawUserId);

  if (!hasExplicitUserId) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16 sm:px-8">
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
            Bible Study
          </h1>
          <p className="text-base leading-7 text-neutral-700">
            A private family tool for reading the Legacy Standard Bible. Scripture
            alone is authoritative. Non-canonical writings, when present, are
            labeled as historical only.
          </p>
        </header>

        <section className="mt-12 border-t border-neutral-200 pt-10">
          <h2 className="text-lg font-medium text-neutral-900">Who is studying?</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Choose how to continue. Progress is stored by user ID.
          </p>

          <div className="mt-6 space-y-8">
            <div>
              <p className="text-sm text-neutral-700">New reader</p>
              <p className="mt-3">
                <Link
                  href="/new-user"
                  className="inline-block border border-neutral-800 px-4 py-2 text-sm text-neutral-900 hover:bg-neutral-100"
                >
                  Create a new user
                </Link>
              </p>
            </div>

            <div>
              <p className="text-sm text-neutral-700">Returning reader</p>
              <ExistingUserForm />
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (!isUuid(rawUserId)) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16 sm:px-8">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
          Bible Study
        </h1>
        <p className="mt-6 text-base leading-7 text-neutral-700">
          The provided user ID is not valid.
        </p>
        <p className="mt-8">
          <Link
            href="/"
            className="text-sm text-neutral-800 underline underline-offset-4 hover:text-neutral-950"
          >
            Return home
          </Link>
        </p>
      </main>
    );
  }

  const userId = resolveUserId(rawUserId);
  if (!userId) {
    return null;
  }

  let progress = null;
  try {
    progress = await getProgress(userId);
  } catch {
    progress = null;
  }

  const resumeHref = progress
    ? buildReadHref(progress.currentBook, progress.currentChapter, userId)
    : buildReadHref("Genesis", 1, userId);

  const resumeLabel = progress
    ? `Resume ${progress.currentBook} ${progress.currentChapter}:${progress.currentVerse}`
    : "Begin at Genesis 1";

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16 sm:px-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
          Bible Study
        </h1>
        <p className="text-base leading-7 text-neutral-700">
          A private family tool for reading the Legacy Standard Bible. Scripture
          alone is authoritative.
        </p>
      </header>

      <section className="mt-12 border-t border-neutral-200 pt-10">
        <h2 className="text-lg font-medium text-neutral-900">Current user</h2>
        <p className="mt-3 break-all font-mono text-sm text-neutral-800">
          {userId}
        </p>

        <p className="mt-8">
          <Link
            href={resumeHref}
            className="inline-block border border-neutral-800 px-4 py-2.5 text-base text-neutral-900 hover:bg-neutral-100"
          >
            {resumeLabel}
          </Link>
        </p>

        <p className="mt-6 text-sm text-neutral-600">
          <Link
            href="/"
            className="underline underline-offset-4 hover:text-neutral-900"
          >
            Choose a different user
          </Link>
        </p>
      </section>
    </main>
  );
}
