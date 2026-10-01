import { describe, expect, it } from "vitest";
import { addDose, beginTide, saveOccasion, savePotion, setJournal, togglePotion, updateSettings } from "./grimoire";
import { deepEqual, mergeGrimoires } from "./merge";
import { newGrimoire, type Grimoire, type Potion } from "./types";

const potion: Omit<Potion, "id"> = {
  name: "Iron",
  dose: "1",
  times: ["09:00"],
  days: [],
  vessel: "flask",
  color: "gold",
  schedule: "daily",
  archived: false,
  reminder: false,
};

function shared(): Grimoire {
  let g = newGrimoire();
  g = savePotion(g, potion);
  g = setJournal(g, "2026-09-30", "A quiet day.");
  return g;
}

describe("deepEqual", () => {
  it("ignores key order and undefined keys", () => {
    expect(deepEqual({ a: 1, b: [1, { c: 2 }] }, { b: [1, { c: 2 }], a: 1 })).toBe(true);
    expect(deepEqual({ a: 1, x: undefined }, { a: 1 })).toBe(true);
    expect(deepEqual([1, 2], [2, 1])).toBe(false);
  });
});

describe("mergeGrimoires", () => {
  it("keeps edits made on different days on each device", () => {
    const base = shared();
    const id = base.potions[0].id;
    const phone = togglePotion(base, "2026-10-01", id, "09:05");
    const laptop = setJournal(base, "2026-10-02", "Wrote on the laptop.");
    const merged = mergeGrimoires(base, laptop, phone);
    expect(merged.days["2026-10-01"].potionLogs).toHaveLength(1);
    expect(merged.days["2026-10-02"].journal).toBe("Wrote on the laptop.");
  });

  it("merges different changes to the same day", () => {
    const base = shared();
    const id = base.potions[0].id;
    const phone = addDose(base, "2026-09-30", id, "14:00");
    const laptop = setJournal(base, "2026-09-30", "A quiet day. Then tea.");
    const merged = mergeGrimoires(base, laptop, phone);
    expect(merged.days["2026-09-30"].potionLogs).toHaveLength(1);
    expect(merged.days["2026-09-30"].journal).toBe("A quiet day. Then tea.");
  });

  it("keeps both doses when each device logged one", () => {
    const base = shared();
    const id = base.potions[0].id;
    const phone = addDose(base, "2026-10-01", id, "08:00");
    const laptop = addDose(base, "2026-10-01", id, "20:00");
    const merged = mergeGrimoires(base, laptop, phone);
    expect(merged.days["2026-10-01"].potionLogs.map((l) => l.time).sort()).toEqual(["08:00", "20:00"]);
  });

  it("keeps both texts when a journal entry was written on both", () => {
    const base = shared();
    const phone = setJournal(base, "2026-09-30", "A quiet day. Phone thoughts.");
    const laptop = setJournal(base, "2026-09-30", "A quiet day. Laptop thoughts.");
    const merged = mergeGrimoires(base, laptop, phone);
    expect(merged.days["2026-09-30"].journal).toBe("A quiet day. Laptop thoughts.\n\nPhone thoughts.");
  });

  it("follows deletions made on one side", () => {
    let base = shared();
    base = saveOccasion(base, { name: "Luna", kind: "birthday", month: 10, day: 14, yearly: true });
    const phone = { ...base, occasions: [] };
    const laptop = updateSettings(base, { soundEnabled: false });
    const merged = mergeGrimoires(base, laptop, phone);
    expect(merged.occasions).toEqual([]);
    expect(merged.settings.soundEnabled).toBe(false);
  });

  it("settles a setting changed on both sides in favour of the preferred side", () => {
    const base = shared();
    const phone = updateSettings(base, { theme: "rose" });
    const laptop = updateSettings(base, { theme: "forest" });
    expect(mergeGrimoires(base, laptop, phone).settings.theme).toBe("forest");
    expect(mergeGrimoires(base, laptop, phone, "remote").settings.theme).toBe("rose");
  });

  it("without a base, keeps everything from both sides", () => {
    const phone = beginTide(savePotion(newGrimoire(), { ...potion, name: "Magnesium" }), "2026-09-20");
    const laptop = beginTide(savePotion(newGrimoire(), potion), "2026-09-20");
    const merged = mergeGrimoires(undefined, laptop, phone, "remote");
    expect(merged.potions.map((p) => p.name).sort()).toEqual(["Iron", "Magnesium"]);
    expect(merged.tides).toHaveLength(1); // the same tide, begun on both
  });
});
