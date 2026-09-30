import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDaysKey, formatLong, parseKey, type DateKey } from "@/lib/dates";

export function DateNav({ date, today, onNavigate }: { date: DateKey; today: DateKey; onNavigate: (d: DateKey) => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <button type="button" aria-label="Previous day" onClick={() => onNavigate(addDaysKey(date, -1))} className="p-1 text-gold-300">
        <ChevronLeft strokeWidth={3} />
      </button>
      <h2 className="pixel-title text-center text-xl leading-tight">
        {date === today ? "Today · " : ""}
        {formatLong(parseKey(date))}
      </h2>
      <button type="button" aria-label="Next day" onClick={() => onNavigate(addDaysKey(date, 1))} className="p-1 text-gold-300">
        <ChevronRight strokeWidth={3} />
      </button>
    </div>
  );
}
