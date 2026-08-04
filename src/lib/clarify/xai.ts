import { CLARIFY_SYSTEM_PROMPT } from "@/lib/clarify/prompt";

const XAI_CHAT_URL = "https://api.x.ai/v1/chat/completions";
const DEFAULT_MODEL = "grok-3-mini";

export class ClarifyApiError extends Error {
  status: number;

  constructor(message: string, status = 502) {
    super(message);
    this.name = "ClarifyApiError";
    this.status = status;
  }
}

type XaiChatResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  error?: {
    message?: string;
    code?: string | number;
    type?: string;
  };
};

function shortSafeMessage(raw: string, maxLength = 180): string {
  const cleaned = raw.replace(/\s+/g, " ").trim();
  if (!cleaned) {
    return "No error message provided";
  }
  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  return `${cleaned.slice(0, maxLength - 1)}…`;
}

function extractXaiErrorMessage(
  data: XaiChatResponse | null,
  rawBody: string,
): string {
  const fromJson = data?.error?.message?.trim();
  if (fromJson) {
    return shortSafeMessage(fromJson);
  }
  if (rawBody.trim()) {
    return shortSafeMessage(rawBody);
  }
  return "No error message provided";
}

export async function requestClarification(userMessage: string): Promise<string> {
  const apiKey = process.env.XAI_API_KEY?.trim();
  const hasApiKey = Boolean(apiKey);

  // Never log the key itself — presence only.
  console.info("[clarify] XAI_API_KEY present:", hasApiKey);

  if (!apiKey) {
    throw new ClarifyApiError("XAI_API_KEY is missing on the server", 500);
  }

  const model = process.env.XAI_MODEL?.trim() || DEFAULT_MODEL;

  let response: Response;
  try {
    response = await fetch(XAI_CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          { role: "system", content: CLARIFY_SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
      }),
    });
  } catch {
    throw new ClarifyApiError("Could not reach the clarification service", 502);
  }

  const rawBody = await response.text();
  let data: XaiChatResponse | null = null;
  try {
    data = rawBody ? (JSON.parse(rawBody) as XaiChatResponse) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    console.error("[clarify] xAI API failed", {
      status: response.status,
      body: rawBody,
    });

    const detail = extractXaiErrorMessage(data, rawBody);
    throw new ClarifyApiError(
      `xAI returned ${response.status}: ${detail}`,
      response.status >= 400 && response.status < 600 ? response.status : 502,
    );
  }

  const content = data?.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new ClarifyApiError("Clarification service returned an empty reply", 502);
  }

  return content;
}
