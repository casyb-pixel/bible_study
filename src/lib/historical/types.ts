export type CanonicalReference = {
  /** Display label, e.g. "Jude 1:14-15". */
  label: string;
  book: string;
  chapter: number;
};

export type HistoricalSection = {
  /** Display index within the research text (not a Scripture verse). */
  index: number;
  text: string;
};

export type HistoricalText = {
  id: string;
  title: string;
  description: string;
  relatedCanonicalReferences: CanonicalReference[];
  sourceNote: string;
  /** True when only a note exists because the writing is lost. */
  isPlaceholder: boolean;
  /** Sections for display / TTS. Empty when isPlaceholder. */
  sections: HistoricalSection[];
};
