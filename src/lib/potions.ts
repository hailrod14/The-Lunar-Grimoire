import { formatHHMM, parseKey, type DateKey } from "./dates";
import type { DayEntry, Grimoire, Potion, PotionLog } from "./types";

export const VESSELS = ["flask", "vial", "dropper", "capsule", "tablet", "bottle", "herbs", "crystal", "cauldron"] as const;
export type Vessel = (typeof VESSELS)[number];

export const VESSEL_NAMES: Record<Vessel, string> = {
  flask: "Round Flask",
  vial: "Tall Vial",
  dropper: "Tincture Dropper",
  capsule: "Capsule",
  tablet: "Tablet",
  bottle: "Pill Bottle",
  herbs: "Herb Bundle",
  crystal: "Crystal",
  cauldron: "Tiny Cauldron",
};

export const LIQUID_COLORS = {
  gold: "#f2b33d",
  violet: "#8f5ee0",
  teal: "#2fbfa8",
  rose: "#e5638f",
  silver: "#b9c6e4",
  moss: "#7fb04a",
} as const;
export type LiquidColor = keyof typeof LIQUID_COLORS;

export const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Whether a potion is meant to be taken on a date (as-needed potions never are). */
export function isScheduledOn(p: Potion, date: DateKey): boolean {
  if (p.schedule === "daily") return true;
  if (p.schedule === "weekly") return p.days.includes(parseKey(date).getDay());
  return false;
}

export type Dose = { potion: Potion; slot: number; time: string };

/** The scheduled doses of one potion on a date. */
export const dosesOn = (p: Potion, date: DateKey): Dose[] =>
  isScheduledOn(p, date) ? p.times.map((time, slot) => ({ potion: p, slot, time })) : [];

/** Every scheduled dose of every active potion on a date, earliest first. */
export const allDosesOn = (g: Grimoire, date: DateKey): Dose[] =>
  g.potions
    .filter((p) => !p.archived)
    .flatMap((p) => dosesOn(p, date))
    .sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));

/** The check-off for one scheduled dose, if it was taken. Old single-dose logs count as the first dose. */
export const doseLog = (day: DayEntry | undefined, potionId: string, slot: number): PotionLog | undefined =>
  day?.potionLogs.find((l) => l.potionId === potionId && !l.extra && (l.slot ?? 0) === slot);

/** "daily at 9:00 am & 9:00 pm", "Mon · Thu at 8:00 am", or "as needed". */
export function describeSchedule(p: Pick<Potion, "schedule" | "times" | "days">): string {
  if (p.schedule === "as-needed") return "as needed";
  const times = p.times.map(formatHHMM).join(" & ");
  if (p.schedule === "daily") return `daily at ${times}`;
  const days = [...p.days].sort((a, b) => a - b).map((d) => WEEKDAYS_SHORT[d]).join(" · ");
  return `${days || "no days chosen"} at ${times}`;
}
