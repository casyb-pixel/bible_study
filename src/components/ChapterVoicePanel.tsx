"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

import {
  ChapterEndConfirmation,
  type ChapterEndStatus,
} from "@/components/ChapterEndConfirmation";
import { ListeningControls } from "@/components/ListeningControls";
import { ReadAloudControls } from "@/components/ReadAloudControls";
import {
  isLikelyReadingEcho,
  isPlausibleClarifyTranscript,
  selectRecentVerses,
} from "@/lib/clarify/transcript";
import { UNDERSTANDING_QUESTION } from "@/lib/completion/understanding";
import type { TranslationCode } from "@/lib/bible/translations";
import type { GrokTtsVoiceId } from "@/lib/speech/grok-voices";
import { speakText } from "@/lib/speech/speak-text";
import {
  matchVoiceCommand,
  voiceCommandFeedback,
  voiceCommandLabel,
  type VoiceCommand,
} from "@/lib/speech/voice-commands";

type Verse = {
  verse: number;
  text: string;
};

type ChapterLink = {
  book: string;
  chapter: number;
  href: string;
};

type ChapterVoicePanelProps = {
  book: string;
  chapter: number;
  translation: TranslationCode;
  verses: Verse[];
  preferredTtsVoice: GrokTtsVoiceId | string;
  userId: string;
  nextChapter: ChapterLink | null;
  previousChapter: ChapterLink | null;
};

type ClarifyStatus = "idle" | "loading" | "speaking" | "ready" | "error";

export function ChapterVoicePanel({
  book,
  chapter,
  translation,
  verses,
  preferredTtsVoice,
  userId,
  nextChapter,
  previousChapter,
}: ChapterVoicePanelProps) {
  const router = useRouter();
  const [pauseRequestId, setPauseRequestId] = useState(0);
  const [resumeRequestId, setResumeRequestId] = useState(0);
  const [repeatRequestId, setRepeatRequestId] = useState(0);
  const [stopListeningRequestId, setStopListeningRequestId] = useState(0);
  const [currentVerse, setCurrentVerse] = useState<number | null>(null);
  const [acceptTranscripts, setAcceptTranscripts] = useState(true);
  const [clarifyStatus, setClarifyStatus] = useState<ClarifyStatus>("idle");
  const [question, setQuestion] = useState("");
  const [clarification, setClarification] = useState("");
  const [clarifyError, setClarifyError] = useState<string | null>(null);
  const [endStatus, setEndStatus] = useState<ChapterEndStatus>("idle");
  const [endError, setEndError] = useState<string | null>(null);
  const [lastCommandLabel, setLastCommandLabel] = useState<string | null>(null);

  const busyRef = useRef(false);
  const endStatusRef = useRef<ChapterEndStatus>("idle");
  const currentVerseRef = useRef<number | null>(null);
  const preferredTtsVoiceRef = useRef(preferredTtsVoice);
  const nextChapterRef = useRef(nextChapter);
  const previousChapterRef = useRef(previousChapter);

  preferredTtsVoiceRef.current = preferredTtsVoice;
  currentVerseRef.current = currentVerse;
  endStatusRef.current = endStatus;
  nextChapterRef.current = nextChapter;
  previousChapterRef.current = previousChapter;

  const handleCurrentVerseChange = useCallback((verse: number | null) => {
    setCurrentVerse(verse);
    currentVerseRef.current = verse;
  }, []);

  const speakFeedback = useCallback(
    (text: string, onDone?: () => void) => {
      if (!text) {
        onDone?.();
        return;
      }
      busyRef.current = true;
      setAcceptTranscripts(false);
      speakText({
        text,
        preferredTtsVoice: preferredTtsVoiceRef.current,
        onEnd: () => {
          busyRef.current = false;
          setAcceptTranscripts(true);
          onDone?.();
        },
        onError: () => {
          busyRef.current = false;
          setAcceptTranscripts(true);
          onDone?.();
        },
      });
    },
    [],
  );

  const beginUnderstandingCheck = useCallback(() => {
    if (endStatusRef.current === "asking" || endStatusRef.current === "saving") {
      return;
    }

    busyRef.current = true;
    setAcceptTranscripts(false);
    setPauseRequestId((value) => value + 1);
    setEndStatus("asking");
    setEndError(null);
    endStatusRef.current = "asking";

    speakText({
      text: UNDERSTANDING_QUESTION,
      preferredTtsVoice: preferredTtsVoiceRef.current,
      onEnd: () => {
        busyRef.current = false;
        setAcceptTranscripts(true);
      },
      onError: () => {
        busyRef.current = false;
        setAcceptTranscripts(true);
      },
    });
  }, []);

  const confirmUnderstood = useCallback(async () => {
    if (endStatusRef.current === "saving" || endStatusRef.current === "confirmed") {
      return;
    }

    busyRef.current = true;
    setAcceptTranscripts(false);
    setEndStatus("saving");
    endStatusRef.current = "saving";
    setEndError(null);

    try {
      const response = await fetch("/api/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          book,
          chapter,
          understandingConfirmed: true,
        }),
      });

      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(data?.error || "Completion could not be recorded.");
      }

      setEndStatus("confirmed");
      endStatusRef.current = "confirmed";

      const offer = nextChapter
        ? "You may continue to the next chapter."
        : "This is the last chapter in the reading order.";

      speakText({
        text: offer,
        preferredTtsVoice: preferredTtsVoiceRef.current,
        onEnd: () => {
          busyRef.current = false;
          setAcceptTranscripts(true);
        },
        onError: () => {
          busyRef.current = false;
          setAcceptTranscripts(true);
        },
      });
    } catch (error) {
      busyRef.current = false;
      setEndStatus("error");
      endStatusRef.current = "error";
      setEndError(
        error instanceof Error
          ? error.message
          : "Completion could not be recorded.",
      );
      setAcceptTranscripts(true);
    }
  }, [book, chapter, nextChapter, userId]);

  const declineUnderstood = useCallback(() => {
    if (endStatusRef.current === "saving") {
      return;
    }

    setEndStatus("declined");
    endStatusRef.current = "declined";
    setEndError(null);
    busyRef.current = true;
    setAcceptTranscripts(false);

    speakText({
      text: "Remain here. You may ask questions or read the chapter again.",
      preferredTtsVoice: preferredTtsVoiceRef.current,
      onEnd: () => {
        busyRef.current = false;
        setAcceptTranscripts(true);
      },
      onError: () => {
        busyRef.current = false;
        setAcceptTranscripts(true);
      },
    });
  }, []);

  const executeCommand = useCallback(
    (command: VoiceCommand) => {
      setLastCommandLabel(voiceCommandLabel(command));

      if (command === "confirm_understanding") {
        void confirmUnderstood();
        return;
      }
      if (command === "decline_understanding") {
        declineUnderstood();
        return;
      }

      if (command === "pause") {
        setPauseRequestId((value) => value + 1);
        speakFeedback(voiceCommandFeedback(command));
        return;
      }

      if (command === "resume") {
        if (clarifyStatus === "ready" || clarifyStatus === "error") {
          setClarifyStatus("idle");
        }
        speakFeedback(voiceCommandFeedback(command), () => {
          setResumeRequestId((value) => value + 1);
        });
        return;
      }

      if (command === "repeat") {
        speakFeedback(voiceCommandFeedback(command), () => {
          setRepeatRequestId((value) => value + 1);
        });
        return;
      }

      if (command === "stop_listening") {
        setStopListeningRequestId((value) => value + 1);
        speakFeedback(voiceCommandFeedback(command));
        return;
      }

      if (command === "next_chapter") {
        const target = nextChapterRef.current;
        if (!target) {
          speakFeedback("There is no next chapter.");
          return;
        }
        speakFeedback(voiceCommandFeedback(command), () => {
          router.push(target.href);
        });
        return;
      }

      if (command === "previous_chapter") {
        const target = previousChapterRef.current;
        if (!target) {
          speakFeedback("There is no previous chapter.");
          return;
        }
        speakFeedback(voiceCommandFeedback(command), () => {
          router.push(target.href);
        });
      }
    },
    [clarifyStatus, confirmUnderstood, declineUnderstood, router, speakFeedback],
  );

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
          status?: number | null;
          message?: string;
          missingApiKey?: boolean;
        } | null;

        if (!response.ok || !data?.clarification) {
          const parts: string[] = [];
          if (data?.missingApiKey) {
            parts.push("XAI_API_KEY is missing on the server");
          }
          if (typeof data?.status === "number") {
            parts.push(`status ${data.status}`);
          }
          const detail =
            data?.message?.trim() ||
            data?.error?.trim() ||
            `HTTP ${response.status}`;
          if (detail && !parts.includes(detail)) {
            parts.push(detail);
          }
          throw new Error(parts.join(" — ") || "Clarification failed");
        }

        setClarification(data.clarification);
        setClarifyStatus("speaking");

        speakText({
          text: data.clarification,
          preferredTtsVoice: preferredTtsVoiceRef.current,
          onEnd: () => {
            busyRef.current = false;
            setClarifyStatus("ready");
            setAcceptTranscripts(true);
          },
          onError: (message) => {
            busyRef.current = false;
            setClarifyStatus("error");
            setClarifyError(message || "Clarification could not be spoken.");
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
      const understandingPromptActive = endStatusRef.current === "asking";

      const command = matchVoiceCommand(trimmed, {
        understandingPromptActive,
      });

      if (command) {
        executeCommand(command);
        return;
      }

      // While the understanding prompt is open, ignore non-command speech.
      if (understandingPromptActive) {
        return;
      }

      if (isLikelyReadingEcho(trimmed, verses, currentVerseRef.current)) {
        return;
      }

      // Barge-in: pause chapter TTS when the reader asks a question.
      setPauseRequestId((value) => value + 1);

      if (!isPlausibleClarifyTranscript(trimmed)) {
        return;
      }

      void runClarify(trimmed);
    },
    [acceptTranscripts, executeCommand, runClarify, verses],
  );

  function handleResumeReading() {
    setResumeRequestId((value) => value + 1);
    if (clarifyStatus === "ready" || clarifyStatus === "error") {
      setClarifyStatus("idle");
    }
  }

  const nextLabel = nextChapter
    ? `Continue to ${nextChapter.book} ${nextChapter.chapter}`
    : null;

  return (
    <div>
      <ReadAloudControls
        book={book}
        chapter={chapter}
        verses={verses}
        preferredTtsVoice={preferredTtsVoice}
        pauseRequestId={pauseRequestId}
        resumeRequestId={resumeRequestId}
        repeatRequestId={repeatRequestId}
        onCurrentVerseChange={handleCurrentVerseChange}
        onChapterEnd={beginUnderstandingCheck}
      />
      <ListeningControls
        onFinalTranscript={handleFinalTranscript}
        acceptTranscripts={acceptTranscripts}
        stopRequestId={stopListeningRequestId}
      />

      {lastCommandLabel ? (
        <p className="mt-3 text-sm text-neutral-600" aria-live="polite">
          Command: {lastCommandLabel}
        </p>
      ) : null}

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

      <ChapterEndConfirmation
        status={endStatus}
        nextHref={nextChapter?.href ?? null}
        nextLabel={nextLabel}
        error={endError}
        onBeginCheck={beginUnderstandingCheck}
        onYes={() => void confirmUnderstood()}
        onNo={declineUnderstood}
      />
    </div>
  );
}
