"use client";

import { useState } from "react";
import { CalendarPlus } from "lucide-react";
import { formatHHMM, type DateKey } from "@/lib/dates";
import { savePotion, updateSettings } from "@/lib/grimoire";
import { isAppleMobile, isInstalled } from "@/lib/pwa";
import { remindersCalendar } from "@/lib/reminders";
import { dispatch } from "@/lib/store";
import type { Grimoire } from "@/lib/types";
import { disablePush, enablePush, pushSupported, ringTimes, usePushEnabled } from "@/lib/push";
import { PUSH_AVAILABLE } from "@/lib/push-config";
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
  const daily = g.potions.filter((p) => p.schedule !== "as-needed" && !p.archived);
  const reminded = daily.filter((p) => p.reminder);
  const showNames = g.settings.reminderNames;
  const pushOn = usePushEnabled();
  const [pushProblem, setPushProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <Section title="Potion reminders">
      <p className="font-journal text-lg text-silver-300">
        {PUSH_AVAILABLE
          ? "Turn on home-screen reminders below and this device is reminded at each time, even with the Grimoire closed."
          : "The Grimoire reminds you while it's open. For reminders when it's closed, add them to your phone's calendar."}
      </p>

      {daily.length === 0 ? (
        <p className="font-journal text-lg text-silver-500">Brew a scheduled potion in the Cabinet to set reminders.</p>
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
                <span className="font-journal text-lg">{p.reminder ? `🔔 ${p.times.map(formatHHMM).join(", ")}` : "off"}</span>
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

      {PUSH_AVAILABLE && (
        <div className="space-y-2 bg-midnight-950 p-3">
          <p className="text-sm text-silver-100">🔔 Home-screen reminders on this device</p>
          {!pushSupported() ? (
            <p className="font-journal text-lg text-silver-500">
              {isAppleMobile() && !isInstalled()
                ? "On iPhone and iPad, add the Grimoire to your home screen first."
                : "This browser can't receive reminders while closed. The calendar option below still works."}
            </p>
          ) : pushOn ? (
            <>
              <p className="font-journal text-lg text-silver-300">
                ✓ On. {reminded.length ? `Rings at ${ringTimes(g)}, unless you've already checked the dose off.` : "Turn on a reminder above to choose when it rings."}
              </p>
              <button type="button" onClick={() => void disablePush()} className="pixel-button pixel-button--ghost">
                Turn off on this device
              </button>
            </>
          ) : (
            <>
              <p className="font-journal text-base text-silver-500">
                A small reminder service learns only the times to ring, never what your potions are. Turn this on for each device you want
                reminded.
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  setPushProblem(await enablePush());
                  setBusy(false);
                  setPermission(notificationsSupported() ? Notification.permission : "unsupported");
                }}
                className="pixel-button pixel-button--gold disabled:opacity-40"
              >
                🔔 Remind me here, even when closed
              </button>
            </>
          )}
          {pushProblem && (
            <p role="alert" className="font-journal text-lg text-gold-300">
              {pushProblem}
            </p>
          )}
        </div>
      )}

      {!(PUSH_AVAILABLE && pushOn) && <p className="pt-1 text-sm text-silver-300">While the Grimoire is open</p>}
      {PUSH_AVAILABLE && pushOn ? null : permission === "granted" ? (
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

      <p className="pt-1 text-sm text-silver-300">{PUSH_AVAILABLE ? "Or in your phone's calendar" : "Even when it's closed"}</p>
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
            : `Adds a repeating event with an alarm for each reminded dose (${reminded.reduce((n, p) => n + p.times.length, 0)} in all).`}
      </p>
    </Section>
  );
}
