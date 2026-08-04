import { CLARIFY_SYSTEM_PROMPT } from "@/lib/clarify/prompt";

const XAI_CHAT_URL = "https://api.x.ai/v1/chat/completions";
const DEFAULT_MODEL = "grok-3-mini";

export type ClarifyFailure = {
  /** Safe human-readable summary for clients. */
  error: string;
  /** Upstream or local HTTP status, when known. */
  status: number | null;
  /** Actual xAI / network message when available. */
  message: string;
  /** Whether XAI_API_KEY is missing on the server. */
  missingApiKey: boolean;
};

export class ClarifyApiError extends Error {
  status: number;
  details: ClarifyFailure;

  constructor(details: ClarifyFailure, httpStatus?: number) {
    super(details.error);
    this.name = "ClarifyApiError";
    this.details = details;
    this.status =
      httpStatus ??
      (typeof details.status === "number" && details.status >= 400
        ? details.status
        : 502);
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
  code?: string;
};

function shortSafeMessage(raw: string, maxLength = 240): string {
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
  if (typeof data?.code === "string" && data.code.trim()) {
    const withCode = rawBody.trim()
      ? `${data.code}: ${rawBody}`
      : data.code;
    return shortSafeMessage(withCode);
  }
  if (rawBody.trim()) {
    return shortSafeMessage(rawBody);
  }
  return "No error message provided";
}

export async function requestClarification(userMessage: string): Promise<string> {
  const apiKey = process.env.XAI_API_KEY?.trim();
  const missingApiKey = !apiKey;

  // Never log the key itself — presence only.
  console.info("[clarify] XAI_API_KEY present:", !missingApiKey);

  if (missingApiKey) {
    console.error("[clarify] XAI_API_KEY is missing on the server");
    throw new ClarifyApiError(
      {
        error: "XAI_API_KEY is missing on the server",
        status: null,
        message: "XAI_API_KEY is missing on the server",
        missingApiKey: true,
      },
      500,
    );
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
  } catch (networkError) {
    const networkMessage =
      networkError instanceof Error
        ? shortSafeMessage(networkError.message)
        : "Network request failed";

    console.error("[clarify] xAI network request failed", {
      message: networkMessage,
    });

    throw new ClarifyApiError(
      {
        error: `Network error calling xAI: ${networkMessage}`,
        status: null,
        message: networkMessage,
        missingApiKey: false,
      },
      502,
    );
  }

  const rawBody = await response.text();
  let data: XaiChatResponse | null = null;
  try {
    data = rawBody ? (JSON.parse(rawBody) as XaiChatResponse) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    const detail = extractXaiErrorMessage(data, rawBody);

    console.error("[clarify] xAI API failed", {
      status: response.status,
      body: rawBody,
      message: detail,
    });

    throw new ClarifyApiError(
      {
        error: `xAI returned ${response.status}: ${detail}`,
        status: response.status,
        message: detail,
        missingApiKey: false,
      },
      response.status >= 400 && response.status < 600 ? response.status : 502,
    );
  }

  const content = data?.choices?.[0]?.message?.content?.trim();
  if (!content) {
    console.error("[clarify] xAI returned an empty reply", {
      status: response.status,
      body: rawBody,
    });

    throw new ClarifyApiError(
      {
        error: "Clarification service returned an empty reply",
        status: response.status,
        message: "Empty reply from xAI",
        missingApiKey: false,
      },
      502,
    );
  }

  return content;
}
