import { describe, expect, it } from "vitest";
import { addDaysKey } from "./dates";
import type { Element } from "./elements";
import { computeInsights } from "./insights";
import { emptyDay, newGrimoire, type Grimoire } from "./types";

const TODAY = "2026-09-10";
const STARTS = ["2026-06-01", "2026-06-29", "2026-07-27", "2026-08-24"]; // 28-day cycles, 5-day tides

function fixture(): Grimoire {
  const g = newGrimoire();
  g.settings.onboarded = true;
  g.tides = STARTS.map((start, i) => ({ id: `t${i}`, start, end: addDaysKey(start, 4) }));
  g.potions = [
    { id: "iron", name: "Iron", dose: "", time: "09:00", vessel: "vial", color: "rose", schedule: "daily", archived: false, reminder: false },
    { id: "new", name: "Never taken", dose: "", time: "09:00", vessel: "vial", color: "gold", schedule: "daily", archived: false, reminder: false },
    { id: "old", name: "Retired", dose: "", time: "09:00", vessel: "vial", color: "gold", schedule: "daily", archived: true, reminder: false },
  ];
  const log = (date: string, element: Element, aspect: "light" | "shadow" = "light") => {
    const day = g.days[date] ?? emptyDay();
    day.elements.morning.push({ element, intensity: 4, aspect });
    g.days[date] = day;
  };
  // Cycle day 2 (Dark Moon): water. Day 8 (Waxing): earth. Day 14 (Full): air. Day 20/21 (Waning): fire.
  for (const s of STARTS) {
    log(addDaysKey(s, 1), "water");
    log(addDaysKey(s, 7), "earth");
    log(addDaysKey(s, 13), "air");
  }
  for (const d of ["2026-06-20", "2026-06-21", "2026-07-18", "2026-08-15"]) log(d, "fire", "shadow");
  log("2026-06-22", "water");
  // Cramps on three Dark Moon days.
  for (const s of STARTS.slice(0, 3)) g.days[addDaysKey(s, 1)].symptoms.push({ id: "cramps", severity: 2 });
  // Iron taken most days from Aug 20, skipping two.
  for (let d = "2026-08-20"; d <= "2026-09-09"; d = addDaysKey(d, 1)) {
    if (d === "2026-08-25" || d === "2026-09-01") continue;
    const day = g.days[d] ?? emptyDay();
    day.potionLogs.push({ id: `l${d}`, potionId: "iron", name: "Iron", dose: "", time: "09:00", extra: false });
    g.days[d] = day;
  }
  return g;
}

describe("computeInsights", () => {
  const insights = computeInsights(fixture(), TODAY);

  it("tallies elements by the phase each day fell in", () => {
    const row = (phase: string) => insights.elements.rows.find((r) => r.phase === phase)!;
    const cell = (phase: string, el: string) => row(phase).cells.find((c) => c.element === el)!;
    expect(insights.elements.totalLogs).toBe(17);
    expect(insights.elements.ready).toBe(true);
    expect(cell("dark", "water").count).toBe(4);
    expect(cell("waxing", "earth").count).toBe(4);
    expect(cell("full", "air").count).toBe(4);
    expect(row("waning").total).toBe(5);
    expect(cell("waning", "fire")).toMatchObject({ count: 4, share: 0.8, shadowShare: 1, avgIntensity: 4 });
  });

  it("calls out an element that clearly rises in one phase", () => {
    expect(insights.elements.highlights[0]).toMatchObject({ element: "fire", phase: "waning", share: 0.8 });
  });

  it("lists the top symptoms per phase", () => {
    const dark = insights.symptoms.phases.find((p) => p.phase === "dark")!;
    expect(dark).toMatchObject({ daysLogged: 3, top: [{ id: "cramps", name: "Cramps", days: 3, share: 1 }] });
    expect(insights.symptoms.ready).toBe(true);
  });

  it("summarizes completed cycles", () => {
    expect(insights.cycles).toMatchObject({ average: 28, shortest: 28, longest: 28, tideAverage: 5 });
    expect(insights.cycles!.bars).toHaveLength(3);
  });

  it("measures potion consistency only since a potion was first taken", () => {
    expect(insights.potions).toEqual([{ id: "iron", name: "Iron", taken: 19, possible: 21, share: 19 / 21 }]);
  });

  it("says nothing about elements or cycles with too little data", () => {
    const sparse = computeInsights({ ...newGrimoire(), tides: [{ id: "a", start: "2026-09-01", end: "2026-09-05" }] }, TODAY);
    expect(sparse.elements.ready).toBe(false);
    expect(sparse.cycles).toBeNull();
    expect(sparse.symptoms.ready).toBe(false);
  });

  it("skips phase-based insights when cycle tracking is off", () => {
    const g = fixture();
    g.settings.cycleTracking = false;
    const off = computeInsights(g, TODAY);
    expect(off.elements.ready).toBe(false);
    expect(off.cycles).toBeNull();
    expect(off.potions).toHaveLength(1);
  });
});
