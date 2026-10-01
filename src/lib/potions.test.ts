import { describe, expect, it } from "vitest";
import { allDosesOn, describeSchedule, doseLog, dosesOn, isScheduledOn } from "./potions";
import { emptyDay, newGrimoire, type Potion } from "./types";

const base: Potion = {
  id: "p",
  name: "Iron",
  dose: "",
  times: ["09:00"],
  days: [],
  vessel: "vial",
  color: "rose",
  schedule: "daily",
  archived: false,
  reminder: false,
};

describe("potion schedules", () => {
  it("knows which days a potion is taken", () => {
    const weekly = { ...base, schedule: "weekly" as const, days: [1, 4] }; // Mon, Thu
    expect(isScheduledOn(base, "2026-09-30")).toBe(true);
    expect(isScheduledOn(weekly, "2026-09-28")).toBe(true); // Monday
    expect(isScheduledOn(weekly, "2026-09-30")).toBe(false); // Wednesday
    expect(isScheduledOn({ ...base, schedule: "as-needed", times: [] }, "2026-09-30")).toBe(false);
  });

  it("lists every dose of the day, earliest first", () => {
    const g = newGrimoire();
    g.potions = [
      { ...base, id: "night", times: ["21:00"] },
      { ...base, id: "twice", times: ["08:00", "20:00"] },
      { ...base, id: "gone", archived: true },
    ];
    expect(allDosesOn(g, "2026-09-30").map((d) => `${d.potion.id}@${d.time}`)).toEqual(["twice@08:00", "twice@20:00", "night@21:00"]);
    expect(dosesOn(g.potions[1], "2026-09-30").map((d) => d.slot)).toEqual([0, 1]);
  });

  it("finds a dose's check-off, treating old logs as the first dose", () => {
    const day = emptyDay();
    day.potionLogs.push({ id: "a", potionId: "p", name: "Iron", dose: "", time: "09:00", extra: false });
    day.potionLogs.push({ id: "b", potionId: "p", name: "Iron", dose: "", time: "12:00", extra: true });
    expect(doseLog(day, "p", 0)?.id).toBe("a");
    expect(doseLog(day, "p", 1)).toBeUndefined();
  });

  it("describes schedules in words", () => {
    expect(describeSchedule({ ...base, times: ["09:00", "21:00"] })).toBe("daily at 9:00 am & 9:00 pm");
    expect(describeSchedule({ ...base, schedule: "weekly", days: [5, 1] })).toBe("Mon · Fri at 9:00 am");
    expect(describeSchedule({ ...base, schedule: "as-needed", times: [] })).toBe("as needed");
  });
});
