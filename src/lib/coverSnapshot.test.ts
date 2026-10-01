import { describe, expect, it } from "vitest";
import { coverSnapshot } from "./coverSnapshot";
import { adoptFamiliar, beginTide } from "./grimoire";
import { awardStickers, unawarded } from "./stickers";
import { newGrimoire } from "./types";

describe("the locked cover's look", () => {
  it("keeps only how the familiar and stickers look and where they sit", () => {
    let g = adoptFamiliar(newGrimoire(), { species: "owl", name: "Hoot", coat: 2, collected: [], adoptedOn: "2026-09-01", stickers: [], cameos: true });
    g = beginTide(g, "2026-09-15");
    g = awardStickers(g, unawarded(g, "2026-10-01"));
    const text = JSON.stringify(coverSnapshot(g));
    expect(text).not.toContain("Hoot");
    expect(text).not.toContain("2026"); // no dates, so no period start dates
    expect(text).not.toContain("label");
    expect(text).not.toContain("mood");
    expect(coverSnapshot(g)!.stickers.length).toBeGreaterThan(0);
  });
});
