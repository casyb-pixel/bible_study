"use client";

import { useEffect, useRef, useState } from "react";

import {
  getSpeechRecognitionConstructor,
  isSpeechRecognitionSupported,
  type BrowserSpeechRecognition,
} from "@/lib/speech/recognition";

type ListeningControlsProps = {
  /** Called with finalized speech when listening is active and transcripts are accepted. */
  onFinalTranscript: (text: string) => void;
  /** When false, keep the mic session alive but do not emit transcripts (e.g. while TTS replies). */
  acceptTranscripts?: boolean;
  /** Increment to turn continuous listening off (voice command). */
  stopRequestId?: number;
};

type ListeningState = "off" | "starting" | "listening" | "error";

export function ListeningControls({
  onFinalTranscript,
  acceptTranscripts = true,
  stopRequestId = 0,
}: ListeningControlsProps) {
  const [listeningState, setListeningState] = useState<ListeningState>("off");
  const [recognizedText, setRecognizedText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const enabledRef = useRef(false);
  const onFinalTranscriptRef = useRef(onFinalTranscript);
  const acceptTranscriptsRef = useRef(acceptTranscripts);
  const restartTimerRef = useRef<number | null>(null);
  const lastStopRequestRef = useRef(0);

  onFinalTranscriptRef.current = onFinalTranscript;
  acceptTranscriptsRef.current = acceptTranscripts;

  useEffect(() => {
    setIsSupported(isSpeechRecognitionSupported());
  }, []);

  useEffect(() => {
    return () => {
      enabledRef.current = false;
      if (restartTimerRef.current !== null) {
        window.clearTimeout(restartTimerRef.current);
      }
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (stopRequestId <= lastStopRequestRef.current) {
      return;
    }
    lastStopRequestRef.current = stopRequestId;
    enabledRef.current = false;
    if (restartTimerRef.current !== null) {
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    setListeningState("off");
    setErrorMessage(null);
  }, [stopRequestId]);

  function clearRestartTimer() {
    if (restartTimerRef.current !== null) {
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  }

  function scheduleRestart() {
    clearRestartTimer();
    restartTimerRef.current = window.setTimeout(() => {
      if (enabledRef.current) {
        startRecognitionInstance();
      }
    }, 250);
  }

  function startRecognitionInstance() {
    const Recognition = getSpeechRecognitionConstructor();
    if (!Recognition || !enabledRef.current) {
      return;
    }

    recognitionRef.current?.abort();

    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      if (enabledRef.current) {
        setListeningState("listening");
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
        setRecognizedText(display);
      }

      if (finalText && acceptTranscriptsRef.current) {
        onFinalTranscriptRef.current(finalText);
      }
    };

    recognition.onerror = (event) => {
      if (!enabledRef.current) {
        return;
      }

      // Benign / recoverable cases — keep listening when possible.
      if (event.error === "no-speech" || event.error === "aborted") {
        return;
      }

      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        enabledRef.current = false;
        setListeningState("error");
        setErrorMessage("Microphone permission was denied.");
        return;
      }

      if (event.error === "network") {
        setErrorMessage(
          "Speech recognition needs a network connection in this browser.",
        );
        return;
      }

      setErrorMessage(`Listening error: ${event.error}`);
    };

    recognition.onend = () => {
      if (!enabledRef.current) {
        setListeningState("off");
        return;
      }
      // Keep continuous listening alive.
      scheduleRestart();
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      scheduleRestart();
    }
  }

  async function enableListening() {
    setErrorMessage(null);
    setListeningState("starting");

    if (!isSpeechRecognitionSupported()) {
      setListeningState("error");
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
      setListeningState("error");
      setErrorMessage("Microphone permission was denied or unavailable.");
      return;
    }

    enabledRef.current = true;
    setRecognizedText("");
    startRecognitionInstance();
  }

  function disableListening() {
    enabledRef.current = false;
    clearRestartTimer();
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    setListeningState("off");
    setErrorMessage(null);
  }

  if (!isSupported) {
    return (
      <div className="mt-6 border-t border-neutral-200 pt-6">
        <p className="text-sm font-medium text-neutral-800">Listening</p>
        <p className="mt-2 text-sm text-neutral-600">
          Continuous listening is not available in this browser. Chrome or Edge
          on desktop usually works best.
        </p>
      </div>
    );
  }

  const isActive =
    listeningState === "listening" || listeningState === "starting";

  return (
    <div className="mt-6 border-t border-neutral-200 pt-6">
      <p className="text-sm font-medium text-neutral-800">Listening</p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {isActive ? (
          <button
            type="button"
            onClick={disableListening}
            className="border border-neutral-800 px-3 py-1.5 text-sm text-neutral-900 hover:bg-neutral-100"
          >
            Stop listening
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void enableListening()}
            className="border border-neutral-800 px-3 py-1.5 text-sm text-neutral-900 hover:bg-neutral-100"
          >
            Enable listening
          </button>
        )}

        {isActive ? (
          <span className="inline-flex items-center gap-2 text-sm text-neutral-700">
            <span
              className="inline-block h-2 w-2 rounded-full bg-neutral-800"
              aria-hidden
            />
            {listeningState === "starting" ? "Starting…" : "Microphone active"}
          </span>
        ) : null}
      </div>

      {errorMessage ? (
        <p className="mt-3 text-sm text-neutral-600">{errorMessage}</p>
      ) : null}

      <div className="mt-4 min-h-[3rem] border border-neutral-200 bg-neutral-50 px-3 py-2">
        <p className="text-xs uppercase tracking-wide text-neutral-500">
          Heard
        </p>
        <p className="mt-1 text-sm text-neutral-800" aria-live="polite">
          {recognizedText || "—"}
        </p>
      </div>
    </div>
  );
}
