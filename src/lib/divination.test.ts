import { describe, expect, it } from "vitest";
import { ELDER_FUTHARK, MAJOR_ARCANA, drawFrom, isValidDraw } from "./divination";
import { getDay, setDraw } from "./grimoire";
import { sanitizeGrimoire } from "./storage";
import { newGrimoire } from "./types";

describe("the daily draw", () => {
  it("has the full Major Arcana and Elder Futhark", () => {
    expect(MAJOR_ARCANA).toHaveLength(22);
    expect(MAJOR_ARCANA[0].name).toBe("The Fool");
    expect(MAJOR_ARCANA[21].name).toBe("The World");
    expect(ELDER_FUTHARK).toHaveLength(24);
    expect(ELDER_FUTHARK.every((r) => r.strokes.every((s) => s.every((n) => n >= 0 && n <= 10)))).toBe(true);
  });

  it("draws within the deck, reversing only tarot", () => {
    const values = [0.999, 0.1];
    const tarot = drawFrom("tarot", () => values.shift()!);
    expect(tarot).toEqual({ deck: "tarot", card: 21, reversed: true });
    for (let i = 0; i < 200; i++) {
      const rune = drawFrom("runes");
      expect(rune.card).toBeLessThan(24);
      expect(rune.reversed).toBe(false);
    }
  });

  it("keeps, returns, and validates a day's draw", () => {
    let g = setDraw(newGrimoire(), "2026-09-30", { deck: "runes", card: 5, reversed: false });
    expect(getDay(g, "2026-09-30").draw).toEqual({ deck: "runes", card: 5, reversed: false });
    const saved = sanitizeGrimoire(JSON.parse(JSON.stringify(g)));
    expect(saved.ok && saved.grimoire.days["2026-09-30"].draw).toEqual({ deck: "runes", card: 5, reversed: false });
    g = setDraw(g, "2026-09-30", undefined);
    expect("draw" in getDay(g, "2026-09-30")).toBe(false);
    expect(isValidDraw({ deck: "tarot", card: 22, reversed: false })).toBe(false);
    expect(isValidDraw({ deck: "oracle", card: 1, reversed: false })).toBe(false);
  });
});
