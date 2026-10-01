"use client";

import { useEffect, useSyncExternalStore } from "react";
import { formatHHMM, type DateKey } from "./dates";
import { updateSettings } from "./grimoire";
import { allDosesOn, doseLog } from "./potions";
import { PUSH_AVAILABLE, PUSH_URL, VAPID_PUBLIC_KEY } from "./push-config";
import { dispatch, getGrimoire } from "./store";
import type { Grimoire } from "./types";

/*
 * Home-screen reminders: a tiny server (see /push) rings this device at each
 * reminder time with a contentless push, even when the Grimoire is closed.
 * The server knows only times and opaque ids (potion id + dose number); the
 * notification's words come from this device (see public/sw.js).
 */

const DEVICE_KEY = "lunar-grimoire:push-device";
const SENT_KEY = "lunar-grimoire:push-sent";
/** Where the service worker finds potion names, only if names are allowed in reminders. */
const LABELS_CACHE = "lunar-grimoire-labels";

const randomId = () => btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(18)))).replace(/\+/g, "-").replace(/\//g, "_");

export const pushSupported = () =>
  PUSH_AVAILABLE && typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

// ── Whether this device rings ────────────────────────────────

/** This device's id, whether it rings, and the group it last joined. */
type DeviceState = { device: string; enabled: boolean; group?: string };
const listeners = new Set<() => void>();
let cached: DeviceState | null = null;

function readDevice(): DeviceState {
  if (cached) return cached;
  try {
    cached = JSON.parse(localStorage.getItem(DEVICE_KEY) ?? "null") ?? { device: randomId(), enabled: false };
  } catch {
    cached = { device: randomId(), enabled: false };
  }
  return cached!;
}
function writeDevice(next: DeviceState) {
  cached = next;
  try {
    localStorage.setItem(DEVICE_KEY, JSON.stringify(next));
  } catch {
    // It still works for this visit.
  }
  listeners.forEach((l) => l());
}

export const pushEnabledHere = () => typeof window !== "undefined" && readDevice().enabled;

export function usePushEnabled(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    () => readDevice().enabled,
    () => false,
  );
}

async function post(path: string, body: unknown) {
  const response = await fetch(`${PUSH_URL}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error(`The reminder bell answered ${response.status}.`);
}

const base64ToBytes = (b64url: string) => Uint8Array.from(atob(b64url.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

/** Ask for permission, subscribe this device, and send the schedule. Resolves to a problem to show, or null. */
export async function enablePush(): Promise<string | null> {
  if (!pushSupported()) return "This browser can't receive reminders while closed.";
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return "Notifications are blocked. Allow them in your browser's site settings, then try again.";
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64ToBytes(VAPID_PUBLIC_KEY) }));
    let g = getGrimoire();
    if (!g) return "Open the Grimoire first.";
    if (!g.settings.pushGroup) {
      const pushGroup = randomId();
      dispatch((x) => updateSettings(x, { pushGroup }));
      g = getGrimoire()!;
    }
    const { device } = readDevice();
    await post("/subscribe", { device, group: g.settings.pushGroup, endpoint: subscription.endpoint });
    writeDevice({ device, enabled: true, group: g.settings.pushGroup });
    forgetSent();
    await syncPush(g);
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : "Couldn't set up reminders. Try again in a moment.";
  }
}

export async function disablePush() {
  const { device } = readDevice();
  writeDevice({ device, enabled: false });
  try {
    const registration = await navigator.serviceWorker.ready;
    await (await registration.pushManager.getSubscription())?.unsubscribe();
    await post("/unsubscribe", { device });
  } catch {
    // The server forgets dead subscriptions on its own.
  }
}

// ── Keeping the bell's schedule current ──────────────────────

const key = (potionId: string, slot: number) => `${potionId}:${slot}`;

/** Reminder times only: no names, no doses. */
export function reminderSchedule(g: Grimoire) {
  return g.potions
    .filter((p) => p.reminder && !p.archived && p.schedule !== "as-needed")
    .flatMap((p) => p.times.map((time, slot) => ({ k: key(p.id, slot), time, days: p.schedule === "weekly" ? p.days : [] })))
    .sort((a, b) => (a.k < b.k ? -1 : 1));
}

/** Today's reminded doses already checked off (on any device, once synced). */
export const takenToday = (g: Grimoire, today: DateKey) =>
  allDosesOn(g, today)
    .filter((d) => d.potion.reminder && doseLog(g.days[today], d.potion.id, d.slot))
    .map((d) => key(d.potion.id, d.slot))
    .sort();

function lastSent(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(SENT_KEY) ?? "{}");
  } catch {
    return {};
  }
}
function rememberSent(kind: string, value: string) {
  try {
    localStorage.setItem(SENT_KEY, JSON.stringify({ ...lastSent(), [kind]: value }));
  } catch {
    // We'll just send again next time.
  }
}
function forgetSent() {
  try {
    localStorage.removeItem(SENT_KEY);
  } catch {
    // Harmless.
  }
}

/** The names the service worker may show, kept on this device only, and only when allowed. */
async function updateLabels(g: Grimoire) {
  if (!("caches" in window)) return;
  if (!g.settings.reminderNames) {
    await caches.delete(LABELS_CACHE);
    return;
  }
  const labels = g.potions
    .filter((p) => p.reminder && !p.archived)
    .flatMap((p) => p.times.map((time) => ({ time, days: p.schedule === "weekly" ? p.days : [], label: p.dose ? `${p.name} (${p.dose})` : p.name })));
  const cache = await caches.open(LABELS_CACHE);
  await cache.put("labels.json", new Response(JSON.stringify(labels), { headers: { "Content-Type": "application/json" } }));
}

/** Send the schedule and today's check-offs to the bell, if they changed. */
export async function syncPush(g: Grimoire, today?: DateKey) {
  if (!pushEnabledHere() || !g.settings.pushGroup) return;
  // Two devices set up at once and sync settled on the other's group: join it.
  const here = readDevice();
  if (here.group !== g.settings.pushGroup) {
    const subscription = await (await navigator.serviceWorker.ready).pushManager.getSubscription();
    if (!subscription) return writeDevice({ ...here, enabled: false });
    await post("/subscribe", { device: here.device, group: g.settings.pushGroup, endpoint: subscription.endpoint });
    writeDevice({ ...here, group: g.settings.pushGroup });
    forgetSent();
  }
  const sent = lastSent();
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const schedule = JSON.stringify({ tz, reminders: reminderSchedule(g) });
  if (sent.schedule !== schedule) {
    await post("/schedule", { group: g.settings.pushGroup, ...JSON.parse(schedule) });
    rememberSent("schedule", schedule);
  }
  if (today) {
    const taken = JSON.stringify({ date: today, keys: takenToday(g, today) });
    if (sent.taken !== taken) {
      await post("/taken", { group: g.settings.pushGroup, ...JSON.parse(taken) });
      rememberSent("taken", taken);
    }
  }
  await updateLabels(g).catch(() => {});
}

/** Keep the bell up to date whenever potions, reminders, or today's check-offs change. */
export function usePushSync(g: Grimoire | null, today: DateKey | null) {
  const enabled = usePushEnabled();
  const schedule = g ? JSON.stringify(reminderSchedule(g)) : "";
  const taken = g && today ? takenToday(g, today).join(",") : "";
  const names = g?.settings.reminderNames;
  const group = g?.settings.pushGroup;
  useEffect(() => {
    if (!enabled || !group) return;
    const timer = setTimeout(() => {
      const current = getGrimoire();
      if (current) syncPush(current, today ?? undefined).catch(() => {});
    }, 1500);
    return () => clearTimeout(timer);
  }, [enabled, group, schedule, taken, names, today]);
}

/** "9:00 am, 9:00 pm" for showing which times will ring. */
export const ringTimes = (g: Grimoire) => [...new Set(reminderSchedule(g).map((r) => r.time))].sort().map(formatHHMM).join(", ");
