import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEY, exportGrimoire, loadGrimoire, parseGrimoireFile, saveGrimoire, sanitizeGrimoire } from "./storage";
import { newGrimoire, type Grimoire } from "./types";

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
  potions: [
    { id: "p1", name: "Iron Tincture", dose: "1 dropper", time: "09:00", vessel: "dropper", color: "rose", schedule: "daily", archived: false },
  ],
  days: {
    "2026-09-30": {
      flow: "light",
      elements: { morning: [{ element: "air", intensity: 3, aspect: "light" }], afternoon: [], night: [] },
      journal: "Rain on the window.",
      potionLogs: [{ id: "l1", potionId: "p1", name: "Iron Tincture", dose: "1 dropper", time: "09:04", extra: false }],
    },
  },
});

describe("localStorage", () => {
  it("starts a fresh Grimoire when nothing is saved", () => {
    expect(loadGrimoire()).toEqual({ grimoire: newGrimoire() });
  });

  it("saves and loads the same Grimoire", () => {
    expect(saveGrimoire(sample())).toBe(true);
    expect(loadGrimoire().grimoire).toEqual(sample());
  });

  it("sets unreadable data aside instead of losing it", () => {
    store.setItem(STORAGE_KEY, "{not json");
    const result = loadGrimoire(new Date("2026-09-30T12:00:00Z"));
    expect(result.grimoire).toEqual(newGrimoire());
    expect(result.problem?.backupKey).toBe("lunar-grimoire:unreadable:2026-09-30T12:00:00.000Z");
    expect(store.getItem(result.problem!.backupKey)).toBe("{not json");
    expect(store.getItem(STORAGE_KEY)).toBe("{not json"); // untouched until the next save
  });

  it("reports a failed save", () => {
    store.failWrites = true;
    expect(saveGrimoire(sample())).toBe(false);
  });

  it("copes with no storage at all", () => {
    delete (globalThis as { window?: unknown }).window;
    expect(loadGrimoire().grimoire).toEqual(newGrimoire());
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
      settings: { defaultCycleLength: 500, soundEnabled: false },
      tides: [{ id: "a", start: "2026-02-30" }, { id: "b", start: "2026-09-22", end: "2026-09-01" }, "junk"],
      potions: [{ name: "" }, { id: "p", name: "Magnesium", vessel: "teapot", color: "plaid", time: "25:99" }],
      days: {
        "not-a-date": { journal: "lost" },
        "2026-09-30": {
          flow: "torrential",
          journal: 42,
          elements: { morning: [{ element: "aether", intensity: 3 }, { element: "fire", intensity: 9, aspect: "shadow" }] },
          potionLogs: [{ potionId: "p", time: "08:00" }, { potionId: "p", time: "noon" }],
        },
      },
    };
    const result = sanitizeGrimoire(messy);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const g = result.grimoire;

    expect(g.settings).toMatchObject({ defaultCycleLength: 28, soundEnabled: false });
    expect(g.tides).toEqual([{ id: "b", start: "2026-09-22" }]); // bad date dropped, backwards end dropped
    expect(g.potions).toMatchObject([{ id: "p", name: "Magnesium", vessel: "flask", color: "gold", time: "" }]);
    expect(Object.keys(g.days)).toEqual(["2026-09-30"]);

    const day = g.days["2026-09-30"];
    expect(day.flow).toBeUndefined();
    expect(day.journal).toBe("");
    expect(day.elements.morning).toEqual([{ element: "fire", intensity: 3, aspect: "shadow" }]);
    expect(day.elements.night).toEqual([]);
    expect(day.potionLogs).toHaveLength(1);
  });
});
