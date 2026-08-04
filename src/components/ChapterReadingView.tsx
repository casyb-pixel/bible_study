"use client";

import { useState, type ReactNode } from "react";

import { ChapterVerseList } from "@/components/ChapterVerseList";
import { ChapterVoicePanel } from "@/components/ChapterVoicePanel";
import { JumpToChapterForm } from "@/components/JumpToChapterForm";
import type { TranslationCode } from "@/lib/bible/translations";
import type { GrokTtsVoiceId } from "@/lib/speech/grok-voices";
import type { VerseMarkRecord } from "@/lib/verse-marks";

type Verse = {
  verse: number;
  text: string;
};

type ChapterLink = {
  book: string;
  chapter: number;
  href: string;
};

type ChapterReadingViewProps = {
  book: string;
  chapter: number;
  translation: TranslationCode;
  verses: Verse[];
  preferredTtsVoice: GrokTtsVoiceId | string;
  userId: string;
  username: string;
  nextChapter: ChapterLink | null;
  previousChapter: ChapterLink | null;
  initialMarks: VerseMarkRecord[];
  header: ReactNode;
};

export function ChapterReadingView({
  book,
  chapter,
  translation,
  verses,
  preferredTtsVoice,
  userId,
  username,
  nextChapter,
  previousChapter,
  initialMarks,
  header,
}: ChapterReadingViewProps) {
  const [activeVerse, setActiveVerse] = useState<number | null>(null);

  return (
    <div className="pb-28">
      <header className="border-b border-neutral-200 pb-6">
        {header}

        <ChapterVoicePanel
          book={book}
          chapter={chapter}
          translation={translation}
          verses={verses}
          preferredTtsVoice={preferredTtsVoice}
          userId={userId}
          nextChapter={nextChapter}
          previousChapter={previousChapter}
          onReadingVerseChange={setActiveVerse}
        />

        <div className="mt-6">
          <JumpToChapterForm
            username={username}
            initialBook={book}
            initialChapter={chapter}
          />
        </div>
      </header>

      <ChapterVerseList
        verses={verses}
        book={book}
        chapter={chapter}
        userId={userId}
        initialMarks={initialMarks}
        activeVerse={activeVerse}
      />
    </div>
  );
}
