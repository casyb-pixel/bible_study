import { relations, sql } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export type CachedChapterVerse = {
  verse: number;
  text: string;
};

export const preferredVoiceEnum = pgEnum("preferred_voice", ["male", "female"]);

export const preferredTranslationEnum = pgEnum("preferred_translation", [
  "NKJV",
  "NIV",
  "NLT",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    username: text("username").notNull().unique(),
    email: text("email").unique(),
    preferredVoice: preferredVoiceEnum("preferred_voice")
      .default("male")
      .notNull(),
    /** xAI Grok TTS voice id (e.g. leo, eve). */
    preferredTtsVoice: text("preferred_tts_voice").default("leo").notNull(),
    preferredTranslation: preferredTranslationEnum("preferred_translation")
      .default("NKJV")
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("users_username_lower_idx").on(sql`lower(${table.username})`),
  ],
);

export const progress = pgTable("progress", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  currentBook: text("current_book").notNull(),
  currentChapter: integer("current_chapter").notNull(),
  currentVerse: integer("current_verse").notNull(),
  lastReadAt: timestamp("last_read_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const placeholders = pgTable("placeholders", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  book: text("book").notNull(),
  chapter: integer("chapter").notNull(),
  verse: integer("verse").notNull(),
  positionNote: text("position_note"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const chapterCompletions = pgTable("chapter_completions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  book: text("book").notNull(),
  chapter: integer("chapter").notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  understandingConfirmed: boolean("understanding_confirmed")
    .default(false)
    .notNull(),
});

/** Cached chapter text by translation to avoid repeated upstream fetches. */
export const chapterCache = pgTable(
  "chapter_cache",
  {
    book: text("book").notNull(),
    chapter: integer("chapter").notNull(),
    translation: text("translation").notNull(),
    plainText: text("plain_text").notNull(),
    verses: jsonb("verses").$type<CachedChapterVerse[]>().notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.book, table.chapter, table.translation],
    }),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  progress: many(progress),
  placeholders: many(placeholders),
  chapterCompletions: many(chapterCompletions),
}));

export const progressRelations = relations(progress, ({ one }) => ({
  user: one(users, {
    fields: [progress.userId],
    references: [users.id],
  }),
}));

export const placeholdersRelations = relations(placeholders, ({ one }) => ({
  user: one(users, {
    fields: [placeholders.userId],
    references: [users.id],
  }),
}));

export const chapterCompletionsRelations = relations(
  chapterCompletions,
  ({ one }) => ({
    user: one(users, {
      fields: [chapterCompletions.userId],
      references: [users.id],
    }),
  }),
);
