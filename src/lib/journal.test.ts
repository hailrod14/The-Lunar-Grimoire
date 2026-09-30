import { describe, expect, it } from "vitest";
import { journalEntries, paginate } from "./journal";
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
