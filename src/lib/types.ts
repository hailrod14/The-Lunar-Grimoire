import type { DateKey } from "./dates";
import type { Draw } from "./divination";
import type { ElementLog, TimeBlock } from "./elements";
import type { Phase } from "./cycle";
import type { Species } from "./familiars";
import type { HolidayRegion } from "./holidays";
import type { LiquidColor, Vessel } from "./potions";
import type { Hemisphere, ThemeSetting } from "./theme";

/** Bump when the saved shape changes, and add a migration in storage.ts. */
export const SCHEMA_VERSION = 6;

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
  theme: ThemeSetting;
  /** Which way the Wheel of the Year turns (sabbats and seasonal themes). */
  hemisphere: Hemisphere;
  /** When the Grimoire was last exported, as an ISO timestamp ("" = never). */
  lastBackupAt: string;
  /** Whose public holidays and observances show on the calendar. */
  holidayRegion: HolidayRegion;
  /** A random id shared by this Grimoire's devices for home-screen reminders ("" = never set up). */
  pushGroup: string;
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
  /** Supply tracking for the apothecary shelf, if switched on. */
  supply?: Supply;
};

/**
 * How much of a potion is on the shelf. Rather than counting down a stored
 * number (which two synced devices could each decrement), the remaining
 * amount is worked out from `amount` minus every dose logged after `since`.
 */
export type Supply = {
  /** How many were on hand at `since` (pills, ml, drops…). */
  amount: number;
  /** When `amount` was counted, as "YYYY-MM-DDTHH:MM" local time. */
  since: string;
  /** How many each dose uses. */
  perDose: number;
  unit: string;
  /** Warn this many days before running out. */
  warnDays: number;
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

/** A personal day to remember: a birthday, anniversary, and so on. */
export type Occasion = {
  id: string;
  name: string;
  kind: "birthday" | "anniversary" | "celebration" | "remembrance";
  /** 1–12 */
  month: number;
  day: number;
  /** For a yearly occasion, the year it began (to count ages); for a one-time one, the year it happens. */
  year?: number;
  yearly: boolean;
};

/** A creature companion that follows your tide. */
export type Familiar = {
  species: Species;
  name: string;
  /** Index into the species' coats. */
  coat: number;
  /** Accessory ids being worn. */
  head?: string;
  neck?: string;
  /** Seasonal pieces gathered so far (they stay once collected). */
  collected: string[];
  adoptedOn: DateKey;
  /** Earned cover stickers. */
  stickers?: Sticker[];
  /** Little visits on the day, journal, and cabinet pages. */
  cameos: boolean;
};

/** A snapshot of the familiar, earned for a moment worth keeping, that can sit on the cover. */
export type Sticker = {
  id: string;
  kind: "season" | "sabbat" | "cycle" | "streak";
  label: string;
  date: DateKey;
  mood: Phase;
  /** For a seasonal sticker: the piece it shows off. */
  wearing?: string;
  /** How the familiar looked when it was earned. */
  look: { species: Species; coat: number; head?: string; neck?: string };
  /** Position on the cover, in percent, and tilt in degrees. */
  x: number;
  y: number;
  rot: number;
  onCover: boolean;
  isNew: boolean;
};

/** 1 (lowest) to 5 (highest). */
export type Level = 1 | 2 | 3 | 4 | 5;

/** Last night's sleep and today's energy. */
export type Rest = { sleepHours?: number; sleepQuality?: Level; energy?: Level };

export type DayEntry = {
  flow?: Flow;
  elements: Record<TimeBlock, ElementLog[]>;
  journal: string;
  potionLogs: PotionLog[];
  symptoms: SymptomLog[];
  /** The day's tarot card or rune, if one was drawn. */
  draw?: Draw;
  rest?: Rest;
};

export type Grimoire = {
  version: typeof SCHEMA_VERSION;
  settings: Settings;
  tides: Tide[];
  potions: Potion[];
  customSymptoms: CustomSymptom[];
  occasions: Occasion[];
  familiar?: Familiar;
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
  theme: "midnight",
  hemisphere: "north",
  lastBackupAt: "",
  holidayRegion: "us",
  pushGroup: "",
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
  occasions: [],
  days: {},
});
