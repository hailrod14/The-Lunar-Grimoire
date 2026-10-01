import { describe, expect, it } from "vitest";
import { moonsIn, sabbatsIn, skyDay } from "./wheel";

// Tests run in America/New_York (see vitest.config.mts), so local dates are fixed.
describe("the Wheel of the Year", () => {
  it("places the eight northern sabbats of 2026", () => {
    expect(sabbatsIn(2026, "north").map((s) => `${s.sabbat.name} ${s.date}`)).toEqual([
      "Imbolc 2026-02-01",
      "Ostara 2026-03-20",
      "Beltane 2026-05-01",
      "Litha 2026-06-21",
      "Lughnasadh 2026-08-01",
      "Mabon 2026-09-22", // 00:05 UTC on the 23rd is the evening of the 22nd in New York
      "Samhain 2026-10-31",
      "Yule 2026-12-21",
    ]);
  });

  it("turns six months apart in the south", () => {
    const south = new Map(sabbatsIn(2026, "south").map((s) => [s.sabbat.id, s.date]));
    expect(south.get("samhain")).toBe("2026-05-01");
    expect(south.get("beltane")).toBe("2026-10-31");
    expect(south.get("yule")).toBe("2026-06-21");
  });

  it("names the full moons, including the Harvest and Hunter's Moons", () => {
    const moons = moonsIn(2026, "north");
    const fulls = [...moons.entries()].filter(([, m]) => m.kind === "full").map(([d, m]) => `${d} ${m.name}`);
    expect(fulls).toContain("2026-01-03 Wolf Moon");
    expect(fulls.find((f) => f.includes("Harvest"))).toMatch(/^2026-09-2/);
    expect(fulls.find((f) => f.includes("Hunter's"))).toMatch(/^2026-10-2/);
  });

  it("marks a Blue Moon when a month has two full moons", () => {
    // May 2026 has full moons on the 1st and the 31st.
    const may = [...moonsIn(2026, "north").entries()].filter(([d, m]) => d.startsWith("2026-05") && m.kind === "full");
    expect(may).toHaveLength(2);
    expect(may[1][1].note).toMatch(/Blue Moon/);
  });

  it("looks up a day's sky", () => {
    expect(skyDay("2026-10-31", "north").sabbat?.name).toBe("Samhain");
    expect(skyDay("2026-10-10", "north").moon?.kind).toBe("new");
    expect(skyDay("2026-10-11", "north")).toEqual({ sabbat: undefined, moon: undefined });
  });
});
