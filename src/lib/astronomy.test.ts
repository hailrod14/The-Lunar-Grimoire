import { describe, expect, it } from "vitest";
import { moonEventsBetween, moonPhaseAt, seasonEvent } from "./astronomy";

const minutesApart = (a: Date, iso: string) => Math.abs(a.getTime() - Date.parse(iso)) / 60_000;

describe("moon phases", () => {
  // Published 2026 times (UTC).
  const events = moonEventsBetween(new Date("2026-01-01T00:00:00Z"), new Date("2027-01-01T00:00:00Z"));
  const find = (kind: "new" | "full", iso: string) => events.find((e) => e.kind === kind && minutesApart(e.at, iso) < 24 * 60);

  it.each([
    ["full", "2026-01-03T10:03Z"],
    ["new", "2026-01-18T19:52Z"],
    ["full", "2026-09-26T16:49Z"],
    ["new", "2026-10-10T15:50Z"],
  ] as const)("finds the %s moon of %s within minutes", (kind, iso) => {
    const event = find(kind, iso);
    expect(event).toBeDefined();
    expect(minutesApart(event!.at, iso)).toBeLessThan(10);
  });

  it("has 12 or 13 full moons a year, alternating with new moons", () => {
    const fulls = events.filter((e) => e.kind === "full").length;
    expect(fulls === 12 || fulls === 13).toBe(true);
    for (let i = 1; i < events.length; i++) expect(events[i].kind).not.toBe(events[i - 1].kind);
  });

  it("puts the phase at 0.5 at the full moon", () => {
    expect(moonPhaseAt(new Date("2026-09-26T16:49Z"))).toBeCloseTo(0.5, 2);
    // At the new moon the phase wraps from just under 1 to 0: the same point on the circle.
    const atNew = moonPhaseAt(new Date("2026-10-10T15:50Z"));
    expect(Math.min(atNew, 1 - atNew)).toBeLessThan(0.01);
  });
});

describe("solstices and equinoxes", () => {
  it.each([
    ["march-equinox", "2026-03-20T14:46Z"],
    ["june-solstice", "2026-06-21T08:24Z"],
    ["september-equinox", "2026-09-23T00:05Z"],
    ["december-solstice", "2026-12-21T20:50Z"],
  ] as const)("finds the %s within minutes", (event, iso) => {
    expect(minutesApart(seasonEvent(2026, event), iso)).toBeLessThan(10);
  });
});
