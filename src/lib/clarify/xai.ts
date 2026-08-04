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
  };
};

export async function requestClarification(userMessage: string): Promise<string> {
  const apiKey = process.env.XAI_API_KEY?.trim();
  if (!apiKey) {
    throw new ClarifyApiError("XAI_API_KEY is not configured", 500);
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

  const data = (await response.json().catch(() => null)) as XaiChatResponse | null;

  if (!response.ok) {
    const detail = data?.error?.message?.trim();
    throw new ClarifyApiError(
      detail || "Clarification service returned an error",
      response.status >= 400 && response.status < 600 ? response.status : 502,
    );
  }

  const content = data?.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new ClarifyApiError("Clarification service returned an empty reply", 502);
  }

  return content;
}
