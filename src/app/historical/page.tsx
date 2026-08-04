import Link from "next/link";

import { HistoricalWarning } from "@/components/HistoricalWarning";
import { listHistoricalTexts } from "@/lib/historical";
import { buildUserQuery, resolveAppUser } from "@/lib/users";

export const dynamic = "force-dynamic";

type HistoricalIndexPageProps = {
  searchParams: Promise<{
    user?: string | string[];
    username?: string | string[];
    userId?: string | string[];
  }>;
};

export default async function HistoricalIndexPage({
  searchParams,
}: HistoricalIndexPageProps) {
  const query = await searchParams;
  const appUser = await resolveAppUser(query);
  const texts = listHistoricalTexts();
  const userQuery = appUser ? `?${buildUserQuery(appUser.username)}` : "";

  return (
    <main className="mx-auto min-h-screen max-w-xl bg-neutral-50 px-6 py-14 sm:px-8 sm:py-16">
      <header className="border-b border-neutral-300 pb-6">
        <p className="text-xs uppercase tracking-wide text-neutral-500">
          Research only
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900">
          Historical texts
        </h1>
        <p className="mt-3 text-sm leading-6 text-neutral-700">
          Writings the Bible references or quotes, and related ancient
          materials for deep research. These are not Scripture.
        </p>
        <HistoricalWarning className="mt-5" />
      </header>

      <ul className="mt-10 space-y-8">
        {texts.map((text) => (
          <li key={text.id} className="border-t border-neutral-300 pt-6">
            <h2 className="text-lg font-medium text-neutral-900">
              <Link
                href={`/historical/${encodeURIComponent(text.id)}${userQuery}`}
                className="underline-offset-4 hover:underline"
              >
                {text.title}
              </Link>
            </h2>
            <p className="mt-2 text-sm leading-6 text-neutral-700">
              {text.description}
            </p>
            <p className="mt-2 text-xs text-neutral-500">
              Related:{" "}
              {text.relatedCanonicalReferences
                .map((ref) => ref.label)
                .join("; ")}
            </p>
            {text.isPlaceholder ? (
              <p className="mt-2 text-xs text-neutral-500">
                Lost work — placeholder only
              </p>
            ) : null}
          </li>
        ))}
      </ul>

      <p className="mt-12 text-sm text-neutral-600">
        <Link
          href={appUser ? `/?${buildUserQuery(appUser.username)}` : "/"}
          className="underline underline-offset-4 hover:text-neutral-900"
        >
          Return home
        </Link>
      </p>
    </main>
  );
}
