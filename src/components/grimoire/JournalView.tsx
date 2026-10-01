"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Feather, ScrollText, Search } from "lucide-react";
import { usePageTurn } from "@/components/pixel/usePageTurn";
import { formatLong, parseKey, type DateKey } from "@/lib/dates";
import { getDay, setJournal } from "@/lib/grimoire";
import { TAG_PATTERN, allTags, highlight, journalEntries, paginate, searchJournal } from "@/lib/journal";
import { dispatch } from "@/lib/store";
import type { Grimoire } from "@/lib/types";
import { DateNav } from "./DateNav";

type Props = { g: Grimoire; date: DateKey; today: DateKey; onNavigate: (d: DateKey) => void };

/** The full-page journal: one parchment book per day, read page by page or written freely. */
export function JournalView({ g, date, today, onNavigate }: Props) {
  const text = getDay(g, date).journal;
  const [writing, setWriting] = useState(() => !text.trim() && date <= today);
  const [showContents, setShowContents] = useState(false);
  const [contentsQuery, setContentsQuery] = useState("");
  const openContents = (query = "") => {
    setContentsQuery(query);
    setShowContents(true);
  };
  const [page, setPage] = useState(0);
  const { pageRef, overlay, turn } = usePageTurn("parchment");

  const pages = paginate(text);
  const current = Math.min(page, pages.length - 1);
  const future = date > today;

  if (showContents) {
    const close = () => setShowContents(false);
    // Picking the page already open just closes the Contents.
    return (
      <Contents
        g={g}
        today={today}
        initialQuery={contentsQuery}
        onOpen={(d) => (d === date ? close() : onNavigate(d))}
        onClose={close}
      />
    );
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
            <p className="flex-1 font-journal text-2xl leading-snug whitespace-pre-wrap">
              <TaggedText text={pages[current]} onTag={(tag) => openContents(`#${tag}`)} />
            </p>
          )}

          {!future && (
            <div className="mt-4 flex items-center justify-between font-journal text-lg text-parchment-700">
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
        <button type="button" onClick={() => openContents()} className="pixel-button pixel-button--ghost flex-1">
          <ScrollText size={16} /> Contents &amp; search
        </button>
      </div>
    </div>
  );
}

/** An entry's text with its #tags shown as tappable gold links. */
function TaggedText({ text, onTag }: { text: string; onTag: (tag: string) => void }) {
  const pieces: React.ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(TAG_PATTERN)) {
    const at = m.index! + m[1].length;
    pieces.push(text.slice(last, at));
    const tag = m[2];
    pieces.push(
      <button key={at} type="button" onClick={() => onTag(tag.toLowerCase())} className="text-gold-700 underline decoration-dotted underline-offset-4 hover:text-violet-500">
        #{tag}
      </button>,
    );
    last = at + tag.length + 1;
  }
  pieces.push(text.slice(last));
  return <>{pieces}</>;
}

function Highlighted({ text, terms }: { text: string; terms: string[] }) {
  return (
    <>
      {highlight(text, terms).map((piece, i) =>
        piece.match ? (
          <mark key={i} className="bg-gold-300/60 text-ink">
            {piece.text}
          </mark>
        ) : (
          <span key={i}>{piece.text}</span>
        ),
      )}
    </>
  );
}

/** Every written day, newest first, with search by words and #tags. */
function Contents({
  g,
  today,
  initialQuery,
  onOpen,
  onClose,
}: {
  g: Grimoire;
  today: DateKey;
  initialQuery: string;
  onOpen: (d: DateKey) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState(initialQuery);
  const searching = query.trim().length > 0;
  const results = searching ? searchJournal(g, query) : journalEntries(g).map((e) => ({ ...e, snippet: e.text, terms: [] as string[] }));
  const tags = allTags(g);
  const toggleTag = (tag: string) => {
    const parts = query.trim().split(/\s+/).filter(Boolean);
    const token = `#${tag}`;
    setQuery((parts.includes(token) ? parts.filter((p) => p !== token) : [...parts, token]).join(" "));
  };

  return (
    <div className="space-y-4">
      <h2 className="pixel-title text-center text-2xl">Contents</h2>

      <label className="relative block">
        <span className="sr-only">Search your journal</span>
        <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-silver-500" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search words or #tags"
          className="block w-[calc(100%-8px)] bg-midnight-950 py-2 pr-3 pl-9 font-journal text-xl text-silver-100 shadow-[0_0_0_4px_var(--color-violet-500)] placeholder:text-silver-500 focus:outline-none"
        />
      </label>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5" aria-label="Your tags">
          {tags.slice(0, 24).map(({ tag, count }) => {
            const on = query.toLowerCase().split(/\s+/).includes(`#${tag}`);
            return (
              <button
                key={tag}
                type="button"
                aria-pressed={on}
                onClick={() => toggleTag(tag)}
                className={`px-2 py-0.5 font-journal text-lg ${on ? "bg-gold-500 text-midnight-950" : "bg-midnight-950 text-gold-300 hover:bg-midnight-700"}`}
              >
                #{tag} <span className="opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="pixel-frame pixel-frame--parchment p-4">
        {results.length === 0 ? (
          <p className="text-center font-journal text-xl text-parchment-700">
            {searching ? "Nothing in your pages matches that." : "No entries yet. Your first page is waiting."}
          </p>
        ) : (
          <ol className="divide-y-2 divide-dashed divide-parchment-500">
            {searching && (
              <li className="pb-2 font-journal text-lg text-parchment-700">
                {results.length} {results.length === 1 ? "entry" : "entries"} found
              </li>
            )}
            {results.map((e) => (
              <li key={e.date}>
                <button type="button" onClick={() => onOpen(e.date)} className="block w-full py-2 text-left hover:bg-parchment-300/50">
                  <span className="block text-sm text-parchment-700">
                    {e.date === today ? "Today · " : ""}
                    {formatLong(parseKey(e.date))}
                  </span>
                  <span className="line-clamp-3 block font-journal text-xl leading-snug">
                    <Highlighted text={e.snippet} terms={e.terms} />
                  </span>
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
