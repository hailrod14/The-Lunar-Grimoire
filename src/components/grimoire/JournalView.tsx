"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Feather, ScrollText } from "lucide-react";
import { usePageTurn } from "@/components/pixel/usePageTurn";
import { formatLong, parseKey, type DateKey } from "@/lib/dates";
import { getDay, setJournal } from "@/lib/grimoire";
import { journalEntries, paginate } from "@/lib/journal";
import { dispatch } from "@/lib/store";
import type { Grimoire } from "@/lib/types";
import { DateNav } from "./DateNav";

type Props = { g: Grimoire; date: DateKey; today: DateKey; onNavigate: (d: DateKey) => void };

/** The full-page journal: one parchment book per day, read page by page or written freely. */
export function JournalView({ g, date, today, onNavigate }: Props) {
  const text = getDay(g, date).journal;
  const [writing, setWriting] = useState(() => !text.trim() && date <= today);
  const [showContents, setShowContents] = useState(false);
  const [page, setPage] = useState(0);
  const { pageRef, overlay, turn } = usePageTurn();

  const pages = paginate(text);
  const current = Math.min(page, pages.length - 1);
  const future = date > today;

  if (showContents) {
    const close = () => setShowContents(false);
    // Picking the page already open just closes the Contents.
    return <Contents g={g} today={today} onOpen={(d) => (d === date ? close() : onNavigate(d))} onClose={close} />;
  }

  return (
    <div className="space-y-4">
      <DateNav date={date} today={today} onNavigate={onNavigate} />

      <div className="pixel-frame pixel-frame--parchment">
        <div ref={pageRef} className="flex min-h-[60dvh] flex-col p-5">
          {future ? (
            <p className="m-auto text-center font-journal text-2xl text-parchment-700">This page is still blank. The day hasn&apos;t come yet.</p>
          ) : writing ? (
            <textarea
              autoFocus
              value={text}
              aria-label={`Journal for ${formatLong(parseKey(date))}`}
              onChange={(e) => dispatch((x) => setJournal(x, date, e.target.value))}
              placeholder="Dip your quill… write as much as you like. It flows onto new pages on its own."
              className="flex-1 resize-none bg-transparent font-journal text-2xl leading-snug placeholder:text-parchment-700 focus:outline-none"
            />
          ) : (
            <p className="flex-1 font-journal text-2xl leading-snug whitespace-pre-wrap">{pages[current]}</p>
          )}

          {!future && (
            <div className="mt-4 flex items-center justify-between text-sm text-parchment-700">
              {writing ? (
                <>
                  <span>
                    {pages.length} page{pages.length === 1 ? "" : "s"} · saved as you write
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setPage(0);
                      setWriting(false);
                    }}
                    className="pixel-button pixel-button--gold"
                  >
                    Close the book
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    aria-label="Previous page"
                    disabled={current === 0}
                    onClick={() => turn("backward", () => setPage(current - 1))}
                    className="p-1 disabled:opacity-30"
                  >
                    <ChevronLeft strokeWidth={3} />
                  </button>
                  <span>
                    Page {current + 1} of {pages.length}
                  </span>
                  <button
                    type="button"
                    aria-label="Next page"
                    disabled={current === pages.length - 1}
                    onClick={() => turn("forward", () => setPage(current + 1))}
                    className="p-1 disabled:opacity-30"
                  >
                    <ChevronRight strokeWidth={3} />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        {overlay}
      </div>

      <div className="flex gap-2">
        {!writing && !future && (
          <button type="button" onClick={() => setWriting(true)} className="pixel-button pixel-button--gold flex-1">
            <Feather size={16} /> {text.trim() ? "Keep writing" : "Write"}
          </button>
        )}
        <button type="button" onClick={() => setShowContents(true)} className="pixel-button pixel-button--ghost flex-1">
          <ScrollText size={16} /> Contents
        </button>
      </div>
    </div>
  );
}

/** Every written day, newest first. */
function Contents({ g, today, onOpen, onClose }: { g: Grimoire; today: DateKey; onOpen: (d: DateKey) => void; onClose: () => void }) {
  const entries = journalEntries(g);
  return (
    <div className="space-y-4">
      <h2 className="pixel-title text-center text-2xl">Contents</h2>
      <div className="pixel-frame pixel-frame--parchment p-4">
        {entries.length === 0 ? (
          <p className="text-center font-journal text-xl text-parchment-700">No entries yet. Your first page is waiting.</p>
        ) : (
          <ol className="divide-y-2 divide-dashed divide-parchment-500">
            {entries.map((e) => (
              <li key={e.date}>
                <button type="button" onClick={() => onOpen(e.date)} className="block w-full py-2 text-left hover:bg-parchment-300/50">
                  <span className="block text-sm text-parchment-700">
                    {e.date === today ? "Today · " : ""}
                    {formatLong(parseKey(e.date))}
                  </span>
                  <span className="line-clamp-2 block font-journal text-xl leading-snug">{e.text}</span>
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>
      <button type="button" onClick={onClose} className="pixel-button pixel-button--ghost w-full">
        Back to the page
      </button>
    </div>
  );
}
