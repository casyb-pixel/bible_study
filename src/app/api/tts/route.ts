import { NextResponse } from "next/server";

import {
  isNonEmptyString,
  jsonError,
  parseJsonBody,
} from "@/lib/api";
import { isGrokTtsVoiceId } from "@/lib/speech/grok-voices";
import { synthesizeSpeech, XaiTtsError } from "@/lib/speech/xai-tts";

export const dynamic = "force-dynamic";

type TtsBody = {
  text?: unknown;
  voiceId?: unknown;
  language?: unknown;
  speed?: unknown;
};

export async function POST(request: Request) {
  const parsed = await parseJsonBody<TtsBody>(request);
  if ("error" in parsed) {
    return parsed.error;
  }

  const { text, voiceId, language, speed } = parsed.data;

  if (!isNonEmptyString(text)) {
    return jsonError("text is required", 400);
  }
  if (voiceId !== undefined && !isGrokTtsVoiceId(voiceId)) {
    return jsonError("voiceId is not a supported Grok voice", 400);
  }
  if (
    language !== undefined &&
    (typeof language !== "string" || language.trim().length === 0)
  ) {
    return jsonError("language must be a non-empty string when provided", 400);
  }
  if (
    speed !== undefined &&
    (typeof speed !== "number" || Number.isNaN(speed))
  ) {
    return jsonError("speed must be a number when provided", 400);
  }

  try {
    const { audio, contentType } = await synthesizeSpeech({
      text,
      voiceId: typeof voiceId === "string" ? voiceId : undefined,
      language: typeof language === "string" ? language : "en",
      speed: typeof speed === "number" ? speed : undefined,
    });

    return new NextResponse(audio, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof XaiTtsError) {
      return jsonError(error.message, error.status);
    }
    return jsonError("Unexpected TTS error", 500);
  }
}
