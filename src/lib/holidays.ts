import { addDaysKey, dateKey, parseKey, type DateKey } from "./dates";
import type { Grimoire, Occasion } from "./types";

/*
 * Public holidays and well-loved observances by region, and the personal
 * occasions (birthdays, anniversaries…) someone adds for themselves.
 * Holidays are shown on their actual date, not a shifted "day off".
 */

export type HolidayRegion = "us" | "ca" | "uk" | "au" | "none";

export const HOLIDAY_REGIONS: { id: HolidayRegion; name: string }[] = [
  { id: "us", name: "United States" },
  { id: "ca", name: "Canada" },
  { id: "uk", name: "United Kingdom" },
  { id: "au", name: "Australia" },
  { id: "none", name: "None" },
];

export type Holiday = { name: string; /** A day off for many people, rather than an observance. */ public: boolean };

/** Easter Sunday (Gregorian), by the anonymous "Meeus/Jones/Butcher" algorithm. */
export function easter(year: number): DateKey {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return dateKey(new Date(year, month - 1, day));
}

/** The nth weekday (0 = Sunday) of a month; n = -1 for the last one. Month is 1–12. */
export function nthWeekday(year: number, month: number, weekday: number, n: number): DateKey {
  if (n > 0) {
    const first = new Date(year, month - 1, 1).getDay();
    return dateKey(new Date(year, month - 1, 1 + ((weekday - first + 7) % 7) + (n - 1) * 7));
  }
  const lastDate = new Date(year, month, 0);
  return dateKey(new Date(year, month - 1, lastDate.getDate() - ((lastDate.getDay() - weekday + 7) % 7)));
}

const on = (year: number, month: number, day: number) => dateKey(new Date(year, month - 1, day));
const MON = 1;
const THU = 4;
const SUN = 0;

type Entry = [DateKey, string, boolean];

function regionHolidays(year: number, region: HolidayRegion): Entry[] {
  const e = easter(year);
  const shared = {
    newYear: [on(year, 1, 1), "New Year's Day", true] as Entry,
    valentine: [on(year, 2, 14), "Valentine's Day", false] as Entry,
    stPatrick: [on(year, 3, 17), "St. Patrick's Day", false] as Entry,
    goodFriday: [addDaysKey(e, -2), "Good Friday", true] as Entry,
    easter: [e, "Easter Sunday", false] as Entry,
    easterMonday: [addDaysKey(e, 1), "Easter Monday", true] as Entry,
    halloween: [on(year, 10, 31), "Halloween", false] as Entry,
    christmasEve: [on(year, 12, 24), "Christmas Eve", false] as Entry,
    christmas: [on(year, 12, 25), "Christmas Day", true] as Entry,
    boxing: [on(year, 12, 26), "Boxing Day", true] as Entry,
    newYearsEve: [on(year, 12, 31), "New Year's Eve", false] as Entry,
  };
  switch (region) {
    case "us":
      return [
        shared.newYear,
        [nthWeekday(year, 1, MON, 3), "Martin Luther King Jr. Day", true],
        shared.valentine,
        [nthWeekday(year, 2, MON, 3), "Presidents' Day", true],
        shared.stPatrick,
        shared.easter,
        [nthWeekday(year, 5, SUN, 2), "Mother's Day", false],
        [nthWeekday(year, 5, MON, -1), "Memorial Day", true],
        [nthWeekday(year, 6, SUN, 3), "Father's Day", false],
        [on(year, 6, 19), "Juneteenth", true],
        [on(year, 7, 4), "Independence Day", true],
        [nthWeekday(year, 9, MON, 1), "Labor Day", true],
        [nthWeekday(year, 10, MON, 2), "Indigenous Peoples' Day", true],
        shared.halloween,
        [on(year, 11, 11), "Veterans Day", true],
        [nthWeekday(year, 11, THU, 4), "Thanksgiving", true],
        shared.christmasEve,
        shared.christmas,
        shared.newYearsEve,
      ];
    case "ca": {
      // Victoria Day: the last Monday before May 25.
      const may24 = new Date(year, 4, 24);
      const victoria = on(year, 5, 24 - ((may24.getDay() - MON + 7) % 7));
      return [
        shared.newYear,
        shared.valentine,
        [nthWeekday(year, 2, MON, 3), "Family Day", true],
        shared.stPatrick,
        shared.goodFriday,
        shared.easter,
        [nthWeekday(year, 5, SUN, 2), "Mother's Day", false],
        [victoria, "Victoria Day", true],
        [nthWeekday(year, 6, SUN, 3), "Father's Day", false],
        [on(year, 7, 1), "Canada Day", true],
        [nthWeekday(year, 8, MON, 1), "Civic Holiday", true],
        [nthWeekday(year, 9, MON, 1), "Labour Day", true],
        [on(year, 9, 30), "National Day for Truth and Reconciliation", true],
        [nthWeekday(year, 10, MON, 2), "Thanksgiving", true],
        shared.halloween,
        [on(year, 11, 11), "Remembrance Day", true],
        shared.christmasEve,
        shared.christmas,
        shared.boxing,
        shared.newYearsEve,
      ];
    }
    case "uk":
      return [
        shared.newYear,
        shared.valentine,
        [addDaysKey(e, -21), "Mothering Sunday", false],
        shared.stPatrick,
        shared.goodFriday,
        shared.easter,
        shared.easterMonday,
        [nthWeekday(year, 5, MON, 1), "Early May bank holiday", true],
        [nthWeekday(year, 5, MON, -1), "Spring bank holiday", true],
        [nthWeekday(year, 6, SUN, 3), "Father's Day", false],
        [nthWeekday(year, 8, MON, -1), "Summer bank holiday", true],
        shared.halloween,
        [on(year, 11, 5), "Bonfire Night", false],
        [nthWeekday(year, 11, SUN, 2), "Remembrance Sunday", false],
        shared.christmasEve,
        shared.christmas,
        shared.boxing,
        shared.newYearsEve,
      ];
    case "au":
      return [
        shared.newYear,
        [on(year, 1, 26), "Australia Day", true],
        shared.valentine,
        shared.goodFriday,
        shared.easter,
        shared.easterMonday,
        [on(year, 4, 25), "Anzac Day", true],
        [nthWeekday(year, 5, SUN, 2), "Mother's Day", false],
        [nthWeekday(year, 6, MON, 2), "King's Birthday", true],
        [nthWeekday(year, 9, SUN, 1), "Father's Day", false],
        shared.halloween,
        shared.christmasEve,
        shared.christmas,
        shared.boxing,
        shared.newYearsEve,
      ];
    case "none":
      return [];
  }
}

const cache = new Map<string, Map<DateKey, Holiday[]>>();

/** A year's holidays for a region, by date. */
export function holidaysIn(year: number, region: HolidayRegion): Map<DateKey, Holiday[]> {
  const id = `${region}:${year}`;
  let days = cache.get(id);
  if (!days) {
    days = new Map();
    for (const [date, name, isPublic] of regionHolidays(year, region)) {
      days.set(date, [...(days.get(date) ?? []), { name, public: isPublic }]);
    }
    cache.set(id, days);
  }
  return days;
}

export const holidaysOn = (date: DateKey, region: HolidayRegion): Holiday[] =>
  holidaysIn(parseKey(date).getFullYear(), region).get(date) ?? [];

// ── Personal occasions ───────────────────────────────────────

export type OccasionKind = Occasion["kind"];

export const OCCASION_KINDS: { id: OccasionKind; name: string; emoji: string }[] = [
  { id: "birthday", name: "Birthday", emoji: "🎂" },
  { id: "anniversary", name: "Anniversary", emoji: "💞" },
  { id: "celebration", name: "Celebration", emoji: "🎁" },
  { id: "remembrance", name: "Remembrance", emoji: "🕯️" },
];

const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

/** Whether an occasion falls on a date. A yearly Feb 29 shows on Feb 28 in other years. */
export function occursOn(o: Occasion, date: DateKey): boolean {
  const d = parseKey(date);
  const year = d.getFullYear();
  if (!o.yearly) return o.year === year && o.month === d.getMonth() + 1 && o.day === d.getDate();
  if (o.year && year < o.year) return false;
  const day = o.month === 2 && o.day === 29 && !isLeap(year) ? 28 : o.day;
  return o.month === d.getMonth() + 1 && day === d.getDate();
}

export const occasionsOn = (g: Grimoire, date: DateKey): Occasion[] => g.occasions.filter((o) => occursOn(o, date));

/** "turns 30", "5 years", or "" — from the year it began, for yearly occasions. */
export function occasionAge(o: Occasion, date: DateKey): string {
  if (!o.yearly || !o.year) return "";
  const n = parseKey(date).getFullYear() - o.year;
  if (n <= 0) return "";
  if (o.kind === "birthday") return `turns ${n}`;
  return `${n} year${n === 1 ? "" : "s"}`;
}

/** The next date on or after `from` that an occasion falls on (within ~8 years), for sorting. */
export function nextOccurrence(o: Occasion, from: DateKey): DateKey | null {
  const start = parseKey(from).getFullYear();
  for (let y = start; y <= start + 8; y++) {
    const leapShift = o.month === 2 && o.day === 29 && !isLeap(y) ? 28 : o.day;
    const date = on(y, o.month, leapShift);
    if (date >= from && occursOn(o, date)) return date;
    if (!o.yearly && y >= (o.year ?? start)) break;
  }
  return null;
}
