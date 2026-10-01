import { tideDay, type Phase } from "./cycle";
import { parseKey, type DateKey } from "./dates";
import { skyMoonPhase } from "./moon";
import type { Hemisphere } from "./theme";
import type { Familiar, Grimoire } from "./types";

/*
 * Familiars: a small creature that keeps you company and follows your tide.
 * Sprites are 16 × 16 pixel art. Shared keys: o outline · b body · B body
 * shade · l belly / light · a accent (ears, wings, fins, markings) · e eye ·
 * w eye shine · n nose / beak / cheeks.
 */

export const SPECIES = ["cat", "dog", "frog", "spider", "fish", "bat", "dragon", "phoenix"] as const;
export type Species = (typeof SPECIES)[number];

export type Coat = { name: string; b: string; B: string; l: string; a: string; e: string; n: string };

type SpeciesInfo = {
  name: string;
  rows: string[];
  coats: Coat[];
  /** Where worn pieces go, as [centre column, row]: a hat's bottom row and neckwear's top row land on that row. */
  head: [number, number];
  neck: [number, number];
  /** What petting sounds like. */
  sound: string;
};

const OUTLINE = "#1a1433";

export const SPECIES_INFO: Record<Species, SpeciesInfo> = {
  cat: {
    name: "Cat",
    rows: [
      "................",
      "..o.......o.....",
      ".obo.....obo....",
      ".obbo...obbo....",
      ".obbbooobbbo....",
      "obbbbbbbbbbbo...",
      "obbebbbbbebbo...",
      "obbbbbnbbbbbo...",
      ".obbbbbbbbbo....",
      "..obbllllbbo....",
      "..oblllllbbo.oo.",
      ".obblllllbbbobbo",
      ".obbllllllbbbbo.",
      ".obblBllBlbbBo..",
      "..ooooooooooo...",
      "................",
    ],
    coats: [
      { name: "Midnight", b: "#2b2440", B: "#1a1530", l: "#4a4060", a: "#2b2440", e: "#ffd866", n: "#f09aa8" },
      { name: "Ginger", b: "#e08a3c", B: "#b0642a", l: "#f6d2a6", a: "#e08a3c", e: "#3f8f3f", n: "#f09aa8" },
      { name: "Smoke", b: "#8a90a8", B: "#5f6580", l: "#c9cde0", a: "#8a90a8", e: "#c98a10", n: "#f09aa8" },
      { name: "Snow", b: "#f2eef8", B: "#c6c0d6", l: "#ffffff", a: "#f2eef8", e: "#3a76c0", n: "#f09aa8" },
    ],
    head: [6, 4],
    neck: [6.5, 9],
    sound: "purr~",
  },
  dog: {
    name: "Dog",
    rows: [
      "................",
      "....oooooo......",
      "...obbbbbbo.....",
      "..oabbbbbbao....",
      ".oaabebbebaao...",
      ".oaabbbbbbaao...",
      ".oaablnnlbaao...",
      ".oaobllllboao...",
      "...oobbbboo.....",
      "...obbbbbbo.....",
      "..obbllllbbo....",
      "..obbllllbbooaao",
      "..obbllllbbbaao.",
      "..obbBbbbbBbo...",
      "...oooooooooo...",
      "................",
    ],
    coats: [
      { name: "Golden", b: "#d9a45a", B: "#a8763a", l: "#f3dcb0", a: "#8a5a2a", e: "#2a1a10", n: "#2a1a10" },
      { name: "Cocoa", b: "#7a4a2a", B: "#5a341c", l: "#c79a70", a: "#4a2a14", e: "#1a0f08", n: "#1a0f08" },
      { name: "Husky", b: "#9aa3b8", B: "#6f7890", l: "#f2f2f8", a: "#4f5770", e: "#3a76c0", n: "#1a1433" },
      { name: "Cream", b: "#f3e3c8", B: "#cdb894", l: "#fffaf0", a: "#c9a070", e: "#2a1a10", n: "#2a1a10" },
    ],
    head: [6.5, 1],
    neck: [6.5, 9],
    sound: "woof!",
  },
  frog: {
    name: "Frog",
    rows: [
      "................",
      "................",
      "..ooo......ooo..",
      ".owweo....oewwo.",
      ".obbbboooobbbbo.",
      "obbbbbbbbbbbbbbo",
      "obbbbbbbbbbbbbbo",
      "obnbbbbbbbbbbnbo",
      "obbbboooooobbbbo",
      ".obbbbbbbbbbbbo.",
      ".obllllllllllbo.",
      "obbllllllllllbbo",
      "obobllllllllbobo",
      "obbo.oooooo.obbo",
      ".oo..........oo.",
      "................",
    ],
    coats: [
      { name: "Moss", b: "#6fbf4a", B: "#4a8f30", l: "#d8f0a0", a: "#4a8f30", e: "#1a1433", n: "#f09aa8" },
      { name: "Poison dart", b: "#3fa0e0", B: "#2a70b0", l: "#9ad8ff", a: "#1a1433", e: "#1a1433", n: "#ffd866" },
      { name: "Rose", b: "#f08ab0", B: "#c0587f", l: "#ffd6e6", a: "#c0587f", e: "#1a1433", n: "#fff4f8" },
      { name: "Marigold", b: "#e8c04a", B: "#b08a20", l: "#fff0b0", a: "#b08a20", e: "#1a1433", n: "#f09aa8" },
    ],
    head: [7.5, 4],
    neck: [7.5, 9],
    sound: "ribbit!",
  },
  spider: {
    name: "Spider",
    rows: [
      "................",
      "................",
      "......oooo......",
      "....oobbbboo....",
      "l..obbbbbbbbo..l",
      ".l.obwwbbwwbo.l.",
      "..oobwebbweboo..",
      "llloobbbbbbbolll",
      "...obbbaabbbo...",
      ".llobbaaaabboll.",
      "l..obbbaabbbo..l",
      ".l..obbbbbbo..l.",
      "l....oooooo....l",
      "................",
      "................",
      "................",
    ],
    coats: [
      { name: "Velvet", b: "#3d3460", B: "#251f3d", l: "#6a5c96", a: "#b07ae0", e: "#1a1433", n: "#f09aa8" },
      { name: "Amber", b: "#6b4a2a", B: "#4a3018", l: "#a07448", a: "#e8a040", e: "#1a1433", n: "#f09aa8" },
      { name: "Ghost", b: "#e8e4f4", B: "#b8b0d0", l: "#c8c0e0", a: "#8f5ee0", e: "#1a1433", n: "#f09aa8" },
      { name: "Jewel", b: "#2fbfa8", B: "#1f8f7e", l: "#5fe0c8", a: "#ffd866", e: "#1a1433", n: "#f09aa8" },
    ],
    head: [7.5, 3],
    neck: [7.5, 8],
    sound: "*happy tip-tapping*",
  },
  fish: {
    name: "Fish",
    rows: [
      "................",
      "................",
      "................",
      "................",
      "....oaao........",
      "..oobbbboo...oo.",
      ".obbbbbbbbo.oaao",
      "obwebbbbbbbobao.",
      "obbbbbbbbbbbbo..",
      "olbbbbbbbbbobao.",
      ".ollllllloo.oaao",
      "..oooooo.....oo.",
      "................",
      "................",
      "................",
      "................",
    ],
    coats: [
      { name: "Goldfish", b: "#f28a3a", B: "#c05a1a", l: "#ffd0a0", a: "#ffb070", e: "#1a1433", n: "#f09aa8" },
      { name: "Betta", b: "#4a6fe0", B: "#2a40a0", l: "#9ab0ff", a: "#c07ae0", e: "#1a1433", n: "#f09aa8" },
      { name: "Moonfish", b: "#c3cfea", B: "#8a9bc4", l: "#eef3ff", a: "#a88ef0", e: "#1a1433", n: "#f09aa8" },
      { name: "Koi", b: "#fff4f8", B: "#d8c8d0", l: "#ffffff", a: "#e8553d", e: "#1a1433", n: "#f09aa8" },
    ],
    head: [5, 5],
    neck: [6, 8],
    sound: "blub blub",
  },
  bat: {
    name: "Bat",
    rows: [
      "................",
      "................",
      "....o......o....",
      "....obo..obo....",
      "....obboobbo....",
      "o..obbbbbbbbo..o",
      "oo.obebbbbebo.oo",
      "oaaobbbbbbbboaao",
      "oaaaobwbbwboaaao",
      "oaaaaobbbboaaaao",
      "oa.aaobbbboaa.ao",
      "o..o.oobboo.o..o",
      "......o..o......",
      "................",
      "................",
      "................",
    ],
    coats: [
      { name: "Dusk", b: "#5a3a7a", B: "#3a2450", l: "#5a3a7a", a: "#3a2a58", e: "#ffd866", n: "#f09aa8" },
      { name: "Night", b: "#2b2440", B: "#1a1530", l: "#2b2440", a: "#4a3a6a", e: "#ff8aa8", n: "#f09aa8" },
      { name: "Fruit bat", b: "#8a5a34", B: "#5a3820", l: "#8a5a34", a: "#4a3020", e: "#1a1433", n: "#f09aa8" },
      { name: "Moth-white", b: "#ece6f6", B: "#bdb4d4", l: "#ece6f6", a: "#a88ef0", e: "#1a1433", n: "#f09aa8" },
    ],
    head: [7.5, 4],
    neck: [7.5, 9],
    sound: "squeak!",
  },
  dragon: {
    name: "Dragon",
    rows: [
      "................",
      "..oa......ao....",
      "...oa....ao.....",
      "...oboooobo.....",
      "..obbbbbbbbo....",
      "..obebbbbebo....",
      "..obbbbbbbbo....",
      "..obbnbbnbbo....",
      "o..obbbbbbo..o..",
      "oa.obllllbo.ao..",
      "oaaobllllboaao..",
      ".oaobllllboao...",
      "..obllllllbo.oo.",
      "..obbBbbBbbooao.",
      "...oooooooo..o..",
      "................",
    ],
    coats: [
      { name: "Emerald", b: "#4fae6a", B: "#2f7a48", l: "#e8d890", a: "#3fa08a", e: "#1a1433", n: "#2f7a48" },
      { name: "Amethyst", b: "#8f5ee0", B: "#5a38a0", l: "#e4dbff", a: "#c09af0", e: "#ffd866", n: "#5a38a0" },
      { name: "Ruby", b: "#d84a5a", B: "#9a2a3a", l: "#ffd0a0", a: "#f08a6a", e: "#ffd866", n: "#9a2a3a" },
      { name: "Gilded", b: "#f2b33d", B: "#b07a1c", l: "#fff4c2", a: "#e0902a", e: "#1a1433", n: "#b07a1c" },
    ],
    head: [6.5, 3],
    neck: [6.5, 8],
    sound: "*a happy puff of smoke*",
  },
  phoenix: {
    name: "Phoenix",
    rows: [
      "................",
      ".....a..a.......",
      "......aa........",
      ".....oooo.......",
      "....obbbbo......",
      "....oebbeo......",
      "....obnnbo......",
      "...obbnnbbo.....",
      "..obbllllbbo....",
      ".oabbllllbbao...",
      "oaabbllllbbaao..",
      ".oaobllllboao...",
      "..oobbbbbboo....",
      "...oaoaaoao.....",
      "....a.aa.a......",
      "................",
    ],
    coats: [
      { name: "Ember", b: "#ff8a3a", B: "#d0501a", l: "#ffd866", a: "#ff4a3a", e: "#1a1433", n: "#ffd866" },
      { name: "Azure", b: "#4ac0e0", B: "#2a80b0", l: "#c0f0ff", a: "#8f5ee0", e: "#1a1433", n: "#ffd866" },
      { name: "Starlight", b: "#e4dbff", B: "#a88ef0", l: "#fff4c2", a: "#ffd866", e: "#1a1433", n: "#f2b33d" },
      { name: "Rosefire", b: "#f06a95", B: "#c0406a", l: "#ffd6e6", a: "#ffb070", e: "#1a1433", n: "#ffd866" },
    ],
    head: [6.5, 3],
    neck: [6.5, 8],
    sound: "*a warm little trill*",
  },
};

/** The colours a sprite's letters turn into. A sleeping familiar's eyes close. */
export function familiarPalette(species: Species, coat: number, asleep = false): Record<string, string> {
  const c = SPECIES_INFO[species].coats[coat] ?? SPECIES_INFO[species].coats[0];
  return {
    o: OUTLINE,
    b: c.b,
    B: c.B,
    l: c.l,
    a: c.a,
    n: c.n,
    e: asleep ? c.B : c.e,
    w: asleep ? c.B : "#ffffff",
  };
}

// ── The wardrobe ─────────────────────────────────────────────

export type Slot = "head" | "neck";
/** Months (1–12, northern hemisphere) when a seasonal piece appears. */
type Season = { months: number[]; label: string };

export type Accessory = { id: string; name: string; slot: Slot; rows: string[]; colors: Record<string, string>; season?: Season };

const AUTUMN: Season = { months: [9, 10, 11], label: "autumn" };
const WINTER: Season = { months: [12, 1, 2], label: "winter" };
const SPRING: Season = { months: [3, 4, 5], label: "spring" };
const SUMMER: Season = { months: [6, 7, 8], label: "summer" };

export const ACCESSORIES: Accessory[] = [
  {
    id: "witch-hat",
    name: "Witch hat",
    slot: "head",
    rows: [".....oo..", "....oao..", "...oaao..", "..oaaaao.", "..oggggo.", "oaaaaaaao", ".ooooooo."],
    colors: { o: OUTLINE, a: "#3a2470", g: "#f2b33d" },
  },
  {
    id: "starry-hat",
    name: "Starry wizard hat",
    slot: "head",
    rows: ["...a...", "..aya..", "..aaa..", ".aaaya.", ".ayaaa.", "aaaaaaa"],
    colors: { a: "#3f5fd0", y: "#ffd866" },
  },
  {
    id: "crown",
    name: "Little crown",
    slot: "head",
    rows: ["y..y..y", "yy.y.yy", "yyyyyyy", "YrYyYbY"],
    colors: { y: "#ffd866", Y: "#b07a1c", r: "#e8553d", b: "#3fa0e0" },
  },
  { id: "bow", name: "Ribbon bow", slot: "head", rows: ["pp.pp", "pPPPp", "pp.pp"], colors: { p: "#f06a95", P: "#c0587f" } },
  {
    id: "party-hat",
    name: "Party hat",
    slot: "head",
    rows: ["..y..", "..p..", ".pbp.", ".bpb.", "pbpbp"],
    colors: { y: "#ffd866", p: "#e5638f", b: "#5fe0c8" },
  },
  {
    id: "pumpkin",
    name: "Pumpkin hat",
    slot: "head",
    rows: ["...g...", ".oOoOo.", "oOoOoOo", "oOoOoOo", ".oOoOo."],
    colors: { g: "#4a8f30", o: "#f28a3a", O: "#c05a1a" },
    season: AUTUMN,
  },
  {
    id: "mushroom",
    name: "Toadstool cap",
    slot: "head",
    rows: ["..rrr..", ".rwrrr.", "rrrrwrr", "..www.."],
    colors: { r: "#d84a5a", w: "#fff4f8" },
    season: AUTUMN,
  },
  {
    id: "santa-hat",
    name: "Yule hat",
    slot: "head",
    rows: ["......ww.", ".....rww.", "...rrr...", "..rrrrr..", "wwwwwwwww"],
    colors: { r: "#d84a5a", w: "#f6f6ff" },
    season: { months: [12], label: "December" },
  },
  {
    id: "beanie",
    name: "Knitted beanie",
    slot: "head",
    rows: ["..www..", ".ttttt.", "tTtTtTt", "wwwwwww"],
    colors: { t: "#2fbfa8", T: "#1f8f7e", w: "#f6f6ff" },
    season: WINTER,
  },
  {
    id: "heart-clip",
    name: "Heart clip",
    slot: "head",
    rows: [".r.r.", "rrrrr", ".rrr.", "..r.."],
    colors: { r: "#f06a95" },
    season: { months: [2], label: "February" },
  },
  {
    id: "clover",
    name: "Lucky clover",
    slot: "head",
    rows: [".g.g.", "ggggg", ".ggg.", "..G..", "..G.."],
    colors: { g: "#6fbf4a", G: "#4a8f30" },
    season: { months: [3], label: "March" },
  },
  {
    id: "flower-crown",
    name: "Flower crown",
    slot: "head",
    rows: [".p.w.p.w.", "gpgwgpgwg"],
    colors: { p: "#f06a95", w: "#fff4f8", g: "#6fbf4a" },
    season: SPRING,
  },
  {
    id: "sun-hat",
    name: "Straw sun hat",
    slot: "head",
    rows: ["...sssss...", "...sbbbs...", "sssssssssss", ".SSSSSSSSS."],
    colors: { s: "#e8c87a", S: "#b8964a", b: "#e5638f" },
    season: SUMMER,
  },
  { id: "bow-tie", name: "Bow tie", slot: "neck", rows: ["bb.bb", "bbBbb", "bb.bb"], colors: { b: "#4a86cf", B: "#2a5a9f" } },
  {
    id: "bell",
    name: "Bell collar",
    slot: "neck",
    rows: ["vvvvvvv", "...Y...", "...y..."],
    colors: { v: "#8f5ee0", y: "#ffd866", Y: "#b07a1c" },
  },
  { id: "moon-pendant", name: "Moon pendant", slot: "neck", rows: ["s...s", ".s.s.", "..y.."], colors: { s: "#c3cfea", y: "#ffd866" } },
  {
    id: "leaf-scarf",
    name: "Autumn leaf scarf",
    slot: "neck",
    rows: ["oOyOoOy", "....oO."],
    colors: { o: "#e8553d", O: "#f28a3a", y: "#e8c04a" },
    season: AUTUMN,
  },
  {
    id: "scarf",
    name: "Striped scarf",
    slot: "neck",
    rows: ["rwrwrwr", "....wr."],
    colors: { r: "#d84a5a", w: "#fff4f8" },
    season: WINTER,
  },
  {
    id: "lei",
    name: "Flower garland",
    slot: "neck",
    rows: ["pwypwyp", ".g.g.g."],
    colors: { p: "#f06a95", w: "#fff4f8", y: "#ffd866", g: "#6fbf4a" },
    season: SUMMER,
  },
];

export const accessory = (id: string | undefined) => ACCESSORIES.find((a) => a.id === id);

/** The month as the northern hemisphere's seasons see it (the south runs six months apart). */
function seasonMonth(date: DateKey, hemisphere: Hemisphere): number {
  const m = parseKey(date).getMonth() + 1;
  return hemisphere === "south" ? ((m + 5) % 12) + 1 : m;
}

export const inSeason = (a: Accessory, date: DateKey, hemisphere: Hemisphere) =>
  !a.season || a.season.months.includes(seasonMonth(date, hemisphere));

/** Seasonal pieces in season now that this familiar hasn't collected yet. */
export function newlyInSeason(f: Familiar, date: DateKey, hemisphere: Hemisphere): Accessory[] {
  return ACCESSORIES.filter((a) => a.season && inSeason(a, date, hemisphere) && !f.collected.includes(a.id));
}

/** Whether the familiar can wear a piece: year-round ones always, seasonal ones once collected. */
export const owns = (f: Familiar, a: Accessory) => !a.season || f.collected.includes(a.id);

// ── Moods, from your tide ────────────────────────────────────

export type Mood = Phase;

/** The familiar follows your tide, or the sky's moon if you're not tracking (or nothing is logged yet). */
export function familiarMood(g: Grimoire, today: DateKey): Mood {
  if (g.settings.cycleTracking) {
    const tide = tideDay(today, g.tides, g.settings, today);
    if (tide) return tide.phase;
  }
  const p = skyMoonPhase(parseKey(today));
  if (p < 0.07 || p > 0.93) return "dark";
  if (p < 0.43) return "waxing";
  if (p < 0.57) return "full";
  return "waning";
}

export function moodLine(f: Familiar, mood: Mood): string {
  switch (mood) {
    case "dark":
      return `${f.name} is curled up asleep beside you. Rest is magic too.`;
    case "waxing":
      return `${f.name} is bright-eyed and curious, ready for something new.`;
    case "full":
      return `${f.name} is glowing with moonlight and wants to play!`;
    case "waning":
      return `${f.name} is tucked in with a warm cup. Slow and gentle today.`;
  }
}

export const DEFAULT_NAMES: Record<Species, string> = {
  cat: "Salem",
  dog: "Biscuit",
  frog: "Pip",
  spider: "Lace",
  fish: "Bubbles",
  bat: "Nyx",
  dragon: "Ember",
  phoenix: "Sol",
};
