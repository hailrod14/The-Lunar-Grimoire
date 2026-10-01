import { parseKey, type DateKey } from "./dates";

export type ThemeName = "midnight" | "parchment" | "forest" | "rose";
export type ThemeSetting = ThemeName | "device" | "seasons";
export type Hemisphere = "north" | "south";

export const THEMES: { id: ThemeSetting; name: string; note: string; swatch: [string, string, string] }[] = [
  { id: "midnight", name: "Midnight", note: "The night sky, gold and violet", swatch: ["#171441", "#f2b33d", "#6b44b8"] },
  { id: "parchment", name: "Parchment", note: "A light, daytime page", swatch: ["#f8f0de", "#9a6a12", "#6b44b8"] },
  { id: "forest", name: "Enchanted Forest", note: "Moss, pine, and honey", swatch: ["#13281a", "#f2b33d", "#4f8a5b"] },
  { id: "rose", name: "Rose Quartz", note: "Plum velvet and rose gold", swatch: ["#321324", "#e0957a", "#c0577f"] },
  { id: "device", name: "Match my device", note: "Parchment by day, Midnight by night", swatch: ["#f8f0de", "#171441", "#f2b33d"] },
  { id: "seasons", name: "Follow the seasons", note: "Turns with the Wheel of the Year", swatch: ["#321324", "#f8f0de", "#13281a"] },
];

/** The bar colour phones use around the app, per theme. */
export const THEME_COLOR: Record<ThemeName, string> = {
  midnight: "#0f0d2e",
  parchment: "#efe4cb",
  forest: "#0c1c12",
  rose: "#230d18",
};

/**
 * The seasons by the Wheel of the Year: Midnight from Samhain through Yule,
 * Rose Quartz from Imbolc (spring's first stirring), Parchment from Beltane
 * (bright summer), and Enchanted Forest from Lughnasadh (harvest and turning leaves).
 * The southern hemisphere's wheel runs six months apart.
 */
export function seasonalTheme(date: DateKey, hemisphere: Hemisphere): ThemeName {
  const d = parseKey(date);
  const shifted = new Date(d.getFullYear(), d.getMonth() + (hemisphere === "south" ? 6 : 0), d.getDate());
  const md = (shifted.getMonth() + 1) * 100 + shifted.getDate(); // e.g. Oct 31 → 1031
  if (md >= 1031 || md < 201) return "midnight";
  if (md < 501) return "rose";
  if (md < 801) return "parchment";
  return "forest";
}

export function resolveTheme(setting: ThemeSetting, prefersDark: boolean, today: DateKey, hemisphere: Hemisphere): ThemeName {
  if (setting === "device") return prefersDark ? "midnight" : "parchment";
  if (setting === "seasons") return seasonalTheme(today, hemisphere);
  return setting;
}

/** Where the chosen theme is remembered outside the (possibly encrypted) Grimoire, for first paint. */
export const THEME_KEY = "lunar-grimoire:theme";

/** Put a theme on the page: palette, phone bar colour, and a note for next time. */
export function applyTheme(name: ThemeName) {
  const root = document.documentElement;
  if (name === "midnight") delete root.dataset.theme;
  else root.dataset.theme = name;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[name]);
  try {
    localStorage.setItem(THEME_KEY, name);
  } catch {
    // Only affects the first paint next time.
  }
}
