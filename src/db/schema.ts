import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const preferredVoiceEnum = pgEnum("preferred_voice", ["male", "female"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").unique(),
  preferredVoice: preferredVoiceEnum("preferred_voice").default("male").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const progress = pgTable("progress", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  currentBook: text("current_book").notNull(),
  currentChapter: integer("current_chapter").notNull(),
  currentVerse: integer("current_verse").notNull(),
  lastReadAt: timestamp("last_read_at", { withTimezone: true }).defaultNow().notNull(),
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
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const chapterCompletions = pgTable("chapter_completions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  book: text("book").notNull(),
  chapter: integer("chapter").notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }).defaultNow().notNull(),
  understandingConfirmed: boolean("understanding_confirmed").default(false).notNull(),
});

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
