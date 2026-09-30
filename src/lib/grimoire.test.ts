import { describe, expect, it } from "vitest";
import {
  activePotions,
  addDose,
  archivePotion,
  beginTide,
  completeOnboarding,
  editTide,
  endTide,
  getDay,
  removeLastDose,
  savePotion,
  setFlow,
  togglePotion,
} from "./grimoire";
import { newGrimoire, type Grimoire, type Potion } from "./types";

const potion: Omit<Potion, "id"> = {
  name: "Iron Tincture",
  dose: "1 dropper",
  time: "09:00",
  vessel: "dropper",
  color: "rose",
  schedule: "daily",
  archived: false,
};

const withPotion = (): [Grimoire, string] => {
  const g = savePotion(newGrimoire(), potion);
  return [g, g.potions[0].id];
};

const starts = (g: Grimoire) => g.tides.map((t) => [t.start, t.end]);

describe("tides", () => {
  it("begins and ends a tide", () => {
    let g = beginTide(newGrimoire(), "2026-09-01");
    expect(starts(g)).toEqual([["2026-09-01", undefined]]);
    g = endTide(g, "2026-09-05");
    expect(starts(g)).toEqual([["2026-09-01", "2026-09-05"]]);
  });

  it("ignores beginning a tide on a day already inside one", () => {
    const g = beginTide(newGrimoire(), "2026-09-01");
    expect(beginTide(g, "2026-09-03")).toBe(g);
  });

  it("moves a tide's start earlier when begun a few days before it", () => {
    let g = endTide(beginTide(newGrimoire(), "2026-09-10"), "2026-09-14");
    g = beginTide(g, "2026-09-08");
    expect(starts(g)).toEqual([["2026-09-08", "2026-09-14"]]);
  });

  it("closes a forgotten open tide when the next one begins", () => {
    let g = beginTide(newGrimoire(), "2026-09-01");
    g = beginTide(g, "2026-09-29");
    expect(starts(g)).toEqual([
      ["2026-09-01", "2026-09-05"], // the usual 5-day length
      ["2026-09-29", undefined],
    ]);
  });

  it("can shorten or extend a tide's end", () => {
    let g = endTide(beginTide(newGrimoire(), "2026-09-01"), "2026-09-05");
    expect(starts(endTide(g, "2026-09-03"))).toEqual([["2026-09-01", "2026-09-03"]]);
    g = endTide(g, "2026-09-07");
    expect(starts(g)).toEqual([["2026-09-01", "2026-09-07"]]);
  });

  it("won't end a tide before it began", () => {
    const g = beginTide(newGrimoire(), "2026-09-10");
    expect(endTide(g, "2026-09-05")).toBe(g);
  });

  it("rejects edits that overlap another tide or end before starting", () => {
    let g = endTide(beginTide(newGrimoire(), "2026-08-01"), "2026-08-05");
    g = endTide(beginTide(g, "2026-09-01"), "2026-09-05");
    const second = g.tides[1].id;
    expect(editTide(g, second, { start: "2026-08-04", end: "2026-08-08" })).toBe(g);
    expect(editTide(g, second, { start: "2026-09-05", end: "2026-09-01" })).toBe(g);
    expect(starts(editTide(g, second, { start: "2026-08-30", end: "2026-09-03" }))[1]).toEqual(["2026-08-30", "2026-09-03"]);
  });

  it("sets and clears a day's flow", () => {
    let g = setFlow(newGrimoire(), "2026-09-01", "heavy");
    expect(getDay(g, "2026-09-01").flow).toBe("heavy");
    g = setFlow(g, "2026-09-01", undefined);
    expect("flow" in getDay(g, "2026-09-01")).toBe(false);
  });
});

describe("potions", () => {
  it("ticks and unticks a daily potion, remembering its name and dose", () => {
    const [g0, id] = withPotion();
    const g1 = togglePotion(g0, "2026-09-30", id, "09:04");
    expect(getDay(g1, "2026-09-30").potionLogs).toMatchObject([
      { potionId: id, name: "Iron Tincture", dose: "1 dropper", time: "09:04", extra: false },
    ]);
    expect(getDay(togglePotion(g1, "2026-09-30", id, "10:00"), "2026-09-30").potionLogs).toEqual([]);
  });

  it("keeps history unchanged when a potion is renamed later", () => {
    const [g0, id] = withPotion();
    let g = togglePotion(g0, "2026-09-30", id, "09:04");
    g = savePotion(g, { ...g.potions[0], name: "Iron Elixir", dose: "2 droppers" });
    expect(g.potions[0].name).toBe("Iron Elixir");
    expect(getDay(g, "2026-09-30").potionLogs[0]).toMatchObject({ name: "Iron Tincture", dose: "1 dropper" });
  });

  it("adds extra doses and removes the most recent one", () => {
    const [g0, id] = withPotion();
    let g = togglePotion(g0, "2026-09-30", id, "09:04");
    g = addDose(g, "2026-09-30", id, "13:00");
    g = addDose(g, "2026-09-30", id, "15:30");
    g = removeLastDose(g, "2026-09-30", id);
    const logs = getDay(g, "2026-09-30").potionLogs;
    expect(logs.map((l) => [l.time, l.extra])).toEqual([
      ["09:04", false],
      ["13:00", true],
    ]);
    // With no extras left, removing never touches the daily check-off.
    g = removeLastDose(removeLastDose(g, "2026-09-30", id), "2026-09-30", id);
    expect(getDay(g, "2026-09-30").potionLogs.map((l) => l.extra)).toEqual([false]);
  });

  it("retires a potion without losing its history", () => {
    const [g0, id] = withPotion();
    const g = archivePotion(togglePotion(g0, "2026-09-30", id, "09:04"), id);
    expect(activePotions(g)).toEqual([]);
    expect(getDay(g, "2026-09-30").potionLogs).toHaveLength(1);
  });

  it("ignores doses for a potion that doesn't exist", () => {
    const g = newGrimoire();
    expect(togglePotion(g, "2026-09-30", "missing", "09:00")).toBe(g);
    expect(addDose(g, "2026-09-30", "missing", "09:00")).toBe(g);
  });
});

describe("completeOnboarding", () => {
  it("turns the first-run answers into settings, a tide, and potions", () => {
    const g = completeOnboarding(newGrimoire(), {
      cycleTracking: true,
      lastTideStart: "2026-09-22",
      lastTideEnd: "2026-09-26",
      cycleLength: 30,
      periodLength: 4,
      potions: [potion],
    });
    expect(g.settings).toMatchObject({ onboarded: true, defaultCycleLength: 30, defaultPeriodLength: 4 });
    expect(starts(g)).toEqual([["2026-09-22", "2026-09-26"]]);
    expect(g.potions.map((p) => p.name)).toEqual(["Iron Tincture"]);
  });

  it("skips the tide when cycle tracking is off", () => {
    const g = completeOnboarding(newGrimoire(), {
      cycleTracking: false,
      lastTideStart: "2026-09-22",
      cycleLength: 28,
      periodLength: 5,
      potions: [],
    });
    expect(g.settings.cycleTracking).toBe(false);
    expect(g.tides).toEqual([]);
  });
});

it("never changes the Grimoire it was given", () => {
  const [g0, id] = withPotion();
  const before = JSON.stringify(g0);
  togglePotion(g0, "2026-09-30", id, "09:00");
  beginTide(g0, "2026-09-01");
  setFlow(g0, "2026-09-01", "light");
  expect(JSON.stringify(g0)).toBe(before);
});
