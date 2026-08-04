import "server-only";

import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { verseMarks } from "@/db/schema";
import {
  isVerseMarkColor,
  isVerseMarkType,
  type VerseMarkColor,
  type VerseMarkRecord,
  type VerseMarkType,
} from "@/lib/verse-marks";

const markColumns = {
  id: verseMarks.id,
  userId: verseMarks.userId,
  book: verseMarks.book,
  chapter: verseMarks.chapter,
  verse: verseMarks.verse,
  type: verseMarks.type,
  noteText: verseMarks.noteText,
  color: verseMarks.color,
  createdAt: verseMarks.createdAt,
  updatedAt: verseMarks.updatedAt,
} as const;

function serializeMark(row: {
  id: string;
  userId: string;
  book: string;
  chapter: number;
  verse: number;
  type: string;
  noteText: string | null;
  color: string | null;
  createdAt: Date;
  updatedAt: Date;
}): VerseMarkRecord {
  return {
    id: row.id,
    userId: row.userId,
    book: row.book,
    chapter: row.chapter,
    verse: row.verse,
    type: isVerseMarkType(row.type) ? row.type : "note",
    noteText: row.noteText,
    color: isVerseMarkColor(row.color) ? row.color : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listVerseMarks(input: {
  userId: string;
  book?: string;
  chapter?: number;
}): Promise<VerseMarkRecord[]> {
  const filters = [eq(verseMarks.userId, input.userId)];

  if (input.book) {
    filters.push(eq(verseMarks.book, input.book.trim()));
  }
  if (typeof input.chapter === "number") {
    filters.push(eq(verseMarks.chapter, input.chapter));
  }

  const rows = await db
    .select(markColumns)
    .from(verseMarks)
    .where(and(...filters))
    .orderBy(
      asc(verseMarks.book),
      asc(verseMarks.chapter),
      asc(verseMarks.verse),
      asc(verseMarks.type),
    );

  return rows.map(serializeMark);
}

export async function getVerseMarkById(
  id: string,
): Promise<VerseMarkRecord | null> {
  const rows = await db
    .select(markColumns)
    .from(verseMarks)
    .where(eq(verseMarks.id, id))
    .limit(1);

  return rows[0] ? serializeMark(rows[0]) : null;
}

export async function upsertVerseMark(input: {
  userId: string;
  book: string;
  chapter: number;
  verse: number;
  type: VerseMarkType;
  noteText?: string | null;
  color?: VerseMarkColor | null;
}): Promise<VerseMarkRecord> {
  const now = new Date();
  const book = input.book.trim();
  const noteText =
    typeof input.noteText === "string" ? input.noteText.trim() || null : null;
  const color = input.color ?? null;

  const existing = await db
    .select({ id: verseMarks.id })
    .from(verseMarks)
    .where(
      and(
        eq(verseMarks.userId, input.userId),
        eq(verseMarks.book, book),
        eq(verseMarks.chapter, input.chapter),
        eq(verseMarks.verse, input.verse),
        eq(verseMarks.type, input.type),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    const [updated] = await db
      .update(verseMarks)
      .set({
        noteText: input.type === "note" ? noteText : null,
        color: input.type === "highlight" ? color : null,
        updatedAt: now,
      })
      .where(eq(verseMarks.id, existing[0].id))
      .returning(markColumns);

    return serializeMark(updated);
  }

  const [created] = await db
    .insert(verseMarks)
    .values({
      userId: input.userId,
      book,
      chapter: input.chapter,
      verse: input.verse,
      type: input.type,
      noteText: input.type === "note" ? noteText : null,
      color: input.type === "highlight" ? color : null,
      createdAt: now,
      updatedAt: now,
    })
    .returning(markColumns);

  return serializeMark(created);
}

export async function updateVerseMark(
  id: string,
  input: {
    noteText?: string | null;
    color?: VerseMarkColor | null;
  },
): Promise<VerseMarkRecord | null> {
  const existing = await getVerseMarkById(id);
  if (!existing) {
    return null;
  }

  const noteText =
    input.noteText !== undefined
      ? typeof input.noteText === "string"
        ? input.noteText.trim() || null
        : null
      : existing.noteText;

  const color =
    input.color !== undefined ? input.color : existing.color;

  const [updated] = await db
    .update(verseMarks)
    .set({
      noteText: existing.type === "note" ? noteText : null,
      color: existing.type === "highlight" ? color : null,
      updatedAt: new Date(),
    })
    .where(eq(verseMarks.id, id))
    .returning(markColumns);

  return updated ? serializeMark(updated) : null;
}

export async function deleteVerseMark(id: string): Promise<boolean> {
  const deleted = await db
    .delete(verseMarks)
    .where(eq(verseMarks.id, id))
    .returning({ id: verseMarks.id });

  return deleted.length > 0;
}
