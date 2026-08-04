"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import {
  CANONICAL_BOOK_NAMES,
  getBookChapterCount,
  isValidChapter,
} from "@/lib/bible/books";
import { buildUserQuery } from "@/lib/user-identity";

type JumpToChapterFormProps = {
  username: string;
  initialBook?: string;
  initialChapter?: number;
};

export function JumpToChapterForm({
  username,
  initialBook = "Genesis",
  initialChapter = 1,
}: JumpToChapterFormProps) {
  const router = useRouter();
  const startingBook = CANONICAL_BOOK_NAMES.includes(initialBook)
    ? initialBook
    : "Genesis";
  const [book, setBook] = useState(startingBook);
  const [chapter, setChapter] = useState(
    String(
      isValidChapter(startingBook, initialChapter) ? initialChapter : 1,
    ),
  );
  const [error, setError] = useState<string | null>(null);

  const maxChapter = useMemo(() => getBookChapterCount(book), [book]);
  const chapterOptions = useMemo(
    () => Array.from({ length: maxChapter }, (_, index) => index + 1),
    [maxChapter],
  );

  function handleBookChange(nextBook: string) {
    setBook(nextBook);
    const nextMax = getBookChapterCount(nextBook);
    const current = Number(chapter);
    if (!Number.isInteger(current) || current < 1 || current > nextMax) {
      setChapter("1");
    }
    setError(null);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const chapterNumber = Number(chapter);
    if (!isValidChapter(book, chapterNumber)) {
      setError("Choose a valid book and chapter.");
      return;
    }

    router.push(
      `/read/${encodeURIComponent(book)}/${chapterNumber}?${buildUserQuery(username)}`,
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-sm font-medium text-neutral-800">Go to a chapter</p>

      <div className="flex flex-wrap items-end gap-3">
        <label className="block text-sm text-neutral-700">
          Book
          <select
            value={book}
            onChange={(event) => handleBookChange(event.target.value)}
            className="mt-1 block w-full min-w-[12rem] border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-900"
          >
            {CANONICAL_BOOK_NAMES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm text-neutral-700">
          Chapter
          <select
            value={chapter}
            onChange={(event) => {
              setChapter(event.target.value);
              setError(null);
            }}
            className="mt-1 block w-full min-w-[5rem] border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-900"
          >
            {chapterOptions.map((value) => (
              <option key={value} value={String(value)}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          className="border border-neutral-800 px-3 py-1.5 text-sm text-neutral-900 hover:bg-neutral-100"
        >
          Go
        </button>
      </div>

      {error ? <p className="text-sm text-neutral-600">{error}</p> : null}
    </form>
  );
}
