import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { isGrokTtsVoiceId } from "@/lib/speech/grok-voices";
import {
  getUserByUsername,
  isValidUsernameFormat,
  normalizeUsername,
  updatePreferredTtsVoice,
} from "@/lib/users";

type Body = {
  username?: unknown;
  preferredTtsVoice?: unknown;
};

export async function POST(request: Request) {
  const parsed = await parseJsonBody<Body>(request);
  if ("error" in parsed) {
    return parsed.error;
  }

  const { username: rawUsername, preferredTtsVoice } = parsed.data;

  if (typeof rawUsername !== "string" || !isValidUsernameFormat(rawUsername)) {
    return jsonError("username is required", 400);
  }

  if (!isGrokTtsVoiceId(preferredTtsVoice)) {
    return jsonError("preferredTtsVoice is not a supported Grok voice", 400);
  }

  const user = await getUserByUsername(normalizeUsername(rawUsername));
  if (!user) {
    return jsonError("User not found", 404);
  }

  const updated = await updatePreferredTtsVoice(user.id, preferredTtsVoice);
  if (!updated) {
    return jsonError("Unable to update voice preference", 500);
  }

  return jsonOk({
    id: updated.id,
    username: updated.username,
    preferredTtsVoice: updated.preferredTtsVoice,
    preferredVoice: updated.preferredVoice,
  });
}
