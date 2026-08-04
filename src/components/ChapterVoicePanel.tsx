"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

import {
  AskQuestionControl,
  type AskClarifyPhase,
  type AskTranscriptResult,
} from "@/components/AskQuestionControl";
import {
  ChapterEndConfirmation,
  type ChapterEndStatus,
} from "@/components/ChapterEndConfirmation";
import { ReadAloudControls } from "@/components/ReadAloudControls";
import {
  isLikelyReadingEcho,
  isPlausibleClarifyTranscript,
  selectRecentVerses,
} from "@/lib/clarify/transcript";
import { UNDERSTANDING_QUESTION } from "@/lib/completion/understanding";
import type { TranslationCode } from "@/lib/bible/translations";
import type { GrokTtsVoiceId } from "@/lib/speech/grok-voices";
import { stopGrokSpeech } from "@/lib/speech/grok-speak";
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
  /** 1-based verse to resume TTS from. */
  initialVerse?: number;
  /** Begin reading aloud when this chapter mounts. */
  autoStart?: boolean;
  nextChapter: ChapterLink | null;
  previousChapter: ChapterLink | null;
  /** Temporary reading-position indicator (spoken verse only). */
  onReadingVerseChange?: (verse: number | null) => void;
};

function withAutostart(href: string): string {
  return href.includes("?") ? `${href}&autostart=1` : `${href}?autostart=1`;
}

type ClarifyStatus = "idle" | "loading" | "speaking" | "ready" | "error";

export function ChapterVoicePanel({
  book,
  chapter,
  translation,
  verses,
  preferredTtsVoice,
  userId,
  initialVerse = 1,
  autoStart = false,
  nextChapter,
  previousChapter,
  onReadingVerseChange,
}: ChapterVoicePanelProps) {
  const router = useRouter();
  const [pauseRequestId, setPauseRequestId] = useState(0);
  const [resumeRequestId, setResumeRequestId] = useState(0);
  const [repeatRequestId, setRepeatRequestId] = useState(0);
  const [answerListenRequestId, setAnswerListenRequestId] = useState(0);
  const [listeningForAnswer, setListeningForAnswer] = useState(false);
  const [currentVerse, setCurrentVerse] = useState<number | null>(null);
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
  const onReadingVerseChangeRef = useRef(onReadingVerseChange);
  const clarifyAbortRef = useRef<AbortController | null>(null);

  preferredTtsVoiceRef.current = preferredTtsVoice;
  currentVerseRef.current = currentVerse;
  endStatusRef.current = endStatus;
  nextChapterRef.current = nextChapter;
  previousChapterRef.current = previousChapter;
  onReadingVerseChangeRef.current = onReadingVerseChange;

  const handleCurrentVerseChange = useCallback((verse: number | null) => {
    setCurrentVerse(verse);
    currentVerseRef.current = verse;
    onReadingVerseChangeRef.current?.(verse);
  }, []);

  const speakFeedback = useCallback(
    (text: string, onDone?: () => void) => {
      if (!text) {
        onDone?.();
        return;
      }
      busyRef.current = true;
      speakText({
        text,
        preferredTtsVoice: preferredTtsVoiceRef.current,
        onEnd: () => {
          busyRef.current = false;
          onDone?.();
        },
        onError: () => {
          busyRef.current = false;
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
    setListeningForAnswer(false);
    setPauseRequestId((value) => value + 1);
    setEndStatus("asking");
    setEndError(null);
    endStatusRef.current = "asking";

    speakText({
      text: UNDERSTANDING_QUESTION,
      preferredTtsVoice: preferredTtsVoiceRef.current,
      onEnd: () => {
        busyRef.current = false;
        setListeningForAnswer(true);
        setAnswerListenRequestId((value) => value + 1);
      },
      onError: () => {
        busyRef.current = false;
        setListeningForAnswer(false);
      },
    });
  }, []);

  const confirmUnderstood = useCallback(async () => {
    if (endStatusRef.current === "saving" || endStatusRef.current === "confirmed") {
      return;
    }

    busyRef.current = true;
    setListeningForAnswer(false);
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

      const target = nextChapterRef.current;
      if (target) {
        speakText({
          text: "Continuing to the next chapter.",
          preferredTtsVoice: preferredTtsVoiceRef.current,
          onEnd: () => {
            busyRef.current = false;
            router.push(withAutostart(target.href));
          },
          onError: () => {
            busyRef.current = false;
            router.push(withAutostart(target.href));
          },
        });
        return;
      }

      speakText({
        text: "This is the last chapter in the reading order.",
        preferredTtsVoice: preferredTtsVoiceRef.current,
        onEnd: () => {
          busyRef.current = false;
        },
        onError: () => {
          busyRef.current = false;
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
    }
  }, [book, chapter, router, userId]);

  const declineUnderstood = useCallback(() => {
    if (endStatusRef.current === "saving") {
      return;
    }

    setListeningForAnswer(false);
    setEndStatus("declined");
    endStatusRef.current = "declined";
    setEndError(null);
    busyRef.current = true;

    speakText({
      text: "Understood. You can ask a question or read again.",
      preferredTtsVoice: preferredTtsVoiceRef.current,
      onEnd: () => {
        busyRef.current = false;
      },
      onError: () => {
        busyRef.current = false;
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
        // Continuous listening was replaced by push-to-talk; acknowledge only.
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
      clarifyAbortRef.current?.abort();
      const abort = new AbortController();
      clarifyAbortRef.current = abort;

      busyRef.current = true;
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
          signal: abort.signal,
        });

        const data = (await response.json().catch(() => null)) as {
          clarification?: string;
          error?: string;
          status?: number | null;
          message?: string;
          missingApiKey?: boolean;
        } | null;

        if (abort.signal.aborted) {
          return;
        }

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
            if (abort.signal.aborted) {
              return;
            }
            busyRef.current = false;
            setClarifyStatus("ready");
          },
          onError: (message) => {
            if (abort.signal.aborted) {
              return;
            }
            busyRef.current = false;
            setClarifyStatus("error");
            setClarifyError(message || "Clarification could not be spoken.");
          },
        });
      } catch (error) {
        if (abort.signal.aborted) {
          return;
        }
        busyRef.current = false;
        setClarifyStatus("error");
        setClarifyError(
          error instanceof Error
            ? error.message
            : "Clarification could not be completed.",
        );
        speakFeedback("Clarification failed.");
      }
    },
    [book, chapter, speakFeedback, translation, verses],
  );

  const handleListenStart = useCallback(() => {
    // Pause chapter reading as soon as the user taps Ask.
    setPauseRequestId((value) => value + 1);
  }, []);

  const handleListeningCue = useCallback(
    (onDone: () => void) => {
      speakFeedback("Listening.", onDone);
    },
    [speakFeedback],
  );

  const handleAskCancel = useCallback(() => {
    if (endStatusRef.current === "asking") {
      setListeningForAnswer(false);
      // Keep the understanding prompt and on-screen buttons available.
      return;
    }

    clarifyAbortRef.current?.abort();
    clarifyAbortRef.current = null;
    stopGrokSpeech();
    busyRef.current = false;
    setClarifyStatus("idle");
    setClarifyError(null);
    // Leave chapter reading paused so the user can resume.
    speakFeedback("Cancelled.");
  }, [speakFeedback]);

  const handleFinalTranscript = useCallback(
    (text: string): AskTranscriptResult => {
      if (busyRef.current) {
        return "ignored";
      }

      const trimmed = text.trim();
      const understandingPromptActive = endStatusRef.current === "asking";

      // Commands always win over clarification.
      const command = matchVoiceCommand(trimmed, {
        understandingPromptActive,
      });

      if (command) {
        setListeningForAnswer(false);
        executeCommand(command);
        return "command";
      }

      // While the understanding prompt is open, only accept yes/no answers.
      if (understandingPromptActive) {
        speakFeedback("Please say yes or no.", () => {
          if (endStatusRef.current === "asking") {
            setListeningForAnswer(true);
            setAnswerListenRequestId((value) => value + 1);
          }
        });
        return "ignored";
      }

      if (isLikelyReadingEcho(trimmed, verses, currentVerseRef.current)) {
        return "ignored";
      }

      if (!isPlausibleClarifyTranscript(trimmed)) {
        speakFeedback("Please ask a clearer question.");
        return "invalid";
      }

      void runClarify(trimmed);
      return "clarify";
    },
    [executeCommand, runClarify, speakFeedback, verses],
  );

  const askClarifyPhase: AskClarifyPhase =
    clarifyStatus === "loading"
      ? "processing"
      : clarifyStatus === "speaking"
        ? "speaking"
        : clarifyStatus === "ready"
          ? "ready"
          : clarifyStatus === "error"
            ? "error"
            : "idle";

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
        userId={userId}
        initialVerse={initialVerse}
        autoStart={autoStart}
        pauseRequestId={pauseRequestId}
        resumeRequestId={resumeRequestId}
        repeatRequestId={repeatRequestId}
        onCurrentVerseChange={handleCurrentVerseChange}
        onChapterEnd={beginUnderstandingCheck}
      />

      <AskQuestionControl
        onFinalTranscript={handleFinalTranscript}
        onListenStart={handleListenStart}
        onListeningCue={handleListeningCue}
        onCancel={handleAskCancel}
        clarifyPhase={askClarifyPhase}
        clarifyError={clarifyError}
        listenRequestId={answerListenRequestId}
        skipListeningCue={endStatus === "asking"}
        listenMode={endStatus === "asking" ? "understanding" : "question"}
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
        listeningForAnswer={listeningForAnswer}
        onBeginCheck={beginUnderstandingCheck}
        onYes={() => void confirmUnderstood()}
        onNo={declineUnderstood}
      />
    </div>
  );
}
