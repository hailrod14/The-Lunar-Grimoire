import { addDaysKey, formatHHMM, type DateKey } from "./dates";
import type { Grimoire, Potion } from "./types";

/*
 * Potion reminders. A website without a server can't wake a phone that has
 * the app closed, so reminders come two ways: notifications while the
 * Grimoire is open (or running in the background), and a calendar file whose
 * alarms the phone's own calendar delivers reliably.
 */

/** Daily potions with reminders on whose time has come today and that aren't checked off yet. */
export function dueReminders(g: Grimoire, today: DateKey, now: string): Potion[] {
  const taken = new Set((g.days[today]?.potionLogs ?? []).filter((l) => !l.extra).map((l) => l.potionId));
  return g.potions.filter((p) => p.reminder && p.schedule === "daily" && !p.archived && p.time && p.time <= now && !taken.has(p.id));
}

/** Notification text. Without names, nothing about medications shows on a lock screen. */
export function reminderMessage(potions: Potion[], showNames: boolean): { title: string; body: string } {
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
 * A calendar file with one daily repeating event per reminded potion, each with
 * an alarm at the potion's time. Times are "floating" (local to wherever the phone is).
 */
export function remindersCalendar(g: Grimoire, today: DateKey, showNames: boolean, now = new Date()): string | null {
  const potions = g.potions.filter((p) => p.reminder && p.schedule === "daily" && !p.archived && p.time);
  if (!potions.length) return null;
  const start = addDaysKey(today, 1).replace(/-/g, "");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//The Lunar Grimoire//Potion Reminders//EN", "CALSCALE:GREGORIAN"];
  for (const p of potions) {
    const time = p.time.replace(":", "") + "00";
    const title = showNames ? `${p.name}${p.dose ? ` (${p.dose})` : ""}` : "Potion time ✨";
    lines.push(
      "BEGIN:VEVENT",
      `UID:${p.id}@lunar-grimoire`,
      `DTSTAMP:${stamp(now)}`,
      `DTSTART:${start}T${time}`,
      "DURATION:PT5M",
      "RRULE:FREQ=DAILY",
      fold(`SUMMARY:${icsText(title)}`),
      fold(`DESCRIPTION:${icsText(`From The Lunar Grimoire · daily at ${formatHHMM(p.time)}`)}`),
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      "TRIGGER:PT0M",
      fold(`DESCRIPTION:${icsText(title)}`),
      "END:VALARM",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}
