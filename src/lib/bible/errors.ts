export class ChapterFetchError extends Error {
  readonly causeName: string;
  readonly retryable: boolean;

  constructor(
    message: string,
    options?: { causeName?: string; retryable?: boolean },
  ) {
    super(message);
    this.name = "ChapterFetchError";
    this.causeName = options?.causeName ?? "Error";
    this.retryable = options?.retryable ?? false;
  }
}

function isRateLimitedMessage(message: string): boolean {
  return /429|too many requests|rate limit/i.test(message);
}

export function toChapterFetchError(error: unknown): ChapterFetchError {
  if (error instanceof ChapterFetchError) {
    return error;
  }

  if (error instanceof Error) {
    if (/API_BIBLE_KEY is not set/i.test(error.message)) {
      return new ChapterFetchError(
        "Scripture API key is not configured. Set API_BIBLE_KEY on the server.",
        { causeName: "MissingApiKey", retryable: false },
      );
    }

    if (isRateLimitedMessage(error.message)) {
      return new ChapterFetchError(
        "The Scripture source is rate-limiting requests. Wait a moment and try again.",
        { causeName: "RateLimited", retryable: true },
      );
    }

    if (/failed \(401|failed \(403/i.test(error.message)) {
      return new ChapterFetchError(
        "The Scripture source rejected the request. Check API_BIBLE_KEY and translation access.",
        { causeName: "Unauthorized", retryable: false },
      );
    }

    return new ChapterFetchError(
      "The chapter text could not be loaded from the Scripture source.",
      { causeName: error.name, retryable: true },
    );
  }

  return new ChapterFetchError(
    "The chapter text could not be loaded from the Scripture source.",
    { causeName: "UnknownError", retryable: true },
  );
}

export function logBibleError(
  context: string,
  details: Record<string, unknown>,
  error: unknown,
): void {
  const base =
    error instanceof Error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        }
      : { value: String(error) };

  console.error(`[bible] ${context}`, {
    ...details,
    error: base,
  });
}
