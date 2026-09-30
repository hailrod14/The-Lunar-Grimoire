/** The real moon in the sky, computed offline. Accurate to within about a day. */

const SYNODIC_MONTH = 29.530588853;
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14); // 2000-01-06 18:14 UTC

/** 0 = new, 0.25 = first quarter, 0.5 = full, 0.75 = last quarter. Uses local noon. */
export function skyMoonPhase(date: Date): number {
  const noon = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12).getTime();
  const days = (noon - KNOWN_NEW_MOON) / 86_400_000;
  return (((days / SYNODIC_MONTH) % 1) + 1) % 1;
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
