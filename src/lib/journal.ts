import type { DateKey } from "./dates";
import type { Grimoire } from "./types";

/** Roughly one Book & Quill page of text at the journal's font size. */
export const PAGE_CHARS = 280;

/**
 * Splits an entry into book pages, breaking between words. A word longer
 * than a whole page is split mid-word so no page ever overflows.
 */
export function paginate(text: string, pageChars = PAGE_CHARS): string[] {
  const pages: string[] = [];
  let current = "";
  for (const token of text.split(/(\s+)/)) {
    if (!token) continue;
    if ((current + token).length <= pageChars) {
      current += token;
      continue;
    }
    if (current.trim()) pages.push(current.trim());
    current = token.trimStart();
    while (current.length > pageChars) {
      pages.push(current.slice(0, pageChars));
      current = current.slice(pageChars);
    }
  }
  if (current.trim() || pages.length === 0) pages.push(current.trim());
  return pages;
}

export type JournalEntry = { date: DateKey; text: string };

/** Every written entry, newest first, for the Contents page. */
export function journalEntries(g: Grimoire): JournalEntry[] {
  return Object.entries(g.days)
    .filter(([, day]) => day.journal.trim())
    .map(([date, day]) => ({ date, text: day.journal.trim() }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}
