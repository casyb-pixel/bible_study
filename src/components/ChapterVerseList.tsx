"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  HIGHLIGHT_BG_CLASS,
  HIGHLIGHT_SWATCH_CLASS,
  MAX_NOTE_LENGTH,
  VERSE_MARK_COLORS,
  type VerseMarkColor,
  type VerseMarkRecord,
} from "@/lib/verse-marks";

type Verse = {
  verse: number;
  text: string;
};

type ChapterVerseListProps = {
  verses: Verse[];
  book: string;
  chapter: number;
  userId: string;
  initialMarks: VerseMarkRecord[];
  /** Temporary reading-position indicator; null when not speaking. */
  activeVerse: number | null;
};

type VerseMarkState = {
  highlight: VerseMarkRecord | null;
  note: VerseMarkRecord | null;
};

function indexMarks(marks: VerseMarkRecord[]): Map<number, VerseMarkState> {
  const map = new Map<number, VerseMarkState>();
  for (const mark of marks) {
    const current = map.get(mark.verse) ?? { highlight: null, note: null };
    if (mark.type === "highlight") {
      current.highlight = mark;
    } else {
      current.note = mark;
    }
    map.set(mark.verse, current);
  }
  return map;
}

export function ChapterVerseList({
  verses,
  book,
  chapter,
  userId,
  initialMarks,
  activeVerse,
}: ChapterVerseListProps) {
  const activeRef = useRef<HTMLDivElement | null>(null);
  const [marksByVerse, setMarksByVerse] = useState(() =>
    indexMarks(initialMarks),
  );
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMarksByVerse(indexMarks(initialMarks));
  }, [initialMarks]);

  useEffect(() => {
    if (activeVerse == null || !activeRef.current) {
      return;
    }
    activeRef.current.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [activeVerse]);

  useEffect(() => {
    if (selectedVerse == null) {
      setNoteDraft("");
      setNoteOpen(false);
      setError(null);
      return;
    }
    const existing = marksByVerse.get(selectedVerse)?.note?.noteText ?? "";
    setNoteDraft(existing);
    setNoteOpen(Boolean(existing));
    setError(null);
  }, [selectedVerse, marksByVerse]);

  const selectedState = useMemo(
    () =>
      selectedVerse == null
        ? null
        : (marksByVerse.get(selectedVerse) ?? { highlight: null, note: null }),
    [marksByVerse, selectedVerse],
  );

  async function upsertHighlight(verse: number, color: VerseMarkColor) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/marks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          book,
          chapter,
          verse,
          type: "highlight",
          color,
        }),
      });
      const data = (await response.json()) as VerseMarkRecord & {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "Could not save highlight.");
      }
      setMarksByVerse((prev) => {
        const next = new Map(prev);
        const current = next.get(verse) ?? { highlight: null, note: null };
        next.set(verse, { ...current, highlight: data });
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save highlight.");
    } finally {
      setBusy(false);
    }
  }

  async function clearHighlight(verse: number, markId: string) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/marks/${markId}`, { method: "DELETE" });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Could not remove highlight.");
      }
      setMarksByVerse((prev) => {
        const next = new Map(prev);
        const current = next.get(verse) ?? { highlight: null, note: null };
        next.set(verse, { ...current, highlight: null });
        return next;
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not remove highlight.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function saveNote(verse: number) {
    const trimmed = noteDraft.trim();
    if (!trimmed) {
      setError("Enter a short note, or remove the note.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/marks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          book,
          chapter,
          verse,
          type: "note",
          noteText: trimmed,
        }),
      });
      const data = (await response.json()) as VerseMarkRecord & {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "Could not save note.");
      }
      setMarksByVerse((prev) => {
        const next = new Map(prev);
        const current = next.get(verse) ?? { highlight: null, note: null };
        next.set(verse, { ...current, note: data });
        return next;
      });
      setNoteOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save note.");
    } finally {
      setBusy(false);
    }
  }

  async function removeNote(verse: number, markId: string) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/marks/${markId}`, { method: "DELETE" });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Could not remove note.");
      }
      setMarksByVerse((prev) => {
        const next = new Map(prev);
        const current = next.get(verse) ?? { highlight: null, note: null };
        next.set(verse, { ...current, note: null });
        return next;
      });
      setNoteDraft("");
      setNoteOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove note.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-10 space-y-6 text-[1.05rem] leading-8 text-neutral-800">
      {verses.map((verse) => {
        const isActive = activeVerse === verse.verse;
        const isSelected = selectedVerse === verse.verse;
        const state = marksByVerse.get(verse.verse) ?? {
          highlight: null,
          note: null,
        };
        const highlightColor = state.highlight?.color ?? null;
        const highlightClass =
          highlightColor != null ? HIGHLIGHT_BG_CLASS[highlightColor] : "";

        const readingClass = isActive
          ? "underline decoration-neutral-400 decoration-1 underline-offset-4 ring-1 ring-inset ring-neutral-300/70"
          : "";
        const readingFallback =
          isActive && !highlightColor ? "bg-neutral-100" : "";

        return (
          <div
            key={verse.verse}
            ref={isActive ? activeRef : undefined}
            data-reading-verse={verse.verse}
          >
            <button
              type="button"
              onClick={() =>
                setSelectedVerse((current) =>
                  current === verse.verse ? null : verse.verse,
                )
              }
              className={[
                "-mx-1 w-full rounded-sm px-1 py-0.5 text-left transition-colors",
                highlightClass,
                readingFallback,
                readingClass,
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span className="mr-2 align-super text-xs text-neutral-500">
                {verse.verse}
              </span>
              {verse.text}
            </button>

            {state.note && !isSelected ? (
              <button
                type="button"
                onClick={() => setSelectedVerse(verse.verse)}
                className="mt-1 block max-w-full truncate text-left text-xs text-neutral-500 hover:text-neutral-700"
              >
                Note — {state.note.noteText}
              </button>
            ) : null}

            {isSelected ? (
              <div className="mt-3 space-y-3 border-t border-neutral-200 pt-3 text-sm text-neutral-600">
                <div>
                  <p className="text-xs tracking-wide text-neutral-500">
                    Highlight
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {VERSE_MARK_COLORS.map((color) => {
                      const selected = selectedState?.highlight?.color === color;
                      return (
                        <button
                          key={color}
                          type="button"
                          disabled={busy}
                          aria-label={`Highlight ${color}`}
                          aria-pressed={selected}
                          onClick={() => void upsertHighlight(verse.verse, color)}
                          className={[
                            "h-7 w-7 rounded-full ring-1 ring-inset disabled:opacity-50",
                            HIGHLIGHT_SWATCH_CLASS[color],
                            selected ? "ring-2 ring-neutral-500" : "",
                          ].join(" ")}
                        />
                      );
                    })}
                    {selectedState?.highlight ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          void clearHighlight(
                            verse.verse,
                            selectedState.highlight!.id,
                          )
                        }
                        className="ml-1 text-xs text-neutral-500 underline underline-offset-2 hover:text-neutral-800 disabled:opacity-50"
                      >
                        Clear
                      </button>
                    ) : null}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs tracking-wide text-neutral-500">
                      Note
                    </p>
                    {selectedState?.note && !noteOpen ? (
                      <button
                        type="button"
                        onClick={() => setNoteOpen(true)}
                        className="text-xs text-neutral-500 underline underline-offset-2 hover:text-neutral-800"
                      >
                        Show
                      </button>
                    ) : null}
                  </div>

                  {noteOpen || !selectedState?.note ? (
                    <>
                      <textarea
                        value={noteDraft}
                        onChange={(event) => setNoteDraft(event.target.value)}
                        maxLength={MAX_NOTE_LENGTH}
                        rows={3}
                        disabled={busy}
                        placeholder="Short note for this verse"
                        className="mt-2 w-full resize-y rounded-sm border border-neutral-200 bg-white px-2.5 py-2 text-sm leading-6 text-neutral-800 outline-none focus:border-neutral-400"
                      />
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void saveNote(verse.verse)}
                          className="text-xs text-neutral-700 underline underline-offset-2 hover:text-neutral-950 disabled:opacity-50"
                        >
                          Save note
                        </button>
                        {selectedState?.note ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              void removeNote(
                                verse.verse,
                                selectedState.note!.id,
                              )
                            }
                            className="text-xs text-neutral-500 underline underline-offset-2 hover:text-neutral-800 disabled:opacity-50"
                          >
                            Remove note
                          </button>
                        ) : null}
                        <span className="text-xs text-neutral-400">
                          {noteDraft.trim().length}/{MAX_NOTE_LENGTH}
                        </span>
                      </div>
                    </>
                  ) : (
                    <p className="mt-2 text-sm leading-6 text-neutral-600">
                      {selectedState.note.noteText}
                    </p>
                  )}
                </div>

                {error ? (
                  <p className="text-xs text-neutral-500">{error}</p>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
