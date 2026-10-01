import { describe, expect, it } from "vitest";
import { ACCESSORIES, SPECIES, SPECIES_INFO, familiarMood, familiarPalette, newlyInSeason, owns } from "./familiars";
import { beginTide } from "./grimoire";
import { sanitizeGrimoire } from "./storage";
import { newGrimoire, type Familiar } from "./types";

const cat: Familiar = { species: "cat", name: "Salem", coat: 0, collected: [], adoptedOn: "2026-10-01" };

describe("familiar sprites", () => {
  it("are 16 × 16 and only use known colours", () => {
    for (const s of SPECIES) {
      const { rows, coats } = SPECIES_INFO[s];
      expect(rows, s).toHaveLength(16);
      for (const row of rows) expect(row.length, `${s}: "${row}"`).toBe(16);
      const palette = familiarPalette(s, 0);
      for (const ch of new Set(rows.join(""))) if (ch !== ".") expect(palette[ch], `${s} uses "${ch}"`).toBeDefined();
      expect(coats.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("accessories are rectangular and fully coloured", () => {
    for (const a of ACCESSORIES) {
      for (const row of a.rows) expect(row.length, a.id).toBe(a.rows[0].length);
      for (const ch of new Set(a.rows.join(""))) if (ch !== ".") expect(a.colors[ch], `${a.id} uses "${ch}"`).toBeDefined();
    }
  });
});

describe("familiar moods and seasons", () => {
  it("follow your tide", () => {
    let g = newGrimoire();
    g = beginTide(g, "2026-10-01");
    expect(familiarMood(g, "2026-10-02")).toBe("dark");
  });

  it("follow the sky's moon when you're not tracking", () => {
    const g = newGrimoire();
    g.settings.cycleTracking = false;
    expect(familiarMood(g, "2026-10-26")).toBe("full"); // the Hunter's Moon
  });

  it("gather seasonal pieces in their season, by hemisphere", () => {
    expect(newlyInSeason(cat, "2026-10-01", "north").map((a) => a.id)).toEqual(["pumpkin", "mushroom", "leaf-scarf"]);
    expect(newlyInSeason(cat, "2026-10-01", "south").map((a) => a.id)).toEqual(["flower-crown"]);
    const pumpkin = ACCESSORIES.find((a) => a.id === "pumpkin")!;
    expect(owns(cat, pumpkin)).toBe(false);
    expect(owns({ ...cat, collected: ["pumpkin"] }, pumpkin)).toBe(true);
  });

  it("are validated when loaded", () => {
    const parsed = sanitizeGrimoire({ version: 4, familiar: { ...cat, head: "pumpkin", neck: "pumpkin", coat: 99, collected: ["pumpkin", "nope"] } });
    expect(parsed.ok && parsed.grimoire.familiar).toEqual({ ...cat, head: "pumpkin", coat: 0, collected: ["pumpkin"] });
    const none = sanitizeGrimoire({ version: 4, familiar: { species: "unicorn" } });
    expect(none.ok && none.grimoire.familiar).toBeUndefined();
  });
});
