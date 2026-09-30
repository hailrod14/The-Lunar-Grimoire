import { isDateKey } from "./dates";
import { ASPECTS, ELEMENTS, TIME_BLOCKS, type ElementLog } from "./elements";
import { LIQUID_COLORS, VESSELS } from "./potions";
import {
  DEFAULT_SETTINGS,
  FLOWS,
  SCHEMA_VERSION,
  emptyDay,
  newGrimoire,
  type DayEntry,
  type Grimoire,
  type Potion,
  type PotionLog,
  type Settings,
  type Tide,
} from "./types";

export const STORAGE_KEY = "lunar-grimoire";

/*
 * Everything lives in this browser's localStorage under one key. Loading
 * never throws and never silently discards data: anything unreadable is
 * copied aside before the Grimoire starts fresh.
 */

// ── Validation ───────────────────────────────────────────────
// Imported and stored data is untrusted: keep what's valid, drop what isn't.

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
const isTime = (v: unknown): v is string => typeof v === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
const oneOf = <T extends string>(v: unknown, options: readonly T[]): v is T => options.includes(v as T);
const numberIn = (v: unknown, lo: number, hi: number, fallback: number) =>
  typeof v === "number" && Number.isInteger(v) && v >= lo && v <= hi ? v : fallback;

function sanitizeSettings(v: unknown): Settings {
  const s = isObj(v) ? v : {};
  return {
    cycleTracking: typeof s.cycleTracking === "boolean" ? s.cycleTracking : DEFAULT_SETTINGS.cycleTracking,
    defaultCycleLength: numberIn(s.defaultCycleLength, 15, 60, DEFAULT_SETTINGS.defaultCycleLength),
    defaultPeriodLength: numberIn(s.defaultPeriodLength, 1, 15, DEFAULT_SETTINGS.defaultPeriodLength),
    onboarded: typeof s.onboarded === "boolean" ? s.onboarded : DEFAULT_SETTINGS.onboarded,
    soundEnabled: typeof s.soundEnabled === "boolean" ? s.soundEnabled : DEFAULT_SETTINGS.soundEnabled,
    lastBackupAt: typeof s.lastBackupAt === "string" && !Number.isNaN(Date.parse(s.lastBackupAt)) ? s.lastBackupAt : "",
  };
}

function sanitizeTide(v: unknown): Tide | null {
  if (!isObj(v) || !isDateKey(v.start)) return null;
  const tide: Tide = { id: str(v.id) || crypto.randomUUID(), start: v.start };
  if (isDateKey(v.end) && v.end >= v.start) tide.end = v.end;
  return tide;
}

function sanitizePotion(v: unknown): Potion | null {
  if (!isObj(v) || typeof v.name !== "string" || !v.name.trim()) return null;
  const colors = Object.keys(LIQUID_COLORS) as (keyof typeof LIQUID_COLORS)[];
  return {
    id: str(v.id) || crypto.randomUUID(),
    name: v.name,
    dose: str(v.dose),
    time: isTime(v.time) ? v.time : "",
    vessel: oneOf(v.vessel, VESSELS) ? v.vessel : "flask",
    color: oneOf(v.color, colors) ? v.color : "gold",
    schedule: v.schedule === "as-needed" ? "as-needed" : "daily",
    archived: v.archived === true,
  };
}

function sanitizeElementLog(v: unknown): ElementLog | null {
  if (!isObj(v) || !oneOf(v.element, ELEMENTS)) return null;
  const aspects = ASPECTS.map((a) => a.id);
  return {
    element: v.element,
    intensity: numberIn(v.intensity, 1, 5, 3) as ElementLog["intensity"],
    aspect: oneOf(v.aspect, aspects) ? v.aspect : "mixed",
  };
}

function sanitizePotionLog(v: unknown): PotionLog | null {
  if (!isObj(v) || typeof v.potionId !== "string" || !isTime(v.time)) return null;
  return {
    id: str(v.id) || crypto.randomUUID(),
    potionId: v.potionId,
    name: str(v.name, "Unnamed potion"),
    dose: str(v.dose),
    time: v.time,
    extra: v.extra === true,
  };
}

const keep = <T>(list: unknown, fn: (v: unknown) => T | null): T[] =>
  Array.isArray(list) ? list.map(fn).filter((x): x is T => x !== null) : [];

function sanitizeDay(v: unknown): DayEntry {
  const d = isObj(v) ? v : {};
  const day = emptyDay();
  const elements = isObj(d.elements) ? d.elements : {};
  for (const { id } of TIME_BLOCKS) day.elements[id] = keep(elements[id], sanitizeElementLog);
  day.journal = str(d.journal);
  day.potionLogs = keep(d.potionLogs, sanitizePotionLog);
  if (oneOf(d.flow, FLOWS.map((f) => f.id))) day.flow = d.flow;
  return day;
}

/** Older saves are upgraded one version at a time. Add a case here when SCHEMA_VERSION increases. */
function migrate(raw: Obj): Obj {
  const data = raw;
  // switch (data.version) { case 1: data = migrate1to2(data); ... }
  return data;
}

export type ParseResult = { ok: true; grimoire: Grimoire } | { ok: false; error: string };

/** Turn untrusted data (a save or an imported file) into a valid Grimoire. */
export function sanitizeGrimoire(raw: unknown): ParseResult {
  if (!isObj(raw)) return { ok: false, error: "This doesn't look like a Grimoire file." };
  const version = raw.version;
  if (typeof version !== "number" || !Number.isInteger(version) || version < 1) {
    return { ok: false, error: "This doesn't look like a Grimoire file." };
  }
  if (version > SCHEMA_VERSION) {
    return { ok: false, error: "This Grimoire was made by a newer version of the app. Refresh to update, then try again." };
  }
  const data = migrate(raw);

  const days: Grimoire["days"] = {};
  if (isObj(data.days)) {
    for (const [key, value] of Object.entries(data.days)) {
      if (isDateKey(key)) days[key] = sanitizeDay(value);
    }
  }

  return {
    ok: true,
    grimoire: {
      version: SCHEMA_VERSION,
      settings: sanitizeSettings(data.settings),
      tides: keep(data.tides, sanitizeTide).sort((a, b) => (a.start < b.start ? -1 : 1)),
      potions: keep(data.potions, sanitizePotion),
      days,
    },
  };
}

// ── Export / import ──────────────────────────────────────────

export function exportGrimoire(g: Grimoire, now = new Date()): string {
  return JSON.stringify({ app: "The Lunar Grimoire", exportedAt: now.toISOString(), ...g }, null, 2);
}

export function parseGrimoireFile(text: string): ParseResult {
  try {
    return sanitizeGrimoire(JSON.parse(text));
  } catch {
    return { ok: false, error: "That file couldn't be read. Is it a Grimoire .json backup?" };
  }
}

// ── localStorage ─────────────────────────────────────────────

export type LoadResult = {
  grimoire: Grimoire;
  /** Set when saved data existed but couldn't be read. It was kept under `backupKey`. */
  problem?: { message: string; backupKey: string };
};

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null; // Blocked storage (some private modes) throws on access.
  }
}

export function loadGrimoire(now = new Date()): LoadResult {
  const store = storage();
  let text: string | null = null;
  try {
    text = store?.getItem(STORAGE_KEY) ?? null;
  } catch {
    text = null;
  }
  if (text === null) return { grimoire: newGrimoire() };

  const parsed = parseGrimoireFile(text);
  if (parsed.ok) return { grimoire: parsed.grimoire };

  // Never overwrite unreadable data: set it aside first.
  const backupKey = `${STORAGE_KEY}:unreadable:${now.toISOString()}`;
  try {
    store?.setItem(backupKey, text);
  } catch {
    // Nothing more we can do; the original key is still untouched until the next save.
  }
  return { grimoire: newGrimoire(), problem: { message: parsed.error, backupKey } };
}

/** Returns false if the save failed (for example, storage is full or blocked). */
export function saveGrimoire(g: Grimoire): boolean {
  const store = storage();
  if (!store) return false;
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(g));
    return true;
  } catch {
    return false;
  }
}
