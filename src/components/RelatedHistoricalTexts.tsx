import Link from "next/link";

import { HistoricalWarning } from "@/components/HistoricalWarning";
import type { HistoricalText } from "@/lib/historical";
import { buildUserQuery } from "@/lib/user-identity";

type RelatedHistoricalTextsProps = {
  texts: HistoricalText[];
  username: string;
};

export function RelatedHistoricalTexts({
  texts,
  username,
}: RelatedHistoricalTextsProps) {
  if (texts.length === 0) {
    return null;
  }

  const userQuery = `?${buildUserQuery(username)}`;

  return (
    <aside className="mt-10 border border-neutral-300 bg-neutral-50 px-4 py-4">
      <p className="text-sm font-medium text-neutral-800">
        Related historical text (non-canonical)
      </p>
      <HistoricalWarning className="mt-3" />
      <ul className="mt-4 space-y-2 text-sm text-neutral-700">
        {texts.map((text) => (
          <li key={text.id}>
            <Link
              href={`/historical/${encodeURIComponent(text.id)}${userQuery}`}
              className="underline underline-offset-4 hover:text-neutral-900"
            >
              View related historical text (non-canonical): {text.title}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
