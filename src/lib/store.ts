"use client";

import { useSyncExternalStore } from "react";
import { deriveSeal, isSealed, openText, sealText, type Seal, type SealedGrimoire } from "./crypto";
import { STORAGE_KEY, loadGrimoire, readSealed, sanitizeGrimoire, saveGrimoire, writeStored, type LoadResult } from "./storage";
import { newGrimoire, type Grimoire } from "./types";

/*
 * The one live copy of the Grimoire in this tab. Components read it with
 * useGrimoireState() and change it with dispatch(). Every change is saved to
 * localStorage immediately, and other open tabs pick it up.
 *
 * With a PIN set, every save is encrypted with a key that exists only in
 * memory while unlocked. Locking forgets the key and the decrypted Grimoire.
 *
 * Alongside the Grimoire the store keeps one companion record for sync (its
 * key and the last copy both devices agreed on). It's saved and sealed the
 * same way, so with a PIN set it can't be read, or used, while locked.
 */

export type OpenState = {
  status: "open";
  grimoire: Grimoire;
  problem?: Extract<LoadResult, { status: "open" }>["problem"];
  /** The last save failed; changes exist only in memory until one succeeds. */
  saveFailed: boolean;
  /** A PIN is set, so saves are encrypted. */
  pinSet: boolean;
};
export type LockedState = { status: "locked"; sealed: SealedGrimoire };
export type StoreState = OpenState | LockedState;

export const SYNC_STORAGE_KEY = `${STORAGE_KEY}:sync`;

let state: StoreState | null = null;
/** The sync record (opaque here; sync.ts validates it). Null while locked or when sync is off. */
let companion: unknown = null;
let seal: Seal | null = null;
/** Encrypted saves run one after another so the newest always lands last. */
let saving: Promise<void> = Promise.resolve();
let hiddenAt = 0;
const listeners = new Set<() => void>();

function ensureLoaded(): StoreState {
  if (!state) {
    const loaded = loadGrimoire();
    state =
      loaded.status === "sealed"
        ? { status: "locked", sealed: loaded.sealed }
        : { status: "open", grimoire: loaded.grimoire, problem: loaded.problem, saveFailed: false, pinSet: false };
    if (state.status === "open") companion = readCompanionPlain();
  }
  return state;
}

// ── The companion (sync) record ──────────────────────────────

function readCompanionText(): string | null {
  try {
    return localStorage.getItem(SYNC_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** The companion record when no PIN is set (an unsealed save). */
function readCompanionPlain(): unknown {
  try {
    const value = JSON.parse(readCompanionText() ?? "null");
    return isSealed(value) ? null : value;
  } catch {
    return null;
  }
}

/** The companion record sealed with `key`, or null if there isn't one it opens. */
async function readCompanionSealed(key: CryptoKey): Promise<unknown> {
  try {
    const value = JSON.parse(readCompanionText() ?? "null");
    if (!isSealed(value)) return null;
    return JSON.parse(await openText(value, key));
  } catch {
    return null;
  }
}

/** Save the companion record (sealed when a PIN is set), after any save in progress. */
function persistCompanion(): Promise<void> {
  const value = companion;
  const key = seal;
  saving = saving.then(async () => {
    try {
      if (value === null) localStorage.removeItem(SYNC_STORAGE_KEY);
      else localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(key ? await sealText(JSON.stringify(value), key) : value));
    } catch {
      // Sync will set itself up again if this is lost.
    }
  });
  return saving;
}

/** The sync record, or null while locked or when sync isn't set up on this device. */
export const getCompanion = (): unknown => (ensureLoaded().status === "open" ? companion : null);

/** Replace the sync record (null removes it). Ignored while locked. */
export function setCompanion(value: unknown): Promise<void> {
  if (ensureLoaded().status !== "open") return Promise.resolve();
  companion = value;
  emit();
  return persistCompanion();
}

function emit() {
  for (const listener of listeners) listener();
}

function setOpen(patch: Partial<OpenState>) {
  const current = ensureLoaded();
  if (current.status === "open") {
    state = { ...current, ...patch };
    emit();
  }
}

/** Save `grimoire`, encrypted when a PIN is set. Returns once this save has landed. */
function persist(grimoire: Grimoire): Promise<void> {
  if (!seal) {
    const ok = saveGrimoire(grimoire);
    if (state?.status === "open" && state.saveFailed === ok) setOpen({ saveFailed: !ok });
    return Promise.resolve();
  }
  const key = seal;
  saving = saving.then(async () => {
    let ok = false;
    try {
      ok = writeStored(JSON.stringify(await sealText(JSON.stringify(grimoire), key)));
    } catch {
      ok = false;
    }
    if (state?.status === "open" && state.saveFailed === ok) setOpen({ saveFailed: !ok });
  });
  return saving;
}

/** Decrypt and validate a sealed Grimoire, or throw. */
async function openSealed(sealed: SealedGrimoire, key: CryptoKey): Promise<Grimoire> {
  const parsed = sanitizeGrimoire(JSON.parse(await openText(sealed, key)));
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.grimoire;
}

// ── Reading and changing ─────────────────────────────────────

/** Apply a change, e.g. dispatch((g) => beginTide(g, today)). Ignored while locked. */
export function dispatch(change: (g: Grimoire) => Grimoire) {
  const current = ensureLoaded();
  if (current.status !== "open") return;
  const grimoire = change(current.grimoire);
  if (grimoire === current.grimoire) return;
  state = { ...current, grimoire };
  emit();
  void persist(grimoire);
}

/** The current Grimoire outside React, or null while locked. */
export const getGrimoire = (): Grimoire | null => {
  const current = ensureLoaded();
  return current.status === "open" ? current.grimoire : null;
};

/** Replace everything, e.g. after importing a backup file. A PIN, if set, stays set. */
export const replaceGrimoire = (grimoire: Grimoire) => dispatch(() => grimoire);

/** Hide the "couldn't read your saved Grimoire" notice. */
export const dismissLoadProblem = () => setOpen({ problem: undefined });

// ── The PIN lock ─────────────────────────────────────────────

/** Try a PIN. Resolves true and opens the Grimoire if it's right. */
export async function unlock(pin: string): Promise<boolean> {
  const current = ensureLoaded();
  if (current.status !== "locked") return true;
  const attempt = await deriveSeal(pin, current.sealed.salt, current.sealed.rounds);
  let grimoire: Grimoire;
  try {
    grimoire = await openSealed(current.sealed, attempt.key);
  } catch {
    return false;
  }
  seal = attempt;
  companion = await readCompanionSealed(attempt.key);
  state = { status: "open", grimoire, saveFailed: false, pinSet: true };
  emit();
  return true;
}

/** Whether `pin` opens the currently saved Grimoire. */
async function pinMatches(pin: string): Promise<boolean> {
  const sealed = readSealed();
  if (!sealed) return false;
  try {
    await openText(sealed, (await deriveSeal(pin, sealed.salt, sealed.rounds)).key);
    return true;
  } catch {
    return false;
  }
}

/** Set a PIN: from now on the Grimoire is saved encrypted. */
export async function setPin(pin: string): Promise<void> {
  const current = ensureLoaded();
  if (current.status !== "open") return;
  seal = await deriveSeal(pin);
  await persist(current.grimoire);
  await persistCompanion();
  setOpen({ pinSet: true });
}

/** Change the PIN. Resolves false if the current PIN is wrong. */
export async function changePin(currentPin: string, newPin: string): Promise<boolean> {
  const current = ensureLoaded();
  if (current.status !== "open" || !(await pinMatches(currentPin))) return false;
  seal = await deriveSeal(newPin);
  await persist(current.grimoire);
  await persistCompanion();
  return true;
}

/** Remove the PIN and save unencrypted again. Resolves false if the PIN is wrong. */
export async function removePin(pin: string): Promise<boolean> {
  const current = ensureLoaded();
  if (current.status !== "open" || !(await pinMatches(pin))) return false;
  await saving;
  seal = null;
  await persist(current.grimoire);
  await persistCompanion();
  setOpen({ pinSet: false });
  return true;
}

/** Lock now: wait for any save in progress, then forget the key and the open Grimoire. */
export async function lockNow(): Promise<void> {
  if (!seal || ensureLoaded().status !== "open") return;
  await saving;
  const sealed = readSealed();
  if (!sealed) return; // Never lock without a sealed copy safely saved.
  seal = null;
  companion = null;
  state = { status: "locked", sealed };
  emit();
}

/** Erase everything, including any PIN. Used by "Start over" and a forgotten PIN. */
export async function eraseEverything(): Promise<void> {
  await saving;
  seal = null;
  const fresh = newGrimoire();
  saveGrimoire(fresh);
  companion = null;
  try {
    localStorage.removeItem(SYNC_STORAGE_KEY);
    for (const key of Object.keys(localStorage)) if (key.startsWith(`${STORAGE_KEY}:reminded:`)) localStorage.removeItem(key);
  } catch {
    // Reminder bookkeeping is harmless to leave behind.
  }
  state = { status: "open", grimoire: fresh, saveFailed: false, pinSet: false };
  emit();
}

// ── Other tabs, and locking when you leave ───────────────────

async function onStorage(e: StorageEvent) {
  if (e.key === SYNC_STORAGE_KEY) {
    if (ensureLoaded().status !== "open") return;
    companion = seal ? await readCompanionSealed(seal.key) : readCompanionPlain();
    emit();
    return;
  }
  if (e.key !== STORAGE_KEY || e.newValue === null) return;
  let value: unknown;
  try {
    value = JSON.parse(e.newValue);
  } catch {
    return;
  }
  if (isSealed(value)) {
    // Same PIN (same salt): follow the other tab's changes. A different PIN: lock.
    if (seal && value.salt === seal.salt) {
      try {
        setOpen({ grimoire: await openSealed(value, seal.key) });
      } catch {
        // Ignore a save we can't read; our own next save will win.
      }
    } else {
      seal = null;
      companion = null;
      state = { status: "locked", sealed: value };
      emit();
    }
    return;
  }
  const parsed = sanitizeGrimoire(value);
  if (!parsed.ok) return;
  seal = null; // Another tab removed the PIN.
  companion = readCompanionPlain();
  const current = ensureLoaded();
  state = current.status === "open" ? { ...current, grimoire: parsed.grimoire, pinSet: false } : { status: "open", grimoire: parsed.grimoire, saveFailed: false, pinSet: false };
  emit();
}

function onVisibility() {
  const current = ensureLoaded();
  if (!seal || current.status !== "open") return;
  const minutes = current.grimoire.settings.autoLockMinutes;
  if (document.hidden) {
    hiddenAt = Date.now();
    if (minutes === 0) void lockNow();
  } else if (Date.now() - hiddenAt >= minutes * 60_000) {
    void lockNow();
  }
}

/** Be told about every change: the Grimoire, locking, or the sync record. */
export function subscribe(listener: () => void) {
  if (listeners.size === 0) {
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisibility);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibility);
    }
  };
}

/**
 * The live store state: open (with the Grimoire) or locked. Null while
 * rendering on the server / before the browser has loaded storage.
 */
export function useGrimoireState(): StoreState | null {
  return useSyncExternalStore(subscribe, ensureLoaded, () => null);
}

export function useGrimoire(): Grimoire | null {
  const current = useGrimoireState();
  return current?.status === "open" ? current.grimoire : null;
}
