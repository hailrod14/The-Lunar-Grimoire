import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEY, exportGrimoire, loadGrimoire, parseGrimoireFile, saveGrimoire, sanitizeGrimoire } from "./storage";
import { SCHEMA_VERSION, newGrimoire, type Grimoire } from "./types";

class MemoryStorage {
  data = new Map<string, string>();
  failWrites = false;
  getItem = (k: string) => this.data.get(k) ?? null;
  setItem = (k: string, v: string) => {
    if (this.failWrites) throw new Error("QuotaExceededError");
    this.data.set(k, v);
  };
  removeItem = (k: string) => void this.data.delete(k);
}

let store: MemoryStorage;

beforeEach(() => {
  store = new MemoryStorage();
  (globalThis as { window?: unknown }).window = { localStorage: store };
});

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
});

const sample = (): Grimoire => ({
  ...newGrimoire(),
  settings: { ...newGrimoire().settings, onboarded: true },
  tides: [{ id: "t1", start: "2026-09-22", end: "2026-09-26" }],
  customSymptoms: [{ id: "custom-a", name: "Dizzy", archived: false }],
  potions: [
    { id: "p1", name: "Iron Tincture", dose: "1 dropper", times: ["09:00"], days: [], vessel: "dropper", color: "rose", schedule: "daily", archived: false, reminder: true },
  ],
  days: {
    "2026-09-30": {
      flow: "light",
      elements: { morning: [{ element: "air", intensity: 3, aspect: "light" }], afternoon: [], night: [] },
      journal: "Rain on the window.",
      potionLogs: [{ id: "l1", potionId: "p1", name: "Iron Tincture", dose: "1 dropper", time: "09:04", extra: false }],
      symptoms: [
        { id: "cramps", severity: 2 },
        { id: "custom-a", severity: 1 },
      ],
    },
  },
});

describe("localStorage", () => {
  it("starts a fresh Grimoire when nothing is saved", () => {
    expect(loadGrimoire()).toEqual({ status: "open", grimoire: newGrimoire() });
  });

  it("saves and loads the same Grimoire", () => {
    expect(saveGrimoire(sample())).toBe(true);
    expect(loadGrimoire()).toEqual({ status: "open", grimoire: sample() });
  });

  it("sets unreadable data aside instead of losing it", () => {
    store.setItem(STORAGE_KEY, "{not json");
    const result = loadGrimoire(new Date("2026-09-30T12:00:00Z"));
    if (result.status !== "open") throw new Error("expected an open Grimoire");
    expect(result.grimoire).toEqual(newGrimoire());
    expect(result.problem?.backupKey).toBe("lunar-grimoire:unreadable:2026-09-30T12:00:00.000Z");
    expect(store.getItem(result.problem!.backupKey)).toBe("{not json");
    expect(store.getItem(STORAGE_KEY)).toBe("{not json"); // untouched until the next save
  });

  it("recognizes a PIN-sealed Grimoire instead of treating it as unreadable", () => {
    const sealed = { kind: "lunar-grimoire-sealed", v: 1, salt: "c2FsdA==", iv: "aXY=", data: "ZGF0YQ==", rounds: 1000 };
    store.setItem(STORAGE_KEY, JSON.stringify(sealed));
    expect(loadGrimoire()).toEqual({ status: "sealed", sealed });
    expect([...store.data.keys()]).toEqual([STORAGE_KEY]); // nothing set aside
  });

  it("reports a failed save", () => {
    store.failWrites = true;
    expect(saveGrimoire(sample())).toBe(false);
  });

  it("copes with no storage at all", () => {
    delete (globalThis as { window?: unknown }).window;
    expect(loadGrimoire()).toEqual({ status: "open", grimoire: newGrimoire() });
    expect(saveGrimoire(sample())).toBe(false);
  });
});

describe("export and import", () => {
  it("round-trips through a backup file", () => {
    const file = exportGrimoire(sample(), new Date("2026-09-30T12:00:00Z"));
    expect(JSON.parse(file)).toMatchObject({ app: "The Lunar Grimoire", exportedAt: "2026-09-30T12:00:00.000Z" });
    const parsed = parseGrimoireFile(file);
    expect(parsed).toEqual({ ok: true, grimoire: sample() });
  });

  it("rejects files that aren't Grimoires", () => {
    expect(parseGrimoireFile("hello")).toMatchObject({ ok: false });
    expect(parseGrimoireFile("[1,2,3]")).toMatchObject({ ok: false });
    expect(parseGrimoireFile(JSON.stringify({ tides: [] }))).toMatchObject({ ok: false });
  });

  it("rejects files from a newer version of the app", () => {
    const result = parseGrimoireFile(JSON.stringify({ ...sample(), version: 99 }));
    expect(result).toMatchObject({ ok: false });
    if (!result.ok) expect(result.error).toMatch(/newer version/);
  });

  it("keeps valid entries and drops broken ones", () => {
    const messy = {
      version: 1,
      settings: { defaultCycleLength: 500, soundEnabled: false, musicEnabled: true, musicVolume: 7 },
      tides: [{ id: "a", start: "2026-02-30" }, { id: "b", start: "2026-09-22", end: "2026-09-01" }, "junk"],
      potions: [{ name: "" }, { id: "p", name: "Magnesium", vessel: "teapot", color: "plaid", time: "25:99" }],
      days: {
        "not-a-date": { journal: "lost" },
        "2026-09-30": {
          flow: "torrential",
          journal: 42,
          elements: { morning: [{ element: "aether", intensity: 3 }, { element: "fire", intensity: 9, aspect: "shadow" }] },
          potionLogs: [{ potionId: "p", time: "08:00" }, { potionId: "p", time: "noon" }],
          symptoms: [{ id: "cramps", severity: 9 }, { id: "cramps", severity: 2 }, { id: "made-up" }],
        },
      },
    };
    const result = sanitizeGrimoire(messy);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const g = result.grimoire;

    expect(g.settings).toMatchObject({ defaultCycleLength: 28, soundEnabled: false, musicEnabled: true, musicVolume: 0.5 });
    expect(g.tides).toEqual([{ id: "b", start: "2026-09-22" }]); // bad date dropped, backwards end dropped
    expect(g.potions).toMatchObject([{ id: "p", name: "Magnesium", vessel: "flask", color: "gold", times: ["09:00"], schedule: "daily" }]);
    expect(Object.keys(g.days)).toEqual(["2026-09-30"]);

    const day = g.days["2026-09-30"];
    expect(day.flow).toBeUndefined();
    expect(day.journal).toBe("");
    expect(day.elements.morning).toEqual([{ element: "fire", intensity: 3, aspect: "shadow" }]);
    expect(day.elements.night).toEqual([]);
    expect(day.potionLogs).toHaveLength(1);
    expect(day.symptoms).toEqual([{ id: "cramps", severity: 1 }]); // unknown dropped, duplicate dropped
  });

  it("upgrades version 2 potions to dose lists and weekdays", () => {
    const v2 = {
      version: 2,
      potions: [
        { id: "a", name: "Iron", time: "08:30", schedule: "daily" },
        { id: "b", name: "Ibuprofen", time: "", schedule: "as-needed", reminder: true },
        { id: "c", name: "Odd", schedule: "weekly", days: [] },
      ],
      days: { "2026-09-30": { potionLogs: [{ id: "l", potionId: "a", time: "08:31", extra: false }] } },
    };
    const result = sanitizeGrimoire(v2);
    if (!result.ok) throw new Error(result.error);
    expect(result.grimoire.potions.map((p) => [p.schedule, p.times, p.days, p.reminder])).toEqual([
      ["daily", ["08:30"], [], false],
      ["as-needed", [], [], false], // as-needed potions can't have reminders
      ["daily", ["09:00"], [], false], // weekly with no days falls back to daily
    ]);
    expect(result.grimoire.days["2026-09-30"].potionLogs[0].slot).toBeUndefined(); // counts as the first dose
  });

  it("upgrades a version 1 Grimoire, filling in the new fields", () => {
    const v1 = {
      version: 1,
      settings: { onboarded: true },
      tides: [],
      potions: [{ id: "p", name: "Iron", dose: "", time: "09:00", vessel: "vial", color: "rose", schedule: "daily", archived: false }],
      days: { "2026-09-30": { journal: "Old entry", elements: {}, potionLogs: [] } },
    };
    const result = sanitizeGrimoire(v1);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.grimoire.version).toBe(SCHEMA_VERSION);
    expect(result.grimoire.potions[0]).toMatchObject({ times: ["09:00"], days: [], schedule: "daily" });
    expect(result.grimoire.customSymptoms).toEqual([]);
    expect(result.grimoire.potions[0].reminder).toBe(false);
    expect(result.grimoire.days["2026-09-30"]).toMatchObject({ journal: "Old entry", symptoms: [] });
  });
});
