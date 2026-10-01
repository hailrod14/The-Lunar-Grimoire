import { beforeEach, describe, expect, it, vi } from "vitest";

// A tiny browser for the store: in-memory localStorage plus no-op event hooks.
class MemoryStorage {
  data = new Map<string, string>();
  getItem = (k: string) => this.data.get(k) ?? null;
  setItem = (k: string, v: string) => void this.data.set(k, v);
  removeItem = (k: string) => void this.data.delete(k);
}

let storage: MemoryStorage;

async function freshStore() {
  vi.resetModules();
  storage = new MemoryStorage();
  const g = globalThis as Record<string, unknown>;
  g.window = { localStorage: storage, addEventListener() {}, removeEventListener() {} };
  g.localStorage = storage;
  return import("./store");
}

const saved = () => storage.getItem("lunar-grimoire") ?? "";

describe("the PIN lock", () => {
  beforeEach(() => {
    vi.setConfig({ testTimeout: 30_000 });
  });

  it("encrypts on set, locks, refuses a wrong PIN, and unlocks with the right one", async () => {
    const store = await freshStore();
    store.dispatch((g) => ({ ...g, days: { "2026-09-30": { ...emptyDayFor(), journal: "Moonlit secret" } } }));
    expect(saved()).toContain("Moonlit secret");

    await store.setPin("2468");
    expect(saved()).not.toContain("Moonlit");
    expect(JSON.parse(saved()).kind).toBe("lunar-grimoire-sealed");

    // Changes made while unlocked are saved encrypted too.
    store.dispatch((g) => ({ ...g, days: { ...g.days, "2026-10-01": { ...emptyDayFor(), journal: "Second secret" } } }));
    await store.lockNow();
    expect(saved()).not.toContain("Second");
    expect(store.getGrimoire()).toBeNull();

    expect(await store.unlock("1111")).toBe(false);
    expect(store.getGrimoire()).toBeNull();
    expect(await store.unlock("2468")).toBe(true);
    expect(store.getGrimoire()!.days["2026-10-01"].journal).toBe("Second secret");
  });

  it("opens a sealed Grimoire after a reload", async () => {
    const first = await freshStore();
    first.dispatch((g) => ({ ...g, days: { "2026-09-30": { ...emptyDayFor(), journal: "Kept" } } }));
    await first.setPin("9876");
    const sealedText = saved();

    vi.resetModules();
    storage.setItem("lunar-grimoire", sealedText);
    const second = await import("./store");
    expect(second.getGrimoire()).toBeNull(); // starts locked
    expect(await second.unlock("9876")).toBe(true);
    expect(second.getGrimoire()!.days["2026-09-30"].journal).toBe("Kept");
  });

  it("changes and removes the PIN only with the current PIN", async () => {
    const store = await freshStore();
    await store.setPin("2468");
    expect(await store.changePin("0000", "1357")).toBe(false);
    expect(await store.changePin("2468", "1357")).toBe(true);
    expect(await store.removePin("2468")).toBe(false);
    expect(await store.removePin("1357")).toBe(true);
    expect(JSON.parse(saved()).kind).toBeUndefined(); // saved unencrypted again
    expect(JSON.parse(saved()).days).toBeDefined();
  });

  it("erases everything, including the PIN", async () => {
    const store = await freshStore();
    store.dispatch((g) => ({ ...g, days: { "2026-09-30": { ...emptyDayFor(), journal: "Gone" } } }));
    await store.setPin("2468");
    await store.lockNow();
    await store.eraseEverything();
    expect(store.getGrimoire()!.days).toEqual({});
    expect(JSON.parse(saved()).kind).toBeUndefined();
  });
});

function emptyDayFor() {
  return { elements: { morning: [], afternoon: [], night: [] }, journal: "", potionLogs: [], symptoms: [] };
}
