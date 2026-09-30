"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Feather } from "lucide-react";
import { DateNav } from "./DayView";
import type { DayMock } from "./mockData";

const PAGE_CHARS = 280;

/** Splits text into book pages on word boundaries. */
function paginate(text: string): string[] {
  const pages: string[] = [];
  let current = "";
  for (const word of text.split(/(\s+)/)) {
    if ((current + word).length > PAGE_CHARS && current.trim()) {
      pages.push(current.trim());
      current = word.trimStart();
    } else current += word;
  }
  if (current.trim() || pages.length === 0) pages.push(current.trim());
  return pages;
}

type Props = { date: Date; day: DayMock; update: (fn: (d: DayMock) => DayMock) => void; onNavigate: (d: Date) => void };

export function JournalView({ date, day, update, onNavigate }: Props) {
  const [writing, setWriting] = useState(!day.journal);
  const [page, setPage] = useState(0);
  const pages = paginate(day.journal);
  const current = Math.min(page, pages.length - 1);

  return (
    <div className="space-y-4">
      <DateNav date={date} onNavigate={onNavigate} />
      <div className="pixel-frame pixel-frame--parchment flex min-h-[60dvh] flex-col p-5">
        {writing ? (
          <textarea
            autoFocus
            value={day.journal}
            onChange={(e) => update((d) => ({ ...d, journal: e.target.value }))}
            placeholder="Dip your quill… write as much as you like. It flows onto new pages on its own."
            className="flex-1 resize-none bg-transparent font-journal text-2xl leading-snug placeholder:text-parchment-700 focus:outline-none"
          />
        ) : (
          <p className="flex-1 font-journal text-2xl leading-snug whitespace-pre-wrap">{pages[current]}</p>
        )}

        <div className="mt-4 flex items-center justify-between text-sm text-parchment-700">
          {writing ? (
            <>
              <span>
                {pages.length} page{pages.length === 1 ? "" : "s"}
              </span>
              <button type="button" onClick={() => setWriting(false)} className="pixel-button pixel-button--gold">
                Close the book
              </button>
            </>
          ) : (
            <>
              <button type="button" aria-label="Previous page" disabled={current === 0} onClick={() => setPage(current - 1)} className="p-1 disabled:opacity-30">
                <ChevronLeft strokeWidth={3} />
              </button>
              <span>
                Page {current + 1} of {pages.length}
              </span>
              <button
                type="button"
                aria-label="Next page"
                disabled={current === pages.length - 1}
                onClick={() => setPage(current + 1)}
                className="p-1 disabled:opacity-30"
              >
                <ChevronRight strokeWidth={3} />
              </button>
            </>
          )}
        </div>
      </div>
      {!writing && (
        <button type="button" onClick={() => setWriting(true)} className="pixel-button pixel-button--gold w-full">
          <Feather size={16} /> Write
        </button>
      )}
    </div>
  );
}
