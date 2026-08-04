/**
 * Client-safe user identity helpers.
 * Do not import the database client from this module.
 */

/** 3–32 chars: letters, numbers, underscore, hyphen. */
export const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{3,32}$/;

export function firstSearchParam(
  value?: string | string[],
): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase();
}

export function isValidUsernameFormat(input: string): boolean {
  return USERNAME_PATTERN.test(input.trim());
}

export function buildUserQuery(username: string): string {
  return `user=${encodeURIComponent(normalizeUsername(username))}`;
}
