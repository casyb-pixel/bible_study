"use client";

import { useEffect, useRef, useState } from "react";

import {
  loadReadingSpeed,
  READING_SPEED_OPTIONS,
  readingSpeedToRate,
  saveReadingSpeed,
  type ReadingSpeed,
} from "@/lib/speech/reading-speed";
import {
  selectSpeechVoice,
  type PreferredVoiceGender,
} from "@/lib/speech/select-voice";

type Verse = {
  verse: number;
  text: string;
};

type ReadAloudControlsProps = {
  book: string;
  chapter: number;
  verses: Verse[];
  preferredVoice: PreferredVoiceGender;
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

type PlaybackState = "idle" | "playing" | "paused";

/** Spoken text only — verse numbers stay on the page, not in speech. */
function buildUtteranceText(verse: Verse): string {
  return verse.text.trim();
}

export function ReadAloudControls({
  book,
  chapter,
  verses,
  preferredVoice,
  pauseRequestId = 0,
  resumeRequestId = 0,
  repeatRequestId = 0,
  onCurrentVerseChange,
  onChapterEnd,
}: ReadAloudControlsProps) {
  const [playbackState, setPlaybackState] = useState<PlaybackState>("idle");
  const [currentVerse, setCurrentVerse] = useState<number | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [voiceLabel, setVoiceLabel] = useState<string | null>(null);
  const [readingSpeed, setReadingSpeed] = useState<ReadingSpeed>("normal");

  const indexRef = useRef(0);
  const preferredVoiceRef = useRef(preferredVoice);
  const versesRef = useRef(verses);
  const speakingRef = useRef(false);
  const playbackStateRef = useRef<PlaybackState>("idle");
  const lastPauseRequestRef = useRef(0);
  const lastResumeRequestRef = useRef(0);
  const lastRepeatRequestRef = useRef(0);
  const readingSpeedRef = useRef<ReadingSpeed>("normal");
  const onCurrentVerseChangeRef = useRef(onCurrentVerseChange);
  const onChapterEndRef = useRef(onChapterEnd);

  preferredVoiceRef.current = preferredVoice;
  versesRef.current = verses;
  playbackStateRef.current = playbackState;
  readingSpeedRef.current = readingSpeed;
  onCurrentVerseChangeRef.current = onCurrentVerseChange;
  onChapterEndRef.current = onChapterEnd;

  function updateCurrentVerse(verse: number | null) {
    setCurrentVerse(verse);
    onCurrentVerseChangeRef.current?.(verse);
  }

  useEffect(() => {
    setIsSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    setReadingSpeed(loadReadingSpeed());
  }, []);

  useEffect(() => {
    return () => {
      speakingRef.current = false;
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Stop cleanly when the chapter content changes (navigation).
  useEffect(() => {
    speakingRef.current = false;
    indexRef.current = 0;
    updateCurrentVerse(null);
    setPlaybackState("idle");
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only on chapter content change
  }, [book, chapter, verses]);

  // Barge-in: pause TTS when listening detects speech.
  useEffect(() => {
    if (pauseRequestId <= lastPauseRequestRef.current) {
      return;
    }
    lastPauseRequestRef.current = pauseRequestId;

    if (
      playbackStateRef.current === "playing" &&
      typeof window !== "undefined" &&
      "speechSynthesis" in window
    ) {
      window.speechSynthesis.pause();
      speakingRef.current = false;
      setPlaybackState("paused");
    }
  }, [pauseRequestId]);

  // Resume chapter reading after clarification (or when the queue was cleared).
  useEffect(() => {
    if (resumeRequestId <= lastResumeRequestRef.current) {
      return;
    }
    lastResumeRequestRef.current = resumeRequestId;

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    if (window.speechSynthesis.paused && playbackStateRef.current === "paused") {
      window.speechSynthesis.resume();
      speakingRef.current = true;
      setPlaybackState("playing");
      return;
    }

    speakFrom(indexRef.current);
    // speakFrom is stable enough via refs; avoid re-binding on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeRequestId]);

  // Re-read the current verse from the start.
  useEffect(() => {
    if (repeatRequestId <= lastRepeatRequestRef.current) {
      return;
    }
    lastRepeatRequestRef.current = repeatRequestId;

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    const list = versesRef.current;
    if (list.length === 0) {
      return;
    }

    const index =
      indexRef.current >= 0 && indexRef.current < list.length
        ? indexRef.current
        : 0;

    window.speechSynthesis.cancel();
    speakingRef.current = true;
    speakFrom(index);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repeatRequestId]);

  function getVoice(): SpeechSynthesisVoice | null {
    if (!("speechSynthesis" in window)) {
      return null;
    }
    return selectSpeechVoice(
      preferredVoiceRef.current,
      window.speechSynthesis.getVoices(),
    );
  }

  function speakFrom(index: number) {
    if (!("speechSynthesis" in window)) {
      return;
    }

    const list = versesRef.current;
    if (index < 0 || index >= list.length) {
      const finishedChapter = list.length > 0 && index >= list.length;
      speakingRef.current = false;
      indexRef.current = 0;
      updateCurrentVerse(null);
      setPlaybackState("idle");
      if (finishedChapter) {
        onChapterEndRef.current?.();
      }
      return;
    }

    const voice = getVoice();
    if (voice) {
      setVoiceLabel(voice.name);
    }

    const verse = list[index];
    const utterance = new SpeechSynthesisUtterance(buildUtteranceText(verse));
    utterance.lang = voice?.lang ?? "en-US";
    if (voice) {
      utterance.voice = voice;
    }
    utterance.rate = readingSpeedToRate(readingSpeedRef.current);

    indexRef.current = index;
    updateCurrentVerse(verse.verse);
    setPlaybackState("playing");
    speakingRef.current = true;

    utterance.onend = () => {
      if (!speakingRef.current) {
        return;
      }
      speakFrom(index + 1);
    };

    utterance.onerror = (event) => {
      // cancel()/new speech often reports canceled or interrupted — keep verse position.
      const errorName =
        typeof event === "object" &&
        event &&
        "error" in event &&
        typeof (event as { error?: unknown }).error === "string"
          ? (event as { error: string }).error
          : "";
      if (errorName === "canceled" || errorName === "interrupted") {
        return;
      }
      speakingRef.current = false;
      setPlaybackState("idle");
      updateCurrentVerse(null);
    };

    window.speechSynthesis.speak(utterance);
  }

  function handlePlay() {
    if (!("speechSynthesis" in window) || versesRef.current.length === 0) {
      return;
    }

    // Voices often load asynchronously.
    const ensureVoices = () => {
      if (playbackState === "paused") {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
          speakingRef.current = true;
          setPlaybackState("playing");
          return;
        }
        // Queue may have been cleared (e.g. clarification speech).
        speakFrom(indexRef.current);
        return;
      }

      window.speechSynthesis.cancel();
      speakFrom(0);
    };

    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      const onVoices = () => {
        window.speechSynthesis.removeEventListener("voiceschanged", onVoices);
        ensureVoices();
      };
      window.speechSynthesis.addEventListener("voiceschanged", onVoices);
      // Fallback if voiceschanged never fires.
      window.setTimeout(ensureVoices, 250);
      return;
    }

    ensureVoices();
  }

  function handlePause() {
    if (!("speechSynthesis" in window)) {
      return;
    }
    window.speechSynthesis.pause();
    speakingRef.current = false;
    setPlaybackState("paused");
  }

  function handleStop() {
    if (!("speechSynthesis" in window)) {
      return;
    }
    speakingRef.current = false;
    indexRef.current = 0;
    window.speechSynthesis.cancel();
    setPlaybackState("idle");
    updateCurrentVerse(null);
  }

  function handleSpeedChange(speed: ReadingSpeed) {
    setReadingSpeed(speed);
    readingSpeedRef.current = speed;
    saveReadingSpeed(speed);

    // Apply the new rate from the current verse when already reading.
    if (
      playbackStateRef.current === "playing" &&
      typeof window !== "undefined" &&
      "speechSynthesis" in window
    ) {
      window.speechSynthesis.cancel();
      speakingRef.current = true;
      speakFrom(indexRef.current);
    }
  }

  if (!isSupported) {
    return (
      <div className="mt-6 border-t border-neutral-200 pt-6">
        <p className="text-sm text-neutral-600">
          Read aloud is not available in this browser.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 border-t border-neutral-200 pt-6">
      <p className="text-sm font-medium text-neutral-800">Read aloud</p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {playbackState === "playing" ? (
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
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Reading speed">
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

      {playbackState === "playing" || playbackState === "paused" ? (
        <p className="mt-3 text-sm text-neutral-600" aria-live="polite">
          {playbackState === "paused" ? "Paused" : "Reading"}
          {currentVerse ? ` — verse ${currentVerse}` : ""}
          {voiceLabel ? ` · ${voiceLabel}` : ""}
        </p>
      ) : (
        <p className="mt-3 text-sm text-neutral-500">
          Uses this device’s voices. Preferred: {preferredVoice}.
        </p>
      )}
    </div>
  );
}
