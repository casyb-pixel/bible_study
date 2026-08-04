/** Fire-and-forget progress save from the browser (canonical reading only). */
export function saveReadingProgress(input: {
  userId: string;
  book: string;
  chapter: number;
  verse: number;
}): void {
  if (typeof window === "undefined") {
    return;
  }
  if (!input.userId || input.book.startsWith("historical:")) {
    return;
  }
  if (
    !Number.isInteger(input.chapter) ||
    input.chapter < 1 ||
    !Number.isInteger(input.verse) ||
    input.verse < 1
  ) {
    return;
  }

  void fetch("/api/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: input.userId,
      book: input.book,
      chapter: input.chapter,
      verse: input.verse,
    }),
  }).catch(() => {
    // Progress saves are best-effort; reading continues if the request fails.
  });
}
