import {
  loadReadingSpeed,
  readingSpeedToRate,
} from "@/lib/speech/reading-speed";
import {
  DEFAULT_GROK_TTS_VOICE,
  type GrokTtsVoiceId,
} from "@/lib/speech/grok-voices";

export type GrokSpeakOptions = {
  text: string;
  voiceId: GrokTtsVoiceId | string;
  speed?: number;
  onEnd?: () => void;
  onError?: (message: string) => void;
};

type ActivePlayback = {
  audio: HTMLAudioElement;
  objectUrl: string;
  abort: AbortController;
};

let active: ActivePlayback | null = null;

export function stopGrokSpeech(): void {
  if (!active) {
    return;
  }
  active.abort.abort();
  active.audio.onended = null;
  active.audio.onerror = null;
  active.audio.pause();
  active.audio.removeAttribute("src");
  URL.revokeObjectURL(active.objectUrl);
  active = null;
}

export function pauseGrokSpeech(): void {
  active?.audio.pause();
}

export function resumeGrokSpeech(): boolean {
  if (!active) {
    return false;
  }
  void active.audio.play().catch(() => {
    // ignore resume failures; caller may restart
  });
  return true;
}

export function isGrokSpeechPaused(): boolean {
  return Boolean(active && active.audio.paused && !active.audio.ended);
}

/**
 * Speak via /api/tts (xAI Grok). Does not fall back to browser voices.
 */
export async function speakWithGrok({
  text,
  voiceId,
  speed,
  onEnd,
  onError,
}: GrokSpeakOptions): Promise<void> {
  if (typeof window === "undefined") {
    onError?.("Speech is only available in the browser.");
    return;
  }

  const trimmed = text.trim();
  if (!trimmed) {
    onEnd?.();
    return;
  }

  stopGrokSpeech();

  const abort = new AbortController();
  const resolvedSpeed = speed ?? readingSpeedToRate(loadReadingSpeed());

  try {
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: trimmed,
        voiceId: voiceId || DEFAULT_GROK_TTS_VOICE,
        language: "en",
        speed: resolvedSpeed,
      }),
      signal: abort.signal,
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      throw new Error(data?.error || `Grok TTS failed (HTTP ${response.status})`);
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const audio = new Audio(objectUrl);

    active = { audio, objectUrl, abort };

    audio.onended = () => {
      stopGrokSpeech();
      onEnd?.();
    };
    audio.onerror = () => {
      stopGrokSpeech();
      onError?.("Audio playback failed.");
    };

    await audio.play();
  } catch (error) {
    if (abort.signal.aborted) {
      return;
    }
    stopGrokSpeech();
    const message =
      error instanceof Error ? error.message : "Grok TTS request failed.";
    onError?.(message);
  }
}
