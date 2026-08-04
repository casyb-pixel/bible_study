"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import {
  TRANSLATIONS,
  type TranslationCode,
} from "@/lib/bible/translations";

type TranslationSelectorProps = {
  username: string;
  currentTranslation: TranslationCode;
};

export function TranslationSelector({
  username,
  currentTranslation,
}: TranslationSelectorProps) {
  const router = useRouter();
  const [selected, setSelected] =
    useState<TranslationCode>(currentTranslation);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const selectedInfo =
    TRANSLATIONS.find((item) => item.code === selected) ?? TRANSLATIONS[0];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/users/translation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          preferredTranslation: selected,
        }),
      });

      const data = (await response.json()) as
        | { preferredTranslation: TranslationCode }
        | { error: string };

      if (!response.ok || "error" in data) {
        setError("error" in data ? data.error : "Unable to save translation");
        return;
      }

      router.refresh();
    } catch {
      setError("Unable to save translation");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <label className="block text-sm text-neutral-700">
        Preferred Bible version
        <select
          className="mt-2 block w-full border border-neutral-300 bg-white px-3 py-2 text-base text-neutral-900"
          value={selected}
          onChange={(event) =>
            setSelected(event.target.value as TranslationCode)
          }
          disabled={isSaving}
        >
          {TRANSLATIONS.map((item) => (
            <option key={item.code} value={item.code}>
              {item.code} — {item.name}
            </option>
          ))}
        </select>
      </label>

      <div className="space-y-2 text-sm leading-6 text-neutral-600">
        <p>{selectedInfo.description}</p>
        <p>
          <span className="text-neutral-800">Pros:</span> {selectedInfo.pros}
        </p>
        <p>
          <span className="text-neutral-800">Cons:</span> {selectedInfo.cons}
        </p>
      </div>

      <button
        type="submit"
        disabled={isSaving || selected === currentTranslation}
        className="border border-neutral-800 px-4 py-2 text-sm text-neutral-900 hover:bg-neutral-100 disabled:opacity-50"
      >
        {isSaving ? "Saving…" : "Save version"}
      </button>

      {error ? <p className="text-sm text-neutral-600">{error}</p> : null}
    </form>
  );
}
