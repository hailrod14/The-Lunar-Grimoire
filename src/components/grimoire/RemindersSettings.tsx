"use client";

import { useState } from "react";
import { CalendarPlus } from "lucide-react";
import { formatHHMM, type DateKey } from "@/lib/dates";
import { savePotion, updateSettings } from "@/lib/grimoire";
import { isAppleMobile, isInstalled } from "@/lib/pwa";
import { remindersCalendar } from "@/lib/reminders";
import { dispatch } from "@/lib/store";
import type { Grimoire } from "@/lib/types";
import { notificationsSupported } from "@/lib/useReminders";
import { Choice } from "./Controls";
import { Section } from "./Section";

function download(text: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function RemindersSettings({ g, today }: { g: Grimoire; today: DateKey }) {
  const [permission, setPermission] = useState(() => (notificationsSupported() ? Notification.permission : "unsupported"));
  const [saved, setSaved] = useState(false);
  const daily = g.potions.filter((p) => p.schedule === "daily" && !p.archived);
  const reminded = daily.filter((p) => p.reminder);
  const showNames = g.settings.reminderNames;

  return (
    <Section title="Potion reminders">
      <p className="font-journal text-lg text-silver-300">
        The Grimoire reminds you while it&apos;s open. For reminders when it&apos;s closed, add them to your phone&apos;s calendar.
      </p>

      {daily.length === 0 ? (
        <p className="font-journal text-lg text-silver-500">Brew a daily potion in the Cabinet to set reminders.</p>
      ) : (
        <ul className="space-y-1">
          {daily.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                aria-pressed={p.reminder}
                onClick={() => dispatch((x) => savePotion(x, { ...p, reminder: !p.reminder }))}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${p.reminder ? "bg-violet-500 text-violet-100" : "bg-midnight-950 text-silver-500"}`}
              >
                <span>{p.name}</span>
                <span className="font-journal text-lg">{p.reminder ? `🔔 ${formatHHMM(p.time)}` : "off"}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="pt-1 text-sm text-silver-300">What reminders say</p>
      <Choice selected={!showNames} onClick={() => dispatch((x) => updateSettings(x, { reminderNames: false }))}>
        “Potion time ✨” (private on a lock screen)
      </Choice>
      <Choice selected={showNames} onClick={() => dispatch((x) => updateSettings(x, { reminderNames: true }))}>
        The potion&apos;s name and dose
      </Choice>

      <p className="pt-1 text-sm text-silver-300">While the Grimoire is open</p>
      {permission === "granted" ? (
        <p className="font-journal text-lg text-silver-300">✓ Notifications are on.</p>
      ) : permission === "denied" ? (
        <p className="font-journal text-lg text-silver-500">Notifications are blocked. You can allow them in your browser&apos;s site settings.</p>
      ) : permission === "unsupported" ? (
        <p className="font-journal text-lg text-silver-500">
          {isAppleMobile() && !isInstalled()
            ? "On iPhone and iPad, notifications work once the Grimoire is added to your home screen."
            : "This browser can't show notifications. The calendar option below still works."}
        </p>
      ) : (
        <button
          type="button"
          onClick={async () => setPermission(await Notification.requestPermission())}
          className="pixel-button pixel-button--ghost"
        >
          🔔 Allow notifications
        </button>
      )}

      <p className="pt-1 text-sm text-silver-300">Even when it&apos;s closed</p>
      <button
        type="button"
        disabled={reminded.length === 0}
        onClick={() => {
          const ics = remindersCalendar(g, today, showNames);
          if (!ics) return;
          download(ics, "lunar-grimoire-reminders.ics", "text/calendar");
          setSaved(true);
        }}
        className="pixel-button pixel-button--gold disabled:opacity-40"
      >
        <CalendarPlus size={16} /> Add to my calendar
      </button>
      <p className="font-journal text-base text-silver-500">
        {reminded.length === 0
          ? "Turn on a reminder above first."
          : saved
            ? "Open the downloaded file to add the reminders to your calendar. If you change potions or times later, add it again and remove the old events."
            : `Adds ${reminded.length} daily event${reminded.length === 1 ? "" : "s"} with an alarm at each potion's time.`}
      </p>
    </Section>
  );
}
