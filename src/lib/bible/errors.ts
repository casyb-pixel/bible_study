import {
  APIError,
  BuildIDError,
  InvalidReferenceError,
  LSBibleError,
} from "lsbible";

export class ChapterFetchError extends Error {
  readonly causeName: string;
  readonly retryable: boolean;

  constructor(message: string, options?: { causeName?: string; retryable?: boolean }) {
    super(message);
    this.name = "ChapterFetchError";
    this.causeName = options?.causeName ?? "Error";
    this.retryable = options?.retryable ?? false;
  }
}

export function toChapterFetchError(error: unknown): ChapterFetchError {
  if (error instanceof ChapterFetchError) {
    return error;
  }

  if (error instanceof InvalidReferenceError) {
    return new ChapterFetchError(error.message, {
      causeName: error.name,
      retryable: false,
    });
  }

  if (error instanceof BuildIDError) {
    return new ChapterFetchError(
      "The Scripture source could not be reached (build ID lookup failed). Try again in a moment.",
      { causeName: error.name, retryable: true },
    );
  }

  if (error instanceof APIError) {
    return new ChapterFetchError(
      "The Scripture source returned an error. Try again in a moment.",
      { causeName: error.name, retryable: true },
    );
  }

  if (error instanceof LSBibleError) {
    return new ChapterFetchError(
      "The Scripture source is temporarily unavailable.",
      { causeName: error.name, retryable: true },
    );
  }

  if (error instanceof Error) {
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
