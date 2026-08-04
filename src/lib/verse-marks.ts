export const VERSE_MARK_TYPES = ["highlight", "note"] as const;
export type VerseMarkType = (typeof VERSE_MARK_TYPES)[number];

export const VERSE_MARK_COLORS = ["yellow", "green", "blue"] as const;
export type VerseMarkColor = (typeof VERSE_MARK_COLORS)[number];

export const MAX_NOTE_LENGTH = 400;

export type VerseMarkRecord = {
  id: string;
  userId: string;
  book: string;
  chapter: number;
  verse: number;
  type: VerseMarkType;
  noteText: string | null;
  color: VerseMarkColor | null;
  createdAt: string;
  updatedAt: string;
};

export function isVerseMarkType(value: unknown): value is VerseMarkType {
  return (
    typeof value === "string" &&
    (VERSE_MARK_TYPES as readonly string[]).includes(value)
  );
}

export function isVerseMarkColor(value: unknown): value is VerseMarkColor {
  return (
    typeof value === "string" &&
    (VERSE_MARK_COLORS as readonly string[]).includes(value)
  );
}

/** Soft, restrained highlight backgrounds. */
export const HIGHLIGHT_BG_CLASS: Record<VerseMarkColor, string> = {
  yellow: "bg-amber-50",
  green: "bg-emerald-50",
  blue: "bg-sky-50",
};

export const HIGHLIGHT_SWATCH_CLASS: Record<VerseMarkColor, string> = {
  yellow: "bg-amber-100 ring-amber-200",
  green: "bg-emerald-100 ring-emerald-200",
  blue: "bg-sky-100 ring-sky-200",
};
