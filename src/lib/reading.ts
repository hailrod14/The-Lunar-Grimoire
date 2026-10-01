"use client";

import { useSyncExternalStore } from "react";

/*
 * Reading comfort: lettering and text size. These belong to the device (a
 * phone and a laptop want different sizes) and must work on the lock screen,
 * so they live in their own localStorage keys rather than in the Grimoire.
 * The first-paint script in layout.tsx reads the same keys.
 */

export type Lettering = "storybook" | "easy" | "pixel";
export type TextSize = "regular" | "large" | "larger";
export type Reading = { lettering: Lettering; textSize: TextSize };

export const LETTERINGS: { id: Lettering; name: string; note: string }[] = [
  { id: "storybook", name: "Storybook", note: "Pixel titles, easy-read words" },
  { id: "easy", name: "Easy-read everywhere", note: "Clear letters, even in titles" },
  { id: "pixel", name: "All pixel", note: "The original retro lettering" },
];

export const TEXT_SIZES: { id: TextSize; name: string }[] = [
  { id: "regular", name: "Regular" },
  { id: "large", name: "Large" },
  { id: "larger", name: "Larger" },
];

const LETTERING_KEY = "lunar-grimoire:lettering";
const SIZE_KEY = "lunar-grimoire:text-size";
const DEFAULT: Reading = { lettering: "storybook", textSize: "regular" };

let current: Reading | null = null;
const listeners = new Set<() => void>();

function read(): Reading {
  if (current) return current;
  try {
    const l = localStorage.getItem(LETTERING_KEY);
    const z = localStorage.getItem(SIZE_KEY);
    current = {
      lettering: LETTERINGS.some((x) => x.id === l) ? (l as Lettering) : DEFAULT.lettering,
      textSize: TEXT_SIZES.some((x) => x.id === z) ? (z as TextSize) : DEFAULT.textSize,
    };
  } catch {
    current = DEFAULT;
  }
  return current;
}

function apply({ lettering, textSize }: Reading) {
  const root = document.documentElement;
  if (lettering === "storybook") delete root.dataset.lettering;
  else root.dataset.lettering = lettering;
  if (textSize === "regular") delete root.dataset.textSize;
  else root.dataset.textSize = textSize;
}

export function setReading(patch: Partial<Reading>) {
  current = { ...read(), ...patch };
  apply(current);
  try {
    localStorage.setItem(LETTERING_KEY, current.lettering);
    localStorage.setItem(SIZE_KEY, current.textSize);
  } catch {
    // Still applies for this visit.
  }
  for (const l of listeners) l();
}

export function useReading(): Reading {
  return useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    read,
    () => DEFAULT,
  );
}
