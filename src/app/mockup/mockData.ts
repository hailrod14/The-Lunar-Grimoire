import type { LiquidColor, Vessel } from "@/lib/potions";
import { addDays, dateKey, diffDays } from "@/lib/dates";
import { ELEMENTS, type ElementLog, type TimeBlock } from "@/lib/elements";

/** The mockup is pinned to one date so every visitor sees the same sample data. */
export const TODAY = new Date(2026, 8, 30);

export const CYCLE_LENGTH = 28;
export const PERIOD_LENGTH = 5;

export type Phase = "dark" | "waxing" | "full" | "waning";

export const PHASE_LABEL: Record<Phase, string> = {
  dark: "Dark Moon",
  waxing: "Waxing",
  full: "Full Moon",
  waning: "Waning",
};

export const PHASE_MEANING: Record<Phase, string> = {
  dark: "Menstrual",
  waxing: "Follicular",
  full: "Ovulatory",
  waning: "Luteal",
};

export const PHASE_BG: Record<Phase, string> = {
  dark: "bg-tide-dark",
  waxing: "bg-tide-waxing",
  full: "bg-tide-full",
  waning: "bg-tide-waning",
};

export type Flow = "spotting" | "light" | "medium" | "heavy" | "clots";
export const FLOWS: { id: Flow; label: string }[] = [
  { id: "spotting", label: "Spotting" },
  { id: "light", label: "Light" },
  { id: "medium", label: "Medium" },
  { id: "heavy", label: "Heavy" },
  { id: "clots", label: "Clots" },
];

export type Potion = {
  id: string;
  name: string;
  dose: string;
  time: string; // "HH:MM"
  vessel: Vessel;
  color: LiquidColor;
  schedule: "daily" | "as-needed";
};

export const INITIAL_POTIONS: Potion[] = [
  { id: "p1", name: "Iron Tincture", dose: "1 dropper", time: "09:00", vessel: "dropper", color: "rose", schedule: "daily" },
  { id: "p2", name: "Vitamin D", dose: "1000 IU", time: "09:00", vessel: "vial", color: "gold", schedule: "daily" },
  { id: "p3", name: "Magnesium Elixir", dose: "200 mg", time: "20:00", vessel: "flask", color: "violet", schedule: "daily" },
  { id: "p4", name: "Ibuprofen", dose: "200 mg", time: "", vessel: "crystal", color: "silver", schedule: "as-needed" },
];

export type DayMock = {
  flow?: Flow;
  elements: Record<TimeBlock, ElementLog[]>;
  /** potionId → time taken, e.g. "9:02 am". */
  taken: Record<string, string>;
  extras: { potionId: string; time: string }[];
  journal: string;
};

export const emptyDay = (): DayMock => ({
  elements: { morning: [], afternoon: [], night: [] },
  taken: {},
  extras: [],
  journal: "",
});

/** Logged tide starts: three past cycles, the latest 8 days before "today". */
export const TIDE_STARTS = [-64, -36, -8].map((n) => addDays(TODAY, n));
export const NEXT_TIDE = addDays(TIDE_STARTS[TIDE_STARTS.length - 1], CYCLE_LENGTH);

export type TideInfo = { day: number; phase: Phase; predicted: boolean; phaseValue: number };

export function tideFor(date: Date): TideInfo {
  const start = [...TIDE_STARTS].reverse().find((s) => diffDays(date, s) >= 0) ?? TIDE_STARTS[0];
  const raw = diffDays(date, start);
  const day = (((raw % CYCLE_LENGTH) + CYCLE_LENGTH) % CYCLE_LENGTH) + 1;
  const phase: Phase = day <= PERIOD_LENGTH ? "dark" : day <= 12 ? "waxing" : day <= 15 ? "full" : "waning";
  const phaseValue =
    phase === "dark" ? 0.02
    : phase === "waxing" ? 0.08 + ((day - 6) / 6) * 0.34
    : phase === "full" ? 0.5
    : 0.58 + ((day - 16) / 12) * 0.37;
  return { day, phase, predicted: diffDays(date, TODAY) > 0, phaseValue };
}

// ── Seeded sample history ─────────────────────────────────────

function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

const JOURNAL_SNIPPETS = [
  "Slow morning, tea and rain on the window. Felt more like myself by evening.",
  "Big energy today. Cleaned the whole kitchen and started a new sketchbook.",
  "Cramps in the afternoon. Heating pad, soup, early night. Being gentle.",
  "Walked by the river after work. The moon was almost full and so bright.",
  "Restless and a little snappy. Wrote it out here instead of saying it out loud.",
];

const FLOW_BY_DAY: Flow[] = ["medium", "heavy", "medium", "light", "spotting"];

function sampleDay(date: Date): DayMock {
  const r = rng(Number(dateKey(date).replaceAll("-", "")));
  const day = emptyDay();
  const tide = tideFor(date);
  if (tide.phase === "dark") day.flow = FLOW_BY_DAY[tide.day - 1];

  const isToday = diffDays(date, TODAY) === 0;
  for (const block of ["morning", "afternoon", "night"] as TimeBlock[]) {
    if (isToday && block !== "morning") continue;
    if (r() < 0.75) {
      day.elements[block].push({
        element: ELEMENTS[Math.floor(r() * 4)],
        intensity: (1 + Math.floor(r() * 5)) as ElementLog["intensity"],
        aspect: r() < 0.55 ? "light" : r() < 0.7 ? "shadow" : "mixed",
      });
    }
  }

  for (const p of INITIAL_POTIONS) {
    if (p.schedule !== "daily") continue;
    if (isToday && p.time > "12:00") continue;
    if (r() < 0.85) day.taken[p.id] = p.time === "09:00" ? "9:04 am" : "8:12 pm";
  }
  if (tide.phase === "dark" && tide.day <= 2) day.extras.push({ potionId: "p4", time: "2:30 pm" });
  if (r() < 0.45) day.journal = JOURNAL_SNIPPETS[Math.floor(r() * JOURNAL_SNIPPETS.length)];
  return day;
}

export const INITIAL_DAYS: Record<string, DayMock> = Object.fromEntries(
  Array.from({ length: 75 }, (_, i) => {
    const d = addDays(TODAY, -i);
    return [dateKey(d), sampleDay(d)];
  }),
);

/** "20:00" → "8:00 pm" */
export function displayTime(hhmm: string): string {
  if (!hhmm) return "as needed";
  const [h, m] = hhmm.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
}
