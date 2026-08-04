export type ReadingSpeed = "slower" | "normal" | "faster";

export const READING_SPEED_OPTIONS: {
  value: ReadingSpeed;
  label: string;
  rate: number;
}[] = [
  { value: "slower", label: "Slower", rate: 0.75 },
  { value: "normal", label: "Normal", rate: 1.0 },
  { value: "faster", label: "Faster", rate: 1.35 },
];

const STORAGE_KEY = "bible_study_reading_speed";

export function readingSpeedToRate(speed: ReadingSpeed): number {
  return (
    READING_SPEED_OPTIONS.find((option) => option.value === speed)?.rate ?? 1.0
  );
}

export function isReadingSpeed(value: unknown): value is ReadingSpeed {
  return value === "slower" || value === "normal" || value === "faster";
}

export function loadReadingSpeed(): ReadingSpeed {
  if (typeof window === "undefined") {
    return "normal";
  }

  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (isReadingSpeed(stored)) {
      return stored;
    }
  } catch {
    // sessionStorage may be unavailable
  }

  return "normal";
}

export function saveReadingSpeed(speed: ReadingSpeed): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(STORAGE_KEY, speed);
  } catch {
    // sessionStorage may be unavailable
  }
}
