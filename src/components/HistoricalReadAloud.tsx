"use client";

import { ReadAloudControls } from "@/components/ReadAloudControls";
import type { PreferredVoiceGender } from "@/lib/speech/select-voice";

type Section = {
  index: number;
  text: string;
};

type HistoricalReadAloudProps = {
  textId: string;
  sections: Section[];
  preferredVoice: PreferredVoiceGender;
};

/**
 * TTS for historical research text only.
 * Intentionally omits listening, clarification, and chapter-end completion.
 */
export function HistoricalReadAloud({
  textId,
  sections,
  preferredVoice,
}: HistoricalReadAloudProps) {
  if (sections.length === 0) {
    return null;
  }

  const verses = sections.map((section) => ({
    verse: section.index,
    text: section.text,
  }));

  return (
    <ReadAloudControls
      book={`historical:${textId}`}
      chapter={1}
      verses={verses}
      preferredVoice={preferredVoice}
    />
  );
}
