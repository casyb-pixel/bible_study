import Link from "next/link";
import { notFound } from "next/navigation";

import { HistoricalReadAloud } from "@/components/HistoricalReadAloud";
import { HistoricalWarning } from "@/components/HistoricalWarning";
import { getHistoricalText } from "@/lib/historical";
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
  const preferredVoice = appUser?.preferredVoice ?? "male";

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
        <p className="mt-3 text-sm text-neutral-600">
          Related Scripture references:{" "}
          {text.relatedCanonicalReferences.map((ref) => ref.label).join("; ")}
        </p>
        <p className="mt-2 text-xs leading-5 text-neutral-500">
          Source note: {text.sourceNote}
        </p>

        {!text.isPlaceholder && text.sections.length > 0 ? (
          <HistoricalReadAloud
            textId={text.id}
            sections={text.sections}
            preferredVoice={preferredVoice}
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

      <nav className="mt-16 space-y-3 border-t border-neutral-300 pt-8 text-sm text-neutral-700">
        <p>
          <Link
            href={`/historical${userQuery}`}
            className="underline underline-offset-4 hover:text-neutral-900"
          >
            All historical texts
          </Link>
        </p>
        {text.relatedCanonicalReferences[0] ? (
          <p>
            <Link
              href={`/read/${encodeURIComponent(text.relatedCanonicalReferences[0].book)}/${text.relatedCanonicalReferences[0].chapter}${userQuery}`}
              className="underline underline-offset-4 hover:text-neutral-900"
            >
              Return to{" "}
              {text.relatedCanonicalReferences[0].book}{" "}
              {text.relatedCanonicalReferences[0].chapter}
            </Link>
          </p>
        ) : null}
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
