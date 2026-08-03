import { db } from "@/db";
import { users } from "@/db/schema";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";

type PreferredVoice = "male" | "female";

type CreateUserBody = {
  preferredVoice?: unknown;
};

function isPreferredVoice(value: unknown): value is PreferredVoice {
  return value === "male" || value === "female";
}

export async function POST(request: Request) {
  let preferredVoice: PreferredVoice = "male";

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const parsed = await parseJsonBody<CreateUserBody>(request);
    if ("error" in parsed) {
      return parsed.error;
    }

    if (
      parsed.data.preferredVoice !== undefined &&
      !isPreferredVoice(parsed.data.preferredVoice)
    ) {
      return jsonError('preferredVoice must be "male" or "female"', 400);
    }

    if (isPreferredVoice(parsed.data.preferredVoice)) {
      preferredVoice = parsed.data.preferredVoice;
    }
  }

  try {
    const [created] = await db
      .insert(users)
      .values({
        preferredVoice,
      })
      .returning({
        id: users.id,
        preferredVoice: users.preferredVoice,
      });

    return jsonOk(created, 201);
  } catch {
    return jsonError("Unable to create user", 500);
  }
}
