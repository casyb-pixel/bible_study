import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";
import { isUuid } from "@/lib/api";
import {
  DEFAULT_TRANSLATION,
  isTranslationCode,
  type TranslationCode,
} from "@/lib/bible/translations";

/** 3–32 chars: letters, numbers, underscore, hyphen. */
export const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{3,32}$/;

export type AppUser = {
  id: string;
  username: string;
  preferredVoice: "male" | "female";
  preferredTranslation: TranslationCode;
};

export function firstSearchParam(
  value?: string | string[],
): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase();
}

export function isValidUsernameFormat(input: string): boolean {
  return USERNAME_PATTERN.test(input.trim());
}

export async function getUserById(id: string): Promise<AppUser | null> {
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      preferredVoice: users.preferredVoice,
      preferredTranslation: users.preferredTranslation,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    ...row,
    preferredTranslation: isTranslationCode(row.preferredTranslation)
      ? row.preferredTranslation
      : DEFAULT_TRANSLATION,
  };
}

export async function getUserByUsername(
  username: string,
): Promise<AppUser | null> {
  const normalized = normalizeUsername(username);

  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      preferredVoice: users.preferredVoice,
      preferredTranslation: users.preferredTranslation,
    })
    .from(users)
    .where(sql`lower(${users.username}) = ${normalized}`)
    .limit(1);

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    ...row,
    preferredTranslation: isTranslationCode(row.preferredTranslation)
      ? row.preferredTranslation
      : DEFAULT_TRANSLATION,
  };
}

export async function usernameExists(username: string): Promise<boolean> {
  const existing = await getUserByUsername(username);
  return existing !== null;
}

export async function updatePreferredTranslation(
  userId: string,
  preferredTranslation: TranslationCode,
): Promise<AppUser | null> {
  const [updated] = await db
    .update(users)
    .set({
      preferredTranslation,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      username: users.username,
      preferredVoice: users.preferredVoice,
      preferredTranslation: users.preferredTranslation,
    });

  if (!updated) {
    return null;
  }

  return {
    ...updated,
    preferredTranslation: isTranslationCode(updated.preferredTranslation)
      ? updated.preferredTranslation
      : DEFAULT_TRANSLATION,
  };
}

/**
 * Resolve a study user from query params.
 * Prefers ?user= / ?username=, then ?userId=.
 */
export async function resolveAppUser(params: {
  user?: string | string[];
  username?: string | string[];
  userId?: string | string[];
}): Promise<AppUser | null> {
  const usernameParam =
    firstSearchParam(params.user) ?? firstSearchParam(params.username);
  const userIdParam = firstSearchParam(params.userId);

  if (usernameParam) {
    if (!isValidUsernameFormat(usernameParam)) {
      return null;
    }
    return getUserByUsername(usernameParam);
  }

  if (userIdParam) {
    if (!isUuid(userIdParam)) {
      return null;
    }
    return getUserById(userIdParam);
  }

  return null;
}

export function buildUserQuery(username: string): string {
  return `user=${encodeURIComponent(normalizeUsername(username))}`;
}
