import {
  APIError,
  BuildIDError,
  InvalidReferenceError,
  LSBibleError,
} from "lsbible";

import { isBuildIdPinned } from "./client";

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

  if (error instanceof InvalidReferenceError) {
    return new ChapterFetchError(error.message, {
      causeName: error.name,
      retryable: false,
    });
  }

  if (error instanceof BuildIDError) {
    if (isRateLimitedMessage(error.message)) {
      return new ChapterFetchError(
        isBuildIdPinned()
          ? "The Scripture source is rate-limiting requests. Wait a moment and try again."
          : "The Scripture source is rate-limiting build ID lookups (HTTP 429). Set the LSB_BUILD_ID environment variable on the server, then redeploy, and try again.",
        { causeName: error.name, retryable: true },
      );
    }

    return new ChapterFetchError(
      isBuildIdPinned()
        ? "The Scripture source could not be reached with the configured build ID. Check LSB_BUILD_ID and try again."
        : "The Scripture source build ID could not be determined. Set LSB_BUILD_ID on the server to avoid automatic lookup, then redeploy.",
      { causeName: error.name, retryable: true },
    );
  }

  if (error instanceof APIError) {
    if (isRateLimitedMessage(error.message)) {
      return new ChapterFetchError(
        "The Scripture source is rate-limiting requests (HTTP 429). Wait a moment and try again.",
        { causeName: error.name, retryable: true },
      );
    }

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
    buildIdPinned: isBuildIdPinned(),
    error: base,
  });
}
