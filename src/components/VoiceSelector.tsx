"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import {
  GROK_TTS_VOICES,
  type GrokTtsVoiceId,
} from "@/lib/speech/grok-voices";

type VoiceSelectorProps = {
  username: string;
  currentVoice: GrokTtsVoiceId;
};

export function VoiceSelector({
  username,
  currentVoice,
}: VoiceSelectorProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<GrokTtsVoiceId>(currentVoice);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/users/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          preferredTtsVoice: selected,
        }),
      });

      const data = (await response.json()) as
        | { preferredTtsVoice: GrokTtsVoiceId }
        | { error: string };

      if (!response.ok || "error" in data) {
        setError("error" in data ? data.error : "Unable to save voice");
        return;
      }

      router.refresh();
    } catch {
      setError("Unable to save voice");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-3">
      <label className="block text-sm text-neutral-700">
        Preferred reading voice (Grok)
        <select
          className="mt-2 block w-full border border-neutral-300 bg-white px-3 py-2 text-base text-neutral-900"
          value={selected}
          onChange={(event) =>
            setSelected(event.target.value as GrokTtsVoiceId)
          }
          disabled={isSaving}
        >
          <optgroup label="Male">
            {GROK_TTS_VOICES.filter((voice) => voice.gender === "male").map(
              (voice) => (
                <option key={voice.id} value={voice.id}>
                  {voice.label}
                </option>
              ),
            )}
          </optgroup>
          <optgroup label="Female">
            {GROK_TTS_VOICES.filter((voice) => voice.gender === "female").map(
              (voice) => (
                <option key={voice.id} value={voice.id}>
                  {voice.label}
                </option>
              ),
            )}
          </optgroup>
        </select>
      </label>

      <button
        type="submit"
        disabled={isSaving || selected === currentVoice}
        className="border border-neutral-800 px-4 py-2 text-sm text-neutral-900 hover:bg-neutral-100 disabled:opacity-50"
      >
        {isSaving ? "Saving…" : "Save voice"}
      </button>

      {error ? <p className="text-sm text-neutral-600">{error}</p> : null}
    </form>
  );
}
