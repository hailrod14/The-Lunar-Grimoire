import { sanitizeGrimoire } from "./storage";
import type { Grimoire } from "./types";

/*
 * Three-way merge for syncing between devices. `base` is the copy both
 * devices last agreed on; `local` and `remote` are what each has now. A part
 * changed on only one side takes that side's version, so edits made on the
 * phone and the laptop both survive. Only a part changed differently on both
 * sides is a conflict:
 *   - lists of things with ids (tides, potions, doses, occasions…) merge item by item;
 *   - a journal entry written on both keeps both texts;
 *   - anything else takes the preferred side's value.
 * Without a base (a device joining for the first time) nothing is treated as
 * deleted: both sides' days, potions, and tides are kept.
 */

type Json = unknown;
type Obj = Record<string, Json>;

const isObj = (v: Json): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const hasId = (v: Json): v is Obj & { id: string } => isObj(v) && typeof v.id === "string";
const isIdList = (v: Json): v is (Obj & { id: string })[] => Array.isArray(v) && v.every(hasId);

/** Structural equality that ignores key order. */
export function deepEqual(a: Json, b: Json): boolean {
  if (a === b) return true;
  if (Array.isArray(a)) return Array.isArray(b) && a.length === b.length && a.every((x, i) => deepEqual(x, b[i]));
  if (isObj(a) && isObj(b)) {
    const keys = Object.keys(a).filter((k) => a[k] !== undefined);
    const otherKeys = Object.keys(b).filter((k) => b[k] !== undefined);
    return keys.length === otherKeys.length && keys.every((k) => deepEqual(a[k], b[k]));
  }
  return false;
}

/** Both devices wrote in the same journal entry: keep each one's words. */
function mergeJournal(base: Json, local: string, remote: string): string {
  if (local.includes(remote)) return local;
  if (remote.includes(local)) return remote;
  const b = typeof base === "string" ? base : "";
  if (b && local.startsWith(b) && remote.startsWith(b)) {
    return `${b}${local.slice(b.length)}\n\n${remote.slice(b.length).replace(/^\s+/, "")}`;
  }
  return `${local}\n\n${remote}`;
}

function mergeById(base: Json, local: (Obj & { id: string })[], remote: (Obj & { id: string })[], prefer: Side): Obj[] {
  const byId = (list: Json) => new Map(isIdList(list) ? list.map((x) => [x.id, x]) : []);
  const b = byId(base);
  const l = byId(local);
  const r = byId(remote);
  const order = [...l.keys(), ...[...r.keys()].filter((id) => !l.has(id))];
  return order.map((id) => merge3(b.get(id), l.get(id), r.get(id), prefer)).filter((x): x is Obj => x !== undefined);
}

type Side = "local" | "remote";

function merge3(base: Json, local: Json, remote: Json, prefer: Side, key?: string): Json {
  if (deepEqual(local, remote)) return local;
  if (deepEqual(base, local)) return remote;
  if (deepEqual(base, remote)) return local;
  // Changed on both sides.
  if (isObj(local) && isObj(remote)) {
    const out: Obj = {};
    for (const k of new Set([...Object.keys(local), ...Object.keys(remote)])) {
      const v = merge3(isObj(base) ? base[k] : undefined, local[k], remote[k], prefer, k);
      if (v !== undefined) out[k] = v;
    }
    return out;
  }
  if (isIdList(local) && isIdList(remote)) return mergeById(base, local, remote, prefer);
  if (key === "journal" && typeof local === "string" && typeof remote === "string") return mergeJournal(base, local, remote);
  // Edited on one side, deleted on the other: keep the edit.
  return prefer === "local" ? (local ?? remote) : (remote ?? local);
}

/**
 * Merge two Grimoires against the copy they last shared. Conflicting settings
 * and values go to `prefer`. The result is validated like any saved Grimoire.
 */
export function mergeGrimoires(base: Grimoire | undefined, local: Grimoire, remote: Grimoire, prefer: Side = "local"): Grimoire {
  const merged = merge3(base, local, remote, prefer) as Grimoire;
  // Two devices that each began the same tide: keep one tide per start date.
  const seen = new Set<string>();
  merged.tides = merged.tides.filter((t) => !seen.has(t.start) && seen.add(t.start));
  const parsed = sanitizeGrimoire(merged);
  return parsed.ok ? parsed.grimoire : prefer === "local" ? local : remote;
}
