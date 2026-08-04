import Link from "next/link";

type ChapterEndStatus =
  | "idle"
  | "asking"
  | "saving"
  | "confirmed"
  | "declined"
  | "error";

type ChapterEndConfirmationProps = {
  status: ChapterEndStatus;
  nextHref: string | null;
  nextLabel: string | null;
  error: string | null;
  /** True while the bottom control is listening for a spoken yes/no. */
  listeningForAnswer?: boolean;
  onBeginCheck: () => void;
  onYes: () => void;
  onNo: () => void;
};

export function ChapterEndConfirmation({
  status,
  nextHref,
  nextLabel,
  error,
  listeningForAnswer = false,
  onBeginCheck,
  onYes,
  onNo,
}: ChapterEndConfirmationProps) {
  if (status === "idle") {
    return (
      <div className="mt-6 border-t border-neutral-200 pt-6">
        <p className="text-sm font-medium text-neutral-800">Chapter end</p>
        <p className="mt-2 text-sm text-neutral-600">
          When you finish this chapter, confirm your understanding.
        </p>
        <button
          type="button"
          onClick={onBeginCheck}
          className="mt-3 border border-neutral-800 px-3 py-1.5 text-sm text-neutral-900 hover:bg-neutral-100"
        >
          Finished this chapter
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6 border-t border-neutral-200 pt-6">
      <p className="text-sm font-medium text-neutral-800">Chapter end</p>

      {status === "asking" || status === "saving" ? (
        <>
          <p className="mt-3 text-sm text-neutral-800">
            Have you understood this chapter?
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onYes}
              disabled={status === "saving"}
              className="border border-neutral-800 px-3 py-1.5 text-sm text-neutral-900 hover:bg-neutral-100 disabled:opacity-40"
            >
              I understand
            </button>
            <button
              type="button"
              onClick={onNo}
              disabled={status === "saving"}
              className="border border-neutral-300 px-3 py-1.5 text-sm text-neutral-800 hover:bg-neutral-100 disabled:opacity-40"
            >
              Not yet
            </button>
          </div>
          {status === "saving" ? (
            <p className="mt-3 text-sm text-neutral-600">Recording…</p>
          ) : listeningForAnswer ? (
            <p className="mt-3 text-sm text-neutral-600" aria-live="polite">
              Listening for your answer… Say yes / I understand, or not yet.
            </p>
          ) : (
            <p className="mt-3 text-sm text-neutral-500">
              Answer by voice at the bottom, or use the buttons here.
            </p>
          )}
        </>
      ) : null}

      {status === "confirmed" ? (
        <>
          <p className="mt-3 text-sm text-neutral-800">
            Understanding recorded for this chapter.
          </p>
          {nextHref && nextLabel ? (
            <p className="mt-4">
              <Link
                href={nextHref}
                className="inline-block border border-neutral-800 px-3 py-1.5 text-sm text-neutral-900 hover:bg-neutral-100"
              >
                {nextLabel}
              </Link>
            </p>
          ) : (
            <p className="mt-3 text-sm text-neutral-600">
              This is the last chapter in the reading order.
            </p>
          )}
        </>
      ) : null}

      {status === "declined" ? (
        <>
          <p className="mt-3 text-sm text-neutral-800">
            You can ask a question or read the chapter again.
          </p>
          <button
            type="button"
            onClick={onBeginCheck}
            className="mt-4 border border-neutral-300 px-3 py-1.5 text-sm text-neutral-800 hover:bg-neutral-100"
          >
            Ask again
          </button>
        </>
      ) : null}

      {status === "error" ? (
        <>
          <p className="mt-3 text-sm text-neutral-600">
            {error || "Completion could not be recorded."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onYes}
              className="border border-neutral-800 px-3 py-1.5 text-sm text-neutral-900 hover:bg-neutral-100"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={onNo}
              className="border border-neutral-300 px-3 py-1.5 text-sm text-neutral-800 hover:bg-neutral-100"
            >
              Not yet
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

export type { ChapterEndStatus };
