import { NextResponse } from "next/server";

import {
  buildClarifyUserMessage,
  type ClarifyVerse,
} from "@/lib/clarify/prompt";
import {
  ClarifyApiError,
  requestClarification,
  type ClarifyFailure,
} from "@/lib/clarify/xai";
import {
  isNonEmptyString,
  isPositiveInt,
  jsonError,
  jsonOk,
  parseJsonBody,
} from "@/lib/api";
import { isTranslationCode } from "@/lib/bible/translations";

export const dynamic = "force-dynamic";

function jsonClarifyFailure(failure: ClarifyFailure, httpStatus: number) {
  return NextResponse.json(failure, { status: httpStatus });
}

type ClarifyBody = {
  question?: unknown;
  book?: unknown;
  chapter?: unknown;
  translation?: unknown;
  verses?: unknown;
};

function parseOptionalVerses(
  value: unknown,
): { ok: true; verses?: ClarifyVerse[] } | { ok: false } {
  if (value === undefined || value === null) {
    return { ok: true, verses: undefined };
  }
  if (!Array.isArray(value)) {
    return { ok: false };
  }

  const verses: ClarifyVerse[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") {
      return { ok: false };
    }
    const row = item as { verse?: unknown; text?: unknown };
    if (!isPositiveInt(row.verse) || !isNonEmptyString(row.text)) {
      return { ok: false };
    }
    verses.push({ verse: row.verse, text: row.text.trim() });
  }
  return { ok: true, verses };
}

export async function POST(request: Request) {
  const parsed = await parseJsonBody<ClarifyBody>(request);
  if ("error" in parsed) {
    return parsed.error;
  }

  const { question, book, chapter, translation, verses: rawVerses } = parsed.data;

  if (!isNonEmptyString(question)) {
    return jsonError("question is required", 400);
  }
  if (!isNonEmptyString(book)) {
    return jsonError("book is required", 400);
  }
  if (!isPositiveInt(chapter)) {
    return jsonError("chapter must be a positive integer", 400);
  }
  if (!isNonEmptyString(translation) || !isTranslationCode(translation)) {
    return jsonError("translation must be NKJV, NIV, or NLT", 400);
  }

  const versesResult = parseOptionalVerses(rawVerses);
  if (!versesResult.ok) {
    return jsonError("verses entries must include verse and text", 400);
  }

  const userMessage = buildClarifyUserMessage({
    question: question.trim(),
    book: book.trim(),
    chapter,
    translation,
    verses: versesResult.verses,
  });

  try {
    const clarification = await requestClarification(userMessage);
    return jsonOk({ clarification });
  } catch (error) {
    if (error instanceof ClarifyApiError) {
      console.error("[clarify] request failed", error.details);
      return jsonClarifyFailure(error.details, error.status);
    }

    const message =
      error instanceof Error
        ? error.message
        : "Unexpected clarification error";
    console.error("[clarify] unexpected error", { message });
    return jsonClarifyFailure(
      {
        error: message,
        status: 500,
        message,
        missingApiKey: !process.env.XAI_API_KEY?.trim(),
      },
      500,
    );
  }
}
