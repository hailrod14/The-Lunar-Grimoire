"use client";

import { useSyncExternalStore } from "react";
import { FIREBASE_CONFIG, SYNC_AVAILABLE } from "./firebase-config";
import { mergeGrimoires } from "./merge";
import { dispatch, getCompanion, getGrimoire, setCompanion, subscribe as subscribeStore } from "./store";
import { WrongKeyError } from "./sync-crypto";
import {
  RevisionConflict,
  createCloudCopy,
  joinCloudCopy,
  parseSyncRecord,
  syncOnce,
  type Cloud,
  type CloudDoc,
  type SyncIO,
  type SyncRecord,
} from "./sync-engine";
import type { Grimoire } from "./types";

/*
 * Sync across devices through Firebase: Google sign-in, and one encrypted
 * document per person in Firestore. Firebase is only downloaded once sync
 * is set up or someone opens the sync settings, so the app stays light.
 */

export type SyncPhase =
  | "unavailable" // this build has no Firebase project
  | "idle" // not started yet
  | "loading"
  | "signed-out"
  | "choose-passphrase" // signed in; no cloud copy yet
  | "enter-passphrase" // signed in; a cloud copy exists but this device doesn't have the key
  | "syncing"
  | "synced"
  | "offline"
  | "error";

export type SyncStatus = { phase: SyncPhase; email?: string; syncedAt?: string; message?: string };

let status: SyncStatus = { phase: SYNC_AVAILABLE ? "idle" : "unavailable" };
const listeners = new Set<() => void>();

function setStatus(next: Partial<SyncStatus>) {
  status = { ...status, ...next };
  for (const l of listeners) l();
}

export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    () => status,
    () => status,
  );
}

// ── Firebase, loaded on demand ───────────────────────────────

type Firebase = {
  auth: import("firebase/auth").Auth;
  authApi: typeof import("firebase/auth");
  cloud: Cloud;
};

let firebase: Promise<Firebase> | null = null;

const toBytes = (b: import("firebase/firestore/lite").Bytes) => b.toUint8Array();

function loadFirebase(): Promise<Firebase> {
  firebase ??= (async () => {
    const [{ initializeApp }, authApi, fs] = await Promise.all([
      import("firebase/app"),
      import("firebase/auth"),
      import("firebase/firestore/lite"),
    ]);
    const app = initializeApp(FIREBASE_CONFIG);
    const auth = authApi.getAuth(app);
    const db = fs.getFirestore(app);
    const ref = (uid: string) => fs.doc(db, "grimoires", uid);

    const cloud: Cloud = {
      async read(uid) {
        const snap = await fs.getDoc(ref(uid));
        if (!snap.exists()) return null;
        const d = snap.data();
        return { salt: d.salt, rounds: d.rounds, rev: d.rev, iv: toBytes(d.iv), data: toBytes(d.data) } satisfies CloudDoc;
      },
      async write(uid, doc, expectedRev) {
        await fs.runTransaction(db, async (tx) => {
          const snap = await tx.get(ref(uid));
          const current = snap.exists() ? (snap.data().rev as number) : 0;
          if (current !== expectedRev) throw new RevisionConflict();
          tx.set(ref(uid), {
            v: 1,
            salt: doc.salt,
            rounds: doc.rounds,
            iv: fs.Bytes.fromUint8Array(doc.iv),
            data: fs.Bytes.fromUint8Array(doc.data),
            rev: expectedRev + 1,
            updatedAt: fs.serverTimestamp(),
          });
        });
        return expectedRev + 1;
      },
      async remove(uid) {
        await fs.deleteDoc(ref(uid));
      },
    };
    return { auth, authApi, cloud };
  })();
  return firebase;
}

// ── Talking to the store ─────────────────────────────────────

const record = (): SyncRecord | null => parseSyncRecord(getCompanion());

function io(cloud: Cloud): SyncIO {
  return {
    cloud,
    local: () => getGrimoire()!,
    apply: (seen: Grimoire, merged: Grimoire) => dispatch((current) => (current === seen ? merged : mergeGrimoires(seen, current, merged))),
    record,
    saveRecord: (r) => setCompanion(r),
    now: () => new Date().toISOString(),
  };
}

let uid: string | null = null;

function friendly(e: unknown): string {
  const code = (e as { code?: string })?.code ?? "";
  if (code.includes("network") || code === "unavailable") return "Couldn't reach the sync server. Check your connection.";
  if (code === "permission-denied") return "The sync server refused access. Try signing out and in again.";
  if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return "Sign-in was closed before it finished.";
  if (code === "auth/unauthorized-domain") return "This web address isn't allowed to sign in yet (add it in Firebase → Authentication → Settings).";
  if (e instanceof WrongKeyError) return e.message;
  return e instanceof Error ? e.message : "Something went wrong while syncing.";
}

// ── The sync loop ────────────────────────────────────────────

let running: Promise<void> | null = null;
let again = false;
let timer: ReturnType<typeof setTimeout> | undefined;

/** Sync now (or right after the sync already in progress). */
export function syncNow(): Promise<void> {
  if (running) {
    again = true;
    return running;
  }
  running = (async () => {
    do {
      again = false;
      await runOnce();
    } while (again);
  })().finally(() => {
    running = null;
  });
  return running;
}

async function runOnce() {
  if (!uid || !record() || !getGrimoire()) return;
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    setStatus({ phase: "offline", message: undefined });
    return;
  }
  setStatus({ phase: "syncing", message: undefined });
  try {
    const { cloud } = await loadFirebase();
    const outcome = await syncOnce(io(cloud));
    if (outcome === "synced") setStatus({ phase: "synced", syncedAt: record()?.syncedAt });
    else if (outcome === "needs-passphrase") {
      await setCompanion(null);
      setStatus({ phase: "enter-passphrase", message: "Your sync passphrase was changed on another device. Enter the new one." });
    } else if (outcome === "cloud-gone") {
      await setCompanion(null);
      setStatus({ phase: "choose-passphrase", message: "The synced copy was deleted from another device. This device kept its own Grimoire." });
    }
  } catch (e) {
    setStatus({ phase: navigator.onLine ? "error" : "offline", message: friendly(e) });
  }
}

/** Sync a moment after changes stop, so a burst of taps is one upload. */
function scheduleSync(delay = 2000) {
  clearTimeout(timer);
  timer = setTimeout(() => void syncNow(), delay);
}

// ── Starting up ──────────────────────────────────────────────

let started = false;
let lastGrimoire: Grimoire | null = null;
let lastCompanion: unknown = null;

/** What to show once we know who's signed in. */
async function settle() {
  const { cloud } = await loadFirebase();
  if (!uid) return setStatus({ phase: "signed-out" });
  const rec = record();
  if (rec && rec.uid !== uid) await setCompanion(null); // a different account signed in
  if (record()) return void syncNow();
  const doc = await cloud.read(uid);
  setStatus({ phase: doc ? "enter-passphrase" : "choose-passphrase" });
}

/**
 * Begin syncing if it's set up on this device; otherwise just learn who's
 * signed in when the sync settings are opened. Safe to call repeatedly.
 */
export async function startSync(eager: boolean) {
  if (!SYNC_AVAILABLE || started) return;
  if (!eager && !record()) return; // don't download Firebase until it's wanted
  started = true;
  setStatus({ phase: "loading" });
  try {
    const { auth, authApi } = await loadFirebase();
    await authApi.getRedirectResult(auth).catch(() => null);
    authApi.onAuthStateChanged(auth, (user) => {
      uid = user?.uid ?? null;
      setStatus({ email: user?.email ?? undefined, message: undefined });
      settle().catch((e) => setStatus({ phase: "error", message: friendly(e) }));
    });
  } catch (e) {
    started = false;
    setStatus({ phase: "error", message: friendly(e) });
    return;
  }

  // Sync after local changes; pause while locked; catch up when the app comes back.
  subscribeStore(() => {
    const g = getGrimoire();
    const c = getCompanion();
    if (g && g !== lastGrimoire && lastGrimoire) scheduleSync();
    if (c !== lastCompanion && c && !lastCompanion && g) scheduleSync(0); // unlocked again
    lastGrimoire = g;
    lastCompanion = c;
  });
  lastGrimoire = getGrimoire();
  lastCompanion = getCompanion();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") scheduleSync(0);
    else if (timer) {
      clearTimeout(timer);
      void syncNow(); // don't leave changes behind when switching away
    }
  });
  window.addEventListener("online", () => scheduleSync(0));
  setInterval(() => {
    if (document.visibilityState === "visible") void syncNow();
  }, 60_000);
}

// ── Actions for the settings screen ──────────────────────────

export async function signIn() {
  const { auth, authApi } = await loadFirebase();
  const provider = new authApi.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  try {
    await authApi.signInWithPopup(auth, provider);
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment") {
      await authApi.signInWithRedirect(auth, provider);
      return;
    }
    setStatus({ message: friendly(e) });
  }
}

/** Use a new passphrase: this device's Grimoire becomes the synced copy. */
export async function choosePassphrase(passphrase: string) {
  const { cloud } = await loadFirebase();
  if (!uid) return;
  setStatus({ phase: "syncing", message: undefined });
  try {
    await createCloudCopy(io(cloud), uid, passphrase);
    setStatus({ phase: "synced", syncedAt: record()?.syncedAt });
  } catch (e) {
    if (e instanceof RevisionConflict) {
      setStatus({ phase: "enter-passphrase", message: "Another device just started syncing. Enter the passphrase you chose there." });
    } else setStatus({ phase: "choose-passphrase", message: friendly(e) });
  }
}

/**
 * Open the synced copy on this device. `adopt` replaces this device's
 * Grimoire (a fresh install); otherwise both are combined. Resolves false on a wrong passphrase.
 */
export async function enterPassphrase(passphrase: string, adopt: boolean): Promise<boolean> {
  const { cloud } = await loadFirebase();
  if (!uid) return false;
  setStatus({ phase: "syncing", message: undefined });
  try {
    const outcome = await joinCloudCopy(io(cloud), uid, passphrase, adopt);
    if (outcome === "cloud-gone") setStatus({ phase: "choose-passphrase" });
    else setStatus({ phase: "synced", syncedAt: record()?.syncedAt });
    return true;
  } catch (e) {
    setStatus({ phase: "enter-passphrase", message: e instanceof WrongKeyError ? undefined : friendly(e) });
    if (e instanceof WrongKeyError) return false;
    return true;
  }
}

/** Stop syncing on this device and sign out. The Grimoire stays here, and in the cloud. */
export async function stopSyncing() {
  const { auth, authApi } = await loadFirebase();
  await setCompanion(null);
  await authApi.signOut(auth);
}

/** Delete the cloud copy. Every device keeps its own Grimoire. */
export async function deleteCloudCopy() {
  const { cloud } = await loadFirebase();
  if (!uid) return;
  await cloud.remove(uid);
  await setCompanion(null);
  setStatus({ phase: "choose-passphrase", message: undefined });
}
