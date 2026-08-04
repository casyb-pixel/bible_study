"use client";

import { useCallback, useRef, useState } from "react";

import { ListeningControls } from "@/components/ListeningControls";
import { ReadAloudControls } from "@/components/ReadAloudControls";
import {
  isLikelyReadingEcho,
  isPlausibleClarifyTranscript,
  selectRecentVerses,
} from "@/lib/clarify/transcript";
import type { TranslationCode } from "@/lib/bible/translations";
import type { PreferredVoiceGender } from "@/lib/speech/select-voice";
import { speakText } from "@/lib/speech/speak-text";

type Verse = {
  verse: number;
  text: string;
};

type ChapterVoicePanelProps = {
  book: string;
  chapter: number;
  translation: TranslationCode;
  verses: Verse[];
  preferredVoice: PreferredVoiceGender;
};

type ClarifyStatus = "idle" | "loading" | "speaking" | "ready" | "error";

export function ChapterVoicePanel({
  book,
  chapter,
  translation,
  verses,
  preferredVoice,
}: ChapterVoicePanelProps) {
  const [pauseRequestId, setPauseRequestId] = useState(0);
  const [resumeRequestId, setResumeRequestId] = useState(0);
  const [currentVerse, setCurrentVerse] = useState<number | null>(null);
  const [acceptTranscripts, setAcceptTranscripts] = useState(true);
  const [clarifyStatus, setClarifyStatus] = useState<ClarifyStatus>("idle");
  const [question, setQuestion] = useState("");
  const [clarification, setClarification] = useState("");
  const [clarifyError, setClarifyError] = useState<string | null>(null);

  const busyRef = useRef(false);
  const currentVerseRef = useRef<number | null>(null);
  const preferredVoiceRef = useRef(preferredVoice);

  preferredVoiceRef.current = preferredVoice;
  currentVerseRef.current = currentVerse;

  const handleCurrentVerseChange = useCallback((verse: number | null) => {
    setCurrentVerse(verse);
    currentVerseRef.current = verse;
  }, []);

  const runClarify = useCallback(
    async (spokenQuestion: string) => {
      busyRef.current = true;
      setAcceptTranscripts(false);
      setPauseRequestId((value) => value + 1);
      setClarifyStatus("loading");
      setQuestion(spokenQuestion);
      setClarification("");
      setClarifyError(null);

      const recentVerses = selectRecentVerses(
        verses,
        currentVerseRef.current,
      );

      try {
        const response = await fetch("/api/clarify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: spokenQuestion,
            book,
            chapter,
            translation,
            verses: recentVerses,
          }),
        });

        const data = (await response.json().catch(() => null)) as {
          clarification?: string;
          error?: string;
        } | null;

        if (!response.ok || !data?.clarification) {
          throw new Error(data?.error || "Clarification failed");
        }

        setClarification(data.clarification);
        setClarifyStatus("speaking");

        speakText({
          text: data.clarification,
          preferredVoice: preferredVoiceRef.current,
          onEnd: () => {
            busyRef.current = false;
            setClarifyStatus("ready");
            setAcceptTranscripts(true);
          },
          onError: () => {
            busyRef.current = false;
            setClarifyStatus("ready");
            setAcceptTranscripts(true);
          },
        });
      } catch (error) {
        busyRef.current = false;
        setClarifyStatus("error");
        setClarifyError(
          error instanceof Error
            ? error.message
            : "Clarification could not be completed.",
        );
        setAcceptTranscripts(true);
      }
    },
    [book, chapter, translation, verses],
  );

  const handleFinalTranscript = useCallback(
    (text: string) => {
      if (busyRef.current || !acceptTranscripts) {
        return;
      }

      const trimmed = text.trim();
      if (isLikelyReadingEcho(trimmed, verses, currentVerseRef.current)) {
        return;
      }

      // Barge-in: pause chapter TTS when the reader speaks.
      setPauseRequestId((value) => value + 1);

      if (!isPlausibleClarifyTranscript(trimmed)) {
        return;
      }

      void runClarify(trimmed);
    },
    [acceptTranscripts, runClarify, verses],
  );

  function handleResumeReading() {
    setResumeRequestId((value) => value + 1);
    if (clarifyStatus === "ready" || clarifyStatus === "error") {
      setClarifyStatus("idle");
    }
  }

  return (
    <div>
      <ReadAloudControls
        book={book}
        chapter={chapter}
        verses={verses}
        preferredVoice={preferredVoice}
        pauseRequestId={pauseRequestId}
        resumeRequestId={resumeRequestId}
        onCurrentVerseChange={handleCurrentVerseChange}
      />
      <ListeningControls
        onFinalTranscript={handleFinalTranscript}
        acceptTranscripts={acceptTranscripts}
      />

      {clarifyStatus !== "idle" || question || clarification || clarifyError ? (
        <div className="mt-6 border-t border-neutral-200 pt-6">
          <p className="text-sm font-medium text-neutral-800">Clarification</p>

          {question ? (
            <div className="mt-3">
              <p className="text-xs uppercase tracking-wide text-neutral-500">
                Question
              </p>
              <p className="mt-1 text-sm text-neutral-800">{question}</p>
            </div>
          ) : null}

          {clarifyStatus === "loading" ? (
            <p className="mt-3 text-sm text-neutral-600">Clarifying…</p>
          ) : null}

          {clarifyStatus === "speaking" ? (
            <p className="mt-3 text-sm text-neutral-600">Speaking reply…</p>
          ) : null}

          {clarification ? (
            <div className="mt-3">
              <p className="text-xs uppercase tracking-wide text-neutral-500">
                Reply
              </p>
              <p className="mt-1 text-sm leading-6 text-neutral-800">
                {clarification}
              </p>
            </div>
          ) : null}

          {clarifyError ? (
            <p className="mt-3 text-sm text-neutral-600">{clarifyError}</p>
          ) : null}

          {clarifyStatus === "ready" || clarifyStatus === "error" ? (
            <div className="mt-4">
              <button
                type="button"
                onClick={handleResumeReading}
                className="border border-neutral-800 px-3 py-1.5 text-sm text-neutral-900 hover:bg-neutral-100"
              >
                Resume reading
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
