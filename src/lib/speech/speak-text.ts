import {
  loadReadingSpeed,
  readingSpeedToRate,
} from "@/lib/speech/reading-speed";
import {
  selectSpeechVoice,
  type PreferredVoiceGender,
} from "@/lib/speech/select-voice";

export type SpeakTextOptions = {
  text: string;
  preferredVoice: PreferredVoiceGender;
  onEnd?: () => void;
  onError?: () => void;
};

/**
 * Speak plain text with the same preferred voice and session reading speed
 * used by chapter Read aloud.
 */
export function speakText({
  text,
  preferredVoice,
  onEnd,
  onError,
}: SpeakTextOptions): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    onError?.();
    return;
  }

  const trimmed = text.trim();
  if (!trimmed) {
    onEnd?.();
    return;
  }

  const run = () => {
    const voice = selectSpeechVoice(
      preferredVoice,
      window.speechSynthesis.getVoices(),
    );
    const utterance = new SpeechSynthesisUtterance(trimmed);
    utterance.lang = voice?.lang ?? "en-US";
    if (voice) {
      utterance.voice = voice;
    }
    utterance.rate = readingSpeedToRate(loadReadingSpeed());
    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onError?.();
    window.speechSynthesis.speak(utterance);
  };

  window.speechSynthesis.cancel();

  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) {
    const onVoices = () => {
      window.speechSynthesis.removeEventListener("voiceschanged", onVoices);
      run();
    };
    window.speechSynthesis.addEventListener("voiceschanged", onVoices);
    window.setTimeout(run, 250);
    return;
  }

  run();
}
