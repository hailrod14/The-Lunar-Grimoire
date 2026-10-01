import { isSealed, type SealedGrimoire } from "./crypto";
import { isDateKey } from "./dates";
import { isValidDraw } from "./divination";
import { ASPECTS, ELEMENTS, TIME_BLOCKS, type ElementLog } from "./elements";
import { LIQUID_COLORS, VESSELS } from "./potions";
import { BUILT_IN_SYMPTOMS } from "./symptoms";
import { THEMES } from "./theme";
import {
  DEFAULT_SETTINGS,
  FLOWS,
  SCHEMA_VERSION,
  emptyDay,
  newGrimoire,
  type CustomSymptom,
  type DayEntry,
  type Grimoire,
  type Potion,
  type PotionLog,
  type Settings,
  type SymptomLog,
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
    musicEnabled: typeof s.musicEnabled === "boolean" ? s.musicEnabled : DEFAULT_SETTINGS.musicEnabled,
    musicVolume:
      typeof s.musicVolume === "number" && s.musicVolume >= 0 && s.musicVolume <= 1 ? s.musicVolume : DEFAULT_SETTINGS.musicVolume,
    reminderNames: s.reminderNames === true,
    autoLockMinutes: numberIn(s.autoLockMinutes, 0, 60, DEFAULT_SETTINGS.autoLockMinutes),
    theme: oneOf(s.theme, THEMES.map((t) => t.id)) ? s.theme : DEFAULT_SETTINGS.theme,
    hemisphere: s.hemisphere === "south" ? "south" : "north",
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
  // Version 2 and earlier had one `time`; version 3 has a list of dose times.
  const rawTimes = Array.isArray(v.times) ? v.times : isTime(v.time) ? [v.time] : [];
  const times = [...new Set(rawTimes.filter(isTime))].sort().slice(0, 6);
  const days = Array.isArray(v.days)
    ? [...new Set(v.days.filter((d): d is number => Number.isInteger(d) && (d as number) >= 0 && (d as number) <= 6))].sort((a, b) => a - b)
    : [];
  const schedule: Potion["schedule"] =
    v.schedule === "as-needed" ? "as-needed" : v.schedule === "weekly" && days.length ? "weekly" : "daily";
  return {
    id: str(v.id) || crypto.randomUUID(),
    name: v.name,
    dose: str(v.dose),
    times: schedule === "as-needed" ? [] : times.length ? times : ["09:00"],
    days: schedule === "weekly" ? days : [],
    vessel: oneOf(v.vessel, VESSELS) ? v.vessel : "flask",
    color: oneOf(v.color, colors) ? v.color : "gold",
    schedule,
    archived: v.archived === true,
    reminder: v.reminder === true && schedule !== "as-needed",
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
    ...(v.extra !== true && Number.isInteger(v.slot) && (v.slot as number) >= 0 && (v.slot as number) < 6 ? { slot: v.slot as number } : {}),
  };
}

const keep = <T>(list: unknown, fn: (v: unknown) => T | null): T[] =>
  Array.isArray(list) ? list.map(fn).filter((x): x is T => x !== null) : [];

function sanitizeCustomSymptom(v: unknown): CustomSymptom | null {
  if (!isObj(v) || typeof v.id !== "string" || !v.id || typeof v.name !== "string" || !v.name.trim()) return null;
  return { id: v.id, name: v.name.trim(), archived: v.archived === true };
}

function sanitizeSymptomLog(known: Set<string>) {
  return (v: unknown): SymptomLog | null => {
    if (!isObj(v) || typeof v.id !== "string" || !known.has(v.id)) return null;
    return { id: v.id, severity: numberIn(v.severity, 1, 3, 1) as SymptomLog["severity"] };
  };
}

function sanitizeDay(v: unknown, knownSymptoms: Set<string>): DayEntry {
  const d = isObj(v) ? v : {};
  const day = emptyDay();
  const elements = isObj(d.elements) ? d.elements : {};
  for (const { id } of TIME_BLOCKS) day.elements[id] = keep(elements[id], sanitizeElementLog);
  day.journal = str(d.journal);
  day.potionLogs = keep(d.potionLogs, sanitizePotionLog);
  // One entry per symptom per day.
  const seen = new Set<string>();
  day.symptoms = keep(d.symptoms, sanitizeSymptomLog(knownSymptoms)).filter((s) => !seen.has(s.id) && seen.add(s.id));
  if (oneOf(d.flow, FLOWS.map((f) => f.id))) day.flow = d.flow;
  if (isValidDraw(d.draw)) day.draw = { deck: d.draw.deck, card: d.draw.card, reversed: d.draw.reversed };
  return day;
}

/**
 * Older saves are upgraded one version at a time. Add a step here when SCHEMA_VERSION increases.
 * v1 → v2 added symptoms, custom symptoms, and potion reminders; v2 → v3 replaced a potion's
 * single `time` with a list of dose `times` plus weekdays. Sanitizing fills in and converts
 * all of these, so no data needs rewriting here.
 */
function migrate(raw: Obj): Obj {
  return raw;
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

  const customSymptoms = keep(data.customSymptoms, sanitizeCustomSymptom);
  const knownSymptoms = new Set([...BUILT_IN_SYMPTOMS.map((s) => s.id), ...customSymptoms.map((s) => s.id)]);

  const days: Grimoire["days"] = {};
  if (isObj(data.days)) {
    for (const [key, value] of Object.entries(data.days)) {
      if (isDateKey(key)) days[key] = sanitizeDay(value, knownSymptoms);
    }
  }

  return {
    ok: true,
    grimoire: {
      version: SCHEMA_VERSION,
      settings: sanitizeSettings(data.settings),
      tides: keep(data.tides, sanitizeTide).sort((a, b) => (a.start < b.start ? -1 : 1)),
      potions: keep(data.potions, sanitizePotion),
      customSymptoms,
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

export type LoadResult =
  | {
      status: "open";
      grimoire: Grimoire;
      /** Set when saved data existed but couldn't be read. It was kept under `backupKey`. */
      problem?: { message: string; backupKey: string };
    }
  /** A PIN is set: the Grimoire is encrypted and needs unlocking. */
  | { status: "sealed"; sealed: SealedGrimoire };

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null; // Blocked storage (some private modes) throws on access.
  }
}

/** The raw saved text, or null if there is none (or storage is blocked). */
export function readStored(): string | null {
  try {
    return storage()?.getItem(STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}

/** Write raw text to the Grimoire's key. Returns false if the save failed (full or blocked storage). */
export function writeStored(text: string): boolean {
  const store = storage();
  if (!store) return false;
  try {
    store.setItem(STORAGE_KEY, text);
    return true;
  } catch {
    return false;
  }
}

/** The sealed (encrypted) Grimoire currently saved, if a PIN is set. */
export function readSealed(): SealedGrimoire | null {
  const text = readStored();
  if (!text) return null;
  try {
    const value = JSON.parse(text);
    return isSealed(value) ? value : null;
  } catch {
    return null;
  }
}

export function loadGrimoire(now = new Date()): LoadResult {
  const text = readStored();
  if (text === null) return { status: "open", grimoire: newGrimoire() };

  const sealed = readSealed();
  if (sealed) return { status: "sealed", sealed };

  const parsed = parseGrimoireFile(text);
  if (parsed.ok) return { status: "open", grimoire: parsed.grimoire };

  // Never overwrite unreadable data: set it aside first.
  const backupKey = `${STORAGE_KEY}:unreadable:${now.toISOString()}`;
  try {
    storage()?.setItem(backupKey, text);
  } catch {
    // Nothing more we can do; the original key is still untouched until the next save.
  }
  return { status: "open", grimoire: newGrimoire(), problem: { message: parsed.error, backupKey } };
}

/** Save the Grimoire unencrypted. Returns false if the save failed. */
export const saveGrimoire = (g: Grimoire): boolean => writeStored(JSON.stringify(g));
