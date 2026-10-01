import { describe, expect, it } from "vitest";
import { addDose, countSupply, removeLastDose, savePotion, setRest, togglePotion } from "./grimoire";
import { computeInsights } from "./insights";
import { mergeGrimoires } from "./merge";
import { runningLow, supplyLeft, supplyStatus } from "./potions";
import { promptsFor } from "./prompts";
import { sanitizeGrimoire } from "./storage";
import { newGrimoire, type Grimoire, type Potion } from "./types";

const base: Omit<Potion, "id"> = {
  name: "Iron",
  dose: "1 capsule",
  times: ["09:00", "21:00"],
  days: [],
  vessel: "capsule",
  color: "rose",
  schedule: "daily",
  archived: false,
  reminder: false,
  supply: { amount: 10, since: "2026-10-01T08:00", perDose: 1, unit: "capsules", warnDays: 3 },
};

function shelf(): { g: Grimoire; id: string } {
  const g = savePotion(newGrimoire(), base);
  return { g, id: g.potions[0].id };
}

describe("the apothecary shelf", () => {
  it("counts down with each dose logged after the count, and back up when one is removed", () => {
    const shelved = shelf();
    const { id } = shelved;
    let { g } = shelved;
    g = togglePotion(g, "2026-09-30", id, "09:00"); // before the count: not taken from it
    g = togglePotion(g, "2026-10-01", id, "09:00");
    g = addDose(g, "2026-10-01", id, "14:00");
    expect(supplyLeft(g, g.potions[0])).toBe(8);
    g = removeLastDose(g, "2026-10-01", id);
    expect(supplyLeft(g, g.potions[0])).toBe(9);
  });

  it("estimates days left and nudges when it's low", () => {
    const shelved = shelf();
    const { id } = shelved;
    let { g } = shelved;
    expect(supplyStatus(g, g.potions[0], "2026-10-01")).toMatchObject({ left: 10, daysLeft: 5, low: false });
    for (const t of ["09:00", "21:00"]) g = togglePotion(g, "2026-10-01", id, t, t === "09:00" ? 0 : 1);
    for (const t of ["09:00", "21:00"]) g = togglePotion(g, "2026-10-02", id, t, t === "09:00" ? 0 : 1);
    expect(supplyStatus(g, g.potions[0], "2026-10-02")).toMatchObject({ left: 6, daysLeft: 3, low: true });
    expect(runningLow(g, "2026-10-02").map((x) => x.potion.name)).toEqual(["Iron"]);
    g = countSupply(g, id, 6 + 60, "2026-10-02T22:00");
    expect(supplyStatus(g, g.potions[0], "2026-10-02")).toMatchObject({ left: 66, daysLeft: 33, low: false });
  });

  it("keeps both devices' doses when synced, since nothing is decremented in place", () => {
    const { g, id } = shelf();
    const phone = togglePotion(g, "2026-10-01", id, "09:00");
    const laptop = addDose(g, "2026-10-01", id, "13:00");
    const merged = mergeGrimoires(g, laptop, phone);
    expect(supplyLeft(merged, merged.potions[0])).toBe(8);
  });

  it("validates supplies when loaded", () => {
    const parsed = sanitizeGrimoire({ version: 5, potions: [{ ...base, id: "a" }, { ...base, id: "b", supply: { amount: -1, since: "x", perDose: 1 } }] });
    expect(parsed.ok && parsed.grimoire.potions.map((p) => Boolean(p.supply))).toEqual([true, false]);
  });
});

describe("rest and energy", () => {
  it("logs, clears, and shows patterns by phase once there's enough", () => {
    let g = newGrimoire();
    g = setRest(g, "2026-10-01", { sleepHours: 7.5, energy: 4 });
    g = setRest(g, "2026-10-01", { energy: undefined });
    expect(g.days["2026-10-01"].rest).toEqual({ sleepHours: 7.5 });
    g = setRest(g, "2026-10-01", { sleepHours: undefined });
    expect(g.days["2026-10-01"].rest).toBeUndefined();

    g.settings.cycleTracking = false;
    for (let d = 1; d <= 7; d++) g = setRest(g, `2026-09-0${d}`, { sleepHours: 6 + (d % 2), sleepQuality: 3, energy: 2 });
    const { rest } = computeInsights(g, "2026-10-01");
    expect(rest.ready).toBe(true);
    expect(rest.rows).toEqual([{ phase: "all", nights: 7, hours: 46 / 7, quality: 3, days: 7, energy: 2 }]);
  });
});

describe("prompts", () => {
  it("put the day's moon or sabbat first, and stay the same for the day", () => {
    const g = newGrimoire();
    expect(promptsFor(g, "2026-10-26", "2026-10-26")[0]).toMatch(/moon is full/);
    expect(promptsFor(g, "2026-10-31", "2026-10-31")[0]).toMatch(/^Samhain/);
    expect(promptsFor(g, "2026-10-05", "2026-10-05")).toEqual(promptsFor(g, "2026-10-05", "2026-10-05"));
  });
});
