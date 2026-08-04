export type VoiceCommand =
  | "resume"
  | "pause"
  | "stop_listening"
  | "next_chapter"
  | "previous_chapter"
  | "repeat"
  | "confirm_understanding"
  | "decline_understanding";

export type MatchVoiceCommandOptions = {
  understandingPromptActive?: boolean;
};

const COMMAND_FEEDBACK: Record<VoiceCommand, string> = {
  resume: "Resuming.",
  pause: "Paused.",
  stop_listening: "Use Ask a question when you want to speak.",
  next_chapter: "Next chapter.",
  previous_chapter: "Previous chapter.",
  repeat: "Repeating.",
  confirm_understanding: "",
  decline_understanding: "",
};

const COMMAND_LABELS: Record<VoiceCommand, string> = {
  resume: "Resume",
  pause: "Pause",
  stop_listening: "Ask later",
  next_chapter: "Next chapter",
  previous_chapter: "Previous chapter",
  repeat: "Repeat",
  confirm_understanding: "I understand",
  decline_understanding: "Not yet",
};

/** Phrases that strongly suggest a clarification question, not a command. */
const QUESTION_HINT =
  /\b(what|why|how|who|whom|whose|when|where|which|explain|mean|means|meaning|clarify|tell me about)\b/i;

function normalizeTranscript(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Remove light polite wrappers so “could you resume please” → “resume”. */
function stripPoliteWrappers(text: string): string {
  return text
    .replace(/^(please\s+)+/, "")
    .replace(/^(could you|can you|would you|will you|would you please|can you please)\s+/, "")
    .replace(/^(please\s+)+/, "")
    .replace(/\s+(please|thanks|thank you)$/, "")
    .trim();
}

type PatternRule = {
  command: VoiceCommand;
  pattern: RegExp;
  /** Only match while the chapter-end understanding prompt is active. */
  requiresUnderstandingPrompt?: boolean;
};

/**
 * Whole-string patterns after polite stripping.
 * Conservative: real questions should fail these full-string matches.
 */
const RULES: PatternRule[] = [
  {
    command: "resume",
    pattern: /^(resume|continue|keep reading|continue reading|resume reading)$/,
  },
  {
    command: "pause",
    pattern: /^(pause|stop reading|pause reading)$/,
  },
  {
    command: "stop_listening",
    pattern:
      /^(stop listening|turn off mic|turn off the mic|turn off microphone|turn off the microphone|disable listening|microphone off)$/,
  },
  {
    command: "next_chapter",
    pattern:
      /^(next chapter|go to next|go to the next|go to the next chapter|go next)$/,
  },
  {
    command: "previous_chapter",
    pattern:
      /^(previous chapter|go back|go to previous|go to the previous|go to the previous chapter)$/,
  },
  {
    command: "repeat",
    pattern:
      /^(repeat|read that again|read it again|say that again|repeat that|repeat verse|read again)$/,
  },
  {
    command: "confirm_understanding",
    requiresUnderstandingPrompt: true,
    pattern:
      /^(yes|yeah|yep|yea|y|i understand|i do|understood|confirm|confirmed)$/,
  },
  {
    command: "decline_understanding",
    requiresUnderstandingPrompt: true,
    pattern:
      /^(no|nope|nah|not yet|i do not understand|i don't understand|do not understand|don't understand)$/,
  },
];

/**
 * Match a final transcript to a core voice command.
 * Returns null when the speech should be treated as clarification (or ignored).
 * Conservative: only short, whole-phrase commands match — real questions fall through.
 */
export function matchVoiceCommand(
  text: string,
  options: MatchVoiceCommandOptions = {},
): VoiceCommand | null {
  const normalized = normalizeTranscript(text);
  if (!normalized) {
    return null;
  }

  // Interrogative punctuation or long speech is never a command.
  if (/[?]/.test(text)) {
    return null;
  }

  const words = normalized.split(" ").filter(Boolean);
  if (words.length > 6) {
    return null;
  }
  if (QUESTION_HINT.test(normalized) && words.length > 2) {
    return null;
  }

  const core = stripPoliteWrappers(normalized);
  if (!core) {
    return null;
  }

  // After stripping, still reject leftover question-like phrasing.
  const coreWords = core.split(" ").filter(Boolean);
  if (coreWords.length > 6) {
    return null;
  }

  for (const rule of RULES) {
    if (rule.requiresUnderstandingPrompt && !options.understandingPromptActive) {
      continue;
    }
    if (rule.pattern.test(core)) {
      return rule.command;
    }
  }

  return null;
}

export function voiceCommandFeedback(command: VoiceCommand): string {
  return COMMAND_FEEDBACK[command];
}

export function voiceCommandLabel(command: VoiceCommand): string {
  return COMMAND_LABELS[command];
}
