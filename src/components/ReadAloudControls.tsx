"use client";

import { useEffect, useRef, useState } from "react";

import {
  clearGrokPrefetch,
  isGrokSpeechPaused,
  pauseGrokSpeech,
  prefetchGrokSpeech,
  resumeGrokSpeech,
  speakWithGrok,
  stopGrokSpeech,
} from "@/lib/speech/grok-speak";
import {
  getGrokTtsVoice,
  type GrokTtsVoiceId,
} from "@/lib/speech/grok-voices";
import { saveReadingProgress } from "@/lib/progress-client";
import {
  loadReadingSpeed,
  READING_SPEED_OPTIONS,
  readingSpeedToRate,
  saveReadingSpeed,
  type ReadingSpeed,
} from "@/lib/speech/reading-speed";

type Verse = {
  verse: number;
  text: string;
};

type ReadAloudControlsProps = {
  book: string;
  chapter: number;
  verses: Verse[];
  preferredTtsVoice: GrokTtsVoiceId | string;
  /** When set, progress is saved for this user (canonical reading only). */
  userId?: string;
  /** 1-based Scripture verse to start from when the chapter opens. */
  initialVerse?: number;
  /** When true, begin reading aloud once the chapter mounts. */
  autoStart?: boolean;
  /** Increment to request a barge-in pause from listening. */
  pauseRequestId?: number;
  /** Increment to resume chapter reading from the current verse. */
  resumeRequestId?: number;
  /** Increment to re-read the current (or last) verse. */
  repeatRequestId?: number;
  onCurrentVerseChange?: (verse: number | null) => void;
  /** Fired once when TTS finishes the last verse of the chapter. */
  onChapterEnd?: () => void;
};

type PlaybackState = "idle" | "playing" | "paused" | "loading";

/** Spoken text only — verse numbers stay on the page, not in speech. */
function buildUtteranceText(verse: Verse): string {
  return verse.text.trim();
}

function resolveStartIndex(list: Verse[], initialVerse?: number): number {
  if (!initialVerse || list.length === 0) {
    return 0;
  }
  const index = list.findIndex((verse) => verse.verse === initialVerse);
  return index >= 0 ? index : 0;
}

export function ReadAloudControls({
  book,
  chapter,
  verses,
  preferredTtsVoice,
  userId,
  initialVerse = 1,
  autoStart = false,
  pauseRequestId = 0,
  resumeRequestId = 0,
  repeatRequestId = 0,
  onCurrentVerseChange,
  onChapterEnd,
}: ReadAloudControlsProps) {
  const [playbackState, setPlaybackState] = useState<PlaybackState>("idle");
  const [currentVerse, setCurrentVerse] = useState<number | null>(null);
  const [readingSpeed, setReadingSpeed] = useState<ReadingSpeed>("normal");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const indexRef = useRef(resolveStartIndex(verses, initialVerse));
  const preferredTtsVoiceRef = useRef(preferredTtsVoice);
  const versesRef = useRef(verses);
  const userIdRef = useRef(userId);
  const speakingRef = useRef(false);
  const playbackStateRef = useRef<PlaybackState>("idle");
  const lastPauseRequestRef = useRef(0);
  const lastResumeRequestRef = useRef(0);
  const lastRepeatRequestRef = useRef(0);
  const autoStartedRef = useRef(false);
  const readingSpeedRef = useRef<ReadingSpeed>("normal");
  const onCurrentVerseChangeRef = useRef(onCurrentVerseChange);
  const onChapterEndRef = useRef(onChapterEnd);

  preferredTtsVoiceRef.current = preferredTtsVoice;
  versesRef.current = verses;
  userIdRef.current = userId;
  playbackStateRef.current = playbackState;
  readingSpeedRef.current = readingSpeed;
  onCurrentVerseChangeRef.current = onCurrentVerseChange;
  onChapterEndRef.current = onChapterEnd;

  const voiceMeta = getGrokTtsVoice(String(preferredTtsVoice));
  const startIndex = resolveStartIndex(verses, initialVerse);

  function persistVerse(verseNumber: number) {
    const id = userIdRef.current;
    if (!id) {
      return;
    }
    saveReadingProgress({
      userId: id,
      book,
      chapter,
      verse: verseNumber,
    });
  }

  function updateCurrentVerse(verse: number | null, persist = false) {
    setCurrentVerse(verse);
    onCurrentVerseChangeRef.current?.(verse);
    if (persist && verse != null) {
      persistVerse(verse);
    }
  }

  useEffect(() => {
    setReadingSpeed(loadReadingSpeed());
  }, []);

  useEffect(() => {
    return () => {
      speakingRef.current = false;
      clearGrokPrefetch();
      stopGrokSpeech();
    };
  }, []);

  // Reset to the saved (or first) verse when the chapter content changes.
  useEffect(() => {
    speakingRef.current = false;
    autoStartedRef.current = false;
    indexRef.current = resolveStartIndex(verses, initialVerse);
    updateCurrentVerse(null);
    setPlaybackState("idle");
    setErrorMessage(null);
    clearGrokPrefetch();
    stopGrokSpeech();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only on chapter content change
  }, [book, chapter, verses, initialVerse]);

  // Auto-start reading (e.g. after voice-confirmed advance to the next chapter).
  useEffect(() => {
    if (!autoStart || autoStartedRef.current || verses.length === 0) {
      return;
    }
    autoStartedRef.current = true;
    speakingRef.current = true;
    void speakFrom(resolveStartIndex(verses, initialVerse));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot per chapter open
  }, [autoStart, book, chapter, verses, initialVerse]);

  // Barge-in: pause TTS when listening detects speech.
  useEffect(() => {
    if (pauseRequestId <= lastPauseRequestRef.current) {
      return;
    }
    lastPauseRequestRef.current = pauseRequestId;

    if (
      playbackStateRef.current === "playing" ||
      playbackStateRef.current === "loading"
    ) {
      pauseGrokSpeech();
      speakingRef.current = false;
      setPlaybackState("paused");
      const list = versesRef.current;
      const verse = list[indexRef.current];
      if (verse) {
        persistVerse(verse.verse);
      }
    }
  }, [pauseRequestId]);

  // Resume chapter reading after clarification (or when the queue was cleared).
  useEffect(() => {
    if (resumeRequestId <= lastResumeRequestRef.current) {
      return;
    }
    lastResumeRequestRef.current = resumeRequestId;

    if (
      playbackStateRef.current === "paused" &&
      isGrokSpeechPaused() &&
      resumeGrokSpeech()
    ) {
      speakingRef.current = true;
      setPlaybackState("playing");
      return;
    }

    void speakFrom(indexRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeRequestId]);

  // Re-read the current verse from the start.
  useEffect(() => {
    if (repeatRequestId <= lastRepeatRequestRef.current) {
      return;
    }
    lastRepeatRequestRef.current = repeatRequestId;

    const list = versesRef.current;
    if (list.length === 0) {
      return;
    }

    const index =
      indexRef.current >= 0 && indexRef.current < list.length
        ? indexRef.current
        : 0;

    speakingRef.current = true;
    void speakFrom(index);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repeatRequestId]);

  function warmNextVerse(index: number) {
    const list = versesRef.current;
    const next = list[index + 1];
    if (!next) {
      clearGrokPrefetch();
      return;
    }
    prefetchGrokSpeech({
      text: buildUtteranceText(next),
      voiceId: preferredTtsVoiceRef.current,
      speed: readingSpeedToRate(readingSpeedRef.current),
    });
  }

  async function speakFrom(index: number) {
    const list = versesRef.current;
    if (index < 0 || index >= list.length) {
      const finishedChapter = list.length > 0 && index >= list.length;
      speakingRef.current = false;
      if (finishedChapter && list.length > 0) {
        persistVerse(list[list.length - 1].verse);
      }
      indexRef.current = resolveStartIndex(list, initialVerse);
      updateCurrentVerse(null);
      setPlaybackState("idle");
      clearGrokPrefetch();
      stopGrokSpeech();
      if (finishedChapter) {
        onChapterEndRef.current?.();
      }
      return;
    }

    const verse = list[index];
    indexRef.current = index;
    updateCurrentVerse(verse.verse, true);
    setPlaybackState("loading");
    setErrorMessage(null);
    speakingRef.current = true;

    await speakWithGrok({
      text: buildUtteranceText(verse),
      voiceId: preferredTtsVoiceRef.current,
      speed: readingSpeedToRate(readingSpeedRef.current),
      onEnd: () => {
        if (!speakingRef.current) {
          return;
        }
        void speakFrom(index + 1);
      },
      onError: (message) => {
        speakingRef.current = false;
        clearGrokPrefetch();
        updateCurrentVerse(null);
        setPlaybackState("idle");
        setErrorMessage(message);
      },
    });

    // Prefetch the next verse only after this verse has started (or finished
    // loading), so we do not replace a matching prefetch for the current verse.
    if (speakingRef.current) {
      warmNextVerse(index);
      if (playbackStateRef.current === "loading") {
        setPlaybackState("playing");
      }
    }
  }

  function handlePlay() {
    if (versesRef.current.length === 0) {
      return;
    }

    if (playbackState === "paused") {
      if (isGrokSpeechPaused() && resumeGrokSpeech()) {
        speakingRef.current = true;
        setPlaybackState("playing");
        return;
      }
      void speakFrom(indexRef.current);
      return;
    }

    stopGrokSpeech();
    // Start from the saved / last verse index (not always verse 1).
    const index =
      indexRef.current >= 0 && indexRef.current < versesRef.current.length
        ? indexRef.current
        : startIndex;
    void speakFrom(index);
  }

  function handlePause() {
    pauseGrokSpeech();
    speakingRef.current = false;
    setPlaybackState("paused");
    const verse = versesRef.current[indexRef.current];
    if (verse) {
      persistVerse(verse.verse);
    }
  }

  function handleStop() {
    const verse = versesRef.current[indexRef.current];
    if (verse) {
      persistVerse(verse.verse);
    }
    speakingRef.current = false;
    // Keep index at the stopped verse so the next Read aloud continues there.
    clearGrokPrefetch();
    stopGrokSpeech();
    setPlaybackState("idle");
    updateCurrentVerse(null);
    setErrorMessage(null);
  }

  function handleSpeedChange(speed: ReadingSpeed) {
    setReadingSpeed(speed);
    readingSpeedRef.current = speed;
    saveReadingSpeed(speed);
    clearGrokPrefetch();

    if (
      playbackStateRef.current === "playing" ||
      playbackStateRef.current === "loading"
    ) {
      speakingRef.current = true;
      void speakFrom(indexRef.current);
    }
  }

  return (
    <div className="mt-6 border-t border-neutral-200 pt-6">
      <p className="text-sm font-medium text-neutral-800">Read aloud</p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {playbackState === "playing" || playbackState === "loading" ? (
          <button
            type="button"
            onClick={handlePause}
            className="border border-neutral-800 px-3 py-1.5 text-sm text-neutral-900 hover:bg-neutral-100"
          >
            Pause
          </button>
        ) : (
          <button
            type="button"
            onClick={handlePlay}
            className="border border-neutral-800 px-3 py-1.5 text-sm text-neutral-900 hover:bg-neutral-100"
          >
            {playbackState === "paused" ? "Resume" : "Read aloud"}
          </button>
        )}

        <button
          type="button"
          onClick={handleStop}
          disabled={playbackState === "idle"}
          className="border border-neutral-300 px-3 py-1.5 text-sm text-neutral-800 hover:bg-neutral-100 disabled:opacity-40"
        >
          Stop
        </button>
      </div>

      <div className="mt-4">
        <p className="text-sm text-neutral-700">Speed</p>
        <div
          className="mt-2 flex flex-wrap gap-2"
          role="group"
          aria-label="Reading speed"
        >
          {READING_SPEED_OPTIONS.map((option) => {
            const selected = readingSpeed === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSpeedChange(option.value)}
                aria-pressed={selected}
                className={
                  selected
                    ? "border border-neutral-800 bg-neutral-100 px-3 py-1.5 text-sm text-neutral-900"
                    : "border border-neutral-300 px-3 py-1.5 text-sm text-neutral-800 hover:bg-neutral-100"
                }
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {errorMessage ? (
        <p className="mt-3 text-sm text-neutral-600" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {playbackState === "playing" ||
      playbackState === "paused" ||
      playbackState === "loading" ? (
        <p className="mt-3 text-sm text-neutral-600" aria-live="polite">
          {playbackState === "paused"
            ? "Paused"
            : playbackState === "loading"
              ? "Preparing voice…"
              : "Reading"}
          {currentVerse ? ` — verse ${currentVerse}` : ""}
          {` · ${voiceMeta.label} (Grok)`}
        </p>
      ) : (
        <p className="mt-3 text-sm text-neutral-500">
          Uses Grok Text-to-Speech. Voice: {voiceMeta.label}.
          {initialVerse > 1
            ? ` Starts at verse ${initialVerse}.`
            : ""}
        </p>
      )}
    </div>
  );
}
