import { describe, expect, it } from "vitest";
import { addDaysKey, diffDays, diffKeys, isDateKey, monthGrid } from "./dates";
import { skyMoonName, skyMoonPhase } from "./moon";

/** Distance around the phase circle, so 0.98 and 0.02 are close. */
const phaseDistance = (a: number, b: number) => Math.min(Math.abs(a - b), 1 - Math.abs(a - b));
const ONE_DAY = 1 / 29.53;

describe("skyMoonPhase", () => {
  // Published 2026 full and new moons (UTC). Allow about a day of error.
  it.each(["2026-01-03", "2026-05-31", "2026-09-26", "2026-12-24"])("is full on %s", (date) => {
    const [y, m, d] = date.split("-").map(Number);
    expect(phaseDistance(skyMoonPhase(new Date(y, m - 1, d)), 0.5)).toBeLessThan(1.5 * ONE_DAY);
  });

  it.each(["2026-01-18", "2026-06-15", "2026-10-10"])("is new on %s", (date) => {
    const [y, m, d] = date.split("-").map(Number);
    expect(phaseDistance(skyMoonPhase(new Date(y, m - 1, d)), 0)).toBeLessThan(1.5 * ONE_DAY);
  });

  it("names the phase", () => {
    expect(skyMoonName(0)).toBe("New Moon");
    expect(skyMoonName(0.25)).toBe("First Quarter");
    expect(skyMoonName(0.5)).toBe("Full Moon");
    expect(skyMoonName(0.99)).toBe("New Moon");
    expect(skyMoonName(skyMoonPhase(new Date(2026, 8, 30)))).toBe("Waning Gibbous");
  });
});

describe("dates", () => {
  it("counts calendar days across daylight-saving changes", () => {
    expect(diffDays(new Date(2026, 2, 9), new Date(2026, 2, 7))).toBe(2); // US spring forward
    expect(diffDays(new Date(2026, 10, 2), new Date(2026, 9, 31))).toBe(2); // fall back
    expect(diffKeys("2027-01-01", "2026-12-31")).toBe(1);
    expect(addDaysKey("2026-02-27", 2)).toBe("2026-03-01");
  });

  it("recognizes real date keys only", () => {
    expect(isDateKey("2026-02-28")).toBe(true);
    expect(isDateKey("2028-02-29")).toBe(true);
    expect(isDateKey("2026-02-30")).toBe(false);
    expect(isDateKey("2026-2-3")).toBe(false);
    expect(isDateKey(20260930)).toBe(false);
  });

  it("lays out a Sunday-first month", () => {
    const weeks = monthGrid(new Date(2026, 8, 1)); // September 2026 starts on a Tuesday
    expect(weeks[0].slice(0, 3).map((d) => d?.getDate() ?? null)).toEqual([null, null, 1]);
    expect(weeks.flat().filter(Boolean)).toHaveLength(30);
    expect(weeks.every((w) => w.length === 7)).toBe(true);
  });
});
