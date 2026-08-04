export type BrowserSpeechRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((this: BrowserSpeechRecognition, ev: Event) => void) | null;
  onend: ((this: BrowserSpeechRecognition, ev: Event) => void) | null;
  onerror:
    | ((
        this: BrowserSpeechRecognition,
        ev: { error: string; message?: string },
      ) => void)
    | null;
  onresult:
    | ((
        this: BrowserSpeechRecognition,
        ev: {
          resultIndex: number;
          results: ArrayLike<{
            isFinal: boolean;
            0: { transcript: string };
          }>;
        },
      ) => void)
    | null;
};

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

export function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") {
    return null;
  }

  const withWebkit = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

  return (
    withWebkit.SpeechRecognition ??
    withWebkit.webkitSpeechRecognition ??
    null
  );
}

export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionConstructor() !== null;
}
