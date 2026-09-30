import type { Element } from "@/components/sprites/ElementSprite";

export type Aspect = "light" | "shadow" | "mixed";
export type TimeBlock = "morning" | "afternoon" | "night";

export type ElementLog = { element: Element; intensity: 1 | 2 | 3 | 4 | 5; aspect: Aspect };

export const ELEMENTS: Element[] = ["fire", "water", "earth", "air"];

export const TIME_BLOCKS: { id: TimeBlock; label: string }[] = [
  { id: "morning", label: "Morning" },
  { id: "afternoon", label: "Afternoon" },
  { id: "night", label: "Night" },
];

export const ELEMENT_INFO: Record<
  Element,
  { name: string; light: string; shadow: string; levels: [string, string, string, string, string]; text: string; bg: string }
> = {
  fire: { name: "Fire", light: "Passionate", shadow: "Irritable", levels: ["Ember", "Kindling", "Flame", "Blaze", "Wildfire"], text: "text-fire", bg: "bg-fire" },
  water: { name: "Water", light: "Intuitive", shadow: "Emotional", levels: ["Mist", "Stream", "River", "Tide", "Tsunami"], text: "text-water", bg: "bg-water" },
  earth: { name: "Earth", light: "Grounded", shadow: "Tired", levels: ["Pebble", "Stone", "Boulder", "Mountain", "Bedrock"], text: "text-earth", bg: "bg-earth" },
  air: { name: "Air", light: "Creative", shadow: "Anxious", levels: ["Breath", "Breeze", "Gust", "Gale", "Tempest"], text: "text-air", bg: "bg-air" },
};

/** What each number means — the same for every element, so ratings stay consistent. */
export const LEVEL_MEANINGS = [
  "Barely there. A faint flicker you only notice if you look.",
  "Noticeable, but easy to set aside.",
  "Clearly present and shaping your choices.",
  "Strong. Hard to ignore; it colors most of your interactions.",
  "Overwhelming. It's in charge today.",
];

export const ASPECTS: { id: Aspect; label: string; glyph: string }[] = [
  { id: "light", label: "Light", glyph: "☀" },
  { id: "shadow", label: "Shadow", glyph: "☾" },
  { id: "mixed", label: "Mixed", glyph: "◐" },
];
