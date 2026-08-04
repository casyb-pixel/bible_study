"use client";

import { ReadAloudControls } from "@/components/ReadAloudControls";
import type { GrokTtsVoiceId } from "@/lib/speech/grok-voices";

type Section = {
  index: number;
  text: string;
};

type HistoricalReadAloudProps = {
  textId: string;
  sections: Section[];
  preferredTtsVoice: GrokTtsVoiceId | string;
};

/**
 * TTS for historical research text only.
 * Intentionally omits listening, clarification, and chapter-end completion.
 */
export function HistoricalReadAloud({
  textId,
  sections,
  preferredTtsVoice,
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
      preferredTtsVoice={preferredTtsVoice}
    />
  );
}
