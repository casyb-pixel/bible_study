import { speakWithGrok, stopGrokSpeech } from "@/lib/speech/grok-speak";
import {
  DEFAULT_GROK_TTS_VOICE,
  type GrokTtsVoiceId,
} from "@/lib/speech/grok-voices";

export type SpeakTextOptions = {
  text: string;
  preferredTtsVoice?: GrokTtsVoiceId | string;
  onEnd?: () => void;
  onError?: (message?: string) => void;
};

/**
 * Speak plain text with Grok TTS using the user's preferred voice and
 * session reading speed. Does not fall back to browser voices.
 */
export function speakText({
  text,
  preferredTtsVoice = DEFAULT_GROK_TTS_VOICE,
  onEnd,
  onError,
}: SpeakTextOptions): void {
  stopGrokSpeech();
  void speakWithGrok({
    text,
    voiceId: preferredTtsVoice,
    onEnd,
    onError: (message) => onError?.(message),
  });
}
