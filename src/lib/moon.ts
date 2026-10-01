import { moonPhaseAt } from "./astronomy";

/** The real moon in the sky, computed offline from precise new and full moon times. */

/** 0 = new, 0.25 = first quarter, 0.5 = full, 0.75 = last quarter. Uses local noon. */
export function skyMoonPhase(date: Date): number {
  return moonPhaseAt(new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12));
}

const NAMES = [
  "New Moon",
  "Waxing Crescent",
  "First Quarter",
  "Waxing Gibbous",
  "Full Moon",
  "Waning Gibbous",
  "Last Quarter",
  "Waning Crescent",
];

export function skyMoonName(phase: number): string {
  return NAMES[Math.round(phase * 8) % 8];
}

/** How much of the moon's face is lit, 0–1, for a phase (0 new, 0.5 full). */
export const illumination = (phase: number) => (1 - Math.cos(2 * Math.PI * phase)) / 2;

/** "Waxing Gibbous · 71% lit" for a date. */
export function skyMoonLine(date: Date): string {
  const phase = skyMoonPhase(date);
  return `${skyMoonName(phase)} · ${Math.round(illumination(phase) * 100)}% lit`;
}
