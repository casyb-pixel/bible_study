"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import {
  DEFAULT_TRANSLATION,
  TRANSLATIONS,
  type TranslationCode,
} from "@/lib/bible/translations";

type CreatedUser = {
  id: string;
  username: string;
  preferredVoice: "male" | "female";
  preferredTranslation: TranslationCode;
};

export function NewUserForm() {
  const [username, setUsername] = useState("");
  const [preferredVoice, setPreferredVoice] = useState<"male" | "female">(
    "male",
  );
  const [preferredTranslation, setPreferredTranslation] =
    useState<TranslationCode>(DEFAULT_TRANSLATION);
  const [createdUser, setCreatedUser] = useState<CreatedUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedInfo =
    TRANSLATIONS.find((item) => item.code === preferredTranslation) ??
    TRANSLATIONS[0];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          preferredVoice,
          preferredTranslation,
        }),
      });

      const data = (await response.json()) as CreatedUser | { error: string };

      if (!response.ok || "error" in data) {
        setError("error" in data ? data.error : "Unable to create user");
        setCreatedUser(null);
        return;
      }

      setCreatedUser(data);
    } catch {
      setError("Unable to create user");
      setCreatedUser(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mt-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm text-neutral-700">
          Username
          <input
            type="text"
            name="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            spellCheck={false}
            autoComplete="username"
            placeholder="casyb"
            disabled={isSubmitting}
            className="mt-2 block w-full border border-neutral-300 bg-white px-3 py-2.5 text-base text-neutral-900 outline-none focus:border-neutral-500 disabled:opacity-50"
          />
        </label>
        <p className="text-sm text-neutral-500">
          3–32 characters. Letters, numbers, underscore, or hyphen.
        </p>

        <label className="block text-sm text-neutral-700">
          Preferred Bible version
          <select
            className="mt-2 block w-full border border-neutral-300 bg-white px-3 py-2 text-base text-neutral-900"
            value={preferredTranslation}
            onChange={(event) =>
              setPreferredTranslation(event.target.value as TranslationCode)
            }
            disabled={isSubmitting}
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

        <label className="block text-sm text-neutral-700">
          Preferred voice
          <select
            className="mt-2 block w-full border border-neutral-300 bg-white px-3 py-2 text-base text-neutral-900"
            value={preferredVoice}
            onChange={(event) =>
              setPreferredVoice(event.target.value as "male" | "female")
            }
            disabled={isSubmitting}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="border border-neutral-800 px-4 py-2 text-sm text-neutral-900 hover:bg-neutral-100 disabled:opacity-50"
        >
          {isSubmitting ? "Creating…" : "Create user"}
        </button>
      </form>

      {error ? <p className="mt-4 text-sm text-neutral-600">{error}</p> : null}

      {createdUser ? (
        <div className="mt-8 space-y-3 text-base text-neutral-700">
          <p>User created.</p>
          <p>
            Username:{" "}
            <span className="font-medium text-neutral-900">
              {createdUser.username}
            </span>
          </p>
          <p>Bible version: {createdUser.preferredTranslation}</p>
          <p>Preferred voice: {createdUser.preferredVoice}</p>
          <p>
            Internal ID:{" "}
            <span className="break-all font-mono text-sm text-neutral-600">
              {createdUser.id}
            </span>
          </p>
          <p>
            <Link
              href={`/?user=${encodeURIComponent(createdUser.username)}`}
              className="text-neutral-800 underline underline-offset-4 hover:text-neutral-950"
            >
              Begin reading as {createdUser.username}
            </Link>
          </p>
          <p>
            <Link
              href={`/read/Genesis/1?user=${encodeURIComponent(createdUser.username)}`}
              className="text-neutral-800 underline underline-offset-4 hover:text-neutral-950"
            >
              Open Genesis 1
            </Link>
          </p>
        </div>
      ) : null}
    </div>
  );
}
