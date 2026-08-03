"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

type CreatedUser = {
  id: string;
  preferredVoice: "male" | "female";
};

export function NewUserForm() {
  const [preferredVoice, setPreferredVoice] = useState<"male" | "female">(
    "male",
  );
  const [createdUser, setCreatedUser] = useState<CreatedUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        body: JSON.stringify({ preferredVoice }),
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
            User ID:{" "}
            <span className="break-all font-mono text-sm text-neutral-900">
              {createdUser.id}
            </span>
          </p>
          <p>Preferred voice: {createdUser.preferredVoice}</p>
          <p>
            <Link
              href={`/?userId=${encodeURIComponent(createdUser.id)}`}
              className="text-neutral-800 underline underline-offset-4 hover:text-neutral-950"
            >
              Begin reading
            </Link>
          </p>
          <p>
            <Link
              href={`/read/Genesis/1?userId=${encodeURIComponent(createdUser.id)}`}
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
