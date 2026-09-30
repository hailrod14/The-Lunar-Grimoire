/** Local-calendar date helpers. Days are keyed "YYYY-MM-DD" in local time. */

const pad = (n: number) => String(n).padStart(2, "0");

/** A local calendar day, "YYYY-MM-DD". */
export type DateKey = string;

export const dateKey = (d: Date): DateKey => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** "2026-09-30" → local midnight on that day. */
export function parseKey(key: DateKey): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** True for a real calendar date written as "YYYY-MM-DD". */
export function isDateKey(value: unknown): value is DateKey {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return dateKey(parseKey(value)) === value;
}

/** Whole days from key `b` to key `a`. */
export const diffKeys = (a: DateKey, b: DateKey) => diffDays(parseKey(a), parseKey(b));

export const addDaysKey = (key: DateKey, n: number): DateKey => dateKey(addDays(parseKey(key), n));

export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

export const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);

/** Whole calendar days from `b` to `a` (DST-safe). */
export const diffDays = (a: Date, b: Date) =>
  Math.round(
    (Date.UTC(a.getFullYear(), a.getMonth(), a.getDate()) - Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())) /
      86_400_000,
  );

export const sameDay = (a: Date, b: Date) => diffDays(a, b) === 0;

export const formatLong = (d: Date) =>
  d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

export const formatShort = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

export const formatMonth = (d: Date) => d.toLocaleDateString("en-US", { month: "long", year: "numeric" });

export const formatTime = (d: Date) =>
  d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).toLowerCase();

/** Weeks of a month for a Sunday-first calendar grid; null pads the edges. */
export function monthGrid(month: Date): (Date | null)[][] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = Array(first.getDay()).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(month.getFullYear(), month.getMonth(), d));
  while (cells.length % 7) cells.push(null);
  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}
