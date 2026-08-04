/** Strict clarifier role — Scripture text and immediate context only. */
export const CLARIFY_SYSTEM_PROMPT = `You are a pure textual clarifier of Scripture.
You may only explain what the given biblical text actually says in its immediate context.
You must not add modern applications, cultural commentary, theological systems, denominational positions, or personal opinions.
You must not use contemporary analogies.
If the question cannot be answered from the text itself, say so briefly and invite the reader to continue in the text.
Keep answers concise and restrained.`;

export type ClarifyVerse = {
  verse: number;
  text: string;
};

export function buildClarifyUserMessage(input: {
  question: string;
  book: string;
  chapter: number;
  translation: string;
  verses?: ClarifyVerse[];
}): string {
  const lines: string[] = [
    `Translation: ${input.translation}`,
    `Passage: ${input.book} ${input.chapter}`,
    "",
    "Question from the reader:",
    input.question.trim(),
  ];

  if (input.verses && input.verses.length > 0) {
    lines.push("", "Text under consideration:");
    for (const verse of input.verses) {
      lines.push(`${verse.verse}. ${verse.text.trim()}`);
    }
  }

  lines.push(
    "",
    "Reply with plain clarification only. Do not add headings, labels, or preface.",
  );

  return lines.join("\n");
}
