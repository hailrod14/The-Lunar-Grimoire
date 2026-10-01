import { describe, expect, it } from "vitest";
import { easter, holidaysOn, nextOccurrence, nthWeekday, occasionAge, occursOn } from "./holidays";
import { sanitizeGrimoire } from "./storage";
import type { Occasion } from "./types";

const names = (date: string, region: Parameters<typeof holidaysOn>[1]) => holidaysOn(date, region).map((h) => h.name);

describe("easter", () => {
  it("matches published dates", () => {
    expect(easter(2024)).toBe("2024-03-31");
    expect(easter(2025)).toBe("2025-04-20");
    expect(easter(2026)).toBe("2026-04-05");
    expect(easter(2027)).toBe("2027-03-28");
  });
});

describe("nthWeekday", () => {
  it("finds nth and last weekdays", () => {
    expect(nthWeekday(2026, 11, 4, 4)).toBe("2026-11-26"); // Thanksgiving
    expect(nthWeekday(2026, 5, 1, -1)).toBe("2026-05-25"); // Memorial Day
    expect(nthWeekday(2026, 9, 1, 1)).toBe("2026-09-07"); // Labor Day
  });
});

describe("holidaysOn", () => {
  it("places each region's holidays", () => {
    expect(names("2026-11-26", "us")).toEqual(["Thanksgiving"]);
    expect(names("2026-10-12", "ca")).toEqual(["Thanksgiving"]);
    expect(names("2026-05-18", "ca")).toEqual(["Victoria Day"]);
    expect(names("2026-03-15", "uk")).toEqual(["Mothering Sunday"]);
    expect(names("2026-04-25", "au")).toEqual(["Anzac Day"]);
    expect(names("2026-10-31", "us")).toEqual(["Halloween"]);
    expect(names("2026-10-31", "none")).toEqual([]);
  });
});

describe("occasions", () => {
  const birthday: Occasion = { id: "b", name: "Luna", kind: "birthday", month: 10, day: 14, year: 1996, yearly: true };
  const leap: Occasion = { id: "l", name: "Leapling", kind: "birthday", month: 2, day: 29, yearly: true };
  const once: Occasion = { id: "o", name: "Moving day", kind: "celebration", month: 6, day: 1, year: 2027, yearly: false };

  it("recur yearly, from the year they began", () => {
    expect(occursOn(birthday, "2026-10-14")).toBe(true);
    expect(occursOn(birthday, "1995-10-14")).toBe(false);
    expect(occasionAge(birthday, "2026-10-14")).toBe("turns 30");
    expect(occasionAge({ ...birthday, kind: "anniversary", year: 2025 }, "2026-10-14")).toBe("1 year");
  });

  it("move Feb 29 to Feb 28 in other years", () => {
    expect(occursOn(leap, "2027-02-28")).toBe(true);
    expect(occursOn(leap, "2028-02-28")).toBe(false);
    expect(occursOn(leap, "2028-02-29")).toBe(true);
  });

  it("happen once when not yearly", () => {
    expect(occursOn(once, "2027-06-01")).toBe(true);
    expect(occursOn(once, "2028-06-01")).toBe(false);
    expect(nextOccurrence(once, "2026-10-01")).toBe("2027-06-01");
    expect(nextOccurrence(once, "2027-06-02")).toBeNull();
    expect(nextOccurrence(birthday, "2026-10-15")).toBe("2027-10-14");
  });

  it("are validated when loaded", () => {
    const parsed = sanitizeGrimoire({
      version: 3,
      occasions: [birthday, { name: "Bad", month: 2, day: 30 }, { name: "No year", month: 1, day: 1, yearly: false }, { name: " Trim ", month: 1, day: 1 }],
    });
    expect(parsed.ok && parsed.grimoire.occasions.map((o) => o.name)).toEqual(["Luna", "Trim"]);
    expect(parsed.ok && parsed.grimoire.settings.holidayRegion).toBe("us");
  });
});
