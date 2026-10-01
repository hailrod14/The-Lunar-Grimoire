import { describe, expect, it } from "vitest";
import { allTags, extractTags, highlight, journalEntries, paginate, searchJournal } from "./journal";
import { setJournal } from "./grimoire";
import { newGrimoire } from "./types";

describe("paginate", () => {
  it("gives one empty page for an empty entry", () => {
    expect(paginate("")).toEqual([""]);
  });

  it("keeps a short entry on one page", () => {
    expect(paginate("A quiet day.")).toEqual(["A quiet day."]);
  });

  it("breaks between words and never overflows a page", () => {
    const text = Array.from({ length: 60 }, (_, i) => `word${i}`).join(" ");
    const pages = paginate(text, 50);
    expect(pages.length).toBeGreaterThan(1);
    expect(pages.every((p) => p.length <= 50)).toBe(true);
    expect(pages.join(" ")).toBe(text);
    expect(pages.every((p) => !p.startsWith(" ") && !p.endsWith(" "))).toBe(true);
  });

  it("splits a single enormous word", () => {
    const pages = paginate("x".repeat(120), 50);
    expect(pages.map((p) => p.length)).toEqual([50, 50, 20]);
  });

  it("keeps line breaks inside a page", () => {
    expect(paginate("Morning:\nrain.\n\nNight:\nstars.")).toEqual(["Morning:\nrain.\n\nNight:\nstars."]);
  });
});

describe("journalEntries", () => {
  it("lists written days newest first, skipping blank ones", () => {
    let g = setJournal(newGrimoire(), "2026-09-01", "First.");
    g = setJournal(g, "2026-09-20", "  ");
    g = setJournal(g, "2026-09-15", " Second. ");
    expect(journalEntries(g)).toEqual([
      { date: "2026-09-15", text: "Second." },
      { date: "2026-09-01", text: "First." },
    ]);
  });
});

describe("tags and search", () => {
  const g = [
    ["2026-09-01", "Gathered #rosemary and #Sage by the river. Felt calm."],
    ["2026-09-10", "Headache all afternoon. More #rosemary tea tonight."],
    ["2026-09-20", "A quiet day. Price was $5 #notatag? no: #moon-ritual done"],
    ["2026-09-25", "email me at witch@wood.example, not a #tag-less line"],
  ].reduce((acc, [date, text]) => setJournal(acc, date, text), newGrimoire());

  it("finds #tags, lowercased, ignoring emails and stray hashes", () => {
    expect(extractTags("Gathered #rosemary and #Sage")).toEqual(["rosemary", "sage"]);
    expect(extractTags("witch@wood.example and c#sharp and ##double")).toEqual([]);
    expect(extractTags("#moon-ritual, #moon_2 and #été")).toEqual(["moon-ritual", "moon_2", "été"]);
  });

  it("counts tags across the journal", () => {
    expect(allTags(g).slice(0, 2)).toEqual([
      { tag: "rosemary", count: 2 },
      { tag: "moon-ritual", count: 1 },
    ]);
  });

  it("matches every word and tag, newest first, with a snippet", () => {
    expect(searchJournal(g, "#rosemary").map((r) => r.date)).toEqual(["2026-09-10", "2026-09-01"]);
    expect(searchJournal(g, "#rosemary headache").map((r) => r.date)).toEqual(["2026-09-10"]);
    expect(searchJournal(g, "RIVER")[0].snippet).toContain("river");
    expect(searchJournal(g, "   ")).toEqual([]);
    expect(searchJournal(g, "dragon")).toEqual([]);
  });

  it("starts and ends snippets on whole words", () => {
    const long = setJournal(newGrimoire(), "2026-09-30", "Brewed rosemary tea under the waning moon while the kettle sang softly. Tried a candle spell for calm and slept well after.");
    const snippet = searchJournal(long, "calm")[0].snippet;
    expect(snippet.startsWith("…")).toBe(true);
    const firstWord = snippet.slice(1).split(" ")[0];
    // The word right after the ellipsis is preceded by a space in the original: it wasn't cut.
    expect(long.days["2026-09-30"].journal).toContain(` ${firstWord} `);
  });

  it("highlights matches without treating the query as a pattern", () => {
    expect(highlight("Price was $5 (cheap)", ["$5", "(cheap)"])).toEqual([
      { text: "Price was ", match: false },
      { text: "$5", match: true },
      { text: " ", match: false },
      { text: "(cheap)", match: true },
    ]);
  });
});
