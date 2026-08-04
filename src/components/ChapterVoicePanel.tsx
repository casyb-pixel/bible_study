"use client";

import { useCallback, useState } from "react";

import { ListeningControls } from "@/components/ListeningControls";
import { ReadAloudControls } from "@/components/ReadAloudControls";
import type { PreferredVoiceGender } from "@/lib/speech/select-voice";

type Verse = {
  verse: number;
  text: string;
};

type ChapterVoicePanelProps = {
  book: string;
  chapter: number;
  verses: Verse[];
  preferredVoice: PreferredVoiceGender;
};

export function ChapterVoicePanel({
  book,
  chapter,
  verses,
  preferredVoice,
}: ChapterVoicePanelProps) {
  const [pauseRequestId, setPauseRequestId] = useState(0);

  const handleSpeechDetected = useCallback(() => {
    setPauseRequestId((value) => value + 1);
  }, []);

  return (
    <div>
      <ReadAloudControls
        book={book}
        chapter={chapter}
        verses={verses}
        preferredVoice={preferredVoice}
        pauseRequestId={pauseRequestId}
      />
      <ListeningControls onSpeechDetected={handleSpeechDetected} />
    </div>
  );
}
