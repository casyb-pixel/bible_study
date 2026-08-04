export const UNDERSTANDING_QUESTION = "Have you understood this chapter?";

export type UnderstandingAnswer = "yes" | "no" | null;

function normalizeAnswer(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Parse a short spoken or typed yes / no understanding reply. */
export function parseUnderstandingAnswer(text: string): UnderstandingAnswer {
  const normalized = normalizeAnswer(text);
  if (!normalized) {
    return null;
  }

  if (
    /^(yes|yeah|yep|yea|y)$/.test(normalized) ||
    /^(i understand|i do|understood|confirm|confirmed)$/.test(normalized) ||
    /\bi understand\b/.test(normalized) ||
    normalized.startsWith("yes ")
  ) {
    return "yes";
  }

  if (
    /^(no|nope|nah)$/.test(normalized) ||
    /^(not yet|i do not understand|i don't understand|do not understand|don't understand)$/.test(
      normalized,
    ) ||
    normalized.startsWith("no ") ||
    normalized.startsWith("not yet")
  ) {
    return "no";
  }

  return null;
}
