import { moonEventsBetween, seasonEvent, type SeasonEvent } from "./astronomy";
import { dateKey, formatTime, parseKey, type DateKey } from "./dates";
import type { Hemisphere } from "./theme";

/*
 * The Wheel of the Year and the moon's turning: the eight sabbats and the
 * named full moons, placed on local calendar days.
 */

export type Sabbat = { id: string; name: string; note: string; meaning: string };

const SABBATS: Record<string, Sabbat> = {
  samhain: { id: "samhain", name: "Samhain", note: "the year's end, when the veil is thin", meaning: "Honour ancestors, release what's done, and rest in the dark." },
  yule: { id: "yule", name: "Yule", note: "the winter solstice, the longest night", meaning: "Light a candle for the sun's return; hope kindled in darkness." },
  imbolc: { id: "imbolc", name: "Imbolc", note: "the first stirrings of spring", meaning: "Clear space, tend the hearth, and plant the first quiet intentions." },
  ostara: { id: "ostara", name: "Ostara", note: "the spring equinox, day and night in balance", meaning: "Balance and fresh growth; begin what you've been dreaming of." },
  beltane: { id: "beltane", name: "Beltane", note: "the blossoming of summer", meaning: "Passion, creativity, and joy; celebrate what's alive in you." },
  litha: { id: "litha", name: "Litha", note: "the summer solstice, the longest day", meaning: "Full power and abundance; bask in the light and give thanks." },
  lughnasadh: { id: "lughnasadh", name: "Lughnasadh", note: "the first harvest", meaning: "Gather the first fruits of your efforts and share them." },
  mabon: { id: "mabon", name: "Mabon", note: "the autumn equinox, the second harvest", meaning: "Gratitude and balance; take stock before the dark half of the year." },
};

/** Where each sabbat falls. Fixed days are cross-quarter dates; the rest follow the sun. */
type Placement = { month: number; day: number } | { season: SeasonEvent };

const NORTH: Record<string, Placement> = {
  samhain: { month: 10, day: 31 },
  yule: { season: "december-solstice" },
  imbolc: { month: 2, day: 1 },
  ostara: { season: "march-equinox" },
  beltane: { month: 5, day: 1 },
  litha: { season: "june-solstice" },
  lughnasadh: { month: 8, day: 1 },
  mabon: { season: "september-equinox" },
};

/** In the south the wheel turns six months apart. */
const SOUTH: Record<string, Placement> = {
  samhain: { month: 5, day: 1 },
  yule: { season: "june-solstice" },
  imbolc: { month: 8, day: 1 },
  ostara: { season: "september-equinox" },
  beltane: { month: 10, day: 31 },
  litha: { season: "december-solstice" },
  lughnasadh: { month: 2, day: 1 },
  mabon: { season: "march-equinox" },
};

/** The sabbats of a year, as local dates. */
export function sabbatsIn(year: number, hemisphere: Hemisphere): { date: DateKey; sabbat: Sabbat }[] {
  const places = hemisphere === "south" ? SOUTH : NORTH;
  return Object.entries(places)
    .map(([id, p]) => ({
      date: dateKey("season" in p ? seasonEvent(year, p.season) : new Date(year, p.month - 1, p.day)),
      sabbat: SABBATS[id],
    }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

// ── Named moons ──────────────────────────────────────────────

/** Traditional full-moon names by month (northern); shifted six months in the south. */
const MOON_NAMES = ["Wolf", "Snow", "Worm", "Pink", "Flower", "Strawberry", "Buck", "Sturgeon", "Corn", "Hunter's", "Beaver", "Cold"];

export type MoonDay = { kind: "new" | "full"; time: string; name: string; note?: string };

/** Every new and full moon in a year, on local days, with full moons named. */
export function moonsIn(year: number, hemisphere: Hemisphere): Map<DateKey, MoonDay> {
  const events = moonEventsBetween(new Date(year, 0, 1), new Date(year + 1, 0, 1));
  const fulls = events.filter((e) => e.kind === "full");

  // The Harvest Moon is the full moon nearest the autumn equinox; the Hunter's Moon follows it.
  const equinox = seasonEvent(year, hemisphere === "south" ? "march-equinox" : "september-equinox");
  const harvest = fulls.reduce((best, e) =>
    Math.abs(e.at.getTime() - equinox.getTime()) < Math.abs(best.at.getTime() - equinox.getTime()) ? e : best,
  );
  const hunters = fulls[fulls.indexOf(harvest) + 1];

  const days = new Map<DateKey, MoonDay>();
  const fullsInMonth = new Map<string, number>();
  for (const e of events) {
    const key = dateKey(e.at);
    const time = formatTime(e.at);
    if (e.kind === "new") {
      days.set(key, { kind: "new", time, name: "New Moon" });
      continue;
    }
    const month = e.at.getMonth();
    const monthKey = `${e.at.getFullYear()}-${month}`;
    const nth = (fullsInMonth.get(monthKey) ?? 0) + 1;
    fullsInMonth.set(monthKey, nth);
    const traditional = MOON_NAMES[(month + (hemisphere === "south" ? 6 : 0)) % 12];
    const name = e === harvest ? "Harvest" : e === hunters ? "Hunter's" : traditional;
    days.set(key, {
      kind: "full",
      time,
      name: `${name} Moon`,
      note: nth === 2 ? "a Blue Moon, the second full moon this month" : undefined,
    });
  }
  return days;
}

// ── Lookups for the calendar and day pages ───────────────────

export type SkyDay = { sabbat?: Sabbat; moon?: MoonDay };

const yearCache = new Map<string, { sabbats: Map<DateKey, Sabbat>; moons: Map<DateKey, MoonDay> }>();

function yearOf(year: number, hemisphere: Hemisphere) {
  const key = `${year}-${hemisphere}`;
  let cached = yearCache.get(key);
  if (!cached) {
    cached = {
      sabbats: new Map(sabbatsIn(year, hemisphere).map((s) => [s.date, s.sabbat])),
      moons: moonsIn(year, hemisphere),
    };
    yearCache.set(key, cached);
  }
  return cached;
}

/** The sabbat and moon event (if any) on a local day. */
export function skyDay(date: DateKey, hemisphere: Hemisphere): SkyDay {
  const y = yearOf(parseKey(date).getFullYear(), hemisphere);
  return { sabbat: y.sabbats.get(date), moon: y.moons.get(date) };
}
