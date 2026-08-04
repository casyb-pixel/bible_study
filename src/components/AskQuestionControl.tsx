"use client";

import { useEffect, useRef, useState } from "react";

import {
  getSpeechRecognitionConstructor,
  isSpeechRecognitionSupported,
  type BrowserSpeechRecognition,
} from "@/lib/speech/recognition";

/** Result of routing a finished utterance (command first, then clarify). */
export type AskTranscriptResult =
  | "command"
  | "clarify"
  | "ignored"
  | "invalid";

/** Parent-driven clarify / reply phase for the bottom bar. */
export type AskClarifyPhase =
  | "idle"
  | "processing"
  | "speaking"
  | "ready"
  | "error";

export type AskListenMode = "question" | "understanding";

type AskQuestionControlProps = {
  /**
   * Route a finalized utterance. Must run the short-command matcher first;
   * return "clarify" only when /api/clarify should run.
   */
  onFinalTranscript: (text: string) => AskTranscriptResult;
  /** Abort listening / in-flight clarify; leave reading paused for resume. */
  onCancel: () => void;
  /** Fired as soon as the user starts asking (pause reading). */
  onListenStart?: () => void;
  /** Optional spoken “Listening.” cue before the mic opens. */
  onListeningCue?: (onDone: () => void) => void;
  clarifyPhase?: AskClarifyPhase;
  clarifyError?: string | null;
  /**
   * Increment to open a single recognition session without tapping
   * (e.g. after the chapter-end understanding question).
   */
  listenRequestId?: number;
  /** When true, skip the spoken “Listening.” cue and open the mic directly. */
  skipListeningCue?: boolean;
  /** Changes bottom-bar copy for chapter-end yes/no answers. */
  listenMode?: AskListenMode;
};

type LocalPhase = "idle" | "cue" | "starting" | "listening" | "error";

export function AskQuestionControl({
  onFinalTranscript,
  onCancel,
  onListenStart,
  onListeningCue,
  clarifyPhase = "idle",
  clarifyError = null,
  listenRequestId = 0,
  skipListeningCue = false,
  listenMode = "question",
}: AskQuestionControlProps) {
  const [localPhase, setLocalPhase] = useState<LocalPhase>("idle");
  const [heardText, setHeardText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const activeRef = useRef(false);
  const emittedRef = useRef(false);
  const cancelledRef = useRef(false);
  const lastListenRequestRef = useRef(0);
  const onFinalTranscriptRef = useRef(onFinalTranscript);
  const onListenStartRef = useRef(onListenStart);
  const onListeningCueRef = useRef(onListeningCue);
  const onCancelRef = useRef(onCancel);
  const skipListeningCueRef = useRef(skipListeningCue);

  onFinalTranscriptRef.current = onFinalTranscript;
  onListenStartRef.current = onListenStart;
  onListeningCueRef.current = onListeningCue;
  onCancelRef.current = onCancel;
  skipListeningCueRef.current = skipListeningCue;

  useEffect(() => {
    setIsSupported(isSpeechRecognitionSupported());
  }, []);

  useEffect(() => {
    return () => {
      activeRef.current = false;
      cancelledRef.current = true;
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  // Mirror parent clarify errors into the bar when not in a listen session.
  useEffect(() => {
    if (clarifyPhase === "error" && clarifyError) {
      setErrorMessage(clarifyError);
      setLocalPhase("error");
      return;
    }
    if (
      (clarifyPhase === "ready" || clarifyPhase === "idle") &&
      localPhase === "error" &&
      !clarifyError
    ) {
      // Keep local recognition errors until the next ask.
      return;
    }
    if (clarifyPhase === "ready") {
      setLocalPhase((phase) =>
        phase === "listening" || phase === "starting" || phase === "cue"
          ? phase
          : "idle",
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync from parent clarify only
  }, [clarifyPhase, clarifyError]);

  function abortRecognition() {
    activeRef.current = false;
    recognitionRef.current?.abort();
    recognitionRef.current = null;
  }

  function finishWithTranscript(text: string) {
    if (emittedRef.current || cancelledRef.current) {
      return;
    }
    emittedRef.current = true;
    activeRef.current = false;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setHeardText(text);

    const result = onFinalTranscriptRef.current(text);
    if (result === "clarify") {
      // Parent will show processing / speaking via clarifyPhase.
      setLocalPhase("idle");
      setErrorMessage(null);
      return;
    }
    if (result === "invalid") {
      setLocalPhase("error");
      setErrorMessage("Please ask a clearer question, or say a short command.");
      return;
    }
    // command or ignored
    setLocalPhase("idle");
    setErrorMessage(null);
  }

  function startRecognitionInstance() {
    const Recognition = getSpeechRecognitionConstructor();
    if (!Recognition || !activeRef.current || cancelledRef.current) {
      setLocalPhase("idle");
      return;
    }

    recognitionRef.current?.abort();
    emittedRef.current = false;

    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      if (activeRef.current && !cancelledRef.current) {
        setLocalPhase("listening");
        setErrorMessage(null);
      }
    };

    recognition.onresult = (event) => {
      if (cancelledRef.current) {
        return;
      }

      let interim = "";
      let finalText = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result[0]?.transcript?.trim() ?? "";
        if (!transcript) {
          continue;
        }
        if (result.isFinal) {
          finalText = `${finalText} ${transcript}`.trim();
        } else {
          interim = `${interim} ${transcript}`.trim();
        }
      }

      const display = finalText || interim;
      if (display) {
        setHeardText(display);
      }

      if (finalText) {
        finishWithTranscript(finalText);
      }
    };

    recognition.onerror = (event) => {
      if (!activeRef.current || cancelledRef.current) {
        return;
      }

      if (event.error === "aborted") {
        return;
      }

      activeRef.current = false;
      recognitionRef.current = null;

      if (event.error === "no-speech") {
        setLocalPhase("error");
        setErrorMessage("No speech heard. Tap Ask a question to try again.");
        return;
      }

      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setLocalPhase("error");
        setErrorMessage("Microphone permission was denied.");
        return;
      }

      if (event.error === "network") {
        setLocalPhase("error");
        setErrorMessage("Speech recognition needs a network connection.");
        return;
      }

      setLocalPhase("error");
      setErrorMessage("Listening failed. Try again.");
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      if (cancelledRef.current || emittedRef.current) {
        activeRef.current = false;
        return;
      }
      if (!activeRef.current) {
        return;
      }
      activeRef.current = false;
      setLocalPhase("error");
      setErrorMessage("No speech heard. Tap Ask a question to try again.");
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      activeRef.current = false;
      setLocalPhase("error");
      setErrorMessage("Could not start listening.");
    }
  }

  async function beginMicSession() {
    if (cancelledRef.current) {
      setLocalPhase("idle");
      return;
    }

    setLocalPhase("starting");

    if (!isSpeechRecognitionSupported()) {
      setLocalPhase("error");
      setErrorMessage("Speech recognition is not available in this browser.");
      return;
    }

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Microphone access is not available.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
    } catch {
      setLocalPhase("error");
      setErrorMessage("Microphone permission was denied or unavailable.");
      return;
    }

    if (cancelledRef.current) {
      setLocalPhase("idle");
      return;
    }

    activeRef.current = true;
    startRecognitionInstance();
  }

  function startListenSession(options?: { skipCue?: boolean }) {
    if (
      localPhase === "cue" ||
      localPhase === "starting" ||
      localPhase === "listening" ||
      clarifyPhase === "processing" ||
      clarifyPhase === "speaking"
    ) {
      return;
    }

    cancelledRef.current = false;
    setErrorMessage(null);
    setHeardText("");
    onListenStartRef.current?.();

    const shouldSkipCue =
      options?.skipCue === true || skipListeningCueRef.current;
    const cue = onListeningCueRef.current;
    if (!shouldSkipCue && cue) {
      setLocalPhase("cue");
      cue(() => {
        if (cancelledRef.current) {
          setLocalPhase("idle");
          return;
        }
        void beginMicSession();
      });
      return;
    }

    void beginMicSession();
  }

  function handleAsk() {
    startListenSession();
  }

  useEffect(() => {
    if (listenRequestId <= lastListenRequestRef.current) {
      return;
    }
    lastListenRequestRef.current = listenRequestId;
    startListenSession({ skipCue: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- trigger only on request id
  }, [listenRequestId]);

  // Stop an answer-listen session when the parent leaves understanding mode
  // (button yes/no, save, or decline).
  useEffect(() => {
    if (listenMode === "understanding") {
      return;
    }
    if (!activeRef.current && localPhase === "idle") {
      return;
    }
    if (
      localPhase === "cue" ||
      localPhase === "starting" ||
      localPhase === "listening"
    ) {
      cancelledRef.current = true;
      abortRecognition();
      setLocalPhase("idle");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- react to mode exit only
  }, [listenMode]);

  function handleCancel() {
    cancelledRef.current = true;
    abortRecognition();
    setHeardText("");
    setErrorMessage(null);
    setLocalPhase("idle");
    onCancelRef.current();
  }

  const isListeningUi =
    localPhase === "cue" ||
    localPhase === "starting" ||
    localPhase === "listening";
  const isProcessingUi = clarifyPhase === "processing";
  const isSpeakingUi = clarifyPhase === "speaking";
  const showCancel = isListeningUi || isProcessingUi || isSpeakingUi;
  const understandingMode = listenMode === "understanding";

  let primaryLabel = "Ask a question";
  let statusLine: string | null = null;

  if (isListeningUi) {
    if (understandingMode) {
      primaryLabel =
        localPhase === "starting" || localPhase === "cue"
          ? "Starting…"
          : "Listening for your answer…";
      statusLine = heardText
        ? `Heard: ${heardText}`
        : "Say yes / I understand, or not yet / no.";
    } else {
      primaryLabel =
        localPhase === "cue"
          ? "Preparing…"
          : localPhase === "starting"
            ? "Starting…"
            : "Listening…";
      statusLine = heardText
        ? `Heard: ${heardText}`
        : "Speak a short command or your question, then pause.";
    }
  } else if (isProcessingUi) {
    primaryLabel = "Getting clarification…";
    statusLine = heardText ? `Question: ${heardText}` : null;
  } else if (isSpeakingUi) {
    primaryLabel = "Speaking reply…";
    statusLine = null;
  } else if (localPhase === "error" || clarifyPhase === "error") {
    primaryLabel = "Ask a question";
    statusLine = understandingMode
      ? `${errorMessage || clarifyError || "Could not hear an answer."} Use the buttons above, or tap Ask a question to try again.`
      : errorMessage || clarifyError;
  } else if (clarifyPhase === "ready") {
    primaryLabel = "Ask a question";
    statusLine = "Reply finished. Resume reading when ready.";
  }

  const micActive = localPhase === "listening";

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 backdrop-blur-sm"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="mx-auto flex max-w-xl flex-col gap-2 px-6 py-3">
        {!isSupported ? (
          <p className="text-sm text-neutral-600">
            Asking by voice is not available in this browser. Chrome or Edge
            usually works best.
          </p>
        ) : (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (!showCancel) {
                  handleAsk();
                }
              }}
              disabled={showCancel}
              aria-live="polite"
              className={[
                "flex min-h-[2.75rem] flex-1 items-center justify-center gap-2 border px-4 py-3 text-sm",
                showCancel
                  ? "border-neutral-800 bg-neutral-100 text-neutral-900"
                  : "border border-neutral-800 text-neutral-900 hover:bg-neutral-100",
              ].join(" ")}
            >
              {micActive ? (
                <span
                  className="inline-block h-2 w-2 shrink-0 rounded-full bg-neutral-800"
                  aria-hidden
                />
              ) : null}
              {primaryLabel}
            </button>

            {showCancel ? (
              <button
                type="button"
                onClick={handleCancel}
                className="shrink-0 border border-neutral-400 px-4 py-3 text-sm text-neutral-800 hover:bg-neutral-100"
              >
                Cancel
              </button>
            ) : null}
          </div>
        )}

        {statusLine ? (
          <p
            className={
              localPhase === "error" || clarifyPhase === "error"
                ? "text-xs text-neutral-600"
                : "text-xs text-neutral-500"
            }
            aria-live="polite"
          >
            {statusLine}
          </p>
        ) : null}
      </div>
    </div>
  );
}
