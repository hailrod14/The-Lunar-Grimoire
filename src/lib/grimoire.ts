import { MAX_TIDE_DAYS, cycleStats, sortTides } from "./cycle";
import { addDaysKey, diffKeys, type DateKey } from "./dates";
import type { Element, ElementLog, TimeBlock } from "./elements";
import {
  emptyDay,
  type DayEntry,
  type Flow,
  type Grimoire,
  type Potion,
  type Settings,
  type SymptomSeverity,
  type Tide,
} from "./types";

/*
 * Every change to the Grimoire goes through these pure functions: each takes
 * the current Grimoire and returns a new one, never mutating the old.
 */

const newId = () => crypto.randomUUID();

/** A tide that begins this close before an existing tide is treated as moving its start earlier. */
const MERGE_WINDOW_DAYS = 7;

// ── Days ─────────────────────────────────────────────────────

export const getDay = (g: Grimoire, date: DateKey): DayEntry => g.days[date] ?? emptyDay();

export function updateDay(g: Grimoire, date: DateKey, fn: (day: DayEntry) => DayEntry): Grimoire {
  return { ...g, days: { ...g.days, [date]: fn(getDay(g, date)) } };
}

export const setFlow = (g: Grimoire, date: DateKey, flow: Flow | undefined) =>
  updateDay(g, date, (d) => {
    const { flow: _old, ...rest } = d; // eslint-disable-line @typescript-eslint/no-unused-vars
    return flow ? { ...rest, flow } : rest;
  });

export const setElements = (g: Grimoire, date: DateKey, block: TimeBlock, logs: ElementLog[]) =>
  updateDay(g, date, (d) => ({ ...d, elements: { ...d.elements, [block]: logs } }));

/** The distinct elements logged across a day's morning, afternoon, and night. */
export function loggedElements(day?: DayEntry): Element[] {
  if (!day) return [];
  const all = [...day.elements.morning, ...day.elements.afternoon, ...day.elements.night].map((e) => e.element);
  return [...new Set(all)];
}

export const setJournal = (g: Grimoire, date: DateKey, journal: string) =>
  updateDay(g, date, (d) => ({ ...d, journal }));

// ── Symptoms ─────────────────────────────────────────────────

/** Set how strongly a symptom was felt on a day; 0 removes it. */
export function setSymptom(g: Grimoire, date: DateKey, id: string, severity: SymptomSeverity | 0): Grimoire {
  return updateDay(g, date, (d) => {
    const others = d.symptoms.filter((s) => s.id !== id);
    if (severity === 0) return { ...d, symptoms: others };
    const at = d.symptoms.findIndex((s) => s.id === id);
    const symptoms = [...others];
    symptoms.splice(at < 0 ? others.length : at, 0, { id, severity });
    return { ...d, symptoms };
  });
}

/** Add a personal symptom, or bring back a retired one with the same name. */
export function addCustomSymptom(g: Grimoire, name: string): Grimoire {
  const clean = name.trim();
  if (!clean) return g;
  const existing = g.customSymptoms.find((s) => s.name.toLowerCase() === clean.toLowerCase());
  if (existing) {
    return existing.archived
      ? { ...g, customSymptoms: g.customSymptoms.map((s) => (s.id === existing.id ? { ...s, archived: false } : s)) }
      : g;
  }
  return { ...g, customSymptoms: [...g.customSymptoms, { id: `custom-${newId()}`, name: clean, archived: false }] };
}

/** Retire a personal symptom from the picker. Days it was logged keep it. */
export const retireCustomSymptom = (g: Grimoire, id: string): Grimoire => ({
  ...g,
  customSymptoms: g.customSymptoms.map((s) => (s.id === id ? { ...s, archived: true } : s)),
});

// ── Tides ────────────────────────────────────────────────────

/**
 * The tide covering a date: a finished tide containing it, or an open one that
 * began recently enough (a forgotten open tide doesn't swallow the next month).
 */
export function tideAt(tides: Tide[], date: DateKey): Tide | undefined {
  return tides.find(
    (t) => t.start <= date && (t.end ? date <= t.end : diffKeys(date, t.start) < MAX_TIDE_DAYS),
  );
}

/** "My tide has begun" on `date`. */
export function beginTide(g: Grimoire, date: DateKey): Grimoire {
  if (tideAt(g.tides, date)) return g;

  // Beginning a few days before a logged tide means its real start was earlier.
  const soonAfter = sortTides(g.tides).find((t) => t.start > date && diffKeys(t.start, date) <= MERGE_WINDOW_DAYS);
  if (soonAfter) {
    return { ...g, tides: g.tides.map((t) => (t.id === soonAfter.id ? { ...t, start: date } : t)) };
  }

  // Any earlier tide left open must have ended before this one began.
  const { periodLength } = cycleStats(g.tides, g.settings);
  const tides = g.tides.map((t) => {
    if (t.end || t.start >= date) return t;
    const usualEnd = addDaysKey(t.start, periodLength - 1);
    const dayBefore = addDaysKey(date, -1);
    return { ...t, end: usualEnd < dayBefore ? usualEnd : dayBefore };
  });

  return { ...g, tides: sortTides([...tides, { id: newId(), start: date }]) };
}

/** "My tide has ended" on `date` (the last day of bleeding). */
export function endTide(g: Grimoire, date: DateKey): Grimoire {
  // Inside a tide: end (or shorten) it. Just after one: extend it to this day.
  const tide =
    tideAt(g.tides, date) ??
    sortTides(g.tides).findLast((t) => t.start < date && diffKeys(date, t.start) < MAX_TIDE_DAYS);
  if (!tide) return g;
  return { ...g, tides: g.tides.map((t) => (t.id === tide.id ? { ...t, end: date } : t)) };
}

/** Re-open a tide that was ended too soon. */
export function reopenTide(g: Grimoire, id: string): Grimoire {
  return {
    ...g,
    tides: g.tides.map((t) => {
      if (t.id !== id) return t;
      const { end: _end, ...open } = t; // eslint-disable-line @typescript-eslint/no-unused-vars
      return open;
    }),
  };
}

/** True if a tide spanning these dates would overlap any tide other than `ignoreId`. */
function overlapsAnother(tides: Tide[], dates: { start: DateKey; end?: DateKey }, ignoreId?: string): boolean {
  const lastDay = dates.end ?? dates.start;
  return tides.some((t) => t.id !== ignoreId && t.start <= lastDay && (t.end ?? t.start) >= dates.start);
}

/** Record a past tide from Settings. Rejects tides that end before they start, run too long, or overlap. */
export function addTide(g: Grimoire, start: DateKey, end: DateKey): Grimoire {
  if (end < start || diffKeys(end, start) >= MAX_TIDE_DAYS) return g;
  if (overlapsAnother(g.tides, { start, end })) return g;
  return { ...g, tides: sortTides([...g.tides, { id: newId(), start, end }]) };
}

/** Edit a tide's dates from the Archive. Rejects edits that end before they start or overlap another tide. */
export function editTide(g: Grimoire, id: string, dates: { start: DateKey; end?: DateKey }): Grimoire {
  if (dates.end && (dates.end < dates.start || diffKeys(dates.end, dates.start) >= MAX_TIDE_DAYS)) return g;
  if (overlapsAnother(g.tides, dates, id)) return g;
  const tides = g.tides.map((t) => (t.id === id ? { id, ...dates } : t));
  return { ...g, tides: sortTides(tides) };
}

export const removeTide = (g: Grimoire, id: string): Grimoire => ({ ...g, tides: g.tides.filter((t) => t.id !== id) });

// ── Potions ──────────────────────────────────────────────────

/** Tick or untick one scheduled dose (`slot`) of a potion. `time` is when it was taken, "HH:MM". */
export function togglePotion(g: Grimoire, date: DateKey, potionId: string, time: string, slot = 0): Grimoire {
  const potion = g.potions.find((p) => p.id === potionId);
  if (!potion) return g;
  return updateDay(g, date, (d) => {
    const existing = d.potionLogs.find((l) => l.potionId === potionId && !l.extra && (l.slot ?? 0) === slot);
    if (existing) return { ...d, potionLogs: d.potionLogs.filter((l) => l !== existing) };
    const log = { id: newId(), potionId, name: potion.name, dose: potion.dose, time, extra: false, slot };
    return { ...d, potionLogs: [...d.potionLogs, log] };
  });
}

/** Log an extra dose of a daily potion, or a dose of an as-needed one. */
export function addDose(g: Grimoire, date: DateKey, potionId: string, time: string): Grimoire {
  const potion = g.potions.find((p) => p.id === potionId);
  if (!potion) return g;
  const log = { id: newId(), potionId, name: potion.name, dose: potion.dose, time, extra: true };
  return updateDay(g, date, (d) => ({ ...d, potionLogs: [...d.potionLogs, log] }));
}

/** Undo the most recent extra dose of a potion on a day (for misclicks). */
export function removeLastDose(g: Grimoire, date: DateKey, potionId: string): Grimoire {
  return updateDay(g, date, (d) => {
    const i = d.potionLogs.findLastIndex((l) => l.potionId === potionId && l.extra);
    return i < 0 ? d : { ...d, potionLogs: d.potionLogs.filter((_, j) => j !== i) };
  });
}

/** Correct the time a dose was taken. */
export function setDoseTime(g: Grimoire, date: DateKey, logId: string, time: string): Grimoire {
  return updateDay(g, date, (d) => ({
    ...d,
    potionLogs: d.potionLogs.map((l) => (l.id === logId ? { ...l, time } : l)),
  }));
}

/** Add a new potion (no id yet) or save changes to an existing one. */
export function savePotion(g: Grimoire, potion: Omit<Potion, "id"> & { id?: string }): Grimoire {
  if (potion.id && g.potions.some((p) => p.id === potion.id)) {
    return { ...g, potions: g.potions.map((p) => (p.id === potion.id ? (potion as Potion) : p)) };
  }
  return { ...g, potions: [...g.potions, { ...potion, id: newId() }] };
}

/** True if any day has a dose of this potion logged. */
export const potionHasHistory = (g: Grimoire, id: string) =>
  Object.values(g.days).some((d) => d.potionLogs.some((l) => l.potionId === id));

/**
 * Remove a potion that was never taken. Potions with history can't be
 * deleted this way, only retired, so past days are never rewritten.
 */
export function deletePotion(g: Grimoire, id: string): Grimoire {
  if (potionHasHistory(g, id)) return g;
  return { ...g, potions: g.potions.filter((p) => p.id !== id) };
}

/** Retire a potion from the cabinet. Its past doses stay in the Archive. */
export const archivePotion = (g: Grimoire, id: string, archived = true): Grimoire => ({
  ...g,
  potions: g.potions.map((p) => (p.id === id ? { ...p, archived } : p)),
});

export const activePotions = (g: Grimoire) => g.potions.filter((p) => !p.archived);

// ── Settings & onboarding ────────────────────────────────────

export const updateSettings = (g: Grimoire, patch: Partial<Settings>): Grimoire => ({
  ...g,
  settings: { ...g.settings, ...patch },
});

export type OnboardingAnswers = {
  cycleTracking: boolean;
  lastTideStart?: DateKey;
  lastTideEnd?: DateKey;
  cycleLength: number;
  periodLength: number;
  potions: Omit<Potion, "id">[];
};

/** The first-run ritual's answers become the Grimoire's first pages. */
export function completeOnboarding(g: Grimoire, answers: OnboardingAnswers): Grimoire {
  let next = updateSettings(g, {
    cycleTracking: answers.cycleTracking,
    defaultCycleLength: answers.cycleLength,
    defaultPeriodLength: answers.periodLength,
    onboarded: true,
  });
  if (answers.cycleTracking && answers.lastTideStart) {
    next = beginTide(next, answers.lastTideStart);
    if (answers.lastTideEnd) next = endTide(next, answers.lastTideEnd);
  }
  for (const p of answers.potions) next = savePotion(next, p);
  return next;
}
