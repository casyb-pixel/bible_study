import "server-only";

import { resolveGrokTtsVoiceId } from "@/lib/speech/grok-voices";

const XAI_TTS_URL = "https://api.x.ai/v1/tts";

export class XaiTtsError extends Error {
  status: number;

  constructor(message: string, status = 502) {
    super(message);
    this.name = "XaiTtsError";
    this.status = status;
  }
}

export type SynthesizeSpeechInput = {
  text: string;
  voiceId?: string;
  language?: string;
  /** xAI speed multiplier; clamped to 0.7–1.5. */
  speed?: number;
};

function clampSpeed(speed: number | undefined): number {
  if (typeof speed !== "number" || Number.isNaN(speed)) {
    return 1;
  }
  return Math.min(1.5, Math.max(0.7, speed));
}

/**
 * Call xAI Grok Text-to-Speech and return MP3 audio bytes.
 */
export async function synthesizeSpeech(
  input: SynthesizeSpeechInput,
): Promise<{ audio: ArrayBuffer; contentType: string }> {
  const apiKey = process.env.XAI_API_KEY?.trim();
  if (!apiKey) {
    throw new XaiTtsError("XAI_API_KEY is missing on the server", 500);
  }

  const text = input.text.trim();
  if (!text) {
    throw new XaiTtsError("text is required", 400);
  }
  if (text.length > 15000) {
    throw new XaiTtsError("text exceeds the 15,000 character limit", 400);
  }

  const defaultVoice =
    process.env.XAI_TTS_DEFAULT_VOICE?.trim() || undefined;
  const voiceId = resolveGrokTtsVoiceId(input.voiceId || defaultVoice);
  const language = input.language?.trim() || "en";
  const speed = clampSpeed(input.speed);

  let response: Response;
  try {
    response = await fetch(XAI_TTS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        voice_id: voiceId,
        language,
        speed,
        output_format: {
          codec: "mp3",
          sample_rate: 24000,
          bit_rate: 128000,
        },
      }),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Network request failed";
    console.error("[tts] xAI network request failed", { message });
    throw new XaiTtsError(`Network error calling xAI TTS: ${message}`, 502);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error("[tts] xAI TTS failed", {
      status: response.status,
      body: body.slice(0, 500),
    });
    let detail = body.trim() || "No error message provided";
    try {
      const parsed = JSON.parse(body) as { error?: string; message?: string };
      detail = parsed.error || parsed.message || detail;
    } catch {
      // keep raw body
    }
    throw new XaiTtsError(
      `xAI TTS returned ${response.status}: ${detail}`,
      response.status >= 400 && response.status < 600 ? response.status : 502,
    );
  }

  const audio = await response.arrayBuffer();
  const contentType = response.headers.get("content-type") || "audio/mpeg";
  return { audio, contentType };
}
