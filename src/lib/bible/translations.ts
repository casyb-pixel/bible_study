export const TRANSLATION_CODES = ["NKJV", "NIV", "NLT"] as const;

export type TranslationCode = (typeof TRANSLATION_CODES)[number];

export const DEFAULT_TRANSLATION: TranslationCode = "NKJV";

/**
 * API.Bible bible IDs for this family's licensed/available texts.
 * Override with API_BIBLE_ID_NKJV / _NIV / _NLT if needed.
 */
const DEFAULT_BIBLE_IDS: Record<TranslationCode, string> = {
  NKJV: "63097d2a0a2f7db3-01",
  NIV: "78a9f6124f344018-01",
  NLT: "d6e14a625393b4da-01",
};

export type TranslationInfo = {
  code: TranslationCode;
  name: string;
  description: string;
  pros: string;
  cons: string;
};

export const TRANSLATIONS: readonly TranslationInfo[] = [
  {
    code: "NKJV",
    name: "New King James Version",
    description:
      "Update of the King James tradition using modern English while aiming to stay close to the formal style of the older text.",
    pros: "Familiar cadence for many readers; more formal language.",
    cons: "Some archaic phrasing remains; less dynamic than modern translations.",
  },
  {
    code: "NIV",
    name: "New International Version",
    description:
      "Widely used mediating translation that balances readability and accuracy.",
    pros: "Clear contemporary English; very common in churches.",
    cons: "More interpretive in places than strictly formal translations.",
  },
  {
    code: "NLT",
    name: "New Living Translation",
    description:
      "Meaning-based (dynamic) translation focused on clarity for modern readers.",
    pros: "Very easy to understand; good for new readers.",
    cons: "Less word-for-word; more interpretive.",
  },
] as const;

export function isTranslationCode(value: unknown): value is TranslationCode {
  return (
    typeof value === "string" &&
    (TRANSLATION_CODES as readonly string[]).includes(value)
  );
}

export function resolveTranslation(
  value?: string | null,
): TranslationCode {
  if (value && isTranslationCode(value.toUpperCase())) {
    return value.toUpperCase() as TranslationCode;
  }
  return DEFAULT_TRANSLATION;
}

export function getBibleId(translation: TranslationCode): string {
  const envKey = `API_BIBLE_ID_${translation}` as const;
  const fromEnv = process.env[envKey]?.trim();
  if (fromEnv) {
    return fromEnv;
  }
  return DEFAULT_BIBLE_IDS[translation];
}

export function getTranslationInfo(
  code: TranslationCode,
): TranslationInfo {
  const info = TRANSLATIONS.find((item) => item.code === code);
  if (!info) {
    return TRANSLATIONS[0];
  }
  return info;
}
