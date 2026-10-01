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

// ── Tags and search ──────────────────────────────────────────

/** A #tag: letters (any language), numbers, - and _, up to 40 characters. */
export const TAG_PATTERN = /(^|[^\p{L}\p{N}_#-])#([\p{L}\p{N}_-]{1,40})/gu;

/** The #tags in an entry, lowercased, without duplicates. */
export function extractTags(text: string): string[] {
  return [...new Set([...text.matchAll(TAG_PATTERN)].map((m) => m[2].toLowerCase()))];
}

/** Every tag used across the journal, most used first. */
export function allTags(g: Grimoire): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const day of Object.values(g.days)) for (const tag of extractTags(day.journal)) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  return [...counts.entries()].map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export type SearchResult = JournalEntry & { snippet: string; terms: string[] };

const SNIPPET_RADIUS = 60;

/**
 * Entries matching every word and #tag in the query (case-insensitive), newest
 * first, each with a short snippet around the first match.
 */
export function searchJournal(g: Grimoire, query: string): SearchResult[] {
  const parts = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const tags = parts.filter((p) => p.startsWith("#") && p.length > 1).map((p) => p.slice(1));
  const words = parts.filter((p) => !p.startsWith("#"));
  if (!tags.length && !words.length) return [];

  return journalEntries(g)
    .filter((e) => {
      const lower = e.text.toLowerCase();
      const entryTags = extractTags(e.text);
      return tags.every((t) => entryTags.includes(t)) && words.every((w) => lower.includes(w));
    })
    .map((e) => {
      const lower = e.text.toLowerCase();
      const first = Math.min(...[...words, ...tags.map((t) => `#${t}`)].map((w) => lower.indexOf(w)).filter((i) => i >= 0));
      // Cut at word boundaries so a snippet never starts or ends mid-word.
      let start = Math.max(0, first - SNIPPET_RADIUS);
      if (start > 0) start = e.text.indexOf(" ", start) + 1 || start;
      let end = Math.min(e.text.length, first + SNIPPET_RADIUS * 2);
      if (end < e.text.length) end = e.text.lastIndexOf(" ", end) > first ? e.text.lastIndexOf(" ", end) : end;
      const snippet = `${start > 0 ? "…" : ""}${e.text.slice(start, end).trim()}${end < e.text.length ? "…" : ""}`;
      return { ...e, snippet, terms: [...words, ...tags.map((t) => `#${t}`)] };
    });
}

/** Split text into plain and highlighted pieces for safe rendering (no HTML). */
export function highlight(text: string, terms: string[]): { text: string; match: boolean }[] {
  const wanted = terms.filter(Boolean).map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!wanted.length) return [{ text, match: false }];
  const pattern = new RegExp(`(${wanted.join("|")})`, "gi");
  return text
    .split(pattern)
    .filter(Boolean)
    .map((piece) => ({ text: piece, match: wanted.some((w) => new RegExp(`^${w}$`, "i").test(piece)) }));
}
