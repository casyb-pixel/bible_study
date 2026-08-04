import { HISTORICAL_TEXTS } from "@/lib/historical/texts";
import type { HistoricalText } from "@/lib/historical/types";

export { HISTORICAL_WARNING } from "@/lib/historical/label";
export type {
  CanonicalReference,
  HistoricalSection,
  HistoricalText,
} from "@/lib/historical/types";

export function listHistoricalTexts(): HistoricalText[] {
  return [...HISTORICAL_TEXTS];
}

export function getHistoricalText(id: string): HistoricalText | null {
  return HISTORICAL_TEXTS.find((text) => text.id === id) ?? null;
}

/** Texts related to a specific canonical book and chapter. */
export function getHistoricalTextsForChapter(
  book: string,
  chapter: number,
): HistoricalText[] {
  const normalizedBook = book.trim().toLowerCase();
  return HISTORICAL_TEXTS.filter((text) =>
    text.relatedCanonicalReferences.some(
      (ref) =>
        ref.book.toLowerCase() === normalizedBook && ref.chapter === chapter,
    ),
  );
}
