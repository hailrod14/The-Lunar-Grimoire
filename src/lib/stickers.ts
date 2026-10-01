import { addDaysKey, type DateKey } from "./dates";
import { ACCESSORIES, newlyInSeason } from "./familiars";
import { allDosesOn, doseLog } from "./potions";
import { phaseOfDay } from "./prompts";
import type { Familiar, Grimoire, Sticker } from "./types";
import { sabbatsIn } from "./wheel";

/*
 * Cover stickers: little snapshots of your familiar, earned along the way.
 *   - a seasonal piece joining the wardrobe (wearing it),
 *   - each sabbat since you met,
 *   - each new cycle,
 *   - every 7 days in a row with all your potions taken.
 * Each keeps the familiar's look from the day it was earned, so the cover
 * becomes a scrapbook of your year.
 */

export const MAX_ON_COVER = 10;
/** Days in a row with every potion taken that earn a sticker. */
const STREAK_DAYS = 7;

/** Spots around the cover's edges (percent of its width and height) that keep the title and moon clear. */
export const COVER_SLOTS: [number, number][] = [
  [17, 14], [83, 14], [16, 36], [85, 34], [16, 58], [85, 56], [50, 92], [80, 90], [36, 7], [65, 7], [85, 74], [34, 92],
];
/** Where today's familiar sits on the cover. */
export const TODAY_SPOT: [number, number] = [19, 82];

export type Earned = Omit<Sticker, "x" | "y" | "rot" | "onCover" | "isNew" | "look">;

/** Every sticker this familiar has earned by `today`, in date order. */
export function earnedStickers(g: Grimoire, today: DateKey): Earned[] {
  const f = g.familiar;
  if (!f) return [];
  const since = f.adoptedOn;
  const out: Earned[] = [];

  // Seasonal pieces (collected, or arriving now)
  const collected = [...f.collected, ...newlyInSeason(f, today, g.settings.hemisphere).map((a) => a.id)];
  for (const id of collected) {
    const piece = ACCESSORIES.find((a) => a.id === id);
    if (piece) out.push({ id: `season:${id}`, kind: "season", label: piece.name, date: today, mood: "waxing", wearing: id });
  }

  // Sabbats since you met
  for (let year = Number(since.slice(0, 4)); year <= Number(today.slice(0, 4)); year++) {
    for (const { date, sabbat } of sabbatsIn(year, g.settings.hemisphere)) {
      if (date >= since && date <= today) out.push({ id: `sabbat:${date}`, kind: "sabbat", label: sabbat.name, date, mood: phaseOfDay(g, date, today) });
    }
  }

  // New cycles
  if (g.settings.cycleTracking) {
    for (const t of g.tides) {
      if (t.start > since && t.start <= today) out.push({ id: `cycle:${t.start}`, kind: "cycle", label: "A new cycle", date: t.start, mood: "dark" });
    }
  }

  // Potion streaks: every 7 days in a row with every scheduled dose taken
  let run = 0;
  for (let d = since; d < today; d = addDaysKey(d, 1)) {
    const doses = allDosesOn(g, d);
    const all = doses.length > 0 && doses.every((x) => doseLog(g.days[d], x.potion.id, x.slot));
    run = all ? run + 1 : 0;
    if (run > 0 && run % STREAK_DAYS === 0) out.push({ id: `streak:${d}`, kind: "streak", label: `${run} days of potions`, date: d, mood: "full" });
  }

  return out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/** Stickers earned but not yet in the familiar's album. */
export function unawarded(g: Grimoire, today: DateKey): Earned[] {
  const have = new Set((g.familiar?.stickers ?? []).map((s) => s.id));
  return earnedStickers(g, today).filter((e) => !have.has(e.id));
}

/** A gentle tilt between −12° and 12°, the same for the same sticker every time. */
const tilt = (id: string) => ([...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 3) % 25) - 12;

/** Add newly earned stickers, each in a free spot on the cover while there's room. */
export function awardStickers(g: Grimoire, earned: Earned[]): Grimoire {
  const f = g.familiar;
  if (!f || !earned.length) return g;
  const stickers = [...(f.stickers ?? [])];
  for (const e of earned) {
    const taken = stickers.filter((s) => s.onCover).map((s) => `${s.x},${s.y}`);
    const slot = COVER_SLOTS.find(([x, y]) => !taken.includes(`${x},${y}`));
    const onCover = Boolean(slot) && stickers.filter((s) => s.onCover).length < MAX_ON_COVER;
    const piece = e.wearing ? ACCESSORIES.find((a) => a.id === e.wearing) : undefined;
    stickers.push({
      ...e,
      look: {
        species: f.species,
        coat: f.coat,
        ...(piece ? { [piece.slot]: piece.id } : { ...(f.head ? { head: f.head } : {}), ...(f.neck ? { neck: f.neck } : {}) }),
      },
      x: slot?.[0] ?? 50,
      y: slot?.[1] ?? 50,
      rot: tilt(e.id),
      onCover,
      isNew: true,
    });
  }
  return { ...g, familiar: { ...f, stickers } };
}

const withStickers = (g: Grimoire, fn: (s: Sticker[]) => Sticker[]): Grimoire =>
  g.familiar ? { ...g, familiar: { ...g.familiar, stickers: fn(g.familiar.stickers ?? []) } } : g;

export const moveSticker = (g: Grimoire, id: string, x: number, y: number) =>
  withStickers(g, (list) => list.map((s) => (s.id === id ? { ...s, x: Math.round(x), y: Math.round(y) } : s)));

/** Put a sticker on the cover (in a free spot) or take it off. */
export function setOnCover(g: Grimoire, id: string, onCover: boolean): Grimoire {
  return withStickers(g, (list) => {
    if (!onCover) return list.map((s) => (s.id === id ? { ...s, onCover } : s));
    if (list.filter((s) => s.onCover).length >= MAX_ON_COVER) return list;
    const taken = list.filter((s) => s.onCover).map((s) => `${s.x},${s.y}`);
    const [x, y] = COVER_SLOTS.find(([sx, sy]) => !taken.includes(`${sx},${sy}`)) ?? [50, 50];
    return list.map((s) => (s.id === id ? { ...s, onCover, x, y } : s));
  });
}

/** Line every cover sticker back up in the edge spots. */
export const tidyStickers = (g: Grimoire) =>
  withStickers(g, (list) => {
    let i = 0;
    return list.map((s) => {
      if (!s.onCover) return s;
      const [x, y] = COVER_SLOTS[i++ % COVER_SLOTS.length];
      return { ...s, x, y };
    });
  });

export const seenStickers = (g: Grimoire) =>
  g.familiar?.stickers?.some((s) => s.isNew) ? withStickers(g, (list) => list.map((s) => ({ ...s, isNew: false }))) : g;

export const newStickers = (f: Familiar | undefined) => (f?.stickers ?? []).filter((s) => s.isNew);
