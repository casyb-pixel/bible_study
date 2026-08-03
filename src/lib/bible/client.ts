import { LSBibleClient, MemoryCacheProvider } from "lsbible";

/**
 * Shared LSBible client for private family study use.
 * Reads from read.lsbible.org via the unofficial lsbible package.
 */
export const lsbibleClient = new LSBibleClient({
  cache: {
    provider: new MemoryCacheProvider(),
  },
  timeout: 30,
});
