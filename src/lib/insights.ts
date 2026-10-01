import { sortTides, tideDay, tideLength, type Phase } from "./cycle";
import { addDaysKey, diffKeys, type DateKey } from "./dates";
import { doseLog, dosesOn } from "./potions";
import { ELEMENTS, type Element } from "./elements";
import { symptomName } from "./symptoms";
import type { Grimoire } from "./types";

/*
 * Patterns for The Scrying Glass. Everything is computed from logged days
 * only (never predictions), and each insight declares how much data it needs
 * before it says anything, so a handful of days never reads as a "pattern".
 */

export const PHASES: Phase[] = ["dark", "waxing", "full", "waning"];

/** Element logs needed before the phase grid is shown. */
export const MIN_ELEMENT_LOGS = 12;
/** Logs needed in one phase before it's called out in a highlight. */
const MIN_PHASE_LOGS = 5;
/** How much more often than usual an element must appear in a phase to be called out. */
const HIGHLIGHT_LIFT = 1.3;
/** Only the strongest patterns are put into words; the grid shows the rest. */
const MAX_HIGHLIGHTS = 2;
/** Days in a phase with symptoms needed before listing its top symptoms. */
const MIN_SYMPTOM_DAYS = 3;
/** Completed cycles needed for the cycle chart. */
export const MIN_CYCLES = 2;
/** The potion window, in days (ending yesterday, so today's not-yet-taken doses don't count against you). */
export const POTION_WINDOW = 30;

export type ElementCell = { element: Element; count: number; share: number; shadowShare: number; avgIntensity: number };
export type ElementRow = { phase: Phase; total: number; cells: ElementCell[] };
export type Highlight = { element: Element; phase: Phase; share: number; lift: number };

export type SymptomPhase = { phase: Phase; daysLogged: number; top: { id: string; name: string; days: number; share: number }[] };

export type CycleBar = { start: DateKey; length: number };
export type CycleSummary = { bars: CycleBar[]; average: number; shortest: number; longest: number; tideAverage: number | null };

export type PotionConsistency = { id: string; name: string; taken: number; possible: number; share: number };

export type Insights = {
  elements: { rows: ElementRow[]; totalLogs: number; highlights: Highlight[]; ready: boolean };
  symptoms: { phases: SymptomPhase[]; ready: boolean };
  cycles: CycleSummary | null;
  potions: PotionConsistency[];
};

/** The phase each logged day fell in, using real cycle lengths. */
function phaseOf(g: Grimoire, date: DateKey, today: DateKey): Phase | null {
  if (date > today) return null;
  return tideDay(date, g.tides, g.settings, today)?.phase ?? null;
}

function elementGrid(g: Grimoire, today: DateKey): Insights["elements"] {
  type Tally = { count: number; shadow: number; intensity: number };
  const tally = new Map<string, Tally>();
  const rowTotals = new Map<Phase, number>();
  const elementTotals = new Map<Element, number>();
  let totalLogs = 0;

  for (const [date, day] of Object.entries(g.days)) {
    const phase = phaseOf(g, date, today);
    if (!phase) continue;
    for (const log of [...day.elements.morning, ...day.elements.afternoon, ...day.elements.night]) {
      const key = `${phase}:${log.element}`;
      const t = tally.get(key) ?? { count: 0, shadow: 0, intensity: 0 };
      t.count++;
      t.intensity += log.intensity;
      if (log.aspect === "shadow") t.shadow++;
      tally.set(key, t);
      rowTotals.set(phase, (rowTotals.get(phase) ?? 0) + 1);
      elementTotals.set(log.element, (elementTotals.get(log.element) ?? 0) + 1);
      totalLogs++;
    }
  }

  const rows: ElementRow[] = PHASES.map((phase) => {
    const total = rowTotals.get(phase) ?? 0;
    return {
      phase,
      total,
      cells: ELEMENTS.map((element) => {
        const t = tally.get(`${phase}:${element}`) ?? { count: 0, shadow: 0, intensity: 0 };
        return {
          element,
          count: t.count,
          share: total ? t.count / total : 0,
          shadowShare: t.count ? t.shadow / t.count : 0,
          avgIntensity: t.count ? t.intensity / t.count : 0,
        };
      }),
    };
  });

  // An element "rises" in a phase when its share there clearly beats its share overall.
  const highlights: Highlight[] = [];
  for (const element of ELEMENTS) {
    const overall = totalLogs ? (elementTotals.get(element) ?? 0) / totalLogs : 0;
    if (!overall) continue;
    let best: Highlight | null = null;
    for (const row of rows) {
      if (row.total < MIN_PHASE_LOGS) continue;
      const cell = row.cells.find((c) => c.element === element)!;
      const lift = cell.share / overall;
      if (cell.count >= 3 && lift >= HIGHLIGHT_LIFT && (!best || lift > best.lift)) {
        best = { element, phase: row.phase, share: cell.share, lift };
      }
    }
    if (best) highlights.push(best);
  }
  highlights.sort((a, b) => b.lift - a.lift);
  highlights.splice(MAX_HIGHLIGHTS);

  return { rows, totalLogs, highlights, ready: totalLogs >= MIN_ELEMENT_LOGS };
}

function symptomsByPhase(g: Grimoire, today: DateKey): Insights["symptoms"] {
  const daysIn = new Map<Phase, number>();
  const counts = new Map<Phase, Map<string, number>>();
  for (const [date, day] of Object.entries(g.days)) {
    if (!day.symptoms.length) continue;
    const phase = phaseOf(g, date, today);
    if (!phase) continue;
    daysIn.set(phase, (daysIn.get(phase) ?? 0) + 1);
    const map = counts.get(phase) ?? new Map<string, number>();
    for (const s of day.symptoms) map.set(s.id, (map.get(s.id) ?? 0) + 1);
    counts.set(phase, map);
  }
  const phases = PHASES.map((phase) => {
    const daysLogged = daysIn.get(phase) ?? 0;
    const top = [...(counts.get(phase) ?? new Map<string, number>()).entries()]
      .sort((a, b) => b[1] - a[1] || symptomName(g, a[0]).localeCompare(symptomName(g, b[0])))
      .slice(0, 3)
      .map(([id, days]) => ({ id, name: symptomName(g, id), days, share: days / daysLogged }));
    return { phase, daysLogged, top };
  });
  return { phases, ready: phases.some((p) => p.daysLogged >= MIN_SYMPTOM_DAYS) };
}

function cycleSummary(g: Grimoire): CycleSummary | null {
  const tides = sortTides(g.tides);
  const bars = tides.slice(1).map((t, i) => ({ start: tides[i].start, length: diffKeys(t.start, tides[i].start) })).slice(-12);
  if (bars.length < MIN_CYCLES) return null;
  const lengths = bars.map((b) => b.length);
  const tideLengths = tides.map(tideLength).filter((n): n is number => n !== undefined);
  return {
    bars,
    average: lengths.reduce((a, b) => a + b, 0) / lengths.length,
    shortest: Math.min(...lengths),
    longest: Math.max(...lengths),
    tideAverage: tideLengths.length ? tideLengths.reduce((a, b) => a + b, 0) / tideLengths.length : null,
  };
}

function potionConsistency(g: Grimoire, today: DateKey): PotionConsistency[] {
  const windowEnd = addDaysKey(today, -1);
  const windowStart = addDaysKey(today, -POTION_WINDOW);
  return g.potions
    .filter((p) => p.schedule !== "as-needed" && !p.archived)
    .map((p) => {
      const takenDays = Object.entries(g.days)
        .filter(([, day]) => day.potionLogs.some((l) => l.potionId === p.id && !l.extra))
        .map(([date]) => date)
        .sort();
      // Don't count days before this potion was first taken: it may be new to the cabinet.
      const first = takenDays[0];
      const start = first && first > windowStart ? first : windowStart;
      let possible = 0;
      let taken = 0;
      if (first) {
        for (let date = start; date <= windowEnd; date = addDaysKey(date, 1)) {
          for (const dose of dosesOn(p, date)) {
            possible++;
            if (doseLog(g.days[date], p.id, dose.slot)) taken++;
          }
        }
      }
      return { id: p.id, name: p.name, taken, possible, share: possible ? taken / possible : 0 };
    })
    .filter((p) => p.possible > 0);
}

export function computeInsights(g: Grimoire, today: DateKey): Insights {
  const tracking = g.settings.cycleTracking;
  return {
    elements: tracking ? elementGrid(g, today) : { rows: [], totalLogs: 0, highlights: [], ready: false },
    symptoms: tracking ? symptomsByPhase(g, today) : { phases: [], ready: false },
    cycles: tracking ? cycleSummary(g) : null,
    potions: potionConsistency(g, today),
  };
}
