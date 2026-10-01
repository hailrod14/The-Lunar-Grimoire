import { describe, expect, it } from "vitest";
import { addDaysKey } from "./dates";
import { buildVisitSummary } from "./summary";
import { emptyDay, newGrimoire, type Grimoire } from "./types";

const TODAY = "2026-09-30";

function fixture(): Grimoire {
  const g = newGrimoire();
  g.tides = [
    { id: "a", start: "2026-06-01", end: "2026-06-05" },
    { id: "b", start: "2026-06-29", end: "2026-07-04" },
    { id: "c", start: "2026-07-28", end: "2026-08-01" },
    { id: "d", start: "2026-08-25", end: "2026-08-29" },
  ];
  g.potions = [
    { id: "iron", name: "Iron", dose: "65 mg", times: ["09:00", "21:00"], days: [], vessel: "vial", color: "rose", schedule: "daily", archived: false, reminder: false },
    { id: "ibu", name: "Ibuprofen", dose: "200 mg", times: [], days: [], vessel: "crystal", color: "silver", schedule: "as-needed", archived: false, reminder: false },
  ];
  const day = (d: string) => (g.days[d] ??= emptyDay());
  day("2026-07-29").flow = "heavy";
  day("2026-07-30").flow = "medium";
  for (const d of ["2026-07-28", "2026-07-29", "2026-08-25"]) day(d).symptoms.push({ id: "cramps", severity: d === "2026-07-29" ? 3 : 2 });
  day("2026-08-10").symptoms.push({ id: "headache", severity: 1 });
  day("2026-07-28").potionLogs.push({ id: "x1", potionId: "ibu", name: "Ibuprofen", dose: "200 mg", time: "10:00", extra: true });
  day("2026-07-28").potionLogs.push({ id: "x2", potionId: "ibu", name: "Ibuprofen", dose: "200 mg", time: "16:00", extra: true });
  // Iron: both doses every day from Sep 20, except the evening dose on Sep 25.
  for (let d = "2026-09-20"; d < TODAY; d = addDaysKey(d, 1)) {
    day(d).potionLogs.push({ id: `m${d}`, potionId: "iron", name: "Iron", dose: "65 mg", time: "09:00", extra: false, slot: 0 });
    if (d !== "2026-09-25") day(d).potionLogs.push({ id: `e${d}`, potionId: "iron", name: "Iron", dose: "65 mg", time: "21:00", extra: false, slot: 1 });
  }
  day("2026-09-01").journal = "Private thoughts that must never leave";
  day("2026-09-01").elements.morning.push({ element: "fire", intensity: 4, aspect: "shadow" });
  return g;
}

describe("buildVisitSummary", () => {
  const s = buildVisitSummary(fixture(), "2026-06-01", TODAY, TODAY);

  it("lists periods with lengths, cycle lengths, and the heaviest flow", () => {
    expect(s.periods.map((p) => [p.start, p.length, p.cycleLength])).toEqual([
      ["2026-06-01", 5, 28],
      ["2026-06-29", 6, 29],
      ["2026-07-28", 5, 28],
      ["2026-08-25", 5, undefined],
    ]);
    expect(s.periods[2].heaviestFlow).toBe("heavy");
  });

  it("summarizes cycle lengths", () => {
    expect(s.overview).toMatchObject({ cyclesMeasured: 3, shortestCycle: 28, longestCycle: 29, lastPeriodStart: "2026-08-25" });
    expect(s.overview.averageCycle).toBeCloseTo(28.33, 1);
    expect(s.overview.averagePeriod).toBeCloseTo(5.25, 2);
  });

  it("counts symptom days by severity and the phase they cluster in", () => {
    expect(s.symptoms[0]).toEqual({ name: "Cramps", days: 3, mild: 0, moderate: 2, strong: 1, commonPhase: "menstrual phase" });
    expect(s.symptoms[1].name).toBe("Headache");
  });

  it("measures scheduled doses taken and as-needed use", () => {
    expect(s.medications).toEqual([{ name: "Iron", dose: "65 mg", schedule: "daily at 9:00 am & 9:00 pm", taken: 19, scheduled: 20 }]);
    expect(s.asNeeded).toEqual([{ name: "Ibuprofen", dose: "200 mg", doses: 2, days: 1 }]);
  });

  it("never includes journal text", () => {
    expect(JSON.stringify(s)).not.toContain("Private thoughts");
  });

  it("only covers the chosen span", () => {
    const recent = buildVisitSummary(fixture(), "2026-08-01", TODAY, TODAY);
    expect(recent.periods.map((p) => p.start)).toEqual(["2026-08-25"]);
    expect(recent.symptoms.map((x) => [x.name, x.days])).toEqual([
      ["Cramps", 1],
      ["Headache", 1],
    ]);
    expect(recent.asNeeded).toEqual([]);
  });
});
