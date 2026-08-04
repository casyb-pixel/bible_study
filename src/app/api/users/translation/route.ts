import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { isTranslationCode } from "@/lib/bible/translations";
import {
  getUserByUsername,
  isValidUsernameFormat,
  normalizeUsername,
  updatePreferredTranslation,
} from "@/lib/users";

type Body = {
  username?: unknown;
  preferredTranslation?: unknown;
};

export async function POST(request: Request) {
  const parsed = await parseJsonBody<Body>(request);
  if ("error" in parsed) {
    return parsed.error;
  }

  const { username: rawUsername, preferredTranslation } = parsed.data;

  if (typeof rawUsername !== "string" || !isValidUsernameFormat(rawUsername)) {
    return jsonError("username is required", 400);
  }

  if (!isTranslationCode(preferredTranslation)) {
    return jsonError(
      'preferredTranslation must be "NKJV", "NIV", or "NLT"',
      400,
    );
  }

  const user = await getUserByUsername(normalizeUsername(rawUsername));
  if (!user) {
    return jsonError("User not found", 404);
  }

  const updated = await updatePreferredTranslation(
    user.id,
    preferredTranslation,
  );

  if (!updated) {
    return jsonError("Unable to update translation preference", 500);
  }

  return jsonOk({
    id: updated.id,
    username: updated.username,
    preferredTranslation: updated.preferredTranslation,
  });
}
