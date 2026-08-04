import Link from "next/link";
import { notFound } from "next/navigation";

import { HistoricalReadAloud } from "@/components/HistoricalReadAloud";
import { HistoricalWarning } from "@/components/HistoricalWarning";
import {
  getAdjacentHistoricalTexts,
  getHistoricalText,
} from "@/lib/historical";
import { buildUserQuery, resolveAppUser } from "@/lib/users";

export const dynamic = "force-dynamic";

type HistoricalDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    user?: string | string[];
    username?: string | string[];
    userId?: string | string[];
  }>;
};

export default async function HistoricalDetailPage({
  params,
  searchParams,
}: HistoricalDetailPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const text = getHistoricalText(decodeURIComponent(id));

  if (!text) {
    notFound();
  }

  const appUser = await resolveAppUser(query);
  const userQuery = appUser ? `?${buildUserQuery(appUser.username)}` : "";
  const preferredTtsVoice = appUser?.preferredTtsVoice ?? "leo";
  const { previous, next } = getAdjacentHistoricalTexts(text.id);

  return (
    <main className="mx-auto min-h-screen max-w-xl bg-neutral-50 px-6 py-14 sm:px-8 sm:py-16">
      <header className="border-b border-neutral-300 pb-6">
        <p className="text-xs uppercase tracking-wide text-neutral-500">
          Research only · Non-canonical
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-800">
          {text.title}
        </h1>
        <HistoricalWarning className="mt-5" />
        <p className="mt-5 text-sm leading-6 text-neutral-700">
          {text.description}
        </p>
        <div className="mt-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">
            Related Scripture
          </p>
          <ul className="mt-2 space-y-1 text-sm text-neutral-700">
            {text.relatedCanonicalReferences.map((ref) => (
              <li key={`${ref.book}-${ref.chapter}-${ref.label}`}>
                {appUser ? (
                  <Link
                    href={`/read/${encodeURIComponent(ref.book)}/${ref.chapter}${userQuery}`}
                    className="underline underline-offset-4 hover:text-neutral-900"
                  >
                    {ref.label}
                  </Link>
                ) : (
                  <span>{ref.label}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-3 text-xs leading-5 text-neutral-500">
          Source note: {text.sourceNote}
        </p>

        {!text.isPlaceholder && text.sections.length > 0 ? (
          <HistoricalReadAloud
            textId={text.id}
            sections={text.sections}
            preferredTtsVoice={preferredTtsVoice}
          />
        ) : null}
      </header>

      <div className="mt-10 space-y-6 text-[1.05rem] leading-8 text-neutral-700">
        {text.isPlaceholder ? (
          <p>
            This writing is lost or not preserved for use here. The biblical
            reference remains in Scripture; this page exists only as a labeled
            historical placeholder.
          </p>
        ) : (
          text.sections.map((section) => (
            <p key={section.index}>
              <span className="mr-2 align-super text-xs text-neutral-500">
                §{section.index}
              </span>
              {section.text}
            </p>
          ))
        )}
      </div>

      <nav className="mt-16 space-y-4 border-t border-neutral-300 pt-8 text-sm text-neutral-700">
        <div className="flex items-center justify-between gap-4">
          {previous ? (
            <Link
              href={`/historical/${encodeURIComponent(previous.id)}${userQuery}`}
              className="underline underline-offset-4 hover:text-neutral-900"
            >
              Previous: {previous.title}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={`/historical/${encodeURIComponent(next.id)}${userQuery}`}
              className="text-right underline underline-offset-4 hover:text-neutral-900"
            >
              Next: {next.title}
            </Link>
          ) : (
            <span />
          )}
        </div>
        <p>
          <Link
            href={`/historical${userQuery}`}
            className="underline underline-offset-4 hover:text-neutral-900"
          >
            All historical texts
          </Link>
        </p>
        <p>
          <Link
            href={appUser ? `/?${buildUserQuery(appUser.username)}` : "/"}
            className="underline underline-offset-4 hover:text-neutral-900"
          >
            Return home
          </Link>
        </p>
      </nav>
    </main>
  );
}
