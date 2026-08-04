"use client";

import { useEffect, useRef, useState } from "react";

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
};

type PlaybackState = "idle" | "playing" | "paused";

function buildUtteranceText(verse: Verse): string {
  return `Verse ${verse.verse}. ${verse.text}`;
}

export function ReadAloudControls({
  book,
  chapter,
  verses,
  preferredVoice,
}: ReadAloudControlsProps) {
  const [playbackState, setPlaybackState] = useState<PlaybackState>("idle");
  const [currentVerse, setCurrentVerse] = useState<number | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [voiceLabel, setVoiceLabel] = useState<string | null>(null);

  const indexRef = useRef(0);
  const preferredVoiceRef = useRef(preferredVoice);
  const versesRef = useRef(verses);
  const speakingRef = useRef(false);

  preferredVoiceRef.current = preferredVoice;
  versesRef.current = verses;

  useEffect(() => {
    setIsSupported(typeof window !== "undefined" && "speechSynthesis" in window);
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
    setCurrentVerse(null);
    setPlaybackState("idle");
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, [book, chapter, verses]);

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
      speakingRef.current = false;
      indexRef.current = 0;
      setCurrentVerse(null);
      setPlaybackState("idle");
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
    utterance.rate = 0.95;

    indexRef.current = index;
    setCurrentVerse(verse.verse);
    setPlaybackState("playing");
    speakingRef.current = true;

    utterance.onend = () => {
      if (!speakingRef.current) {
        return;
      }
      speakFrom(index + 1);
    };

    utterance.onerror = () => {
      speakingRef.current = false;
      setPlaybackState("idle");
      setCurrentVerse(null);
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
        window.speechSynthesis.resume();
        speakingRef.current = true;
        setPlaybackState("playing");
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
    setCurrentVerse(null);
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
