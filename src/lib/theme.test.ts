import { describe, expect, it } from "vitest";
import { resolveTheme, seasonalTheme } from "./theme";

describe("themes", () => {
  it("follows the Wheel of the Year in the north", () => {
    expect(seasonalTheme("2026-10-31", "north")).toBe("midnight"); // Samhain
    expect(seasonalTheme("2026-01-31", "north")).toBe("midnight");
    expect(seasonalTheme("2026-02-01", "north")).toBe("rose"); // Imbolc
    expect(seasonalTheme("2026-05-01", "north")).toBe("parchment"); // Beltane
    expect(seasonalTheme("2026-08-01", "north")).toBe("forest"); // Lughnasadh
    expect(seasonalTheme("2026-10-30", "north")).toBe("forest");
  });

  it("runs six months apart in the south", () => {
    expect(seasonalTheme("2026-05-01", "south")).toBe("midnight"); // southern Samhain season
    expect(seasonalTheme("2026-11-01", "south")).toBe("parchment"); // southern Beltane
  });

  it("matches the device or uses a chosen theme", () => {
    expect(resolveTheme("device", true, "2026-09-30", "north")).toBe("midnight");
    expect(resolveTheme("device", false, "2026-09-30", "north")).toBe("parchment");
    expect(resolveTheme("rose", true, "2026-09-30", "north")).toBe("rose");
    expect(resolveTheme("seasons", true, "2026-09-30", "north")).toBe("forest");
  });
});
