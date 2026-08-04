import Link from "next/link";

import { HistoricalWarning } from "@/components/HistoricalWarning";
import type { HistoricalText } from "@/lib/historical";
import { buildUserQuery } from "@/lib/user-identity";

type RelatedHistoricalTextsProps = {
  texts: HistoricalText[];
  username: string;
  book: string;
  chapter: number;
};

export function RelatedHistoricalTexts({
  texts,
  username,
  book,
  chapter,
}: RelatedHistoricalTextsProps) {
  if (texts.length === 0) {
    return null;
  }

  const userQuery = `?${buildUserQuery(username)}`;
  const normalizedBook = book.trim().toLowerCase();

  return (
    <aside className="mt-10 border border-neutral-300 bg-neutral-50 px-4 py-4">
      <p className="text-sm font-medium text-neutral-800">
        Related historical text (non-canonical)
      </p>
      <HistoricalWarning className="mt-3" />
      <ul className="mt-4 space-y-3 text-sm text-neutral-700">
        {texts.map((text) => {
          const labelsHere = text.relatedCanonicalReferences
            .filter(
              (ref) =>
                ref.book.toLowerCase() === normalizedBook &&
                ref.chapter === chapter,
            )
            .map((ref) => ref.label);

          return (
            <li key={text.id}>
              <Link
                href={`/historical/${encodeURIComponent(text.id)}${userQuery}`}
                className="underline underline-offset-4 hover:text-neutral-900"
              >
                {text.title}
              </Link>
              {labelsHere.length > 0 ? (
                <p className="mt-1 text-xs text-neutral-500">
                  Related to: {labelsHere.join("; ")}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
