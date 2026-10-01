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
