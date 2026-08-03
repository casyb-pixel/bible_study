"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function ExistingUserForm() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = userId.trim();

    if (!UUID_PATTERN.test(trimmed)) {
      setError("Enter a valid user ID (UUID).");
      return;
    }

    setError(null);
    router.push(`/?userId=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <label className="block text-sm text-neutral-600">
        Existing user ID
        <input
          type="text"
          name="userId"
          value={userId}
          onChange={(event) => setUserId(event.target.value)}
          spellCheck={false}
          autoComplete="off"
          placeholder="00000000-0000-4000-8000-000000000001"
          className="mt-2 block w-full border border-neutral-300 bg-white px-3 py-2.5 font-mono text-sm text-neutral-900 outline-none focus:border-neutral-500"
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
