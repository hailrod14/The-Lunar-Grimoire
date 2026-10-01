"use client";

import { useEffect } from "react";
import { dateKey, nowTime, type DateKey } from "./dates";
import { dueReminders, reminderMessage } from "./reminders";
import { getGrimoire } from "./store";

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
/** Only notify for potions that came due recently; older ones show on the Today card instead. */
const FRESH_MINUTES = 10;
const CHECK_EVERY_MS = 30_000;

const minutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3));

/** Which potions were already announced today (per browser; a convenience, so failures are harmless). */
function announced(day: DateKey): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(`lunar-grimoire:reminded:${day}`) ?? "[]"));
  } catch {
    return new Set();
  }
}
function remember(day: DateKey, ids: Set<string>) {
  try {
    localStorage.setItem(`lunar-grimoire:reminded:${day}`, JSON.stringify([...ids]));
  } catch {
    // Without storage we may notify twice; acceptable.
  }
}

export const notificationsSupported = () => typeof window !== "undefined" && "Notification" in window;

async function notify(title: string, body: string, tag: string) {
  const options = { body, tag, icon: `${base}/icons/icon-192.png`, badge: `${base}/icons/icon-192.png` };
  const registration = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
  if (registration) await registration.showNotification(title, options);
  else new Notification(title, options);
}

/** While the Grimoire is open, announce potions as they come due. */
export function useReminderNotifications(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const check = () => {
      if (!notificationsSupported() || Notification.permission !== "granted") return;
      const g = getGrimoire();
      if (!g) return; // Locked: say nothing until it's opened.
      const today = dateKey(new Date());
      const now = nowTime();
      const seen = announced(today);
      const fresh = dueReminders(g, today, now).filter(
        (p) => !seen.has(p.id) && minutes(now) - minutes(p.time) <= FRESH_MINUTES,
      );
      if (!fresh.length) return;
      fresh.forEach((p) => seen.add(p.id));
      remember(today, seen);
      const { title, body } = reminderMessage(fresh, g.settings.reminderNames);
      notify(title, body, `potions-${today}-${now}`).catch(() => {});
    };
    check();
    const timer = setInterval(check, CHECK_EVERY_MS);
    return () => clearInterval(timer);
  }, [enabled]);
}
