import { describe, expect, it } from "vitest";
import { adoptFamiliar, beginTide, savePotion, togglePotion } from "./grimoire";
import { MAX_ON_COVER, awardStickers, earnedStickers, moveSticker, seenStickers, setOnCover, tidyStickers, unawarded } from "./stickers";
import { addDaysKey } from "./dates";
import { newGrimoire, type Grimoire, type Potion } from "./types";

function withFamiliar(adoptedOn = "2026-09-01"): Grimoire {
  return adoptFamiliar(newGrimoire(), { species: "fox", name: "Juniper", coat: 0, collected: [], adoptedOn, stickers: [], cameos: true, head: "witch-hat" });
}

const potion: Omit<Potion, "id"> = {
  name: "Iron",
  dose: "",
  times: ["09:00"],
  days: [],
  vessel: "tablet",
  color: "rose",
  schedule: "daily",
  archived: false,
  reminder: false,
};

describe("cover stickers", () => {
  it("are earned for sabbats, new cycles, seasonal pieces, and potion streaks", () => {
    let g = withFamiliar();
    g = beginTide(g, "2026-09-10");
    g = savePotion(g, potion);
    const id = g.potions[0].id;
    for (let d = "2026-09-01"; d <= "2026-09-14"; d = addDaysKey(d, 1)) g = togglePotion(g, d, id, "09:00");
    const ids = earnedStickers(g, "2026-10-01").map((s) => s.id);
    expect(ids).toContain("sabbat:2026-09-22"); // Mabon
    expect(ids).toContain("cycle:2026-09-10");
    expect(ids).toContain("season:pumpkin");
    expect(ids.filter((x) => x.startsWith("streak:"))).toEqual(["streak:2026-09-07", "streak:2026-09-14"]);
    expect(ids).not.toContain("sabbat:2026-08-01"); // before they met
  });

  it("keep the familiar's look from the day they were earned", () => {
    let g = withFamiliar();
    g = awardStickers(g, unawarded(g, "2026-10-01"));
    const pumpkin = g.familiar!.stickers!.find((s) => s.id === "season:pumpkin")!;
    expect(pumpkin.look).toEqual({ species: "fox", coat: 0, head: "pumpkin" });
    const mabon = g.familiar!.stickers!.find((s) => s.id === "sabbat:2026-09-22")!;
    expect(mabon.look).toEqual({ species: "fox", coat: 0, head: "witch-hat" });
    expect(unawarded(g, "2026-10-01")).toEqual([]);
  });

  it("go on the cover in free spots up to the limit, and can be moved, removed, and tidied", () => {
    let g = withFamiliar("2025-01-01"); // a long time together: many sabbats
    g = awardStickers(g, unawarded(g, "2026-10-01"));
    const stickers = g.familiar!.stickers!;
    expect(stickers.length).toBeGreaterThan(MAX_ON_COVER);
    const onCover = stickers.filter((s) => s.onCover);
    expect(onCover).toHaveLength(MAX_ON_COVER);
    expect(new Set(onCover.map((s) => `${s.x},${s.y}`)).size).toBe(MAX_ON_COVER);
    expect(stickers.every((s) => s.isNew)).toBe(true);

    const first = onCover[0].id;
    g = moveSticker(g, first, 40.4, 60.6);
    expect(g.familiar!.stickers!.find((s) => s.id === first)).toMatchObject({ x: 40, y: 61 });
    const extra = stickers.find((s) => !s.onCover)!.id;
    expect(setOnCover(g, extra, true)).toEqual(g); // full
    g = setOnCover(g, first, false);
    g = setOnCover(g, extra, true);
    expect(g.familiar!.stickers!.filter((s) => s.onCover)).toHaveLength(MAX_ON_COVER);
    g = tidyStickers(seenStickers(g));
    expect(g.familiar!.stickers!.some((s) => s.isNew)).toBe(false);
  });
});
