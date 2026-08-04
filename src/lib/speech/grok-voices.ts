export type GrokTtsVoiceId =
  | "leo"
  | "rex"
  | "orion"
  | "eve"
  | "ara"
  | "luna";

export type GrokTtsVoice = {
  id: GrokTtsVoiceId;
  label: string;
  gender: "male" | "female";
};

/** Curated high-quality Grok voices offered in the app. */
export const GROK_TTS_VOICES: readonly GrokTtsVoice[] = [
  { id: "leo", label: "Leo", gender: "male" },
  { id: "rex", label: "Rex", gender: "male" },
  { id: "orion", label: "Orion", gender: "male" },
  { id: "eve", label: "Eve", gender: "female" },
  { id: "ara", label: "Ara", gender: "female" },
  { id: "luna", label: "Luna", gender: "female" },
] as const;

export const DEFAULT_GROK_TTS_VOICE: GrokTtsVoiceId = "leo";

export function isGrokTtsVoiceId(value: unknown): value is GrokTtsVoiceId {
  return (
    typeof value === "string" &&
    GROK_TTS_VOICES.some((voice) => voice.id === value)
  );
}

export function getGrokTtsVoice(id: string): GrokTtsVoice {
  return (
    GROK_TTS_VOICES.find((voice) => voice.id === id) ??
    GROK_TTS_VOICES.find((voice) => voice.id === DEFAULT_GROK_TTS_VOICE)!
  );
}

export function resolveGrokTtsVoiceId(
  value?: string | null,
): GrokTtsVoiceId {
  if (isGrokTtsVoiceId(value)) {
    return value;
  }
  return DEFAULT_GROK_TTS_VOICE;
}
