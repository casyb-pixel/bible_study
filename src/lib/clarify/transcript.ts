type Verse = {
  verse: number;
  text: string;
};

function normalizeSpeech(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Short or empty finals are ignored for clarification requests. */
export function isPlausibleClarifyTranscript(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 8) {
    return false;
  }
  const words = trimmed.split(/\s+/).filter(Boolean);
  return words.length >= 2;
}

/**
 * Detect when recognition likely heard chapter TTS rather than the reader.
 */
export function isLikelyReadingEcho(
  transcript: string,
  verses: Verse[],
  currentVerse: number | null,
): boolean {
  const normalized = normalizeSpeech(transcript);
  if (normalized.length < 24) {
    return false;
  }

  const around =
    currentVerse == null
      ? verses
      : verses.filter(
          (verse) =>
            verse.verse >= currentVerse - 1 && verse.verse <= currentVerse + 1,
        );

  const haystack = normalizeSpeech(
    around.map((verse) => verse.text).join(" "),
  );
  if (!haystack) {
    return false;
  }

  if (haystack.includes(normalized)) {
    return true;
  }

  const words = normalized.split(" ").filter((word) => word.length > 3);
  if (words.length < 5) {
    return false;
  }

  const matched = words.filter((word) => haystack.includes(word)).length;
  return matched / words.length >= 0.85;
}

/** Recent verses around the reading position for API context. */
export function selectRecentVerses(
  verses: Verse[],
  currentVerse: number | null,
  radius = 4,
): Verse[] {
  if (verses.length === 0) {
    return [];
  }
  if (currentVerse == null) {
    return verses.slice(0, Math.min(verses.length, radius * 2 + 1));
  }

  return verses.filter(
    (verse) =>
      verse.verse >= currentVerse - radius &&
      verse.verse <= currentVerse + radius,
  );
}
