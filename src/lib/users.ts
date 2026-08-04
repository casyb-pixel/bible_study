import "server-only";

import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";
import { isUuid } from "@/lib/api";
import {
  DEFAULT_TRANSLATION,
  isTranslationCode,
  type TranslationCode,
} from "@/lib/bible/translations";
import {
  getGrokTtsVoice,
  resolveGrokTtsVoiceId,
  type GrokTtsVoiceId,
} from "@/lib/speech/grok-voices";
import {
  buildUserQuery,
  firstSearchParam,
  isValidUsernameFormat,
  normalizeUsername,
  USERNAME_PATTERN,
} from "@/lib/user-identity";

export {
  buildUserQuery,
  firstSearchParam,
  isValidUsernameFormat,
  normalizeUsername,
  USERNAME_PATTERN,
};

export type AppUser = {
  id: string;
  username: string;
  preferredVoice: "male" | "female";
  preferredTtsVoice: GrokTtsVoiceId;
  preferredTranslation: TranslationCode;
};

const userColumns = {
  id: users.id,
  username: users.username,
  preferredVoice: users.preferredVoice,
  preferredTtsVoice: users.preferredTtsVoice,
  preferredTranslation: users.preferredTranslation,
};

function mapAppUser(row: {
  id: string;
  username: string;
  preferredVoice: "male" | "female";
  preferredTtsVoice: string;
  preferredTranslation: string;
}): AppUser {
  return {
    id: row.id,
    username: row.username,
    preferredVoice: row.preferredVoice,
    preferredTtsVoice: resolveGrokTtsVoiceId(row.preferredTtsVoice),
    preferredTranslation: isTranslationCode(row.preferredTranslation)
      ? row.preferredTranslation
      : DEFAULT_TRANSLATION,
  };
}

export async function getUserById(id: string): Promise<AppUser | null> {
  const rows = await db
    .select(userColumns)
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  const row = rows[0];
  return row ? mapAppUser(row) : null;
}

export async function getUserByUsername(
  username: string,
): Promise<AppUser | null> {
  const normalized = normalizeUsername(username);

  const rows = await db
    .select(userColumns)
    .from(users)
    .where(sql`lower(${users.username}) = ${normalized}`)
    .limit(1);

  const row = rows[0];
  return row ? mapAppUser(row) : null;
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
    .returning(userColumns);

  return updated ? mapAppUser(updated) : null;
}

export async function updatePreferredTtsVoice(
  userId: string,
  preferredTtsVoice: GrokTtsVoiceId,
): Promise<AppUser | null> {
  const voice = getGrokTtsVoice(preferredTtsVoice);
  const [updated] = await db
    .update(users)
    .set({
      preferredTtsVoice: voice.id,
      preferredVoice: voice.gender,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning(userColumns);

  return updated ? mapAppUser(updated) : null;
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
