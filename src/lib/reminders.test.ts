import { describe, expect, it } from "vitest";
import { dueReminders, reminderMessage, remindersCalendar } from "./reminders";
import { emptyDay, newGrimoire, type Grimoire, type Potion } from "./types";

const potion = (over: Partial<Potion>): Potion => ({
  id: "p",
  name: "Iron Tincture",
  dose: "1 dropper",
  time: "09:00",
  vessel: "dropper",
  color: "rose",
  schedule: "daily",
  archived: false,
  reminder: true,
  ...over,
});

function grimoire(): Grimoire {
  const g = newGrimoire();
  g.potions = [
    potion({ id: "iron" }),
    potion({ id: "mag", name: "Magnesium; calm, sleep", time: "20:00" }),
    potion({ id: "quiet", reminder: false }),
    potion({ id: "asneeded", schedule: "as-needed", time: "" }),
    potion({ id: "retired", archived: true }),
  ];
  return g;
}

describe("dueReminders", () => {
  it("returns reminded daily potions whose time has passed", () => {
    expect(dueReminders(grimoire(), "2026-09-30", "08:59").map((p) => p.id)).toEqual([]);
    expect(dueReminders(grimoire(), "2026-09-30", "09:00").map((p) => p.id)).toEqual(["iron"]);
    expect(dueReminders(grimoire(), "2026-09-30", "21:00").map((p) => p.id)).toEqual(["iron", "mag"]);
  });

  it("skips potions already checked off today (but not extra doses)", () => {
    const g = grimoire();
    const day = emptyDay();
    day.potionLogs.push({ id: "a", potionId: "iron", name: "Iron", dose: "", time: "09:02", extra: false });
    day.potionLogs.push({ id: "b", potionId: "mag", name: "Mag", dose: "", time: "12:00", extra: true });
    g.days["2026-09-30"] = day;
    expect(dueReminders(g, "2026-09-30", "21:00").map((p) => p.id)).toEqual(["mag"]);
  });
});

describe("reminderMessage", () => {
  it("keeps medication names off the lock screen unless allowed", () => {
    const due = dueReminders(grimoire(), "2026-09-30", "21:00");
    expect(reminderMessage(due, false)).toEqual({ title: "Potion time ✨", body: "2 potions await you." });
    expect(reminderMessage(due.slice(0, 1), true)).toEqual({ title: "Iron Tincture awaits ✨", body: "Iron Tincture (1 dropper)" });
  });
});

describe("remindersCalendar", () => {
  const now = new Date("2026-09-30T12:00:00Z");

  it("makes one daily event with an alarm per reminded potion", () => {
    const ics = remindersCalendar(grimoire(), "2026-09-30", true, now)!;
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(ics).toContain("DTSTART:20261001T090000\r\n");
    expect(ics).toContain("DTSTART:20261001T200000\r\n");
    expect(ics).toContain("RRULE:FREQ=DAILY\r\n");
    expect(ics).toContain("DTSTAMP:20260930T120000Z\r\n");
    expect(ics).toContain(String.raw`SUMMARY:Magnesium\; calm\, sleep (1 dropper)` + "\r\n");
    expect(ics.match(/BEGIN:VALARM/g)).toHaveLength(2);
  });

  it("uses a generic title when names are hidden", () => {
    const ics = remindersCalendar(grimoire(), "2026-09-30", false, now)!;
    expect(ics).not.toContain("Iron");
    expect(ics).toContain("SUMMARY:Potion time ✨");
  });

  it("keeps every line within the length limit", () => {
    const g = grimoire();
    g.potions[0].name = "A very long potion name ".repeat(6);
    const ics = remindersCalendar(g, "2026-09-30", true, now)!;
    expect(ics.split("\r\n").every((l) => l.length <= 75)).toBe(true);
  });

  it("returns nothing when no potion has a reminder", () => {
    const g = grimoire();
    g.potions = g.potions.map((p) => ({ ...p, reminder: false }));
    expect(remindersCalendar(g, "2026-09-30", true, now)).toBeNull();
  });
});
