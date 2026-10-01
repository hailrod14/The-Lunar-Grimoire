import type { DateKey } from "./dates";
import type { ElementLog, TimeBlock } from "./elements";
import type { LiquidColor, Vessel } from "./potions";

/** Bump when the saved shape changes, and add a migration in storage.ts. */
export const SCHEMA_VERSION = 3;

export type Flow = "spotting" | "light" | "medium" | "heavy" | "clots";

export const FLOWS: { id: Flow; label: string }[] = [
  { id: "spotting", label: "Spotting" },
  { id: "light", label: "Light" },
  { id: "medium", label: "Medium" },
  { id: "heavy", label: "Heavy" },
  { id: "clots", label: "Clots" },
];

export type Settings = {
  /** Off for anyone not tracking a cycle: moods and potions still work. */
  cycleTracking: boolean;
  /** Used until enough cycles are logged to learn the real averages. */
  defaultCycleLength: number;
  defaultPeriodLength: number;
  onboarded: boolean;
  soundEnabled: boolean;
  /** Generated forest-witch music. Off by default; it never plays without a tap. */
  musicEnabled: boolean;
  /** Music volume from 0 to 1. */
  musicVolume: number;
  /** Show potion names in reminders. Off by default so nothing shows on a lock screen. */
  reminderNames: boolean;
  /** With a PIN set: lock after the Grimoire has been out of sight this long (0 = as soon as you leave). */
  autoLockMinutes: number;
  /** When the Grimoire was last exported, as an ISO timestamp ("" = never). */
  lastBackupAt: string;
};

/** One period. `end` is missing while the tide is still flowing. */
export type Tide = { id: string; start: DateKey; end?: DateKey };

export type Schedule = "daily" | "weekly" | "as-needed";

export type Potion = {
  id: string;
  name: string;
  dose: string;
  /** Dose times as "HH:MM", earliest first: one check-off per time. Empty for as-needed potions. */
  times: string[];
  /** For "weekly" potions: the weekdays it's taken (0 = Sunday … 6 = Saturday). */
  days: number[];
  vessel: Vessel;
  color: LiquidColor;
  /** Every day, certain days of the week, or only when needed. */
  schedule: Schedule;
  /** Retired potions leave the checklist but keep their history. */
  archived: boolean;
  /** Remind at `time` each day (daily potions only). */
  reminder: boolean;
};

/** A dose taken. Name and dose are copied so later edits never rewrite history. */
export type PotionLog = {
  id: string;
  potionId: string;
  name: string;
  dose: string;
  /** Time taken as "HH:MM". */
  time: string;
  /** False for a scheduled check-off, true for extra / as-needed doses. */
  extra: boolean;
  /** Which of the potion's scheduled doses this checks off (index into `times`). */
  slot?: number;
};

export type SymptomSeverity = 1 | 2 | 3;

/** A symptom felt on a day: a built-in id (e.g. "cramps") or a custom symptom's id. */
export type SymptomLog = { id: string; severity: SymptomSeverity };

/** A symptom someone added for themselves. Retired ones stay in history. */
export type CustomSymptom = { id: string; name: string; archived: boolean };

export type DayEntry = {
  flow?: Flow;
  elements: Record<TimeBlock, ElementLog[]>;
  journal: string;
  potionLogs: PotionLog[];
  symptoms: SymptomLog[];
};

export type Grimoire = {
  version: typeof SCHEMA_VERSION;
  settings: Settings;
  tides: Tide[];
  potions: Potion[];
  customSymptoms: CustomSymptom[];
  days: Record<DateKey, DayEntry>;
};

export const DEFAULT_SETTINGS: Settings = {
  cycleTracking: true,
  defaultCycleLength: 28,
  defaultPeriodLength: 5,
  onboarded: false,
  soundEnabled: true,
  musicEnabled: false,
  musicVolume: 0.5,
  reminderNames: false,
  autoLockMinutes: 5,
  lastBackupAt: "",
};

export const emptyDay = (): DayEntry => ({
  elements: { morning: [], afternoon: [], night: [] },
  journal: "",
  potionLogs: [],
  symptoms: [],
});

export const newGrimoire = (): Grimoire => ({
  version: SCHEMA_VERSION,
  settings: { ...DEFAULT_SETTINGS },
  tides: [],
  potions: [],
  customSymptoms: [],
  days: {},
});
