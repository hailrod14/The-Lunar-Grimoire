import { deepEqual, mergeGrimoires } from "./merge";
import { sanitizeGrimoire } from "./storage";
import { WrongKeyError, deriveSyncKey, openFromCloud, sealForCloud, type CloudSeal, type SyncKey } from "./sync-crypto";
import type { Grimoire } from "./types";

/*
 * The sync protocol, independent of any particular server. The cloud holds
 * one encrypted copy per person with a revision number; every write says
 * which revision it builds on, so two devices can never overwrite each
 * other's changes unseen: the later one re-reads, merges, and tries again.
 */

export type CloudDoc = CloudSeal & { salt: string; rounds: number; rev: number };

export class RevisionConflict extends Error {}

export interface Cloud {
  read(uid: string): Promise<CloudDoc | null>;
  /** Write a new copy if the cloud is still at `expectedRev` (0 = no copy yet). Resolves to the new revision. */
  write(uid: string, doc: Omit<CloudDoc, "rev">, expectedRev: number): Promise<number>;
  remove(uid: string): Promise<void>;
}

/** What a device remembers about sync. `base` is the copy it last agreed with the cloud on. */
export type SyncRecord = { uid: string; key: SyncKey; base: Grimoire | null; baseRev: number; syncedAt: string };

export function isSyncRecord(v: unknown): v is SyncRecord {
  const r = v as SyncRecord;
  return (
    typeof r === "object" &&
    r !== null &&
    typeof r.uid === "string" &&
    typeof r.key?.raw === "string" &&
    typeof r.key.salt === "string" &&
    typeof r.key.rounds === "number" &&
    typeof r.baseRev === "number" &&
    typeof r.syncedAt === "string"
  );
}

/** Read a stored record, validating its base copy. */
export function parseSyncRecord(v: unknown): SyncRecord | null {
  if (!isSyncRecord(v)) return null;
  const base = v.base ? sanitizeGrimoire(v.base) : null;
  return { ...v, base: base?.ok ? base.grimoire : null, baseRev: base?.ok ? v.baseRev : -1 };
}

export type SyncIO = {
  cloud: Cloud;
  /** This device's Grimoire right now. */
  local(): Grimoire;
  /** Replace this device's Grimoire with `merged`, unless it changed since `seen` (then merge again). */
  apply(seen: Grimoire, merged: Grimoire): void;
  record(): SyncRecord | null;
  saveRecord(r: SyncRecord | null): Promise<void>;
  now(): string;
};

export type SyncOutcome = "synced" | "needs-passphrase" | "cloud-gone" | "stopped";

/** Bring this device and the cloud together. Safe to call any time; repeats are cheap. */
export async function syncOnce(io: SyncIO): Promise<SyncOutcome> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const rec = io.record();
    if (!rec) return "stopped";
    const doc = await io.cloud.read(rec.uid);
    if (!doc) return "cloud-gone";
    if (doc.salt !== rec.key.salt) return "needs-passphrase"; // the passphrase was changed elsewhere

    const local = io.local();
    let next: Grimoire;
    if (rec.base && doc.rev === rec.baseRev) {
      if (deepEqual(local, rec.base)) return "synced"; // nothing new anywhere
      next = local;
    } else {
      let remote: Grimoire;
      try {
        remote = await openFromCloud(doc, rec.key);
      } catch (e) {
        if (e instanceof WrongKeyError) return "needs-passphrase";
        throw e;
      }
      // A device joining with its own entries keeps them, but the cloud's settings win.
      next = mergeGrimoires(rec.base ?? undefined, local, remote, rec.base ? "local" : "remote");
      if (!deepEqual(next, local)) io.apply(local, next);
      if (deepEqual(next, remote)) {
        await io.saveRecord({ ...rec, base: remote, baseRev: doc.rev, syncedAt: io.now() });
        return "synced";
      }
    }

    try {
      const sealed = await sealForCloud(next, rec.key);
      const rev = await io.cloud.write(rec.uid, { ...sealed, salt: rec.key.salt, rounds: rec.key.rounds }, doc.rev);
      await io.saveRecord({ ...rec, base: next, baseRev: rev, syncedAt: io.now() });
      return "synced";
    } catch (e) {
      if (!(e instanceof RevisionConflict)) throw e;
      // Another device wrote first: read again and merge with its changes.
    }
  }
  throw new Error("Another device kept syncing at the same moment. Try again shortly.");
}

/** Start syncing with a new passphrase: this device's Grimoire becomes the cloud copy. */
export async function createCloudCopy(io: SyncIO, uid: string, passphrase: string): Promise<void> {
  const key = await deriveSyncKey(passphrase);
  const local = io.local();
  const rev = await io.cloud.write(uid, { ...(await sealForCloud(local, key)), salt: key.salt, rounds: key.rounds }, 0);
  await io.saveRecord({ uid, key, base: local, baseRev: rev, syncedAt: io.now() });
}

/**
 * Join an existing cloud copy. With `adopt`, this device simply takes the
 * cloud's Grimoire (a fresh install); otherwise both are merged on the next sync.
 * Throws WrongKeyError if the passphrase doesn't open it.
 */
export async function joinCloudCopy(io: SyncIO, uid: string, passphrase: string, adopt: boolean): Promise<SyncOutcome> {
  const doc = await io.cloud.read(uid);
  if (!doc) return "cloud-gone";
  const key = await deriveSyncKey(passphrase, doc.salt, doc.rounds);
  const remote = await openFromCloud(doc, key);
  if (adopt) {
    io.apply(io.local(), remote);
    await io.saveRecord({ uid, key, base: remote, baseRev: doc.rev, syncedAt: io.now() });
    return "synced";
  }
  await io.saveRecord({ uid, key, base: null, baseRev: -1, syncedAt: "" });
  return syncOnce(io);
}
