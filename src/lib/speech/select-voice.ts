export type PreferredVoiceGender = "male" | "female";

const FEMALE_HINT =
  /female|zira|samantha|susan|hazel|victoria|karen|moira|tessa|fiona|woman|girl|jenny|aria|sara|siri/i;
const MALE_HINT =
  /male|david|mark|daniel|james|george|fred|tom|guy|man|boy|ryan|christopher|eric|richard|steffan/i;

/**
 * Choose a local speechSynthesis voice matching preferred gender when possible.
 * Falls back to the first English voice, then any available voice.
 */
export function selectSpeechVoice(
  preferred: PreferredVoiceGender,
  voices: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | null {
  if (voices.length === 0) {
    return null;
  }

  const english = voices.filter((voice) =>
    voice.lang.toLowerCase().startsWith("en"),
  );
  const pool = english.length > 0 ? english : voices;

  const preferredHint = preferred === "female" ? FEMALE_HINT : MALE_HINT;
  const otherHint = preferred === "female" ? MALE_HINT : FEMALE_HINT;

  const preferredMatch = pool.find(
    (voice) =>
      preferredHint.test(voice.name) && !otherHint.test(voice.name),
  );
  if (preferredMatch) {
    return preferredMatch;
  }

  // Avoid clearly opposite-gender named voices when possible.
  const nonOpposite = pool.find((voice) => !otherHint.test(voice.name));
  return nonOpposite ?? pool[0] ?? null;
}
