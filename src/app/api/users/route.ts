import { db } from "@/db";
import { users } from "@/db/schema";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import {
  DEFAULT_TRANSLATION,
  isTranslationCode,
  type TranslationCode,
} from "@/lib/bible/translations";
import {
  getGrokTtsVoice,
  isGrokTtsVoiceId,
  type GrokTtsVoiceId,
  DEFAULT_GROK_TTS_VOICE,
} from "@/lib/speech/grok-voices";
import {
  isValidUsernameFormat,
  normalizeUsername,
  usernameExists,
} from "@/lib/users";

type CreateUserBody = {
  username?: unknown;
  preferredVoice?: unknown;
  preferredTtsVoice?: unknown;
  preferredTranslation?: unknown;
};

export async function POST(request: Request) {
  const parsed = await parseJsonBody<CreateUserBody>(request);
  if ("error" in parsed) {
    return parsed.error;
  }

  const {
    username: rawUsername,
    preferredVoice: rawVoice,
    preferredTtsVoice: rawTtsVoice,
    preferredTranslation: rawTranslation,
  } = parsed.data;

  if (typeof rawUsername !== "string" || rawUsername.trim().length === 0) {
    return jsonError("username is required", 400);
  }

  if (!isValidUsernameFormat(rawUsername)) {
    return jsonError(
      "username must be 3–32 characters and use only letters, numbers, underscore, or hyphen",
      400,
    );
  }

  if (rawTtsVoice !== undefined && !isGrokTtsVoiceId(rawTtsVoice)) {
    return jsonError("preferredTtsVoice is not a supported Grok voice", 400);
  }

  if (
    rawVoice !== undefined &&
    rawVoice !== "male" &&
    rawVoice !== "female"
  ) {
    return jsonError('preferredVoice must be "male" or "female"', 400);
  }

  if (
    rawTranslation !== undefined &&
    !isTranslationCode(rawTranslation)
  ) {
    return jsonError(
      'preferredTranslation must be "NKJV", "NIV", or "NLT"',
      400,
    );
  }

  const username = normalizeUsername(rawUsername);
  let preferredTtsVoice: GrokTtsVoiceId = DEFAULT_GROK_TTS_VOICE;
  if (isGrokTtsVoiceId(rawTtsVoice)) {
    preferredTtsVoice = rawTtsVoice;
  } else if (rawVoice === "female") {
    preferredTtsVoice = "eve";
  } else if (rawVoice === "male") {
    preferredTtsVoice = "leo";
  }
  const voice = getGrokTtsVoice(preferredTtsVoice);
  const preferredTranslation: TranslationCode = isTranslationCode(
    rawTranslation,
  )
    ? rawTranslation
    : DEFAULT_TRANSLATION;

  if (await usernameExists(username)) {
    return jsonError("username is already taken", 409);
  }

  try {
    const [created] = await db
      .insert(users)
      .values({
        username,
        preferredVoice: voice.gender,
        preferredTtsVoice: voice.id,
        preferredTranslation,
      })
      .returning({
        id: users.id,
        username: users.username,
        preferredVoice: users.preferredVoice,
        preferredTtsVoice: users.preferredTtsVoice,
        preferredTranslation: users.preferredTranslation,
      });

    return jsonOk(created, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/unique|duplicate/i.test(message)) {
      return jsonError("username is already taken", 409);
    }
    return jsonError("Unable to create user", 500);
  }
}
