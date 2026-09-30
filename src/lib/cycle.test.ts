import { describe, expect, it } from "vitest";
import { cycleStats, needsEndCheck, nextTideStart, tideDay } from "./cycle";
import { addDaysKey } from "./dates";
import { DEFAULT_SETTINGS, type Tide } from "./types";

const settings = DEFAULT_SETTINGS; // 28-day cycle, 5-day tide
let n = 0;
const tide = (start: string, end?: string): Tide => ({ id: `t${n++}`, start, ...(end ? { end } : {}) });

/** Tides starting `gaps` days apart, each lasting `length` days. */
function tidesWithGaps(first: string, gaps: number[], length = 5): Tide[] {
  const starts = [first];
  for (const gap of gaps) starts.push(addDaysKey(starts.at(-1)!, gap));
  return starts.map((s) => tide(s, addDaysKey(s, length - 1)));
}

describe("cycleStats", () => {
  it("uses the onboarding defaults until three cycles are logged", () => {
    const stats = cycleStats(tidesWithGaps("2026-01-01", [31], 7), settings);
    expect(stats).toEqual({ cycleLength: 28, periodLength: 5, cyclesLearned: 0, periodsLearned: 0 });
  });

  it("learns the average of recent cycles and tides", () => {
    const stats = cycleStats(tidesWithGaps("2026-01-01", [29, 28, 27, 29], 6), settings);
    expect(stats.cycleLength).toBe(28); // 28.25 rounds to 28
    expect(stats.periodLength).toBe(6);
    expect(stats.cyclesLearned).toBe(4);
  });

  it("only counts the six most recent cycles", () => {
    const stats = cycleStats(tidesWithGaps("2025-01-01", [40, 40, 30, 30, 30, 30, 30, 30]), settings);
    expect(stats.cycleLength).toBe(30);
  });

  it("ignores gaps that look like a missed log", () => {
    const stats = cycleStats(tidesWithGaps("2026-01-01", [28, 28, 90, 28]), settings);
    expect(stats.cycleLength).toBe(28);
    expect(stats.cyclesLearned).toBe(3);
  });

  it("keeps learned lengths within sensible limits", () => {
    expect(cycleStats(tidesWithGaps("2026-01-01", [55, 55, 55]), settings).cycleLength).toBe(45);
    expect(cycleStats(tidesWithGaps("2026-01-01", [16, 16, 16]), settings).cycleLength).toBe(21);
  });

  it("ignores tides that are still open when learning tide length", () => {
    const tides = [...tidesWithGaps("2026-01-01", [28, 28], 7), tide("2026-03-26")];
    expect(cycleStats(tides, settings).periodLength).toBe(7);
  });
});

describe("tideDay — a single logged cycle (28-day default)", () => {
  const tides = [tide("2026-09-01", "2026-09-05")];
  const today = "2026-09-10";
  const at = (date: string) => tideDay(date, tides, settings, today)!;

  it("is Dark Moon and bleeding while the tide flows", () => {
    expect(at("2026-09-01")).toMatchObject({ cycleDay: 1, phase: "dark", bleeding: true, predicted: false });
    expect(at("2026-09-05")).toMatchObject({ cycleDay: 5, phase: "dark", bleeding: true });
  });

  it("waxes after the tide ends", () => {
    expect(at("2026-09-06")).toMatchObject({ cycleDay: 6, phase: "waxing", bleeding: false });
    expect(at("2026-09-12")).toMatchObject({ cycleDay: 12, phase: "waxing" });
  });

  it("is Full Moon around day 14 (ovulation ± 1)", () => {
    for (const d of ["2026-09-13", "2026-09-14", "2026-09-15"]) expect(at(d).phase).toBe("full");
  });

  it("wanes until the next tide, marked as predicted after today", () => {
    expect(at("2026-09-16")).toMatchObject({ cycleDay: 16, phase: "waning", predicted: true });
    expect(at("2026-09-28")).toMatchObject({ cycleDay: 28, phase: "waning" });
  });

  it("predicts the next tide one cycle after the last began", () => {
    expect(at("2026-09-29")).toMatchObject({
      cycleDay: 1,
      phase: "dark",
      bleeding: false,
      predicted: true,
      cycleStart: "2026-09-29",
    });
    expect(at("2026-10-27")).toMatchObject({ cycleDay: 1, cycleStart: "2026-10-27" });
    expect(nextTideStart(tides, settings, today)).toBe("2026-09-29");
  });

  it("gives a moon shape that matches the phase", () => {
    expect(at("2026-09-02").phaseValue).toBeLessThan(0.05);
    expect(at("2026-09-09").phaseValue).toBeGreaterThan(0.05);
    expect(at("2026-09-09").phaseValue).toBeLessThan(0.45);
    expect(at("2026-09-14").phaseValue).toBeCloseTo(0.5);
    expect(at("2026-09-20").phaseValue).toBeGreaterThan(0.55);
    expect(at("2026-09-28").phaseValue).toBeLessThanOrEqual(0.94);
  });

  it("knows nothing before the first logged tide", () => {
    expect(tideDay("2026-08-31", tides, settings, today)).toBeNull();
  });

  it("returns nothing when cycle tracking is off", () => {
    expect(tideDay("2026-09-03", tides, { ...settings, cycleTracking: false }, today)).toBeNull();
    expect(nextTideStart(tides, { ...settings, cycleTracking: false }, today)).toBeNull();
  });
});

describe("tideDay — past cycles use their real length", () => {
  // A 32-day cycle: ovulation ≈ day 18, so the Full Moon is days 17–19.
  const tides = [tide("2026-06-01", "2026-06-05"), tide("2026-07-03", "2026-07-07")];
  const at = (date: string) => tideDay(date, tides, settings, "2026-07-10")!;

  it("places the Full Moon by the real cycle length, not the average", () => {
    expect(at("2026-06-16")).toMatchObject({ cycleDay: 16, cycleLength: 32, phase: "waxing" });
    expect(at("2026-06-18")).toMatchObject({ cycleDay: 18, phase: "full" });
    expect(at("2026-06-20")).toMatchObject({ cycleDay: 20, phase: "waning" });
  });

  it("starts a new cycle on the next logged tide", () => {
    expect(at("2026-07-03")).toMatchObject({ cycleDay: 1, phase: "dark", bleeding: true });
  });
});

describe("tideDay — an open tide", () => {
  const tides = [tide("2026-09-01")];

  it("counts every day through today as bleeding", () => {
    const today = "2026-09-03";
    expect(tideDay("2026-09-03", tides, settings, today)).toMatchObject({ phase: "dark", bleeding: true });
    // Tomorrow is still expected to be Dark Moon, but isn't logged.
    expect(tideDay("2026-09-04", tides, settings, today)).toMatchObject({ phase: "dark", bleeding: false, predicted: true });
    expect(tideDay("2026-09-06", tides, settings, today)).toMatchObject({ phase: "waxing", predicted: true });
  });

  it("stays Dark Moon for a long tide until it's ended", () => {
    expect(tideDay("2026-09-08", tides, settings, "2026-09-08")).toMatchObject({ cycleDay: 8, phase: "dark", bleeding: true });
  });

  it("stops a forgotten open tide at 15 days", () => {
    const today = "2026-09-25";
    expect(tideDay("2026-09-15", tides, settings, today)).toMatchObject({ phase: "dark", bleeding: true });
    expect(tideDay("2026-09-16", tides, settings, today)).toMatchObject({ bleeding: false });
    expect(tideDay("2026-09-20", tides, settings, today)).toMatchObject({ phase: "waning", bleeding: false });
  });

  it("asks whether the tide has ended after ten days", () => {
    expect(needsEndCheck(tides, "2026-09-09")).toBe(false);
    expect(needsEndCheck(tides, "2026-09-10")).toBe(true);
    expect(needsEndCheck([tide("2026-09-01", "2026-09-05")], "2026-09-20")).toBe(false);
  });
});

describe("tideDay — a late tide", () => {
  const tides = [tide("2026-09-01", "2026-09-05")];
  const today = "2026-10-03"; // cycle day 33 of an expected 28

  it("reports how many days late, still waning", () => {
    expect(tideDay(today, tides, settings, today)).toMatchObject({ cycleDay: 33, phase: "waning", daysLate: 5, bleeding: false });
  });

  it("moves predictions to start tomorrow", () => {
    expect(nextTideStart(tides, settings, today)).toBe("2026-10-04");
    expect(tideDay("2026-10-04", tides, settings, today)).toMatchObject({ cycleDay: 1, phase: "dark", predicted: true });
  });
});
