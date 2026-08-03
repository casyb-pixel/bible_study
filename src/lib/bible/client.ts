import { LSBibleClient, MemoryCacheProvider } from "lsbible";

/**
 * Shared LSBible client for private family study use.
 * Reads from read.lsbible.org via the unofficial lsbible package.
 */
export function createLsbibleClient(): LSBibleClient {
  return new LSBibleClient({
    cache: {
      provider: new MemoryCacheProvider(),
    },
    // Optional override if auto-detected build IDs fail in production.
    buildId: process.env.LSB_BUILD_ID || undefined,
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

/** Replace the shared client (used after build-id / upstream failures). */
export function resetLsbibleClient(): LSBibleClient {
  sharedClient = createLsbibleClient();
  return sharedClient;
}
