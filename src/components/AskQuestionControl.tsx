"use client";

import { useEffect, useRef, useState } from "react";

import {
  getSpeechRecognitionConstructor,
  isSpeechRecognitionSupported,
  type BrowserSpeechRecognition,
} from "@/lib/speech/recognition";

type AskQuestionControlProps = {
  /** Called once with the finalized utterance from a push-to-talk session. */
  onFinalTranscript: (text: string) => void;
  /** When false, the ask button is disabled (e.g. while clarifying). */
  disabled?: boolean;
  /** Fired as soon as the user starts a listen session (pause reading). */
  onListenStart?: () => void;
};

type AskState = "idle" | "starting" | "listening" | "error";

export function AskQuestionControl({
  onFinalTranscript,
  disabled = false,
  onListenStart,
}: AskQuestionControlProps) {
  const [askState, setAskState] = useState<AskState>("idle");
  const [heardText, setHeardText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const activeRef = useRef(false);
  const emittedRef = useRef(false);
  const onFinalTranscriptRef = useRef(onFinalTranscript);
  const onListenStartRef = useRef(onListenStart);

  onFinalTranscriptRef.current = onFinalTranscript;
  onListenStartRef.current = onListenStart;

  useEffect(() => {
    setIsSupported(isSpeechRecognitionSupported());
  }, []);

  useEffect(() => {
    return () => {
      activeRef.current = false;
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (disabled && activeRef.current) {
      stopListening();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stop only when disabled flips on
  }, [disabled]);

  function stopListening() {
    activeRef.current = false;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setAskState("idle");
  }

  function finishWithTranscript(text: string) {
    if (emittedRef.current) {
      return;
    }
    emittedRef.current = true;
    activeRef.current = false;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setAskState("idle");
    setHeardText(text);
    onFinalTranscriptRef.current(text);
  }

  function startRecognitionInstance() {
    const Recognition = getSpeechRecognitionConstructor();
    if (!Recognition || !activeRef.current) {
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
      if (activeRef.current) {
        setAskState("listening");
        setErrorMessage(null);
      }
    };

    recognition.onresult = (event) => {
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
      if (!activeRef.current) {
        return;
      }

      if (event.error === "aborted") {
        return;
      }

      if (event.error === "no-speech") {
        activeRef.current = false;
        recognitionRef.current = null;
        setAskState("idle");
        setErrorMessage("No speech heard. Tap Ask a question to try again.");
        return;
      }

      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        activeRef.current = false;
        recognitionRef.current = null;
        setAskState("error");
        setErrorMessage("Microphone permission was denied.");
        return;
      }

      if (event.error === "network") {
        activeRef.current = false;
        recognitionRef.current = null;
        setAskState("error");
        setErrorMessage(
          "Speech recognition needs a network connection in this browser.",
        );
        return;
      }

      activeRef.current = false;
      recognitionRef.current = null;
      setAskState("error");
      setErrorMessage(`Listening error: ${event.error}`);
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      if (!activeRef.current || emittedRef.current) {
        if (!emittedRef.current) {
          setAskState("idle");
        }
        activeRef.current = false;
        return;
      }
      // Session ended without a final result (silence).
      activeRef.current = false;
      setAskState("idle");
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      activeRef.current = false;
      setAskState("error");
      setErrorMessage("Could not start listening.");
    }
  }

  async function handleAsk() {
    if (disabled || activeRef.current) {
      return;
    }

    setErrorMessage(null);
    setHeardText("");
    setAskState("starting");
    onListenStartRef.current?.();

    if (!isSpeechRecognitionSupported()) {
      setAskState("error");
      setErrorMessage("Speech recognition is not available in this browser.");
      return;
    }

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Microphone access is not available in this browser.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
    } catch {
      setAskState("error");
      setErrorMessage("Microphone permission was denied or unavailable.");
      return;
    }

    activeRef.current = true;
    startRecognitionInstance();
  }

  function handleCancel() {
    stopListening();
    setErrorMessage(null);
  }

  const isListening =
    askState === "listening" || askState === "starting";

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
            {isListening ? (
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 border border-neutral-800 bg-neutral-100 px-4 py-3 text-sm text-neutral-900"
              >
                {askState === "starting" ? "Starting…" : "Listening… Tap to cancel"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleAsk()}
                disabled={disabled}
                className="flex-1 border border-neutral-800 px-4 py-3 text-sm text-neutral-900 hover:bg-neutral-100 disabled:opacity-50"
              >
                Ask a question
              </button>
            )}
          </div>
        )}

        {isListening ? (
          <p className="text-xs text-neutral-500" aria-live="polite">
            Speak your question, then pause when finished.
            {heardText ? ` Heard: ${heardText}` : ""}
          </p>
        ) : null}

        {errorMessage ? (
          <p className="text-xs text-neutral-600">{errorMessage}</p>
        ) : null}
      </div>
    </div>
  );
}
