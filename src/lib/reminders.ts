import { addDaysKey, parseKey, type DateKey } from "./dates";
import { allDosesOn, describeSchedule, doseLog, type Dose } from "./potions";
import type { Grimoire, Potion } from "./types";

/*
 * Potion reminders. A website without a server can't wake a phone that has
 * the app closed, so reminders come two ways: notifications while the
 * Grimoire is open (or running in the background), and a calendar file whose
 * alarms the phone's own calendar delivers reliably.
 */

/** Doses with reminders on whose time has come today and that aren't checked off yet. */
export function dueReminders(g: Grimoire, today: DateKey, now: string): Dose[] {
  return allDosesOn(g, today).filter((d) => d.potion.reminder && d.time <= now && !doseLog(g.days[today], d.potion.id, d.slot));
}

/** Notification text. Without names, nothing about medications shows on a lock screen. */
export function reminderMessage(doses: Dose[], showNames: boolean): { title: string; body: string } {
  const potions: Potion[] = [...new Map(doses.map((d) => [d.potion.id, d.potion])).values()];
  if (!showNames) {
    return { title: "Potion time ✨", body: potions.length > 1 ? `${potions.length} potions await you.` : "A potion awaits you." };
  }
  const names = potions.map((p) => (p.dose ? `${p.name} (${p.dose})` : p.name));
  return { title: potions.length > 1 ? "Your potions await ✨" : `${potions[0].name} awaits ✨`, body: names.join(", ") };
}

// ── Calendar file (iCalendar, RFC 5545) ──────────────────────

/** Escape text for an iCalendar property value. */
const icsText = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, (c) => `\\${c}`);

/** Fold long lines at 74 characters, as the format requires. */
const fold = (line: string) => line.match(/.{1,74}/g)!.join("\r\n ");

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/**
 * A calendar file with one repeating event per reminded dose (daily, or on the
 * potion's weekdays), each with an alarm at the dose's time. Times are "floating" (local to wherever the phone is).
 */
export function remindersCalendar(g: Grimoire, today: DateKey, showNames: boolean, now = new Date()): string | null {
  const potions = g.potions.filter((p) => p.reminder && p.schedule !== "as-needed" && !p.archived && p.times.length);
  if (!potions.length) return null;
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//The Lunar Grimoire//Potion Reminders//EN", "CALSCALE:GREGORIAN"];
  for (const p of potions) {
    // Start on the first upcoming day the potion is actually taken.
    let first = addDaysKey(today, 1);
    if (p.schedule === "weekly") while (!p.days.includes(parseKey(first).getDay())) first = addDaysKey(first, 1);
    const rule = p.schedule === "weekly" ? `RRULE:FREQ=WEEKLY;BYDAY=${p.days.map((d) => BYDAY[d]).join(",")}` : "RRULE:FREQ=DAILY";
    const title = showNames ? `${p.name}${p.dose ? ` (${p.dose})` : ""}` : "Potion time ✨";
    p.times.forEach((time, slot) => {
      lines.push(
        "BEGIN:VEVENT",
        `UID:${p.id}-${slot}@lunar-grimoire`,
        `DTSTAMP:${stamp(now)}`,
        `DTSTART:${first.replace(/-/g, "")}T${time.replace(":", "")}00`,
        "DURATION:PT5M",
        rule,
        fold(`SUMMARY:${icsText(title)}`),
        fold(`DESCRIPTION:${icsText(`From The Lunar Grimoire · ${describeSchedule(p)}`)}`),
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        "TRIGGER:PT0M",
        fold(`DESCRIPTION:${icsText(title)}`),
        "END:VALARM",
        "END:VEVENT",
      );
    });
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

const BYDAY = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
