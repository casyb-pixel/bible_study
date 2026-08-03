import { LSBibleClient, MemoryCacheProvider } from "lsbible";

/**
 * Shared LSBible client for private family study use.
 * Reads from read.lsbible.org via the unofficial lsbible package.
 */

/** Trimmed LSB_BUILD_ID from the environment, if present. */
export function getConfiguredBuildId(): string | undefined {
  const value = process.env.LSB_BUILD_ID?.trim();
  return value && value.length > 0 ? value : undefined;
}

export function isBuildIdPinned(): boolean {
  return getConfiguredBuildId() !== undefined;
}

export function createLsbibleClient(): LSBibleClient {
  const pinnedBuildId = getConfiguredBuildId();

  if (pinnedBuildId) {
    console.info("[bible] Using pinned LSB_BUILD_ID (skipping auto lookup)");
  } else {
    console.info(
      "[bible] LSB_BUILD_ID not set; using automatic build ID lookup",
    );
  }

  return new LSBibleClient({
    cache: {
      provider: new MemoryCacheProvider(),
    },
    // When set, the SDK skips fetching the homepage for a build ID.
    buildId: pinnedBuildId,
    timeout: 45,
    headers: {
      // Browser-like headers reduce upstream blocks from serverless IPs.
      "User-Agent":
        "Mozilla/5.0 (compatible; BibleStudyFamily/1.0; private-family-use)",
      Accept: "text/html,application/xhtml+xml,application/json,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Cache-Control": "no-cache",
    },
  });
}

let sharedClient = createLsbibleClient();

export function getLsbibleClient(): LSBibleClient {
  return sharedClient;
}

/** Replace the shared client (used after upstream failures when not pinned). */
export function resetLsbibleClient(): LSBibleClient {
  sharedClient = createLsbibleClient();
  return sharedClient;
}
