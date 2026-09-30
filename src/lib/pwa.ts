"use client";

import { useSyncExternalStore } from "react";

/*
 * Installing the Grimoire as an app, and keeping it available offline.
 */

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Register the service worker (production builds only; it would cache stale code during development). */
export async function registerServiceWorker() {
  if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.register(`${base}/sw.js`, { scope: `${base}/` });
    const worker = registration.active ?? (await navigator.serviceWorker.ready).active;
    // Hand over everything this page already loaded so it works offline from the first visit.
    const urls = performance.getEntriesByType("resource").map((e) => e.name);
    worker?.postMessage({ type: "precache", urls: [...urls, location.href] });
  } catch {
    // Offline support is a bonus; the app works without it.
  }
}

// ── The browser's install offer (Chrome, Edge, Android) ──────

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Start listening early, before Settings is open, since the offer can arrive at load. */
export function listenForInstallPrompt() {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as InstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    emit();
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Whether the browser is offering a one-tap install right now. */
export const useCanInstall = () => useSyncExternalStore(subscribe, () => deferred !== null, () => false);

export async function promptInstall() {
  if (!deferred) return;
  await deferred.prompt();
  await deferred.userChoice;
  deferred = null;
  emit();
}

/** True when running as an installed app rather than in a browser tab. */
export function isInstalled(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** iPhone and iPad install through Safari's Share menu instead of a prompt. */
export function isAppleMobile(): boolean {
  return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}
