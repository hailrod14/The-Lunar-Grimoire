import type { Familiar, Grimoire, Sticker } from "./types";

/*
 * How the cover looks, kept outside the (possibly encrypted) Grimoire so the
 * locked cover can show your familiar and stickers. Only looks and positions
 * are kept: no names, labels, dates, or moods, so nothing about your cycle
 * or health shows while the book is locked.
 */

export const COVER_KEY = "lunar-grimoire:cover";

export type CoverSnapshot = {
  familiar: Pick<Familiar, "species" | "coat" | "head" | "neck" | "coverSpot">;
  stickers: Pick<Sticker, "kind" | "look" | "x" | "y" | "rot">[];
};

export function coverSnapshot(g: Grimoire): CoverSnapshot | null {
  const f = g.familiar;
  if (!f) return null;
  return {
    familiar: { species: f.species, coat: f.coat, head: f.head, neck: f.neck, coverSpot: f.coverSpot },
    stickers: (f.stickers ?? []).filter((s) => s.onCover).map(({ kind, look, x, y, rot }) => ({ kind, look, x, y, rot })),
  };
}

export function saveCoverSnapshot(snapshot: CoverSnapshot | null) {
  try {
    if (snapshot) localStorage.setItem(COVER_KEY, JSON.stringify(snapshot));
    else localStorage.removeItem(COVER_KEY);
  } catch {
    // The locked cover simply shows no familiar.
  }
}

/** The last saved look, turned back into something the cover can draw (as plain stickers). */
export function readCoverSnapshot(): { familiar: Familiar; stickers: Sticker[] } | null {
  try {
    const s = JSON.parse(localStorage.getItem(COVER_KEY) ?? "null") as CoverSnapshot | null;
    if (!s?.familiar?.species) return null;
    return {
      familiar: { ...s.familiar, name: "Your familiar", collected: [], adoptedOn: "2026-01-01", cameos: false },
      stickers: (s.stickers ?? []).map((st, i) => ({
        ...st,
        id: `locked-${i}`,
        label: "",
        date: "2026-01-01",
        mood: st.kind === "cycle" ? "dark" : "waxing",
        onCover: true,
        isNew: false,
      })),
    };
  } catch {
    return null;
  }
}
