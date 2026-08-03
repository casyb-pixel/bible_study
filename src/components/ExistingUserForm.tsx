"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{3,32}$/;

export function ExistingUserForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = username.trim();

    if (!USERNAME_PATTERN.test(trimmed)) {
      setError(
        "Enter a username (3–32 characters: letters, numbers, underscore, or hyphen).",
      );
      return;
    }

    setError(null);
    router.push(`/?user=${encodeURIComponent(trimmed.toLowerCase())}`);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <label className="block text-sm text-neutral-600">
        Username
        <input
          type="text"
          name="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          spellCheck={false}
          autoComplete="username"
          placeholder="casyb"
          className="mt-2 block w-full border border-neutral-300 bg-white px-3 py-2.5 text-base text-neutral-900 outline-none focus:border-neutral-500"
        />
      </label>
      <button
        type="submit"
        className="border border-neutral-800 px-4 py-2 text-sm text-neutral-900 hover:bg-neutral-100"
      >
        Continue
      </button>
      {error ? <p className="text-sm text-neutral-600">{error}</p> : null}
    </form>
  );
}
