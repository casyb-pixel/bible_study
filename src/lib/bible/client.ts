import {
  getBibleId,
  type TranslationCode,
} from "@/lib/bible/translations";

const API_BASE = "https://api.scripture.api.bible/v1";

export function getApiBibleKey(): string {
  const key = process.env.API_BIBLE_KEY?.trim();
  if (!key) {
    throw new Error("API_BIBLE_KEY is not set");
  }
  return key;
}

export type ApiBibleChapterResponse = {
  data: {
    id: string;
    bibleId: string;
    number: string;
    bookId: string;
    reference?: string;
    copyright?: string;
    verseCount?: number;
    content: string;
  };
};

export async function fetchChapterFromApiBible(input: {
  translation: TranslationCode;
  chapterId: string;
}): Promise<ApiBibleChapterResponse> {
  const bibleId = getBibleId(input.translation);
  const url = new URL(
    `${API_BASE}/bibles/${bibleId}/chapters/${input.chapterId}`,
  );
  url.searchParams.set("content-type", "text");
  url.searchParams.set("include-notes", "false");
  url.searchParams.set("include-titles", "false");
  url.searchParams.set("include-chapter-numbers", "false");
  url.searchParams.set("include-verse-numbers", "true");

  const response = await fetch(url, {
    headers: {
      "api-key": getApiBibleKey(),
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `API.Bible request failed (${response.status} ${response.statusText})${
        body ? `: ${body.slice(0, 200)}` : ""
      }`,
    );
  }

  return (await response.json()) as ApiBibleChapterResponse;
}
