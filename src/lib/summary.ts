import { PHASE_MEANING, cycleStats, nextTideWindow, sortTides, tideDay, tideLength, type Phase } from "./cycle";
import { addDaysKey, diffKeys, type DateKey } from "./dates";
import { ELEMENTS, type Element } from "./elements";
import { describeSchedule, doseLog, dosesOn } from "./potions";
import { symptomName } from "./symptoms";
import { FLOWS, type Flow, type Grimoire } from "./types";

/*
 * A summary for a healthcare visit, in plain clinical language. Built only
 * from what was logged in the chosen span; the journal is never included.
 */

export type SummaryPeriod = { start: DateKey; end?: DateKey; length?: number; cycleLength?: number; heaviestFlow?: Flow };
export type SummarySymptom = { name: string; days: number; mild: number; moderate: number; strong: number; commonPhase?: string };
export type SummaryMedication = { name: string; dose: string; schedule: string; taken: number; scheduled: number };
export type SummaryAsNeeded = { name: string; dose: string; doses: number; days: number };
export type SummaryMood = { element: Element; logs: number; averageIntensity: number; shadowShare: number };

export type VisitSummary = {
  from: DateKey;
  to: DateKey;
  tracking: boolean;
  overview: {
    averageCycle?: number;
    shortestCycle?: number;
    longestCycle?: number;
    cyclesMeasured: number;
    averagePeriod?: number;
    variation: number;
    lastPeriodStart?: DateKey;
    nextExpected?: { earliest: DateKey; latest: DateKey };
  };
  periods: SummaryPeriod[];
  symptoms: SummarySymptom[];
  medications: SummaryMedication[];
  asNeeded: SummaryAsNeeded[];
  moods: SummaryMood[];
  daysLogged: number;
};

const FLOW_RANK: Record<Flow, number> = Object.fromEntries(FLOWS.map((f, i) => [f.id, i])) as Record<Flow, number>;
const average = (ns: number[]) => (ns.length ? ns.reduce((a, b) => a + b, 0) / ns.length : undefined);

export function buildVisitSummary(g: Grimoire, from: DateKey, to: DateKey, today: DateKey): VisitSummary {
  const inRange = (d: DateKey) => d >= from && d <= to;
  const days = Object.entries(g.days).filter(([d]) => inRange(d));
  const tracking = g.settings.cycleTracking;

  // ── Periods and cycles
  const tides = sortTides(g.tides);
  const periods: SummaryPeriod[] = tides
    .map((t, i) => {
      const next = tides[i + 1];
      let heaviestFlow: Flow | undefined;
      for (let d = t.start; d <= (t.end ?? t.start); d = addDaysKey(d, 1)) {
        const flow = g.days[d]?.flow;
        if (flow && (!heaviestFlow || FLOW_RANK[flow] > FLOW_RANK[heaviestFlow])) heaviestFlow = flow;
      }
      return {
        start: t.start,
        end: t.end,
        length: tideLength(t),
        cycleLength: next ? diffKeys(next.start, t.start) : undefined,
        heaviestFlow,
      };
    })
    .filter((p) => inRange(p.start));

  const cycleLengths = periods.map((p) => p.cycleLength).filter((n): n is number => n !== undefined);
  const periodLengths = periods.map((p) => p.length).filter((n): n is number => n !== undefined);
  const stats = cycleStats(g.tides, g.settings);
  const upcoming = tracking ? nextTideWindow(g.tides, g.settings, today) : null;

  // ── Symptoms
  const symptomTally = new Map<string, { days: number; sev: [number, number, number]; phases: Map<Phase, number> }>();
  for (const [date, day] of days) {
    const phase = tracking ? tideDay(date, g.tides, g.settings, today)?.phase : undefined;
    for (const s of day.symptoms) {
      const t = symptomTally.get(s.id) ?? { days: 0, sev: [0, 0, 0], phases: new Map() };
      t.days++;
      t.sev[s.severity - 1]++;
      if (phase) t.phases.set(phase, (t.phases.get(phase) ?? 0) + 1);
      symptomTally.set(s.id, t);
    }
  }
  const symptoms = [...symptomTally.entries()]
    .map(([id, t]) => {
      const top = [...t.phases.entries()].sort((a, b) => b[1] - a[1])[0];
      return {
        name: symptomName(g, id),
        days: t.days,
        mild: t.sev[0],
        moderate: t.sev[1],
        strong: t.sev[2],
        commonPhase: top ? `${PHASE_MEANING[top[0]].toLowerCase()} phase` : undefined,
      };
    })
    .sort((a, b) => b.days - a.days || a.name.localeCompare(b.name));

  // ── Medications: scheduled doses taken vs scheduled, counted from the first logged dose
  const medications: SummaryMedication[] = [];
  const asNeeded: SummaryAsNeeded[] = [];
  for (const p of g.potions) {
    const logs = days.flatMap(([date, day]) => day.potionLogs.filter((l) => l.potionId === p.id).map((l) => ({ date, l })));
    if (p.schedule === "as-needed") {
      if (logs.length) asNeeded.push({ name: p.name, dose: p.dose, doses: logs.length, days: new Set(logs.map((x) => x.date)).size });
      continue;
    }
    const firstTaken = Object.entries(g.days)
      .filter(([, day]) => day.potionLogs.some((l) => l.potionId === p.id && !l.extra))
      .map(([d]) => d)
      .sort()[0];
    if (!firstTaken && p.archived) continue;
    const start = firstTaken && firstTaken > from ? firstTaken : from;
    const end = to < today ? to : addDaysKey(today, -1); // today isn't over yet
    let scheduled = 0;
    let taken = 0;
    if (firstTaken) {
      for (let d = start; d <= end; d = addDaysKey(d, 1)) {
        for (const dose of dosesOn(p, d)) {
          scheduled++;
          if (doseLog(g.days[d], p.id, dose.slot)) taken++;
        }
      }
    }
    const extras = logs.filter((x) => x.l.extra).length;
    if (scheduled || extras) medications.push({ name: p.name, dose: p.dose, schedule: describeSchedule(p), taken, scheduled });
  }

  // ── Mood elements (included only if chosen)
  const moodTally = new Map<Element, { logs: number; intensity: number; shadow: number }>();
  for (const [, day] of days) {
    for (const log of [...day.elements.morning, ...day.elements.afternoon, ...day.elements.night]) {
      const t = moodTally.get(log.element) ?? { logs: 0, intensity: 0, shadow: 0 };
      t.logs++;
      t.intensity += log.intensity;
      if (log.aspect === "shadow") t.shadow++;
      moodTally.set(log.element, t);
    }
  }
  const moods = ELEMENTS.filter((e) => moodTally.has(e)).map((e) => {
    const t = moodTally.get(e)!;
    return { element: e, logs: t.logs, averageIntensity: t.intensity / t.logs, shadowShare: t.shadow / t.logs };
  });

  return {
    from,
    to,
    tracking,
    overview: {
      averageCycle: average(cycleLengths),
      shortestCycle: cycleLengths.length ? Math.min(...cycleLengths) : undefined,
      longestCycle: cycleLengths.length ? Math.max(...cycleLengths) : undefined,
      cyclesMeasured: cycleLengths.length,
      averagePeriod: average(periodLengths),
      variation: stats.spread,
      lastPeriodStart: tides.at(-1)?.start,
      nextExpected: upcoming ? { earliest: upcoming.earliest, latest: upcoming.latest } : undefined,
    },
    periods,
    symptoms,
    medications,
    asNeeded,
    moods,
    daysLogged: days.length,
  };
}
