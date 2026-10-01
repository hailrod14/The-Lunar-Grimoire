/*
 * Precise new and full moons, and the solstices and equinoxes, computed
 * offline with the algorithms in Jean Meeus, "Astronomical Algorithms"
 * (2nd ed.), chapters 49 and 27. Moon phases use the main periodic terms
 * (accurate to a few minutes); seasons use the full 24-term correction.
 */

const RAD = Math.PI / 180;
const sin = (deg: number) => Math.sin(deg * RAD);
const cos = (deg: number) => Math.cos(deg * RAD);

/** Terrestrial Time runs about 69 seconds ahead of UTC in the 2020s. */
const DELTA_T_DAYS = 69 / 86_400;

/** Julian Ephemeris Day → JavaScript Date (UTC instant). */
const jdeToDate = (jde: number) => new Date((jde - DELTA_T_DAYS - 2_440_587.5) * 86_400_000);

// ── Moon phases (Meeus ch. 49) ───────────────────────────────

export type MoonEvent = { kind: "new" | "full"; at: Date };

/** The new (k whole) or full (k + 0.5) moon numbered k from January 2000. */
function moonPhaseJde(k: number): number {
  const T = k / 1236.85;
  const jde = 2451550.09766 + 29.530588861 * k + 0.00015437 * T ** 2 - 0.00000015 * T ** 3 + 0.00000000073 * T ** 4;
  const E = 1 - 0.002516 * T - 0.0000074 * T ** 2;
  const M = 2.5534 + 29.1053567 * k - 0.0000014 * T ** 2 - 0.00000011 * T ** 3;
  const Mp = 201.5643 + 385.81693528 * k + 0.0107582 * T ** 2 + 0.00001238 * T ** 3 - 0.000000058 * T ** 4;
  const F = 160.7108 + 390.67050284 * k - 0.0016118 * T ** 2 - 0.00000227 * T ** 3 + 0.000000011 * T ** 4;
  const Om = 124.7746 - 1.56375588 * k + 0.0020672 * T ** 2 + 0.00000215 * T ** 3;

  const full = Math.abs(k % 1) > 0.25;
  const correction = full
    ? -0.40614 * sin(Mp) + 0.17302 * E * sin(M) + 0.01614 * sin(2 * Mp) + 0.01043 * sin(2 * F) +
      0.00734 * E * sin(Mp - M) - 0.00515 * E * sin(Mp + M) + 0.00209 * E * E * sin(2 * M) -
      0.00111 * sin(Mp - 2 * F) - 0.00057 * sin(Mp + 2 * F) + 0.00056 * E * sin(2 * Mp + M) -
      0.00042 * sin(3 * Mp) + 0.00042 * E * sin(M + 2 * F) + 0.00038 * E * sin(M - 2 * F) -
      0.00024 * E * sin(2 * Mp - M) - 0.00017 * sin(Om)
    : -0.4072 * sin(Mp) + 0.17241 * E * sin(M) + 0.01608 * sin(2 * Mp) + 0.01039 * sin(2 * F) +
      0.00739 * E * sin(Mp - M) - 0.00514 * E * sin(Mp + M) + 0.00208 * E * E * sin(2 * M) -
      0.00111 * sin(Mp - 2 * F) - 0.00057 * sin(Mp + 2 * F) + 0.00056 * E * sin(2 * Mp + M) -
      0.00042 * sin(3 * Mp) + 0.00042 * E * sin(M + 2 * F) + 0.00038 * E * sin(M - 2 * F) -
      0.00024 * E * sin(2 * Mp - M) - 0.00017 * sin(Om);
  return jde + correction;
}

/** Every new and full moon between two instants, in order. */
export function moonEventsBetween(from: Date, to: Date): MoonEvent[] {
  const yearsFrom2000 = (d: Date) => (d.getTime() - Date.UTC(2000, 0, 6)) / (365.25 * 86_400_000);
  const first = Math.floor(yearsFrom2000(from) * 12.3685) - 1;
  const last = Math.ceil(yearsFrom2000(to) * 12.3685) + 1;
  const events: MoonEvent[] = [];
  for (let k = first; k <= last; k++) {
    for (const [offset, kind] of [[0, "new"], [0.5, "full"]] as const) {
      const at = jdeToDate(moonPhaseJde(k + offset));
      if (at >= from && at < to) events.push({ kind, at });
    }
  }
  return events.sort((a, b) => a.at.getTime() - b.at.getTime());
}

/**
 * How far through its cycle the moon is at an instant: 0 new, 0.5 full.
 * Measured between the surrounding new moons, with the full moon pinned at 0.5.
 */
export function moonPhaseAt(at: Date): number {
  const span = 32 * 86_400_000;
  const events = moonEventsBetween(new Date(at.getTime() - span), new Date(at.getTime() + span));
  const before = events.filter((e) => e.at <= at).at(-1);
  const after = events.find((e) => e.at > at);
  if (!before || !after) return 0;
  const progress = (at.getTime() - before.at.getTime()) / (after.at.getTime() - before.at.getTime());
  return before.kind === "new" ? progress * 0.5 : 0.5 + progress * 0.5;
}

// ── Solstices and equinoxes (Meeus ch. 27) ───────────────────

export type SeasonEvent = "march-equinox" | "june-solstice" | "september-equinox" | "december-solstice";

const SEASON_TERMS: [number, number, number][] = [
  [485, 324.96, 1934.136], [203, 337.23, 32964.467], [199, 342.08, 20.186], [182, 27.85, 445267.112],
  [156, 73.14, 45036.886], [136, 171.52, 22518.443], [77, 222.54, 65928.934], [74, 296.72, 3034.906],
  [70, 243.58, 9037.513], [58, 119.81, 33718.147], [52, 297.17, 150.678], [50, 21.02, 2281.226],
  [45, 247.54, 29929.562], [44, 325.15, 31555.956], [29, 60.93, 4443.417], [18, 155.12, 67555.328],
  [17, 288.79, 4562.452], [16, 198.04, 62894.029], [14, 199.76, 31436.921], [12, 95.39, 14577.848],
  [12, 287.11, 31931.756], [12, 320.81, 34777.259], [9, 227.73, 1222.114], [8, 15.45, 16859.074],
];

const MEAN_SEASON: Record<SeasonEvent, number[]> = {
  "march-equinox": [2451623.80984, 365242.37404, 0.05169, -0.00411, -0.00057],
  "june-solstice": [2451716.56767, 365241.62603, 0.00325, 0.00888, -0.0003],
  "september-equinox": [2451810.21715, 365242.01767, -0.11575, 0.00337, 0.00078],
  "december-solstice": [2451900.05952, 365242.74049, -0.06223, -0.00823, 0.00032],
};

/** The instant of a solstice or equinox in a given year (valid 2000–3000). */
export function seasonEvent(year: number, event: SeasonEvent): Date {
  const Y = (year - 2000) / 1000;
  const [a, b, c, d, e] = MEAN_SEASON[event];
  const jde0 = a + b * Y + c * Y ** 2 + d * Y ** 3 + e * Y ** 4;
  const T = (jde0 - 2451545.0) / 36525;
  const W = 35999.373 * T - 2.47;
  const dLambda = 1 + 0.0334 * cos(W) + 0.0007 * cos(2 * W);
  const S = SEASON_TERMS.reduce((sum, [A, B, C]) => sum + A * cos(B + C * T), 0);
  return jdeToDate(jde0 + (0.00001 * S) / dLambda);
}
