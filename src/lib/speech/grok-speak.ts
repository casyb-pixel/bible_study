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

type PrefetchEntry = {
  key: string;
  promise: Promise<Blob>;
  abort: AbortController;
};

let active: ActivePlayback | null = null;
let prefetch: PrefetchEntry | null = null;

function playbackKey(
  text: string,
  voiceId: string,
  speed: number,
): string {
  return `${voiceId}|${speed}|${text}`;
}

function resolveSpeed(speed?: number): number {
  return speed ?? readingSpeedToRate(loadReadingSpeed());
}

async function fetchTtsBlob(input: {
  text: string;
  voiceId: string;
  speed: number;
  signal: AbortSignal;
}): Promise<Blob> {
  const response = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: input.text,
      voiceId: input.voiceId || DEFAULT_GROK_TTS_VOICE,
      language: "en",
      speed: input.speed,
    }),
    signal: input.signal,
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(data?.error || `Grok TTS failed (HTTP ${response.status})`);
  }

  return response.blob();
}

export function clearGrokPrefetch(): void {
  if (!prefetch) {
    return;
  }
  prefetch.abort.abort();
  prefetch = null;
}

/**
 * Warm the next verse audio while the current verse plays so verse-to-verse
 * transitions have little or no network gap.
 */
export function prefetchGrokSpeech({
  text,
  voiceId,
  speed,
}: {
  text: string;
  voiceId: GrokTtsVoiceId | string;
  speed?: number;
}): void {
  if (typeof window === "undefined") {
    return;
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return;
  }

  const resolvedSpeed = resolveSpeed(speed);
  const key = playbackKey(trimmed, String(voiceId), resolvedSpeed);

  if (prefetch?.key === key) {
    return;
  }

  clearGrokPrefetch();

  const abort = new AbortController();
  const promise = fetchTtsBlob({
    text: trimmed,
    voiceId: String(voiceId),
    speed: resolvedSpeed,
    signal: abort.signal,
  }).catch((error) => {
    if (prefetch?.key === key) {
      prefetch = null;
    }
    throw error;
  });

  prefetch = { key, promise, abort };
}

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
 * Uses a matching prefetch blob when available for continuous verse reading.
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

  const resolvedSpeed = resolveSpeed(speed);
  const key = playbackKey(trimmed, String(voiceId), resolvedSpeed);
  const playbackAbort = new AbortController();

  let blob: Blob | null = null;

  if (prefetch?.key === key) {
    const entry = prefetch;
    prefetch = null;
    try {
      blob = await entry.promise;
    } catch {
      blob = null;
    }
  }

  stopGrokSpeech();

  try {
    if (!blob) {
      blob = await fetchTtsBlob({
        text: trimmed,
        voiceId: String(voiceId),
        speed: resolvedSpeed,
        signal: playbackAbort.signal,
      });
    }

    const objectUrl = URL.createObjectURL(blob);
    const audio = new Audio(objectUrl);

    active = { audio, objectUrl, abort: playbackAbort };

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
    if (playbackAbort.signal.aborted) {
      return;
    }
    stopGrokSpeech();
    const message =
      error instanceof Error ? error.message : "Grok TTS request failed.";
    onError?.(message);
  }
}
