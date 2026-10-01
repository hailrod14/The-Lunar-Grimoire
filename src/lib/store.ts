"use client";

import { useSyncExternalStore } from "react";
import { STORAGE_KEY, loadGrimoire, saveGrimoire, type LoadResult } from "./storage";
import type { Grimoire } from "./types";

/*
 * The one live copy of the Grimoire in this tab. Components read it with
 * useGrimoire() and change it with dispatch(). Every change is saved to
 * localStorage immediately, and other open tabs pick it up.
 */

type State = {
  grimoire: Grimoire;
  problem?: LoadResult["problem"];
  /** The last save failed; changes exist only in memory until one succeeds. */
  saveFailed: boolean;
};

let state: State | null = null;
const listeners = new Set<() => void>();

function ensureLoaded(): State {
  if (!state) {
    const { grimoire, problem } = loadGrimoire();
    state = { grimoire, problem, saveFailed: false };
  }
  return state;
}

function emit() {
  for (const listener of listeners) listener();
}

function onStorage(e: StorageEvent) {
  if (e.key !== STORAGE_KEY) return;
  const { grimoire } = loadGrimoire();
  state = { ...ensureLoaded(), grimoire };
  emit();
}

function subscribe(listener: () => void) {
  if (listeners.size === 0) window.addEventListener("storage", onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

/** Apply a change, e.g. dispatch((g) => beginTide(g, today)). */
export function dispatch(change: (g: Grimoire) => Grimoire) {
  const current = ensureLoaded();
  const grimoire = change(current.grimoire);
  if (grimoire === current.grimoire) return;
  state = { ...current, grimoire, saveFailed: !saveGrimoire(grimoire) };
  emit();
}

/** The current Grimoire outside React (e.g. to check a setting from an event handler). */
export const getGrimoire = (): Grimoire => ensureLoaded().grimoire;

/** Replace everything, e.g. after importing a backup file. */
export const replaceGrimoire = (grimoire: Grimoire) => dispatch(() => grimoire);

/** Hide the "couldn't read your saved Grimoire" notice. */
export function dismissLoadProblem() {
  const current = ensureLoaded();
  state = { ...current, problem: undefined };
  emit();
}

/**
 * The live Grimoire state. Null while rendering on the server / before the
 * browser has loaded storage, so screens can show a loading state.
 */
export function useGrimoireState(): State | null {
  return useSyncExternalStore(subscribe, ensureLoaded, () => null);
}

export function useGrimoire(): Grimoire | null {
  return useGrimoireState()?.grimoire ?? null;
}
