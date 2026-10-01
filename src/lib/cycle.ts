import { addDaysKey, diffKeys, type DateKey } from "./dates";
import type { Settings, Tide } from "./types";

/*
 * The Lunar Tide model
 * ────────────────────
 * Dark Moon  (menstrual)   day 1 → the tide's last day
 * Waxing     (follicular)  after the tide → the day before the Full Moon window
 * Full Moon  (ovulatory)   estimated ovulation ± 1 day
 * Waning     (luteal)      after the Full Moon window → the next tide
 *
 * Ovulation is estimated as 14 days before the cycle's end. For past cycles
 * the real length is known, so history is placed exactly; for the current
 * and future cycles the learned average is used.
 */

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

/** Cycles needed before learned averages replace the onboarding answers. */
export const MIN_CYCLES_TO_LEARN = 3;
/** Only the most recent cycles count, so the averages follow change over time. */
export const MAX_CYCLES_TO_LEARN = 6;

const CYCLE_LIMITS = [21, 45] as const;
const PERIOD_LIMITS = [2, 10] as const;
/** Gaps outside this range are probably a missed log, not a real cycle. */
const PLAUSIBLE_CYCLE = [15, 60] as const;
const PLAUSIBLE_PERIOD = [1, 15] as const;
/** ± days around a prediction while still using onboarding estimates. */
const ESTIMATE_SPREAD = 3;
/** The widest a prediction window gets, however irregular the cycles. */
const MAX_SPREAD = 7;
/** Cycles longer than this multiple of the typical one are treated as a skipped tide. */
const SKIPPED_TIDE_FACTOR = 1.5;
/** Ask "Has your tide ended?" once an open tide reaches this many days. */
export const END_CHECK_DAYS = 10;
/** No tide runs longer than this; a forgotten open tide stops here. */
export const MAX_TIDE_DAYS = 15;

const clamp = (n: number, [lo, hi]: readonly [number, number]) => Math.min(hi, Math.max(lo, n));
const within = (n: number, [lo, hi]: readonly [number, number]) => n >= lo && n <= hi;
const average = (ns: number[]) => ns.reduce((a, b) => a + b, 0) / ns.length;
const median = (ns: number[]) => {
  const sorted = [...ns].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

export const sortTides = (tides: Tide[]) => [...tides].sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));

/** Length in days of a finished tide, start and end inclusive. */
export const tideLength = (t: Tide) => (t.end ? diffKeys(t.end, t.start) + 1 : undefined);

export type CycleStats = {
  cycleLength: number;
  periodLength: number;
  /** How many real cycles the cycle length was learned from (0 = using the default). */
  cyclesLearned: number;
  /** ± days of uncertainty for predictions: how much recent cycles varied (wider while estimating). */
  spread: number;
  periodsLearned: number;
};

export function cycleStats(tides: Tide[], settings: Settings): CycleStats {
  const sorted = sortTides(tides);

  const recent = sorted
    .slice(1)
    .map((t, i) => diffKeys(t.start, sorted[i].start))
    .filter((n) => within(n, PLAUSIBLE_CYCLE))
    .slice(-MAX_CYCLES_TO_LEARN);
  // A cycle far longer than usual is most likely a skipped tide; leave it out.
  const typical = median(recent);
  const cycles = recent.filter((n) => n <= typical * SKIPPED_TIDE_FACTOR);

  const periods = sorted
    .map(tideLength)
    .filter((n): n is number => n !== undefined && within(n, PLAUSIBLE_PERIOD))
    .slice(-MAX_CYCLES_TO_LEARN);

  const learnCycle = cycles.length >= MIN_CYCLES_TO_LEARN;
  const learnPeriod = periods.length >= MIN_CYCLES_TO_LEARN;

  // Predictions are as uncertain as the cycles are irregular: about one standard deviation.
  const deviation = learnCycle ? Math.sqrt(average(cycles.map((n) => (n - average(cycles)) ** 2))) : null;
  const spread = deviation === null ? ESTIMATE_SPREAD : Math.min(MAX_SPREAD, Math.max(1, Math.round(deviation)));

  return {
    spread,
    cycleLength: learnCycle ? clamp(Math.round(average(cycles)), CYCLE_LIMITS) : settings.defaultCycleLength,
    periodLength: learnPeriod ? clamp(Math.round(average(periods)), PERIOD_LIMITS) : settings.defaultPeriodLength,
    cyclesLearned: learnCycle ? cycles.length : 0,
    periodsLearned: learnPeriod ? periods.length : 0,
  };
}

export type TideDay = {
  /** 1-based day of the cycle this date falls in. */
  cycleDay: number;
  /** Length used for this cycle: the real one for past cycles, the average otherwise. */
  cycleLength: number;
  phase: Phase;
  /** 0 → 1 moon shape for drawing (0 dark, 0.5 full). */
  phaseValue: number;
  /** A logged tide day (never true for predictions). */
  bleeding: boolean;
  /** The date is after today, so everything about it is an estimate. */
  predicted: boolean;
  /** Days past the expected next tide (0 when not late). */
  daysLate: number;
  /** Start of the cycle this date belongs to (predicted for future cycles). */
  cycleStart: DateKey;
};

function phaseFor(cycleDay: number, cycleLength: number, darkDays: number, late: boolean): { phase: Phase; phaseValue: number } {
  if (late) return { phase: "waning", phaseValue: 0.95 };
  const ovulation = Math.max(cycleLength - 14, darkDays + 2);
  const fullStart = ovulation - 1;
  const fullEnd = ovulation + 1;

  if (cycleDay <= darkDays) return { phase: "dark", phaseValue: 0.01 };
  if (cycleDay >= fullStart && cycleDay <= fullEnd) {
    return { phase: "full", phaseValue: 0.5 + (cycleDay - ovulation) * 0.03 };
  }
  if (cycleDay < fullStart) {
    const span = Math.max(1, fullStart - 1 - darkDays);
    return { phase: "waxing", phaseValue: 0.06 + (0.38 * (cycleDay - darkDays - 1)) / span };
  }
  const span = Math.max(1, cycleLength - fullEnd);
  return { phase: "waning", phaseValue: Math.min(0.94, 0.56 + (0.38 * (cycleDay - fullEnd - 1)) / span) };
}

/**
 * Where a date sits in the Lunar Tide. Returns null when cycle tracking is off
 * or the date is before the first logged tide.
 */
export function tideDay(date: DateKey, tides: Tide[], settings: Settings, today: DateKey): TideDay | null {
  if (!settings.cycleTracking) return null;
  const sorted = sortTides(tides);
  const index = sorted.findLastIndex((t) => t.start <= date);
  if (index < 0) return null;

  const stats = cycleStats(sorted, settings);
  const current = sorted[index];
  const next = sorted[index + 1];
  const predicted = date > today;

  // ── A finished cycle: the next tide is logged, so the real length is known.
  if (next) {
    const actual = diffKeys(next.start, current.start);
    const cycleLength = within(actual, PLAUSIBLE_CYCLE) ? actual : stats.cycleLength;
    const cycleDay = diffKeys(date, current.start) + 1;
    const darkDays = tideLength(current) ?? stats.periodLength;
    const late = cycleDay > cycleLength;
    return {
      cycleDay,
      cycleLength,
      ...phaseFor(cycleDay, cycleLength, darkDays, late),
      bleeding: cycleDay <= darkDays,
      predicted,
      daysLate: late ? cycleDay - cycleLength : 0,
      cycleStart: current.start,
    };
  }

  // ── The latest logged cycle, running through today and into predictions.
  const cycleLength = stats.cycleLength;
  const todayDay = diffKeys(today, current.start) + 1;
  // An open tide lasts at least through today, and at least the usual length.
  const currentDark = current.end ? tideLength(current)! : Math.max(stats.periodLength, Math.min(todayDay, MAX_TIDE_DAYS));
  const loggedDarkEnd = current.end ?? addDaysKey(current.start, Math.min(Math.max(todayDay, 1), MAX_TIDE_DAYS) - 1);

  // If today is already past the expected next tide, predictions start tomorrow.
  const lateToday = todayDay > cycleLength;
  const firstPredicted = lateToday ? addDaysKey(today, 1) : addDaysKey(current.start, cycleLength);

  if (date < firstPredicted) {
    const cycleDay = diffKeys(date, current.start) + 1;
    const late = cycleDay > cycleLength;
    return {
      cycleDay,
      cycleLength,
      ...phaseFor(cycleDay, cycleLength, currentDark, late),
      bleeding: !predicted && date <= loggedDarkEnd,
      predicted,
      daysLate: late ? cycleDay - cycleLength : 0,
      cycleStart: current.start,
    };
  }

  // ── A future, predicted cycle.
  const cyclesAhead = Math.floor(diffKeys(date, firstPredicted) / cycleLength);
  const cycleStart = addDaysKey(firstPredicted, cyclesAhead * cycleLength);
  const cycleDay = diffKeys(date, cycleStart) + 1;
  return {
    cycleDay,
    cycleLength,
    ...phaseFor(cycleDay, cycleLength, stats.periodLength, false),
    bleeding: false,
    predicted: true,
    daysLate: 0,
    cycleStart,
  };
}

/** The predicted start of the next tide, or null without enough information. */
export function nextTideStart(tides: Tide[], settings: Settings, today: DateKey): DateKey | null {
  if (!settings.cycleTracking) return null;
  const latest = sortTides(tides).at(-1);
  if (!latest) return null;
  const { cycleLength } = cycleStats(tides, settings);
  const expected = addDaysKey(latest.start, cycleLength);
  return expected > today ? expected : addDaysKey(today, 1);
}

export type TideWindow = { earliest: DateKey; likely: DateKey; latest: DateKey; spread: number };

/**
 * When the next tide is likely to begin, as a range rather than a single day.
 * The range never starts in the past: a late tide's window begins tomorrow.
 */
export function nextTideWindow(tides: Tide[], settings: Settings, today: DateKey): TideWindow | null {
  const likely = nextTideStart(tides, settings, today);
  if (!likely) return null;
  const { spread } = cycleStats(tides, settings);
  const tomorrow = addDaysKey(today, 1);
  const earliest = addDaysKey(likely, -spread);
  return { earliest: earliest > tomorrow ? earliest : tomorrow, likely, latest: addDaysKey(likely, spread), spread };
}

/** The tide still flowing on `today`, if one was never ended. */
export function openTide(tides: Tide[], today: DateKey): Tide | undefined {
  return sortTides(tides).findLast((t) => !t.end && t.start <= today);
}

/** True when an open tide has run long enough to gently ask whether it ended. */
export function needsEndCheck(tides: Tide[], today: DateKey): boolean {
  const open = openTide(tides, today);
  return open ? diffKeys(today, open.start) + 1 >= END_CHECK_DAYS : false;
}
