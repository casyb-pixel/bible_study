import { HISTORICAL_WARNING } from "@/lib/historical/label";

type HistoricalWarningProps = {
  className?: string;
};

export function HistoricalWarning({ className = "" }: HistoricalWarningProps) {
  return (
    <p
      className={`border border-neutral-400 bg-neutral-100 px-3 py-2 text-sm font-medium leading-6 text-neutral-900 ${className}`.trim()}
      role="note"
    >
      {HISTORICAL_WARNING}
    </p>
  );
}
